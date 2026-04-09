#!/usr/bin/env python3
"""
Auto-generate part_images/manifest.json by scanning part_images/{SKU}/ folders.

Usage:
    python3 generate-manifest.py

Run this whenever you add or remove images from part_images/.
Image files (jpg, jpeg, png, webp, gif) directly inside each SKU folder
are included. Subfolders are ignored.
"""

import os
import json

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'part_images')
manifest = {}

for sku in sorted(os.listdir(root)):
    sku_dir = os.path.join(root, sku)
    if not os.path.isdir(sku_dir) or sku.startswith('.'):
        continue
    images = sorted([
        f for f in os.listdir(sku_dir)
        if os.path.isfile(os.path.join(sku_dir, f))
        and os.path.splitext(f)[1].lower() in IMAGE_EXTS
    ])
    if images:
        manifest[sku] = images

manifest_path = os.path.join(root, 'manifest.json')
with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

total_images = sum(len(v) for v in manifest.values())
print(f"manifest.json updated: {total_images} image(s) across {len(manifest)} SKU(s)")
for sku, files in manifest.items():
    print(f"  {sku}: {files}")
