Each folder follows the following pattern:

- a `game-config.json`, with game specific parameters.  
- A `steamapps_common` folder. 
  - Files in this folder are copied exactly as is, including structure, to the /home/ubuntu/.steam/SteamApps/common/ folder. 
- A `scripts` folder, which will execute any `bash` scripts on initialization. 
  - This is currently in development.