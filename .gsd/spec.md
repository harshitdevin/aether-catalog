# Spec: Fix Product Identification Accuracy

## Goal
Improve the MobileNet classification accuracy for products. The server currently returns `unknown` or low-confidence results for registered items.

## Success Criteria
- The script `test_accuracy.py` must run and exit with exit code `0` (accuracy target of >= 80% achieved).
- Confidence scores must be calibrated correctly (should not return `unknown` if the actual product is visible and registered).

## Task Breakdown
1. **Analyze Current Accuracy**: Run `python test_accuracy.py` to identify which products are misclassified or returning low confidence.
2. **Optimize Feature Preprocessing**: Check if cv2 adjustments (CLAHE, scaling, resizing) in `server.py` match what is used during training or in the frontend.
3. **Calibrate Thresholds**: Tune the confidence thresholds or similarity calculation in `classify_crop` (in `server.py`).
4. **Trigger Retraining**: If tuning is insufficient, run retraining using `python rebuild_model.py` or `python run_training_fast.py` to regenerate the weights in `web_model/`.
5. **Verify Accuracy**: Re-run `python test_accuracy.py` until it passes.
