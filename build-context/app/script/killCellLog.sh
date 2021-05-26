#!/bin/bash
#SSH to host and kill 'logCell.sh'
sshpass -p $ROOT_PWD ssh root@$BRIDGE_IP_HOST -o StrictHostKeyChecking=no <<'ENDSSH'
    ps -aux | grep logCell.sh | awk '{print $2}' | xargs kill
    echo done
ENDSSH
