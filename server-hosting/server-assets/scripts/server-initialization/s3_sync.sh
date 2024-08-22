#!/bin/bash

# This script adds a cron job for the ubuntu user that synchronizes a local directory
# with an S3 bucket every 5 minutes.
# Usage: ./script.sh <APP_SAVE_LOCATION> <S3_SAVE_BUCKET>

# Accept parameters for APP_SAVE_LOCATION and S3_SAVE_BUCKET
APP_SAVE_LOCATION=$1
S3_SAVE_BUCKET=$2

# Check if parameters are provided
if [[ -z "$APP_SAVE_LOCATION" || -z "$S3_SAVE_BUCKET" ]]; then
  echo "Usage: $0 <APP_SAVE_LOCATION> <S3_SAVE_BUCKET>"
  exit 1
fi

# Add the cron job
(crontab -l -u ubuntu 2>/dev/null; echo "*/5 * * * * /usr/local/bin/aws s3 sync $APP_SAVE_LOCATION s3://$S3_SAVE_BUCKET") | crontab -u ubuntu -
