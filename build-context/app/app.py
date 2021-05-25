import threading
from flask import Flask
from flask import render_template
from flask import jsonify
from flask import request
import os
import time
import ast
import requests
import json
import signal
import sys

#const
MAX_LOCATIO_JSON_SIZE = 5000
#global var
logCell = False
run = True

#----------------------------------------------------------------------------------------
#Webserver-------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------
class webserver(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)

    def run(self):
        
        app = Flask(__name__)

        #get global var
        global logCell

        #dafault endpoint
        @app.route('/')
        #return index.html
        def Index():
            return render_template("index.html")

        #endpoint '/startLog'
        @app.route('/startLog', methods=['GET'])
        #start logging
        def StartLog():
            global logCell
            #start log if not logging yet
            if(logCell == False):
                response = os.popen("bash /app/script/startCellLog.sh").read()
                #success
                if(response == "done\n"):
                    #write to file
                    f = open("/app/volume/logStatus.txt","w")
                    f.write("True")
                    f.close()

                    logCell = True
                    return "Log started"
                #error
                else:
                    return "Error"
            else:
                return "Log already started"

        #endpoint '/stopLog'
        @app.route('/stopLog', methods=['GET'])
        #stop logging
        def StopLog():
            global logCell
            #stop log if logging
            if(logCell == True):
                response = os.popen("bash /app/script/killCellLog.sh").read()
                #success
                if(response == "done\n"):
                    #write to file
                    f = open("/app/volume/logStatus.txt","w")
                    f.write("False")
                    f.close()

                    logCell = False
                    return "Log stoped"
                #error
                else:
                    return "Error"
            else:
                return "Log already stoped"

        #endpoint '/logStatus'
        @app.route('/logStatus', methods=['GET'])
        #return log-status
        def LogStatus():
            global logCell
            #return 'True' or 'False'
            return str(logCell)

        #endpoint '/getJson'
        @app.route('/getJson', methods=['GET'])
        #return location data
        def GetJSON():
            data = open("/app/volume/location.json","r").readlines()[0]
            data = ast.literal_eval(data)
            #return locations as json
            return jsonify(data)
        
        #endpoint '/setJson'
        @app.route('/setJson', methods=['POST'])
        #set location data
        def SetJSON():
            try:
                data = request.get_json(force=True)
                f = open("/app/volume/location.json","w")
                f.write(str(json.dumps(data)))
                f.close()
                
                return "Success"
            except:
                return "invalid format"

        #entpoint '/shutdown'
        @app.route('/shutdown', methods=['GET'])
        #shutdown the server
        def Shutdown():
            func = request.environ.get('werkzeug.server.shutdown')
            if func is None:
                raise RuntimeError('Not running with the Werkzeug Server')
            func()
            return "Shutting down..."

        #entpoint '/getJsonStorage'
        @app.route('/getJsonSize', methods=['GET'])
        #shutdown the server
        def GetJsonStorage():
            global MAX_LOCATIO_JSON_SIZE
            #get location.json
            location = open("/app/volume/location.json","r").readlines()[0]
            #convert to Json
            locationJson = json.loads(location)
            locationJsonSize = len(locationJson["spots"])

            return str(locationJsonSize) + "/" + str(MAX_LOCATIO_JSON_SIZE)

        if __name__ == '__main__':
            app.run(host='0.0.0.0')

#----------------------------------------------------------------------------------------
#Cell to location------------------------------------------------------------------------
#----------------------------------------------------------------------------------------
class cellToLocation(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)

    def run(self):
        #vars for path
        locationPath = "/app/volume/location.json"
        cellPath = "/app/volume/cell.log"

        #returns time and date of last loction-------------------------------------------
        def GetLastLocationTimeDate(locationJson):
            lastLocationTime = ""
            lastLocationDate = ""
            #get time and date of last location
            if len(locationJson["spots"]) >= 1:
                lastLocationTime = locationJson["spots"][-1]["time"]
                lastLocationDate = locationJson["spots"][-1]["date"]
            return {"lastLocationTime": lastLocationTime, "lastLocationDate": lastLocationDate}

        #returns locations as Json-------------------------------------------------------
        def GetLocationJson():
            #read location.json
            location = open(locationPath,"r").readlines()[0]
            #convert to Json
            locationJson = json.loads(location)
            return locationJson

        #returns cell information of last location---------------------------------------
        def GetCellDataOfLastLocation(lastLocationDate, lastLocationTime):
            lastLocationMcc = ""
            lastLocationMnc = ""
            lastLocationLac = ""
            lastLocationCellId = ""
            lastLocationIndex = -1
            cell = ""
            #read cell.log
            cell = open(cellPath,"r").readlines()

            if (lastLocationDate != "" and lastLocationTime != ""):
                #find log of last location
                for index, value in reversed(list(enumerate(cell))):
                    #convert to Json
                    cellJson = json.loads(value)
                    #get time and date of current cell
                    cellDate = cellJson["date"]
                    cellTime = cellJson["time"]
                    #if same time and date -> save mcc, mnc, lac, cid and index of cell
                    if cellDate == lastLocationDate and cellTime == lastLocationTime:
                        mccmnc = cellJson["location"][0]["mccmnc"]
                        lastLocationMcc = mccmnc[:3]
                        lastLocationMnc = mccmnc[3:]
                        lastLocationLac = cellJson["location"][0]["lac"]
                        lastLocationCellId = cellJson["location"][0]["cid"]
                        lastLocationIndex = index
                        #stop for-loop
                        break
            return {"lastLocationMcc": lastLocationMcc, "lastLocationMnc": lastLocationMnc, "lastLocationLac":lastLocationLac, "lastLocationCellId": lastLocationCellId, "lastLocationIndex": lastLocationIndex, "cell": cell}

        #returns json of new spots-------------------------------------------------------
        def GetLocationOfNewerLogs(lastLocationMcc, lastLocationMnc, lastLocationLac, lastLocationCellId, lastLocationIndex, cell):
            #consts
            url = "http://opencellid.org/cell/get"
            #vars
            oldMcc = lastLocationMcc
            oldMnc = lastLocationMnc
            oldLac = lastLocationLac
            OldCellId = lastLocationCellId
            #list of new locastions
            newSpots = []

            for i in range(lastLocationIndex+1, len(cell)):
                #get json
                currentLineJson = json.loads(cell[i])
                #get mcc, mnc, lac, cellId
                mccmnc = currentLineJson["location"][0]["mccmnc"]
                mcc = mccmnc[:3]
                mnc = mccmnc[3:]
                lac = currentLineJson["location"][0]["lac"]
                cellId = currentLineJson["location"][0]["cid"]
                key = os.popen("echo $OPENCELLID_KEY").read()
                radio = currentLineJson["location"][0]["technology"]#radio is not send to API(get's less accurate)
                #only proceed if it is a new cell
                if not (mcc==oldMcc and mnc==oldMnc and lac==oldLac and cellId==OldCellId):
                    #params for request
                    payload = {"key":key,"mcc":mcc,"mnc":mnc,"lac":lac,"cellid":cellId,"format":"json"}
                    #send request
                    try:
                        response = requests.get(url, params=payload)

                        #get response Json
                        responseJson = json.loads(response.text)
                        #if response has no error
                        if not ("error" in responseJson):
                            newSpot = {}
                            newSpot["lat"] = responseJson["lat"]
                            newSpot["lon"] = responseJson["lon"]
                            newSpot["range"] = responseJson["range"]
                            newSpot["date"] = currentLineJson["date"]
                            newSpot["time"] = currentLineJson["time"]
                            newSpot["technology"] = currentLineJson["location"][0]["technology"]
                            newSpots.append(newSpot)

                        #print error
                        else:
                            error = responseJson["error"]
                            print(error, file=sys.stderr)
                            newSpot = {}
                            #save data without lat and lon
                            newSpot["lat"] = ""
                            newSpot["lon"] = ""
                            newSpot["range"] = ""
                            newSpot["date"] = currentLineJson["date"]
                            newSpot["time"] = currentLineJson["time"]
                            newSpot["technology"] = currentLineJson["location"][0]["technology"]
                            newSpots.append(newSpot)

                    except requests.ConnectionError:
                        print("no connection to internet", file=sys.stderr)

                #save current values as old
                oldMcc = mcc
                oldMnc = mnc
                oldLac = lac
                OldCellId = cellId
            
            return newSpots

        #add new spots to all locations
        def AddNewLocations(newSpots):
            #open location.json
            f = open(locationPath,"w")
            #add each new spot
            for spot in newSpots:
                locationJson["spots"].append(spot)
            #wirte new json
            f.write(str(json.dumps(locationJson)))
            print("Added new spots to location.json", file=sys.stderr)
            f.close()

        #--------------------------------------------------------------------------------
        #main----------------------------------------------------------------------------
        #--------------------------------------------------------------------------------
        print("start converting cell-data to location-data", file=sys.stderr)
        #information about last location/cell
        lastLocationDate = ""
        lastLocationTime = ""
        lastLocationMcc = ""
        lastLocationMnc = ""
        lastLocationLac = ""
        lastLocationCellId = ""
        lastLocationIndex = -1
        #content of files
        location = ""
        cell = ""
        #list of new spots
        newSpots = []
        #json of all locations
        locationJson = {}


        #add new locations---------------------------------------------------------------
        #--------------------------------------------------------------------------------

        #get last time/date of location.json---------------------------------------------
        locationJson = GetLocationJson()

        #at least one location already saved
        result = GetLastLocationTimeDate(locationJson)
        lastLocationDate = result["lastLocationDate"]       #empty if no location saved
        lastLocationTime = result["lastLocationTime"]       #empty if no location saved

        #get mcc, mnc, lac, cid and index of last cell in location.json------------------
        result = GetCellDataOfLastLocation(lastLocationDate, lastLocationTime)
        lastLocationMcc = result["lastLocationMcc"]         #empty if no location saved
        lastLocationMnc = result["lastLocationMnc"]         #empty if no location saved
        lastLocationLac = result["lastLocationLac"]         #empty if no location saved
        lastLocationCellId = result["lastLocationCellId"]   #empty if no location saved
        lastLocationIndex = result["lastLocationIndex"]     #-1 if no location saved
        cell = result["cell"]                               #empty if cell.log is empty

        #get location of all newer logs--------------------------------------------------
        newSpots = GetLocationOfNewerLogs(lastLocationMcc, lastLocationMnc, lastLocationLac, lastLocationCellId, lastLocationIndex, cell)

        #write new locations-------------------------------------------------------------
        AddNewLocations(newSpots)


        #remove old infos----------------------------------------------------------------
        #--------------------------------------------------------------------------------

        if(len(cell) > 100):
            print("There are more than 100 cell-logs", file=sys.stderr)
            #get time and date of last location if needed--------------------------------
            if(len(newSpots) >= 1):
                lastLocationDate = newSpots[-1]["date"]
                lastLocationTime = newSpots[-1]["time"]
            #get new cell log (maybe new logs)
            cell = open(cellPath,"r").readlines()

            #get index of last location--------------------------------------------------
            for index, value in reversed(list(enumerate(cell))):
                        #convert to Json
                        cellJson = json.loads(value)
                        #get time and date of current cell
                        cellDate = cellJson["date"]
                        cellTime = cellJson["time"]
                        #if same time and date -> save index of cell
                        if cellDate == lastLocationDate and cellTime == lastLocationTime:
                            lastLocationIndex = index
                            #stop for-loop
                            break
            print("index of last location in cell.log: " + str(lastLocationIndex), file=sys.stderr)
            print("lenght of cell.log: " + str(len(cell)), file=sys.stderr)
            #remove latest logs----------------------------------------------------------
            if((len(cell) - lastLocationIndex) < 100):
                while(len(cell) > 100):
                    del cell[0]
            #keep newest 100 and write last cell on index 0
            else:
                lastCell = cell[lastLocationIndex]
                while(len(cell) > 100):
                    del cell[0]
                cell[0] = lastCell

            #write new cell.log-----------------------------------------------------------
            f = open(cellPath,"w")
            for element in cell:
                f.write(element)
            f.close()
            print("rewrote cell.log", file=sys.stderr)


#----------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------


#function to stop container clean
def handler_stop_signals(signum, frame):
    global run
    run = False
    #stop logging
    os.system("bash /app/script/killCellLog.sh")
    #kill webserver
    requests.get('http://0.0.0.0:5000/shutdown')

#define funktion for 'stop container'
signal.signal(signal.SIGINT, handler_stop_signals)
signal.signal(signal.SIGTERM, handler_stop_signals)

#set current log status
data = open("/app/volume/logStatus.txt","r").readlines()[0]
#logging
if(data == "True"):
    response = os.popen("bash /app/script/startCellLog.sh").read()
    #success
    if(response == "done\n"):
        logCell = True
    #error
    else:
        logCell = False
#not logging
elif(data == "False"):
    logCell = False


#run threads
t1 = webserver()
t2 = cellToLocation()
print("start t1", file=sys.stderr)
t1.start()
print("t1 runs", file=sys.stderr)
while run:
    #cell->GPS
    if(logCell == True):
        t2 = cellToLocation()
        print("start t2", file=sys.stderr)
        t2.start()
        print("t2 runs", file=sys.stderr)
        t2.join()
        time.sleep(10)

        #limit GPS-data
        #get location.json
        location = open("/app/volume/location.json","r").readlines()[0]
        #convert to Json
        locationJson = json.loads(location)
        #if Json is bigger than 5000 -> remove oledest until smaller than 5000
        if(len(locationJson["spots"]) >= MAX_LOCATIO_JSON_SIZE):
            print("location.json is to big", file=sys.stderr)
            while(len(locationJson["spots"]) >= MAX_LOCATIO_JSON_SIZE):
                locationJson["spots"].pop(0)
            #write new location.json
            print("location.json was cut", file=sys.stderr)
            f = open("/app/volume/location.json","w")
            f.write(str(json.dumps(locationJson)))
            f.close()
        

     
