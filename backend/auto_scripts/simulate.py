import pandas as pd
import random
import time
import json
import requests
from datetime import datetime

# Helper to convert numpy types to native Python types
def make_json_safe(payload):
    return {
        k: (v.item() if hasattr(v, "item") else v)
        for k, v in payload.items()
    }

# Load your dataset
df = pd.read_csv("supply_chain_data.csv")
df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]

# External events pool
external_events = [
    "Fuel hike", "Port congestion", "Festival demand spike",
    "Political unrest", "Monsoon delay", "Raw material shortage"
]

# Starting fuel price
fuel_price = 100.0

# Determine status based on data
def determine_status(row, fuel, event):
    if row["stock_levels"] < 20 or row["availability"] < 20:
        return "alert", "Low stock"
    if row["defect_rates"] > 3.0:
        return "alert", "High defect rate"
    if row["lead_times"] > 20 or row.get("manufacturing_lead_time", 0) > 20:
        return "alert", "Long lead time"
    if fuel > 150:
        return "alert", "High fuel price"
    if event == "Festival demand spike" and row["stock_levels"] < 50:
        return "alert", "Insufficient stock for festival"
    return "normal", None

# Generate scenario variants
def generate_scenarios(row, base_fuel):
    scenarios = []
    for i in range(3):
        fuel = base_fuel + random.uniform(-10, 10)
        event = random.choice(external_events) if random.random() < 0.4 else None

        row_copy = row.copy()
        row_copy["stock_levels"] = max(0, row_copy["stock_levels"] + random.randint(-10, 10))
        row_copy["defect_rates"] = max(0, row_copy["defect_rates"] + random.uniform(-1, 1))
        row_copy["lead_times"] = max(0, row_copy["lead_times"] + random.randint(-3, 3))

        status, reason = determine_status(row_copy, fuel, event)

        scenario_payload = {
            "sku": row_copy["sku"],
            "entity": "store" if "store" in row_copy["location"].lower() else "warehouse",
            "location": row_copy["location"],
            "inventory_level": int(row_copy["stock_levels"]),
            "status": status,
            "reason": reason or "N/A",
            "external_event": event,
            "fuel_price": round(fuel, 2),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "universe": f"Scenario-{i+1}"
        }

        scenarios.append(scenario_payload)

    return scenarios

# Main loop (runs every 5 seconds)
while True:
    row = df.sample(1).iloc[0]

    fuel_price += random.uniform(-3, 3)
    fuel_price = max(50, min(200, fuel_price))

    event = random.choice(external_events) if random.random() < 0.2 else None
    status, reason = determine_status(row, fuel_price, event)

    live_payload = {
        "sku": row["sku"],
        "entity": "store" if "store" in row["location"].lower() else "warehouse",
        "location": row["location"],
        "inventory_level": int(row["stock_levels"]),
        "status": status,
        "reason": reason or "N/A",
        "external_event": event,
        "fuel_price": round(fuel_price, 2),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "universe": "Live"
    }

    # ✅ Print JSON-safe live payload
    print("\n📤 [LIVE]", live_payload['status'].upper(), "|", json.dumps(make_json_safe(live_payload), indent=2))

    # ✅ Send to backend
    try:
        response = requests.post("http://localhost:4000/data/submit", json={
            "entity": live_payload["entity"],
            "location": live_payload["location"],
            "inventory_level": live_payload["inventory_level"],
            "status": live_payload["status"],
            "timestamp": live_payload["timestamp"]
        })
        print(f"✅ Live data sent (status {response.status_code})")
    except Exception as e:
        print(f"❌ Error sending live data: {str(e)}")

    # 🔮 Generate & send scenario variants
    scenarios = generate_scenarios(row, fuel_price)
    for s in scenarios:
        print("🔮 [SCENARIO]", s['status'].upper(), "|", s['universe'], "|", json.dumps(make_json_safe(s), indent=2))
        try:
            response = requests.post("http://localhost:4000/data/submit", json={
                "entity": s["entity"],
                "location": s["location"],
                "inventory_level": s["inventory_level"],
                "status": s["status"],
                "timestamp": s["timestamp"]
            })
            print(f"✅ Scenario data sent ({s['universe']}, status {response.status_code})")
        except Exception as e:
            print(f"❌ Error sending scenario data: {str(e)}")

    time.sleep(5)
