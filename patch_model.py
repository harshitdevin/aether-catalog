import json

with open('web_model/model.json', 'r', encoding='utf-8') as f:
    m = json.load(f)

layers = m['modelTopology']['model_config']['config']['layers']
patched = 0
for layer in layers:
    cfg = layer['config']
    # TF.js requires 'batchInputShape', but Keras 3 exports 'batch_shape'
    if 'batch_shape' in cfg and 'batchInputShape' not in cfg:
        cfg['batchInputShape'] = cfg['batch_shape']
        patched += 1
        print("Patched InputLayer: added batchInputShape =", cfg['batchInputShape'])
    if 'batch_input_shape' in cfg and 'batchInputShape' not in cfg:
        cfg['batchInputShape'] = cfg['batch_input_shape']
        patched += 1
        print("Patched InputLayer: added batchInputShape from batch_input_shape")

with open('web_model/model.json', 'w', encoding='utf-8') as f:
    json.dump(m, f)

print("Done. Patched", patched, "layers.")
print("Verifying...")
with open('web_model/model.json', 'r', encoding='utf-8') as f:
    m2 = json.load(f)
l0 = m2['modelTopology']['model_config']['config']['layers'][0]
print("InputLayer config keys:", list(l0['config'].keys()))
