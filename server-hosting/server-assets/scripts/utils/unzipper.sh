#!/bin/bash

# Currently hard coded into the initialize script.

# Unzip all zip files in the current directory
for zip_file in *.zip; do
    if [ -f "$zip_file" ]; then
        unzip -o "$zip_file"
    fi
done

# Add execute permissions to all files in the current directory
chmod +x *

echo "All zip files have been extracted and execute permissions have been added to all files."