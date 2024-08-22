crontab -l -e ubuntu | { cat; echo \"*/5 * * * * /usr/local/bin/aws s3 sync $APP_SAVE_LOCATION s3://sevendaystodiehosting-sevendaystodiehostingsavesbu-p8zhv6l0klg9\"; } | crontab -
/usr/local/bin/aws s3 sync /home/ubuntu/.local/share/7DaysToDie s3://sevendaystodiehosting-sevendaystodiehostingsavesbu-p8zhv6l0klg9;
sudo su -s /bin/bash ubuntu