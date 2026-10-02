import json
import os

TEMPLATES_FILE = 'modules/templates.json'

BEVERAGE_TEMPLATES = [
    {
        "key": "thums_up",
        "name": "Thums Up Soft Drink",
        "category": "Beverages",
        "value": 40.0,
        "manufacturer": "Coca-Cola India",
        "model": "750ml Bottle / 300ml Can",
        "tags": ["beverages", "soft drink", "soda", "thums up", "cold drink"],
        "notes": "Strong fizzy cola soft drink popular across India.",
        "image": "assets/thums_up.png"
    },
    {
        "key": "coca_cola",
        "name": "Coca-Cola Soft Drink",
        "category": "Beverages",
        "value": 40.0,
        "manufacturer": "Coca-Cola India",
        "model": "750ml Plastic Bottle / Can",
        "tags": ["beverages", "soft drink", "coca cola", "soda", "cold drink"],
        "notes": "Classic refreshing carbonated cola beverage.",
        "image": "assets/coca_cola.png"
    },
    {
        "key": "sprite",
        "name": "Sprite Lemon-Lime Drink",
        "category": "Beverages",
        "value": 40.0,
        "manufacturer": "Coca-Cola India",
        "model": "750ml Bottle / 300ml Can",
        "tags": ["beverages", "soft drink", "sprite", "lemon lime", "soda"],
        "notes": "Clear lemon-lime flavored carbonated soft drink.",
        "image": "assets/sprite.png"
    },
    {
        "key": "maaza",
        "name": "Maaza Mango Fruit Drink",
        "category": "Beverages",
        "value": 65.0,
        "manufacturer": "Coca-Cola India",
        "model": "1.2L Bottle / 200ml Pack",
        "tags": ["beverages", "mango drink", "maaza", "juice", "fruit drink"],
        "notes": "Rich Alphonso mango fruit juice drink.",
        "image": "assets/maaza.png"
    },
    {
        "key": "real_juice",
        "name": "Real Fruit Power Juice",
        "category": "Beverages",
        "value": 115.0,
        "manufacturer": "Dabur",
        "model": "1L Tetra Pack",
        "tags": ["beverages", "real juice", "fruit juice", "mixed fruit", "tetra pack"],
        "notes": "100% natural fruit juice tetra pack.",
        "image": "assets/real_juice.png"
    },
    {
        "key": "amul_kool",
        "name": "Amul Kool Flavoured Milk",
        "category": "Beverages",
        "value": 30.0,
        "manufacturer": "Amul",
        "model": "200ml Glass Bottle / Can",
        "tags": ["beverages", "amul kool", "flavoured milk", "kesar", "dairy"],
        "notes": "Delicious kesar/elaichi flavoured cold milk drink.",
        "image": "assets/amul_kool.png"
    },
    {
        "key": "nescafe_coffee",
        "name": "Nescafe Classic Instant Coffee",
        "category": "Beverages",
        "value": 185.0,
        "manufacturer": "Nestle",
        "model": "50g Glass Jar",
        "tags": ["beverages", "nescafe", "coffee", "instant coffee", "nestle"],
        "notes": "Premium roasted coffee beans instant powder jar.",
        "image": "assets/nescafe_coffee.png"
    },
    {
        "key": "taj_mahal_tea",
        "name": "Brooke Bond Taj Mahal Tea",
        "category": "Beverages",
        "value": 290.0,
        "manufacturer": "HUL",
        "model": "500g Tea Box",
        "tags": ["beverages", "taj mahal", "tea", "chai", "brooke bond"],
        "notes": "Fine estate tea leaves with rich aroma and golden liquor.",
        "image": "assets/taj_mahal_tea.png"
    }
]

def update_templates():
    existing = []
    if os.path.exists(TEMPLATES_FILE):
        with open(TEMPLATES_FILE, 'r', encoding='utf-8') as f:
            existing = json.load(f)
            
    existing_keys = {item['key'] for item in existing}
    
    # Filter or replace beverage keys
    updated = [item for item in existing if item['key'] not in {b['key'] for b in BEVERAGE_TEMPLATES}]
    updated.extend(BEVERAGE_TEMPLATES)
    
    with open(TEMPLATES_FILE, 'w', encoding='utf-8') as f:
        json.dump(updated, f, indent=2)
        
    print(f"Updated {TEMPLATES_FILE} with {len(BEVERAGE_TEMPLATES)} Indian Beverage templates!")

if __name__ == "__main__":
    update_templates()
