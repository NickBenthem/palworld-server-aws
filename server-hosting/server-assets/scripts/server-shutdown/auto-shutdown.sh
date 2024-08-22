#!/bin/sh

# Load environment variables from the .env file
export $(grep -v '^#' .env | xargs)

# Ensure that the necessary environment variables are set
if [ -z "$GAME_PORT" ] || [ -z "$SHUTDOWN_IDLE_MINUTES" ] || [ -z "$IDLE_CHECK_FREQUENCY_SECONDS" ]; then
  echo "Error: One or more required environment variables (GAME_PORT, SHUTDOWN_IDLE_MINUTES, IDLE_CHECK_FREQUENCY_SECONDS) are not set."
  exit 1
fi
isIdle=0

while [ $isIdle -le 0 ]; do
    isIdle=1
    iterations=$((60 / $IDLE_CHECK_FREQUENCY_SECONDS * $SHUTDOWN_IDLE_MINUTES))
    while [ $iterations -gt 0 ]; do
        sleep $IDLE_CHECK_FREQUENCY_SECONDS

        # Check TCP connections
        tcpReceived=$(ss -l | grep "$GAME_PORT" | awk '{s+=$3} END {print s}')
        tcpSent=$(ss -l | grep "$GAME_PORT" | awk '{s+=$4} END {print s}')

        # If any of the connection bytes are not empty or greater than 0
        if ([ ! -z $tcpReceived ] && [ $tcpReceived -gt 0 ]) || \
           ([ ! -z $tcpSent ] && [ $tcpSent -gt 0 ]); then
            isIdle=0
        fi

        if [ $isIdle -le 0 ] && [ $(($iterations % 21)) -eq 0 ]; then
           echo "Activity detected, resetting shutdown timer to $SHUTDOWN_IDLE_MINUTES minutes."
           break
        fi
        iterations=$(($iterations-1))
    done
done

echo "No activity detected for $shutdownIdleMinutes minutes, shutting down."
