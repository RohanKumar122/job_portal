from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient, TEXT
from bson import ObjectId
import os
from dotenv import load_dotenv

import time

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Mongo connection
client = MongoClient(os.getenv("MONGO_URL"))
db = client['allJobs']
collection = db['projection']

# Ensure indexes for performance
def setup_indexes():
    try:
        # MongoDB only allows one text index. We try to create a comprehensive one.
        # We specify a name to avoid conflict with default names.
        collection.create_index([
            ("name", TEXT), 
            ("companyName", TEXT), 
            ("locations", TEXT)
        ], name="job_search_text_index", background=True)
    except Exception as e:
        print(f"Note: Text index could not be created or already exists: {e}")

    try:
        collection.create_index("companyName", background=True)
        collection.create_index("locations", background=True)
        collection.create_index("postedAt", background=True)
        collection.create_index("createdAt", background=True)
    except Exception as e:
        print(f"Note: Some regular indexes could not be created: {e}")

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
        locations = request.args.getlist('locations')
        limit = int(request.args.get('limit', 10)) # Default to 10
        skip = int(request.args.get('skip', 0))
        sort_order = request.args.get('sort', 'newest')
        
        query = {}
        
        # Search filter
        if search:
            # If search is provided, we use a slightly more optimized regex or text search if needed
            # For now, keeping regex but ensuring it hits indexes where possible
            regex_search = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"name": regex_search},
                {"companyName": regex_search},
                {"locations": regex_search}
            ]
            
        # Company filter
        if company != 'All':
            query["companyName"] = company

        # Locations filter
        if locations:
            query["locations"] = {"$in": locations}

        # Fetch results with pagination and projection
        sort_val = -1 if sort_order == 'newest' else 1
        
        # Projection to exclude unnecessary large fields if any
        projection = {"_id": 1, "name": 1, "companyName": 1, "locations": 1, "postedAt": 1, "createdAt": 1, "positionUrl": 1, "workLocationOption": 1, "department": 1}
        
        cursor = collection.find(query, projection).sort("postedAt", sort_val).skip(skip).limit(limit)
        
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
        
        # If searching, don't use cache
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
            
        # Get unique company names and their job counts
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
            
        # Get unique locations. Using distinct is efficient if the field is indexed.
        locations = collection.distinct("locations")
        result = {
            "locations": sorted([l for l in locations if l])
        }
        
        cache["metadata"]["data"] = result
        cache["metadata"]["timestamp"] = time.time()
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)