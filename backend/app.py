from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv
import logging

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Set up logging
logging.basicConfig(level=logging.INFO)

# MongoDB Atlas connection (use .env for MONGO_URI)
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority')
client = MongoClient(MONGO_URI)
db = client['digital_twin']
collection = db['supply_chain_data']

REQUIRED_FIELDS = ['entity', 'location', 'inventory_level', 'timestamp']

# Helper: Validate ISO timestamp
from dateutil.parser import isoparse

def is_valid_iso8601(ts):
    try:
        isoparse(ts)
        return True
    except Exception:
        return False

# Helper: Status classification

def get_status(inventory_level):
    try:
        lvl = int(inventory_level)
    except Exception:
        return None
    if lvl < 200:
        return "critical"
    elif lvl < 500:
        return "low"
    else:
        return "operational"

@app.route('/data', methods=['POST'])
def add_data():
    if not request.is_json:
        return jsonify({'success': False, 'message': 'Request must be JSON.'}), 400
    data = request.get_json()
    # Required fields check
    missing = [field for field in REQUIRED_FIELDS if field not in data]
    if missing:
        return jsonify({'success': False, 'message': f'Missing fields: {", ".join(missing)}'}), 400
    # inventory_level must be int
    try:
        inventory_level = int(data['inventory_level'])
    except Exception:
        return jsonify({'success': False, 'message': 'inventory_level must be an integer.'}), 400
    # timestamp must be valid ISO
    if not is_valid_iso8601(data['timestamp']):
        return jsonify({'success': False, 'message': 'timestamp must be valid ISO 8601 format.'}), 400
    # Status classification (overrides user input if present)
    status = get_status(inventory_level)
    if status is None:
        return jsonify({'success': False, 'message': 'Invalid inventory_level for status classification.'}), 400
    # Add server-side received_at timestamp
    record = {
        'entity': data['entity'],
        'location': data['location'],
        'inventory_level': inventory_level,
        'status': status,
        'timestamp': data['timestamp'],
        'received_at': datetime.utcnow().isoformat() + 'Z'
    }
    try:
        collection.insert_one(record)
        logging.info(f"Received and stored: {record}")
        return jsonify({'success': True, 'message': 'Data stored successfully.', 'status': status}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

@app.route('/data/dashboard', methods=['GET'])
def get_dashboard_data():
    try:
        limit = int(request.args.get('limit', 100))
        # Sort by timestamp descending, limit results
        data = list(collection.find({}, {'_id': 0}).sort('timestamp', -1).limit(limit))
        return jsonify({'success': True, 'data': data}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, debug=True)



