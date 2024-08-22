#!/bin/bash

# Note: Arguments to this script 
#  1: number - Application ID from SteamDB (required)

# Get the directory of the current script
SCRIPT_DIR=$(dirname "$0")

# Define log file path in the same directory as the script
LOG_FILE="$SCRIPT_DIR/steam_install.log"

# install steamcmd: https://developer.valvesoftware.com/wiki/SteamCMD?__cf_chl_jschl_tk__=pmd_WNQPOiK18.h0rf16RCYrARI2s8_84hUMwT.7N1xHYcs-1635248050-0-gqNtZGzNAiWjcnBszQiR#Linux.2FmacOS)
{
    add-apt-repository multiverse
    dpkg --add-architecture i386
    apt update

    # Needed to accept steam license without hangup
    echo steam steam/question 'select' "I AGREE" | sudo debconf-set-selections
    echo steam steam/license note '' | sudo debconf-set-selections

    apt install -y unzip lib32gcc1 steamcmd jq binutils expect lib32stdc++6 libsdl2-2.0-0:i386 libxml2-utils netcat pigz

    STEAMWORKS_SDK_SCRIPT="mkdir -p ~/.steam/sdk64/ && steamcmd +force_install_dir ~/.steam +login anonymous +app_update 1007 +quit"
    # Gather 64bit SDK https://developer.valvesoftware.com/wiki/SteamCMD#SteamCMD_Startup_Errors
    COPY_SDK_SCRIPT="cp ~/Steam/steamapps/common/Steamworks\ SDK\ Redist/linux64/steamclient.so ~/.steam/sdk64/"

    echo "$STEAMWORKS_SDK_SCRIPT"
    echo "$COPY_SDK_SCRIPT"
    pushd ~ || exit

    # Download LinuxGSM, initialize as Ubuntu to create sdtdserver file.
    su - ubuntu -c "curl -Lo ~/linuxgsm.sh https://linuxgsm.sh && chmod +x ~/linuxgsm.sh && bash ~/linuxgsm.sh sdtdserver"

    # Run as root to install dependencies.
    su ~/sdtdserver auto-install

    # Run as user to install.
    su - ubuntu -c "bash ~/sdtdserver auto-install"

    # Copy files for  initialization.
    su - ubuntu -c "cp /home/ubuntu/games/7daystodie/game-server-configs/serverconfig.xml /home/ubuntu/serverfiles/sdtdserver.xml"

    # Generate the service to start.
    echo "[Unit]
    Description=LinuxGSM sdtdserver Server
    After=network-online.target
    Wants=network-online.target

    [Service]
    Type=forking
    User=ubuntu
    WorkingDirectory=/home/ubuntu
    # Assume that the service is running after main process exits with code 0
    RemainAfterExit=yes
    ExecStart=/home/ubuntu/sdtdserver start
    ExecStop=/home/ubuntu/sdtdserver stop
    Restart=no

    [Install]
    WantedBy=multi-user.target" > /etc/systemd/system/sdtdserver.service

    sudo systemctl enable sdtdserver
    sudo systemctl start sdtdserver

    popd || exit

} 2>&1 | tee -a "$LOG_FILE"
