from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient, TEXT
from bson import ObjectId
import os
import re
from dotenv import load_dotenv
from datetime import datetime, timedelta
import time

load_dotenv()

app = Flask(__name__)
# Robust CORS for development
CORS(app, resources={r"/*": {"origins": "*"}})

# Mongo connection
try:
    client = MongoClient(os.getenv("MONGO_URL"), serverSelectionTimeoutMS=5000)
    db = client['allJobs']
    collection = db['projection']
    # Trigger a connection check
    client.server_info()
except Exception as e:
    print(f"CRITICAL: Failed to connect to MongoDB: {e}")

# Ensure indexes for performance
def setup_indexes():
    try:
        # Check if we need to update/recreate the text index
        # MongoDB only allows one text index. 
        existing_indexes = collection.list_indexes()
        text_index_name = None
        for idx in existing_indexes:
            if any(val == "text" for val in idx["key"].values()):
                text_index_name = idx["name"]
                break
        
        # If it's not our named index, we drop it to ensure we have the correct weights (including locations)
        if text_index_name and text_index_name != "job_search_text_index":
            print(f"Updating text index: dropping {text_index_name}...")
            collection.drop_index(text_index_name)

        collection.create_index([
            ("name", TEXT), 
            ("companyName", TEXT), 
            ("locations", TEXT)
        ], name="job_search_text_index", background=True)
        print("Backend: Text index ready.")
    except Exception as e:
        print(f"Backend: Text index notice (handled): {str(e)[:100]}...")

    try:
        collection.create_index("companyName", background=True)
        collection.create_index("locations", background=True)
        collection.create_index("postedAt", background=True)
        collection.create_index("createdAt", background=True)
        collection.create_index("department", background=True)
        collection.create_index("workLocationOption", background=True)
        print("Backend: Regular indexes ready.")
    except Exception as e:
        print(f"Backend: Regular index notice: {str(e)[:100]}...")

# Run index setup
setup_indexes()

# Simple in-memory cache
cache = {
    "companies": {"data": None, "timestamp": 0},
    "metadata": {"data": None, "timestamp": 0}
}
CACHE_TIMEOUT = 300 # 5 minutes

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    try:
        search = request.args.get('q', '')
        company = request.args.get('company', 'All')
        companies_param = request.args.get('companies', '')
        locations = request.args.getlist('locations')
        departments = request.args.getlist('departments')
        work_types = request.args.getlist('workTypes')
        limit = min(max(int(request.args.get('limit', 10)), 1), 50)
        skip = max(int(request.args.get('skip', 0)), 0)
        sort_order = request.args.get('sort', 'newest')

        # Which field drives ordering. createdAt (ingestion timestamp) is a
        # consistent "YYYY-MM-DD HH:MM:SS" string across every source, unlike
        # postedAt which varies by scraper (ISO datetime, "Jul 31, 2026",
        # "Posted Yesterday", plain date, or empty) and sorts incorrectly as text.
        sort_by = request.args.get('sortBy', 'createdAt')
        if sort_by not in ('createdAt', 'postedAt'):
            sort_by = 'createdAt'

        # Date Filters - same reasoning applies, so date-range filters are
        # applied against createdAt by default.
        date_field = request.args.get('dateField', 'createdAt')
        if date_field not in ('createdAt', 'postedAt'):
            date_field = 'createdAt'
        date_filter = request.args.get('dateFilter', 'all')
        start_date_str = request.args.get('startDate', '')
        end_date_str = request.args.get('endDate', '')

        query = {}
        and_clauses = []

        # Search filter (Regex-based text search)
        if search:
            regex_search = {"$regex": re.escape(search), "$options": "i"}
            and_clauses.append({"$or": [
                {"name": regex_search},
                {"companyName": regex_search},
                {"locations": regex_search}
            ]})

        # Company/Companies filter
        if companies_param:
            query["companyName"] = {"$in": companies_param.split(',')}
        elif company != 'All':
            query["companyName"] = company

        # Locations filter
        if locations:
            query["locations"] = {"$in": locations}

        # Department filter
        if departments:
            query["department"] = {"$in": departments}

        # Work-mode filter: canonical buckets (Remote/Hybrid/Onsite) matched
        # case-insensitively against the raw, inconsistently-cased workLocationOption
        if work_types:
            work_type_or = [
                {"workLocationOption": {"$regex": re.escape(wt), "$options": "i"}}
                for wt in work_types
            ]
            and_clauses.append({"$or": work_type_or})

        # Date filtering logic
        now = datetime.utcnow()
        date_query = None
        if date_filter == 'today':
            date_query = {"$gte": now.strftime('%Y-%m-%d 00:00:00')}
        elif date_filter == 'last7':
            date_query = {"$gte": (now - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')}
        elif date_filter == 'last30':
            date_query = {"$gte": (now - timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')}
        elif date_filter == 'thisYear':
            date_query = {"$gte": datetime(now.year, 1, 1).strftime('%Y-%m-%d %H:%M:%S')}
        elif date_filter == 'custom' and start_date_str:
            date_query = {"$gte": start_date_str}
            if end_date_str:
                date_query["$lte"] = end_date_str + " 23:59:59"

        if date_query:
            query[date_field] = date_query

        if and_clauses:
            query["$and"] = and_clauses

        # Sorting logic - secondary _id key keeps skip/limit pagination stable
        sort_val = -1 if sort_order == 'newest' else 1

        # Performance: Projection to exclude heavy fields
        projection = {
            "_id": 1, "name": 1, "companyName": 1, "locations": 1,
            "postedAt": 1, "createdAt": 1, "positionUrl": 1,
            "workLocationOption": 1, "department": 1
        }

        cursor = collection.find(query, projection).sort(
            [(sort_by, sort_val), ("_id", sort_val)]
        ).skip(skip).limit(limit)

        jobs_list = []
        for job in cursor:
            if '_id' in job:
                job['_id'] = str(job['_id'])
            jobs_list.append(job)

        return jsonify(jobs_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/companies', methods=['GET'])
def get_companies():
    try:
        search = request.args.get('q', '')
        
        # Cache handling (only for general requests)
        if not search:
            now = time.time()
            if cache["companies"]["data"] and (now - cache["companies"]["timestamp"] < CACHE_TIMEOUT):
                return jsonify(cache["companies"]["data"])
        
        query = {}
        if search:
            regex_search = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"name": regex_search},
                {"companyName": regex_search}
            ]
            
        # Aggregation pipeline for unique companies and counts
        pipeline = [
            {"$match": query},
            {"$group": {"_id": "$companyName", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        
        companies_raw = list(collection.aggregate(pipeline))
        result = [{"name": c["_id"], "count": c["count"]} for c in companies_raw if c["_id"]]
        
        if not search:
            cache["companies"]["data"] = result
            cache["companies"]["timestamp"] = time.time()
            
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/metadata', methods=['GET'])
def get_metadata():
    try:
        now = time.time()
        if cache["metadata"]["data"] and (now - cache["metadata"]["timestamp"] < CACHE_TIMEOUT):
            return jsonify(cache["metadata"]["data"])
            
        # Get unique filter values efficiently via indexes
        locations = collection.distinct("locations")
        departments = collection.distinct("department")
        work_location_options = collection.distinct("workLocationOption")
        result = {
            "locations": sorted([l for l in locations if l]),
            "departments": sorted([d for d in departments if d]),
            "workLocationOptions": sorted([w for w in work_location_options if w])
        }
        
        cache["metadata"]["data"] = result
        cache["metadata"]["timestamp"] = time.time()
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # use_reloader=False is crucial on Windows to prevent WinError 10038/threading issues
    app.run(debug=True, port=8000, use_reloader=False)