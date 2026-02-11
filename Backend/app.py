from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient, TEXT
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Mongo connection
client = MongoClient(os.getenv("MONGO_URL"))
db = client['allJobs']
collection = db['projection']

# Ensure indexes for performance
collection.create_index([("name", TEXT), ("companyName", TEXT)])
collection.create_index("postedAt")
collection.create_index("createdAt")

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    try:
        search = request.args.get('q', '')
        company = request.args.get('company', 'All')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        skip = (page - 1) * limit
        
        query = {}
        
        # Search filter
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"companyName": {"$regex": search, "$options": "i"}}
            ]
            
        # Projection to fetch only necessary fields (reduces payload & DB load)
        projection = {
            "name": 1,
            "companyName": 1,
            "department": 1,
            "locations": 1,
            "postedAt": 1,
            "createdAt": 1,
            "workLocationOption": 1,
            "positionUrl": 1,
            "_id": 1
        }

        # Fetch results with pagination and projection
        total_jobs = collection.count_documents(query)
        jobs_cursor = collection.find(query, projection).sort("postedAt", -1).skip(skip).limit(limit)
        
        jobs_list = []
        for job in jobs_cursor:
            if '_id' in job:
                job['_id'] = str(job['_id'])
            jobs_list.append(job)
            
        response_data = {
            "jobs": jobs_list,
            "total": total_jobs,
            "page": page,
            "limit": limit,
            "pages": (total_jobs + limit - 1) // limit
        }
        
        resp = jsonify(response_data)
        # Enable caching for 5 minutes to handle high traffic spikes
        resp.headers['Cache-Control'] = 'public, max-age=300'
        return resp
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)