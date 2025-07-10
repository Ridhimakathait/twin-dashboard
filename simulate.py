import requests
import random
import time
from datetime import datetime

ENTITIES = ["warehouse", "store", "factory"]
LOCATIONS = ["Delhi", "Mumbai", "Bangalore", "New York", "London"]
STATUSES = ["normal", "warning", "critical"]

BACKEND_URL = "http://localhost:4000/data/submit"

while True:
    data = {
        "entity": random.choice(ENTITIES),
        "location": random.choice(LOCATIONS),
        "inventory_level": random.randint(100, 800),
        "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": random.choice(STATUSES)
    }
    try:
        res = requests.post(BACKEND_URL, json=data)
        print(f"POST {BACKEND_URL} {res.status_code}", res.json())
    except Exception as e:
        print(f"Error posting to backend: {e}")
    time.sleep(5)
