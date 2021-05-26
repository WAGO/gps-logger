#!/bin/bash
function getLocation() {
    echo $(/etc/config-tools/config_mdmd-ng -n get json)
}
function getDate() {
    echo '"date":"'$(date +%F)'"'
}
function getTime() {
    echo '"time":"'$(date +%T)'"'
}
#get path of volume on host
volumePath=$(docker volume inspect --format '{{ .Mountpoint }}' locationLog)

while :
do
    #write information in cell.log
    echo '{'$(getDate),$(getTime),'"location"':[$(getLocation)]'}' >> $volumePath/cell.log
    sleep 10
done 
