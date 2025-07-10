import requests
import random, time

for i in range(10):
    data = {
        "entity": "Store A",
        "location": "New York",
        "inventory_level": random.randint(100, 800),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    res = requests.post("http://localhost:3001/data", json=data)
    print(res.json())
    time.sleep(1)
