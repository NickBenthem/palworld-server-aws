#!/bin/bash

# Check if the correct number of arguments is provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 source_folder destination_folder"
    exit 1
fi

# Assign arguments to variables
SOURCE_FOLDER=$1
DESTINATION_FOLDER=$2

# Copy files recursively and force overwrite
cp -rf "$SOURCE_FOLDER"/* "$DESTINATION_FOLDER"

# Print success message
echo "Files copied from $SOURCE_FOLDER to $DESTINATION_FOLDER successfully."
