from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv
import logging

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])  # Enable CORS for frontend

logging.basicConfig(level=logging.INFO)

MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/digital_twin')
client = MongoClient(MONGO_URI)
db = client['digital_twin']
collection = db['supply_chain_data']

REQUIRED_FIELDS = ['entity', 'location', 'inventory_level', 'timestamp', 'status']

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/data/submit', methods=['POST'])
def add_data():
    if not request.is_json:
        return jsonify({'success': False, 'message': 'Request must be JSON.'}), 400
    data = request.get_json()
    missing = [field for field in REQUIRED_FIELDS if field not in data]
    if missing:
        return jsonify({'success': False, 'message': f'Missing fields: {', '.join(missing)}'}), 400
    try:
        inventory_level = int(data['inventory_level'])
    except Exception:
        return jsonify({'success': False, 'message': 'inventory_level must be an integer.'}), 400
    # Validate status field
    allowed_statuses = {'normal', 'warning', 'critical'}
    status = str(data['status']).lower()
    if status not in allowed_statuses:
        return jsonify({'success': False, 'message': f"Invalid status: {data['status']}. Must be one of: normal, warning, critical."}), 400
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
        return jsonify({'success': True, 'message': 'Data stored successfully.'}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

@app.route('/data/dashboard', methods=['GET'])
def get_dashboard_data():
    try:
        limit = int(request.args.get('limit', 100))
        data = list(collection.find({}, {'_id': 0}).sort('timestamp', -1).limit(limit))
        return jsonify({'success': True, 'data': data}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000, debug=True)



