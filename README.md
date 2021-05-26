# gps-logger
This repository contains the sources for a GPS logger application running on a WAGO PFC 750-8217 with Mobile Radio Module 4G. For further information check the Wiki (https://github.com/WAGO/gps-logger/wiki)


## Starting the gps-logger container 

```bash
docker run -d \
--restart=always \
--name gps-logger \
-v your/log/folder:/app/volume \
-p 8081:5000 \ (port 8081 can be changed)
-e OPENCELLID_KEY=your_access_token \
-e ROOT_PWD=your_toot_password \ (optional => default "wago")
-e BRIDGE_IP_HOST=bridge.network.ip \ (optional => default "172.17.0.1")
wagoautomation/gps-logger:tag (e.g. latest or 01.01.00)
```
