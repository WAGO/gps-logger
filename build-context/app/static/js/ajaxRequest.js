//run when site is loaded----------------------------------------------------------------
$(document).ready(function(){
    //get all locations
    console.log("ready");
    $.ajax({
        url: "/getJson",
        type: "GET",
        success: getJsonOnSuccess,
        error: getJsonOnError
    });
    //get current log status
    $.ajax({
        url: "/logStatus",
        type: "GET",
        success: logStatusOnSuccess,
        error: logStatusOnError
    });
    //get information about storage
    $.ajax({
        url: "/getJsonSize",
        type: "GET",
        success: getJsonSizeOnSuccess,
        error: getJsonSizeOnError
    });
    
});
//start logging--------------------------------------------------------------------------
$("#startLogging").click(function(){
    console.log("startLogging");
    //start logging
    $.ajax({
        url: "/startLog",
        type: "GET",
        success: changeLogOnSuccess,
        error: changeLogOnError
    });
});
//stop logging---------------------------------------------------------------------------
$("#stopLogging").click(function(){
    console.log("stopLogging");
    //stop logging
    $.ajax({
        url: "/stopLog",
        type: "GET",
        success: changeLogOnSuccess,
        error: changeLogOnError
    });
});
//remove data----------------------------------------------------------------------------
$("#removeData").click(function(){
    console.log("removeData");
    //get start time and date
    var startTime = $("#startTime").val().split(":");
    var startHour = parseInt(startTime[0]);
    var startMinute = parseInt(startTime[1]);

    var startDate = $("#startDate").val().split("-");
    var startYear = parseInt(startDate[0]);
    var startMonth = parseInt(startDate[1]);
    var startDay = parseInt(startDate[2]);
    //get stop time and date
    var stopTime = $("#stopTime").val().split(":");
    var stopHour = parseInt(stopTime[0]);
    var stopMinute = parseInt(stopTime[1]);

    var stopDate = $("#stopDate").val().split("-");
    var stopYear = parseInt(stopDate[0]);
    var stopMonth = parseInt(stopDate[1]);
    var stopDay = parseInt(stopDate[2]);

    //temorary Json to write data
    var tmpJson = {};
    tmpJson.spots = [];

    for (var i = 0; i < baseJson["spots"].length; i++){
        //remove all filtered spots
        var spotTime = baseJson["spots"][i].time.slice(0,-3).split(":");
        var spotHour = parseInt(spotTime[0]);
        var spotMinute = parseInt(spotTime[1]);

        var spotDate = baseJson["spots"][i].date.split("-");
        var spotYear = parseInt(spotDate[0]);
        var spotMonth = parseInt(spotDate[1]);
        var spotDay = parseInt(spotDate[2]);

        
        if( 
            !(
                //date is later than start-date and start-time
                (   
                    spotYear>startYear || 
                    (spotYear==startYear && spotMonth>startMonth) || 
                    (spotYear==startYear && spotMonth==startMonth && spotDay>startDay) || 
                    ((spotYear==startYear && spotMonth==startMonth && spotDay==startDay) && (spotHour>startHour || (spotHour==startHour && spotMinute>=startMinute)))
                ) &&
                //date is before stop-date and stop-time
                (
                    spotYear<stopYear || 
                    (spotYear==stopYear && spotMonth<stopMonth) || 
                    (spotYear==stopYear && spotMonth==stopMonth && spotDay<stopDay) ||
                    ((spotYear==stopYear && spotMonth==stopMonth && spotDay==stopDay) && (spotHour<stopHour || (spotHour==stopHour && spotMinute<=stopMinute)))
                )
            )
        ){
            
            tmpJson.spots.push(baseJson["spots"][i]);
        }
        
    }
    if (confirm("Are you sure you want to remove this data? Removed data can not be restored!")) {
        //remove data
        $.ajax({
            url: "/setJson",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(tmpJson),
            success: setJsonOnSuccess,
            error: setJsonOnError
        });
      } else {
        //cancel
      }
});


//---------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------


//getJson--------------------------------------------------------------------------------
function getJsonOnSuccess(data){
    console.log("getJsonOnSuccess");
    baseJson = data;
    //reload map-elements
    LoadMapElements(baseJson);
    var oldestTime = baseJson["spots"][0]["time"];
    var oldestDate = baseJson["spots"][0]["date"];
    var newestTime = baseJson["spots"][baseJson["spots"].length -1]["time"];
    var newestDate = baseJson["spots"][baseJson["spots"].length -1]["date"];
    $("#oldestLog").html(oldestDate + "   " + oldestTime);
    $("#newestLog").html(newestDate + "   " + newestTime);

    $("#stopDate").val(newestDate);
    $("#stopTime").val(newestTime.substring(0,newestTime.length-3));

    $("#startDate").val(oldestDate);
    $("#startTime").val(oldestTime.substring(0,oldestTime.length-3));
}

function getJsonOnError(){
    console.log("getJsonOnError");
	console.log("Error while 'getJson'");
}

//logStatus------------------------------------------------------------------------------
function logStatusOnSuccess(data){
    console.log("logStatusOnSuccess");
    //set status
    if (data=="True"){
        $("#logStatus").html("Logging");
    }else{
        $("#logStatus").html("Not Logging");
    }
}

function logStatusOnError(){
    console.log("logStatusOnError");
	console.log("Error while 'logStatus'");
}

//startLog/stopLog-----------------------------------------------------------------------
function changeLogOnSuccess(data){
    console.log("changeLogOnSuccess");
    if(data=="Error"){
        console.log("Error while changeLogOnSuccess");
        alert("Error while 'Start Logging' or 'Stop Logging'. Please check your command for running this container. (e.g. ROOT_PWD)");
    }
    else{
        //get current log-status
        $.ajax({
            url: "/logStatus",
            type: "GET",
            success: logStatusOnSuccess,
            error: logStatusOnError
        });
    }
}

function changeLogOnError(){
    console.log("changeLogOnError");
	console.log("Error while 'startLog' or 'stopLog'");
}

//setJson--------------------------------------------------------------------------------
function setJsonOnSuccess(){
    console.log("setJsonOnSuccess");
    //get new Json
    $.ajax({
        url: "/getJson",
        type: "GET",
        success: getJsonOnSuccess,
        error: getJsonOnError
    });
    
}

function setJsonOnError(){
    console.log("setJsonOnError");
	console.log("Error while 'remove data'");
}

//getJsonSize--------------------------------------------------------------------------------
function getJsonSizeOnSuccess(data){
    console.log("getJsonSizeOnSuccess");
    //set "Storage"
    $("#storage").html(data + " Spots");
}

function getJsonSizeOnError(){
    console.log("getJsonSizeOnError");
	console.log("Error while 'getJsonSize'");
}