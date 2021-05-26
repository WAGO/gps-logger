#!/bin/bash
#get path, run 'logCell.sh'
sshpass -p $ROOT_PWD ssh root@$BRIDGE_IP_HOST -o StrictHostKeyChecking=no <<'ENDSSH'
    volumePath=$(docker volume inspect --format '{{ .Mountpoint }}' locationLog)
    bash $volumePath/logCell.sh &
    echo done
ENDSSH