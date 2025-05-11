#!/bin/bash

ghostscript_layer="https://github.com/cbschuld/ghostscript-aws-lambda-layer/releases/download/10.02.1/ghostscript-layer.zip"
imagemagick_layer="https://github.com/cbschuld/imagemagick-aws-lambda-layer/releases/download/7.1.1-21/imagemagick-layer.zip"

# wget the layers to `packages` and unzip them there with the same name. then remove the zips.

wget $ghostscript_layer -O packages/ghostscript-layer.zip
unzip packages/ghostscript-layer.zip -d packages/ghostscript-layer
rm packages/ghostscript-layer.zip

wget $imagemagick_layer -O packages/imagemagick-layer.zip
unzip packages/imagemagick-layer.zip -d packages/imagemagick-layer
rm packages/imagemagick-layer.zip

chmod +x packages/imagemagick-layer/bin/magick
chmod +x packages/imagemagick-layer/bin/convert
chmod +x packages/imagemagick-layer/bin/identify
chmod +x packages/ghostscript-layer/bin/gs
