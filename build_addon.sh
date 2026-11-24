#!/bin/bash

# Build script for CyrixEssentials
# Packages the Behavior Pack and Resource Pack as folders into a single .mcaddon file
#
# The version in "CyrixEssentials (BP)/manifest.json" is the single source of truth:
# it names the output file and is stamped into the pack display names
# (pack.name in the texts/*.lang files) on every build.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Pack names
BP_DIR="CyrixEssentials (BP)"
RP_DIR="CyrixEssentials (RP)"

echo -e "${YELLOW}Building CyrixEssentials addon...${NC}"

# Read the version from the BP manifest
VERSION=$(python3 -c "import json; print('.'.join(map(str, json.load(open('$BP_DIR/manifest.json'))['header']['version'])))")
if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: could not read version from $BP_DIR/manifest.json!${NC}"
    exit 1
fi
OUTPUT_NAME="CyrixEssentials ${VERSION}.mcaddon"
echo -e "${YELLOW}Version: ${VERSION}${NC}"

# Check if directories exist
if [ ! -d "$BP_DIR" ]; then
    echo -e "${RED}Error: $BP_DIR not found!${NC}"
    exit 1
fi

if [ ! -d "$RP_DIR" ]; then
    echo -e "${RED}Error: $RP_DIR not found!${NC}"
    exit 1
fi

# Sanity check: both packs must have a manifest
if [ ! -f "$BP_DIR/manifest.json" ] || [ ! -f "$RP_DIR/manifest.json" ]; then
    echo -e "${RED}Error: manifest.json missing from one of the packs!${NC}"
    exit 1
fi

# Stamp the version into the in-game pack display names so they always match
# the manifest version.
for LANG_FILE in "$BP_DIR/texts/en_US.lang" "$RP_DIR/texts/en_US.lang"; do
    sed -i "s/^pack.name=.*/pack.name=CyrixEssentials ${VERSION}/" "$LANG_FILE"
done

# Back up any existing builds instead of deleting them
BACKUP_COUNTER=0
shopt -s nullglob
for existing in CyrixEssentials*.mcaddon; do
    mkdir -p backups
    BACKUP_COUNTER=$((BACKUP_COUNTER + 1))
    BACKUP_NAME="backups/${existing%.mcaddon}_$(date +%Y%m%d_%H%M%S)_${BACKUP_COUNTER}.mcaddon"
    echo "Backing up existing $existing -> $BACKUP_NAME"
    mv "$existing" "$BACKUP_NAME"
done
shopt -u nullglob
# Keep only the 10 most recent backups
ls -1t backups/*.mcaddon 2>/dev/null | tail -n +11 | while IFS= read -r old; do rm -f "$old"; done

# Zip both pack folders directly into the .mcaddon (no intermediate .mcpack files)
python3 - "$BP_DIR" "$RP_DIR" "$OUTPUT_NAME" <<'PYEOF'
import os, sys, zipfile

bp_dir, rp_dir, out_name = sys.argv[1:4]

def add_pack(zf, pack_dir):
    for root, dirs, files in os.walk(pack_dir):
        dirs[:] = sorted(d for d in dirs if not d.startswith("."))
        for f in sorted(files):
            if f == ".DS_Store" or f.startswith("."):
                continue
            full = os.path.join(root, f)
            rel = os.path.relpath(full, ".").replace(os.sep, "/")
            zf.write(full, rel)

with zipfile.ZipFile(out_name, "w", zipfile.ZIP_DEFLATED) as mcaddon:
    for pack_dir in (bp_dir, rp_dir):
        add_pack(mcaddon, pack_dir)

print(f"Packed {os.path.getsize(out_name)} bytes -> {out_name}")
PYEOF

echo -e "${GREEN}Build complete: $OUTPUT_NAME${NC}"
echo "Location: $SCRIPT_DIR/$OUTPUT_NAME"
echo "Size: $(du -h "$OUTPUT_NAME" | cut -f1)"
