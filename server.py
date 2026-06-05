import os
import random
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from pymongo import MongoClient

app = Flask(__name__, static_folder='.', static_url_path='')

# Local MongoDB connection
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
try:
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    # Check connection
    mongo_client.server_info()
    db = mongo_client["aether_catalog_db"]
except Exception as e:
    print(f"CRITICAL: Failed to connect to MongoDB at {MONGO_URI}. Ensure MongoDB is running.")
    print(str(e))
    class MockCollection:
        def __init__(self): self.data = {}
        def find(self): return list(self.data.values())
        def insert_one(self, doc):
            doc['_id'] = str(random.randint(1000, 9999))
            self.data[doc.get('id', doc['_id'])] = doc
        def insert_many(self, docs):
            for doc in docs:
                self.insert_one(doc)
        def replace_one(self, query, doc, upsert=False):
            key = list(query.values())[0]
            self.data[key] = doc
        def delete_one(self, query):
            key = list(query.values())[0]
            if key in self.data:
                del self.data[key]
                class Res: deleted_count = 1
                return Res()
            class Res: deleted_count = 0
            return Res()
        def delete_many(self, query): self.data.clear()
        def count_documents(self, query): return len(self.data)
    
    class MockDB:
        def __init__(self):
            self.assets = MockCollection()
            self.activities = MockCollection()
            self.users = MockCollection()
    db = MockDB()
    print("Warning: Running with fallback in-memory mock database.")

# Beautiful Inline SVG Designs for Assets to prevent broken images and load instantly
SVG_ASSETS = {
  "macbook": 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b0f19"/><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236366f1"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><rect x="150" y="80" width="500" height="300" rx="15" fill="%231e293b" stroke="%23334155" stroke-width="3"/><rect x="170" y="100" width="460" height="260" rx="4" fill="%23020617"/><path d="M100,380 L700,380 L720,410 C720,415 710,420 700,420 L100,420 C90,420 80,415 80,410 Z" fill="%23334155"/><rect x="360" y="380" width="80" height="6" rx="3" fill="%231e293b"/><circle cx="400" cy="230" r="45" fill="url(%23g1)" opacity="0.85"/><polygon points="380,230 425,205 425,255" fill="%23ffffff"/><circle cx="400" cy="90" r="3" fill="%23475569"/><text x="400" y="470" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aether Book Pro 16</text></svg>',
  "chair": 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b0f19"/><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><path d="M350,100 L450,100 L460,250 L340,250 Z" fill="none" stroke="url(%23g2)" stroke-width="8" stroke-linecap="round"/><path d="M320,250 L480,250 L490,290 L310,290 Z" fill="%231e293b" rx="5"/><rect x="330" y="150" width="140" height="80" fill="%23334155" opacity="0.3" rx="8"/><path d="M290,180 L310,260 M510,180 L490,260" stroke="%23475569" stroke-width="12" stroke-linecap="round"/><path d="M400,290 L400,400 M370,400 L430,400" stroke="%23334155" stroke-width="14"/><path d="M400,400 L320,450 M400,400 L480,450 M400,400 L400,460" stroke="%231e293b" stroke-width="10" stroke-linecap="round"/><circle cx="320" cy="450" r="10" fill="%23475569"/><circle cx="480" cy="450" r="10" fill="%23475569"/><circle cx="400" cy="460" r="10" fill="%23475569"/><text x="400" y="50" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aether Kinetic Ergonomic Chair</text></svg>',
  "camera": 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b0f19"/><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23ef4444"/></linearGradient></defs><rect x="250" y="180" width="300" height="180" rx="16" fill="%231e293b" stroke="%23334155" stroke-width="4"/><rect x="290" y="145" width="80" height="35" rx="5" fill="%23334155"/><circle cx="500" cy="220" r="8" fill="%23ef4444" stroke="%237f1d1d" stroke-width="2"/><circle cx="400" cy="270" r="70" fill="%230f172a" stroke="%23475569" stroke-width="6"/><circle cx="400" cy="270" r="50" fill="url(%23g3)" stroke="%23020617" stroke-width="4"/><circle cx="380" cy="250" r="15" fill="%23ffffff" opacity="0.25"/><text x="400" y="440" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aether Cine FX3 Camera</text></svg>',
  "headset": 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b0f19"/><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2306b6d4"/><stop offset="100%" stop-color="%23a855f7"/></linearGradient></defs><path d="M220,200 C220,130 580,130 580,200" fill="none" stroke="%23334155" stroke-width="12" stroke-linecap="round"/><rect x="200" y="200" width="400" height="150" rx="75" fill="%231e293b" stroke="%23334155" stroke-width="4"/><rect x="220" y="215" width="360" height="120" rx="60" fill="%23020617"/><path d="M240,275 Q400,310 560,275" fill="none" stroke="url(%23g4)" stroke-width="6" stroke-linecap="round" opacity="0.9"/><circle cx="280" cy="250" r="4" fill="%2306b6d4"/><circle cx="520" cy="250" r="4" fill="%23a855f7"/><text x="400" y="420" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aether Prism VR-X Headset</text></svg>',
  "microscope": 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b0f19"/><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23a855f7"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect x="300" y="400" width="200" height="20" rx="5" fill="%23334155"/><path d="M400,400 L400,280 Q400,200 460,180" fill="none" stroke="%23334155" stroke-width="16" stroke-linecap="round"/><path d="M460,150 L400,250" stroke="url(%23g5)" stroke-width="20" stroke-linecap="round"/><rect x="375" y="240" width="50" height="30" fill="%231e293b" stroke="%23475569" stroke-width="2" rx="4"/><circle cx="340" cy="300" r="10" fill="%233b82f6" opacity="0.8"/><text x="400" y="470" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aether BioScan-X Microscope</text></svg>'
}

# Seed Assets priced strictly in INR
SEED_ASSETS = [
    {
        "id": "AETHER-00121",
        "name": "Aether Book Pro 16\"",
        "category": "Electronics",
        "value": 249900.00,
        "manufacturer": "AetherTech",
        "model": "AB-16-M3X",
        "condition": "Excellent",
        "status": "In Service",
        "location": "Executive Office A",
        "serial": "SN-APL982K11",
        "tags": ["laptop", "hardware", "executive", "silicon"],
        "notes": "CTO primary machine. Loaded with M3 Max equivalent configuration, 64GB RAM, 2TB SSD. AppleCare coverage active till May 2028.",
        "image": SVG_ASSETS["macbook"],
        "createdAt": datetime.utcnow().isoformat() + "Z"
    },
    {
        "id": "AETHER-00122",
        "name": "Kinetic Ergonomic Mesh Chair",
        "category": "Office Gear",
        "value": 45000.00,
        "manufacturer": "Herman Office",
        "model": "Aeron-Gen2",
        "condition": "Good",
        "status": "In Service",
        "location": "Design Studio B",
        "serial": "SN-HA-88291A",
        "tags": ["furniture", "ergonomic", "office", "studio"],
        "notes": "Premium posture correction chair with adjustable armrests and mesh backing. Back support tension re-calibrated in early 2026.",
        "image": SVG_ASSETS["chair"],
        "createdAt": datetime.utcnow().isoformat() + "Z"
    },
    {
        "id": "AETHER-00123",
        "name": "Aether Cine FX3 Camera",
        "category": "Media Equipment",
        "value": 389900.00,
        "manufacturer": "Sone",
        "model": "ILME-FX3-A",
        "condition": "Excellent",
        "status": "Storage",
        "location": "Equipment Closet C",
        "serial": "SN-SO-FX3-9921",
        "tags": ["camera", "media", "video", "production"],
        "notes": "Full-frame Cinema line camera. Used for marketing campaigns and tutorials. Stored in moisture-controlled case with 50mm f/1.2 lens.",
        "image": SVG_ASSETS["camera"],
        "createdAt": datetime.utcnow().isoformat() + "Z"
    },
    {
        "id": "AETHER-00124",
        "name": "Prism VR-X Spatial Headset",
        "category": "Electronics",
        "value": 310000.00,
        "manufacturer": "AetherTech",
        "model": "PRISM-VRX",
        "condition": "Excellent",
        "status": "In Service",
        "location": "Spatial Development Lab",
        "serial": "SN-VRX-7762A",
        "tags": ["vr", "hardware", "spatial", "testing"],
        "notes": "Used by the spatial software development team. Checked out by Lead Architect. Calibrated for 90Hz eye-tracking.",
        "image": SVG_ASSETS["headset"],
        "createdAt": datetime.utcnow().isoformat() + "Z"
    },
    {
        "id": "AETHER-00125",
        "name": "BioScan-X Digital Microscope",
        "category": "Laboratory",
        "value": 780000.00,
        "manufacturer": "Optika Labs",
        "model": "BSX-5000",
        "condition": "Fair",
        "status": "Maintenance",
        "location": "R&D BioLab 2",
        "serial": "SN-OP-5000-B3",
        "tags": ["lab", "microscope", "research", "optical"],
        "notes": "Digital optical microscope with 5000x magnification and USB capture output. Scheduled for lens cleaning and sensor calibration next Monday.",
        "image": SVG_ASSETS["microscope"],
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }
]

# Initial Seed Activities
SEED_ACTIVITIES = [
    {
        "id": "act-1",
        "type": "add",
        "desc": "Asset <strong>Aether Book Pro 16\"</strong> catalogued successfully by system initialization.",
        "time": datetime.utcnow().isoformat() + "Z"
    },
    {
        "id": "act-2",
        "type": "add",
        "desc": "Asset <strong>Kinetic Ergonomic Mesh Chair</strong> added to registry.",
        "time": datetime.utcnow().isoformat() + "Z"
    },
    {
        "id": "act-3",
        "type": "voice",
        "desc": "Hands-free capture processed: <strong>Aether Cine FX3 Camera</strong> logged via vocal command.",
        "time": datetime.utcnow().isoformat() + "Z"
    },
    {
        "id": "act-4",
        "type": "add",
        "desc": "Asset <strong>Prism VR-X Spatial Headset</strong> registered under Electronics.",
        "time": datetime.utcnow().isoformat() + "Z"
    },
    {
        "id": "act-5",
        "type": "update",
        "desc": "Status updated for <strong>BioScan-X Digital Microscope</strong>: shifted to <strong>Maintenance</strong>.",
        "time": datetime.utcnow().isoformat() + "Z"
    }
]

# Seed Users (roles: admin, staff)
SEED_USERS = [
    {
        "username": "admin",
        "password": "admin",
        "role": "admin",
        "name": "Admin Portal"
    },
    {
        "username": "user",
        "password": "user",
        "role": "staff",
        "name": "Staff Registry"
    }
]

def seed_data():
    try:
        if db.users.count_documents({}) == 0:
            db.users.insert_many(SEED_USERS)
            print("Users database seeded successfully.")
        
        if db.assets.count_documents({}) == 0:
            db.assets.insert_many(SEED_ASSETS)
            print("Assets database seeded successfully in INR.")
            
        if db.activities.count_documents({}) == 0:
            db.activities.insert_many(SEED_ACTIVITIES)
            print("Activities database seeded successfully.")
    except Exception as e:
        print(f"Error seeding database: {e}")

# Call seed logic
seed_data()

# Routing endpoints for static assets
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# Fetch all users (used to sync front-end caching)
@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        users = list(db.users.find())
        for u in users:
            u['_id'] = str(u['_id'])
        return jsonify(users)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Verify credentials endpoint
@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    try:
        credentials = request.json
        username = credentials.get('username', '').strip()
        password = credentials.get('password', '')
        role = credentials.get('role', '')
        
        # Query matching user
        user = db.users.find_one({
            "username": {"$regex": f"^{username}$", "$options": "i"},
            "password": password,
            "role": role
        })
        
        if user:
            user['_id'] = str(user['_id'])
            return jsonify(user)
        return jsonify({"error": "Invalid username, password, or role Selection!"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get all assets
@app.route('/api/assets', methods=['GET'])
def get_assets():
    try:
        assets = list(db.assets.find())
        # Sort manually or via query. Let's do descending by createdAt.
        # We need a robust parser since datetime strings can be sorted alphabetically.
        assets.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        for a in assets:
            a['_id'] = str(a['_id'])
        return jsonify(assets)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Save or update asset (write-through API)
@app.route('/api/assets', methods=['POST'])
def save_asset():
    try:
        asset = request.json
        asset_id = asset.get('id')
        
        if not asset_id:
            # Generate random unique id
            asset_id = f"AETHER-{random.randint(10000, 99999)}"
            asset['id'] = asset_id
            asset['createdAt'] = datetime.utcnow().isoformat() + "Z"
            
        # Clean any _id field from payload to prevent BSON error
        if '_id' in asset:
            del asset['_id']
            
        db.assets.replace_one({"id": asset_id}, asset, upsert=True)
        return jsonify(asset)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Delete asset
@app.route('/api/assets/<asset_id>', methods=['DELETE'])
def delete_asset(asset_id):
    try:
        result = db.assets.delete_one({"id": asset_id})
        if result.deleted_count > 0:
            return jsonify({"success": True})
        return jsonify({"success": False, "message": "Asset not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get activities
@app.route('/api/activities', methods=['GET'])
def get_activities():
    try:
        activities = list(db.activities.find())
        activities.sort(key=lambda x: x.get('time', ''), reverse=True)
        activities = activities[:30] # Keep max 30
        for act in activities:
            act['_id'] = str(act['_id'])
        return jsonify(activities)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Save activity log
@app.route('/api/activities', methods=['POST'])
def save_activity():
    try:
        act = request.json
        if not act.get('id'):
            act['id'] = f"act-{random.randint(100000, 999999)}"
        if not act.get('time'):
            act['time'] = datetime.utcnow().isoformat() + "Z"
            
        if '_id' in act:
            del act['_id']
            
        db.activities.insert_one(act)
        act['_id'] = str(act['_id'])
        
        # Maintain max 30 items
        try:
            total_docs = db.activities.count_documents({})
            if total_docs > 30:
                # Find oldest and delete them
                all_acts = list(db.activities.find())
                all_acts.sort(key=lambda x: x.get('time', ''))
                excess = total_docs - 30
                for i in range(excess):
                    db.activities.delete_one({"id": all_acts[i]['id']})
        except Exception as ex:
            print(f"Error purging excess activities: {ex}")
            
        return jsonify(act)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Purge and reload
@app.route('/api/purge', methods=['POST'])
def purge_database():
    try:
        db.assets.delete_many({})
        db.activities.delete_many({})
        db.users.delete_many({})
        seed_data()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Start Flask Web Server
    app.run(host='0.0.0.0', port=8000, debug=True)
