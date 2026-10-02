import os
import cv2
import numpy as np
import server

# Initialize model
server.load_classifier_and_centroids()

# Go through dataset directory
dataset_dir = './dataset'
total = 0
correct = 0

print("Evaluating model accuracy on real products (ignoring classes with ONLY synthetic placeholders)...")
for label in os.listdir(dataset_dir):
    label_dir = os.path.join(dataset_dir, label)
    if not os.path.isdir(label_dir) or label == 'unknown':
        continue
        
    # Get all images in this folder
    all_images = [f for f in os.listdir(label_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
    if not all_images:
        continue
        
    # Filter for real images
    real_images = [f for f in all_images if not f.startswith('synth_img_')]
    if not real_images:
        # Skip this class because it has no real product images
        continue
        
    # Take up to 5 real images per category to keep test fast
    for img_name in real_images[:5]:
        img_path = os.path.join(label_dir, img_name)
        img = cv2.imread(img_path)
        if img is None:
            continue
            
        pred_label, conf = server.classify_crop(img)
        total += 1
        is_correct = (pred_label == label)
        if is_correct:
            correct += 1
            
        print(f"File: {label}/{img_name} -> Predicted: {pred_label} (conf: {conf:.2f}) -> {'PASS' if is_correct else 'FAIL'}")

if total > 0:
    accuracy = correct / total
    print(f"\nFinal Accuracy on Real Products: {accuracy*100:.2f}% ({correct}/{total})")
    if accuracy >= 0.80:
        print("Success: Accuracy target met!")
        exit(0)
    else:
        print("Error: Accuracy is below 80%.")
        exit(1)
else:
    print("No real product images found to evaluate.")
    exit(1)
