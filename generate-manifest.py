#!/usr/bin/env python3
"""
Auto-generate part_images/manifest.json by scanning part_images/{SKU}/ folders.

Usage (local images):
    python3 generate-manifest.py

Usage (Google Drive):
    python3 generate-manifest.py --gdrive FOLDER_ID --api-key YOUR_API_KEY

Run this whenever you add or remove images.
The manifest stores full URLs so the app works identically for both sources.
"""

import os
import json
import sys
import argparse

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}


def build_local_manifest():
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'part_images')
    manifest = {}

    for sku in sorted(os.listdir(root)):
        sku_dir = os.path.join(root, sku)
        if not os.path.isdir(sku_dir) or sku.startswith('.'):
            continue
        files = sorted([
            f for f in os.listdir(sku_dir)
            if os.path.isfile(os.path.join(sku_dir, f))
            and os.path.splitext(f)[1].lower() in IMAGE_EXTS
        ])
        if files:
            # Store as relative URL paths (works from the app's root)
            manifest[sku] = [f'part_images/{sku}/{f}' for f in files]

    return manifest


def build_gdrive_manifest(folder_id, api_key):
    """
    List SKU-named subfolders in a shared Google Drive folder, then list
    image files inside each. Requires the folder (and subfolders) to be
    shared as "Anyone with the link can view".
    """
    try:
        import urllib.request
        import urllib.parse
    except ImportError:
        print("ERROR: urllib not available", file=sys.stderr)
        sys.exit(1)

    def drive_list(parent_id, mime_filter=None):
        q = f"'{parent_id}' in parents and trashed = false"
        if mime_filter:
            q += f" and mimeType = '{mime_filter}'"
        params = urllib.parse.urlencode({
            'q': q,
            'fields': 'files(id,name,mimeType)',
            'key': api_key,
            'pageSize': 1000,
        })
        url = f'https://www.googleapis.com/drive/v3/files?{params}'
        with urllib.request.urlopen(url) as r:
            return json.loads(r.read())['files']

    manifest = {}

    # List SKU subfolders
    subfolders = drive_list(folder_id, mime_filter='application/vnd.google-apps.folder')
    print(f"Found {len(subfolders)} SKU folder(s) in Drive")

    for folder in sorted(subfolders, key=lambda x: x['name']):
        sku = folder['name']
        files = drive_list(folder['id'])
        image_files = [
            f for f in files
            if os.path.splitext(f['name'])[1].lower() in IMAGE_EXTS
        ]
        if image_files:
            # Use direct-view URL — works for publicly shared files
            manifest[sku] = [
                f"https://drive.google.com/uc?export=view&id={f['id']}"
                for f in sorted(image_files, key=lambda x: x['name'])
            ]

    return manifest


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--gdrive', metavar='FOLDER_ID', help='Google Drive root folder ID')
    parser.add_argument('--api-key', metavar='KEY', help='Google Drive API key')
    args = parser.parse_args()

    if args.gdrive:
        if not args.api_key:
            print("ERROR: --api-key is required with --gdrive", file=sys.stderr)
            sys.exit(1)
        print(f"Fetching from Google Drive folder: {args.gdrive}")
        manifest = build_gdrive_manifest(args.gdrive, args.api_key)
    else:
        manifest = build_local_manifest()

    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'part_images')
    manifest_path = os.path.join(root, 'manifest.json')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    total = sum(len(v) for v in manifest.values())
    print(f"manifest.json updated: {total} image(s) across {len(manifest)} SKU(s)")
    for sku, urls in manifest.items():
        print(f"  {sku}: {len(urls)} image(s)")


if __name__ == '__main__':
    main()
