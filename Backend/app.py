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
collection = db['ericsson']

# Ensure indexes for performance
collection.create_index([("name", TEXT), ("companyName", TEXT)])
collection.create_index("postedAt")
collection.create_index("createdAt")

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    try:
        search = request.args.get('q', '')
        company = request.args.get('company', 'All')
        
        query = {}
        
        # Search filter
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"companyName": {"$regex": search, "$options": "i"}}
            ]
            
        # Company filter
        if company != 'All':
            query["companyName"] = company

        # Fetch all results (removed limit)
        jobs_cursor = collection.find(query).sort("postedAt", -1)
        
        jobs_list = []
        for job in jobs_cursor:
            if '_id' in job:
                job['_id'] = str(job['_id'])
            jobs_list.append(job)
            
        return jsonify(jobs_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)