#!/bin/bash
echo "* Scaffolding local object storage..."
rm -rf .local-object-storage
mkdir -p .local-object-storage/floorplans
mkdir -p .local-object-storage/profileimages

echo "* Downloading fake user profile images..."
curl -L 'https://picsum.photos/256/256' > .local-object-storage/profileimages/one.png
curl -L 'https://picsum.photos/256/256' > .local-object-storage/profileimages/two.png
curl -L 'https://picsum.photos/256/256' > .local-object-storage/profileimages/three.png

echo "* Copying fake floorplan fixture..."
cp fixtures/floor-svg-15.svg .local-object-storage/floorplans/15.svg
