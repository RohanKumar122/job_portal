from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
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

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    try:
        # Fetch all jobs from the collection
        jobs_cursor = collection.find()
        jobs_list = []
        for job in jobs_cursor:
            # Convert ObjectId to string for JSON serialization
            if '_id' in job:
                job['_id'] = str(job['_id'])
            jobs_list.append(job)
        return jsonify(jobs_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)