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
wagoautomation/gps-logger:tag (e.g. latest or 0.1.0)
```
## Get OpenCelliD access token
- Create a free account on the website https://opencellid.org/. 
- After logging in, the token can be generated under "API Access Tokens" via "Create Access Token". 

> <span style="color:red;"> <strong>Attention:</strong> </span> If necessary the port "8081" can be changed according to internal IT security guidelines. This port is used to access the application web interface. 
