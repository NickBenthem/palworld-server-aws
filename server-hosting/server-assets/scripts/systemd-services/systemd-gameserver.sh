##!/bin/bash
#
## This script creates a systemd service file for a game server with configurable
## Description, ExecStart, and WorkingDirectory.
## Usage: ./your_script_name.sh "Service Description" "Path to ExecStart Script" "Working Directory"
#
## Variables to be passed to the script
#DESCRIPTION=$1
#EXEC_START=$2
#WORKING_DIRECTORY=$3
#
## Create the systemd service file
#cat << EOF > /etc/systemd/system/gameserver.service
#[Unit]
#Description=$DESCRIPTION
#Wants=network-online.target
#After=syslog.target network.target nss-lookup.target network-online.target
#
#[Service]
#Environment="LD_LIBRARY_PATH=./linux64"
##ExecStartPre=\$STEAM_INSTALL_SCRIPT
#ExecStart=$EXEC_START
#User=ubuntu
#Group=ubuntu
#StandardOutput=journal
#Restart=on-failure
#KillSignal=SIGINT
#WorkingDirectory=$WORKING_DIRECTORY
#
#[Install]
#WantedBy=multi-user.target
#EOF
#
## Enable and start the service
#systemctl enable gameserver
#systemctl start gameserver
