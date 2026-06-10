import os
import shutil
import json

DATASET_DIR = './dataset'
WEB_MODEL_DIR = './web_model'

def main():
    print("Purging trained dataset and models...")
    
    # 1. Delete all folders in `./dataset`
    if os.path.exists(DATASET_DIR):
        for item in os.listdir(DATASET_DIR):
            item_path = os.path.join(DATASET_DIR, item)
            if os.path.isdir(item_path):
                shutil.rmtree(item_path)
            else:
                os.remove(item_path)
        print("Cleared ./dataset folder.")
    else:
        os.makedirs(DATASET_DIR, exist_ok=True)
        
    # 2. Re-create `unknown` folder
    unknown_dir = os.path.join(DATASET_DIR, 'unknown')
    os.makedirs(unknown_dir, exist_ok=True)
    # Add a single dummy 1x1 black image so the features loop has at least one file to scan
    import cv2
    import numpy as np
    dummy_img = np.zeros((224, 224, 3), dtype=np.uint8)
    cv2.imwrite(os.path.join(unknown_dir, 'dummy.jpg'), dummy_img)
    print("Created clean fallback ./dataset/unknown folder with dummy image.")
    
    # 3. Create baseline centroids.json
    centroids_file = os.path.join(WEB_MODEL_DIR, 'centroids.json')
    centroids_payload = {
        "classes": ["unknown"],
        "centroids": {
            "unknown": [0.0] * 1280
        }
    }
    with open(centroids_file, 'w', encoding='utf-8') as f:
        json.dump(centroids_payload, f)
    print("Reset web_model/centroids.json to clean baseline.")
    
    # 4. Create baseline classifier.json
    classifier_file = os.path.join(WEB_MODEL_DIR, 'classifier.json')
    classifier_payload = {
        "classes": ["unknown"],
        "weights": [[0.0] for _ in range(1280)],  # Shape (1280, 1)
        "biases": [0.0]                           # Shape (1,)
    }
    with open(classifier_file, 'w', encoding='utf-8') as f:
        json.dump(classifier_payload, f)
    print("Reset web_model/classifier.json to clean baseline.")
    
    # Remove X.npy and y.npy to clear pre-extracted features
    for f in ['X.npy', 'y.npy']:
        if os.path.exists(f):
            os.remove(f)
            print(f"Removed old feature file: {f}")
            
    print("Purge complete! Dataset and model have been completely reset.")

if __name__ == '__main__':
    main()
