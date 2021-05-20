//-------------------------------------------------------------------------------------------------
//vars
//-------------------------------------------------------------------------------------------------
//GPS-Data
var baseJson
var CurrentBaseJson;
//all circles
var featureGroupCircles;
//all marker
var featureGroupMarkers;
var route;
var map;

//-------------------------------------------------------------------------------------------------
//create map
//-------------------------------------------------------------------------------------------------
map = L.map('mapid').setView([0, 0], 1);
//setup of map
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1
}).addTo(map);


//-------------------------------------------------------------------------------------------------
//add or removes circles
//-------------------------------------------------------------------------------------------------
$("#toggleCircles").click(function(){
    console.log("toggleCircles");
    //map has circles
    if(map.hasLayer(featureGroupCircles)){
        map.removeLayer(featureGroupCircles);
    }
    //mapt don't have circles
    else{
        map.addLayer(featureGroupCircles);
    }
});

//-------------------------------------------------------------------------------------------------
//add or removes markers
//-------------------------------------------------------------------------------------------------
$("#toggleMarkers").click(function(){
    console.log("toggleMarkers");
    //map has markers
    if(map.hasLayer(featureGroupMarkers)){
        map.removeLayer(featureGroupMarkers);
    }
    //mapt don't have markers
    else{
        map.addLayer(featureGroupMarkers);
    }
});

//-------------------------------------------------------------------------------------------------
//add or removes route
//-------------------------------------------------------------------------------------------------
$("#toggleRoute").click(function(){
    console.log("toggleRoute");
    //map has route
    if(map.hasLayer(route)){
        map.removeLayer(route);
    }
    //mapt don't have route
    else{
        map.addLayer(route);
    }
});

//-------------------------------------------------------------------------------------------------
//set filters
//-------------------------------------------------------------------------------------------------
$("#setFilters").click(function(){
    console.log("setFilters");
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

    //technology
    var technology = ($('input[name=technology]:checked').val());
    //temorary Json to write data
    var tmpJson = {};
    tmpJson.spots = [];

    baseJson["spots"].forEach(function(spot){
        //push all wanted spots in tmpJson
        var spotTime = spot.time.slice(0,-3).split(":");
        var spotHour = parseInt(spotTime[0]);
        var spotMinute = parseInt(spotTime[1]);

        var spotDate = spot.date.split("-");
        var spotYear = parseInt(spotDate[0]);
        var spotMonth = parseInt(spotDate[1]);
        var spotDay = parseInt(spotDate[2]);

        if( //date is later than start-date and start-time
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
        ){
            //if LTE checked, only write LTE
            if(technology=="LTE" && spot.technology=="LTE"){
                tmpJson.spots.push(spot);
            //if ALL checked, wirite all
            }else if(technology=="ALL"){
                tmpJson.spots.push(spot);
            }
            
        }
    });
    CurrentBaseJson = tmpJson;
    LoadMapElements(CurrentBaseJson);
});


//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------------------------------------
//list of all circles
//-------------------------------------------------------------------------------------------------
function LoadCircles(baseJson){
    console.log("LoadCircles");
    var circles = [];
    var circleStyle = {
        color: "#616A73",
        fillColor: "#616A73",
        weight: 1,
        fillOpacity: 0.2
    }
    //fill circles with all circles
    baseJson["spots"].forEach(function(spot){
        //only proseed if spot has lat
        if(spot["lat"]!=""){
            //create a single circle for each spot
            var circle = L.circle([spot["lat"],spot["lon"]], spot["range"], circleStyle).bindPopup(spot["range"] + " m");
            circles.push(circle);
        }
        
    });
    //add circles to map
    var featureGroupCircles = L.featureGroup(circles).addTo(map);
    return featureGroupCircles;
}

//-------------------------------------------------------------------------------------------------
//list of all markers
//-------------------------------------------------------------------------------------------------
function LoadMarkers(baseJson){
    console.log("LoadMarkers");
    var markers = [];
    //list of Json with all information to create all markers
    var markersJson = [];
    //define blackIcon
    var blackIcon = L.icon({
        iconUrl: "static/media/marker_black.svg",
        iconSize: [33,37],
        iconAnchor: [17,37],
        popupAnchor: [0,-30]
    })

    //fill markersJson with lat, lon, time, additionalTime
    baseJson["spots"].forEach(function(spot){
        //only proseed if spot has lat
        if(spot["lat"]!=""){
            //Json of single marker
            var markerJson = Object.create(spot);
            markerJson["additionalTime"] = "";
            markerJson["additionalDate"] = "";
            //check if same lat and lon is in markersJson
            markersJson.forEach(function(savedMarker){
                if(savedMarker["lat"]==markerJson["lat"] && savedMarker["lon"]==markerJson["lon"]){
                    //add time of other markers
                    markerJson["additionalTime"] += "<br>" + savedMarker["time"];
                    savedMarker["additionalTime"] += "<br>" + markerJson["time"];
                    //add date of other markers
                    markerJson["additionalDate"] += "<br>" + savedMarker["date"];
                    savedMarker["additionalDate"] += "<br>" + markerJson["date"];
                }
            });
            markersJson.push(markerJson);
        }
    });


    //fill markers with all markers
    markersJson.forEach(function(spot){
        //create a single marker for each spot
        var marker = L.marker([spot["lat"],spot["lon"]], {icon:blackIcon}).bindPopup(
            "<table>" +
                "<tr>" +
                    "<td>" +
                        "Date" +
                    "</td>" +
                    "<td>" +
                        "<b>" + spot["date"] + "</b>" + spot["additionalDate"] +
                    "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td>" +
                        "Time" +
                    "</td>" +
                    "<td>" +
                        "<b>" + spot["time"] + "</b>" + spot["additionalTime"] +
                    "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td>" +
                        "Range" +
                    "</td>" +
                    "<td>" +
                        spot["range"] + " m" +
                    "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td>" +
                        "Technology" +
                    "</td>" +
                    "<td>" +
                        spot["technology"] +
                    "</td>" +
                "</tr>" +
            "</table>");
       
        markers.push(marker);
    });
    //add markers to map
    var featureGroupMarkers = L.featureGroup(markers).addTo(map);
    return featureGroupMarkers;
}

//-------------------------------------------------------------------------------------------------
//list of all coordinates
//-------------------------------------------------------------------------------------------------
function LoadRoute(baseJson){
    console.log("LoadRoute");
    var coordinates = []
    var routeStyle = {
        color: '#6EC800',
        weight: 5,
        opacity: 1,
        smoothFactor: 1
    }
    //fill coordinates with all coordinates
    baseJson["spots"].forEach(function(spot){
        //only proseed if spot has lat
        if(spot["lat"]!=""){
            //create a single coordinate for each spot
            var coordinate = [spot["lat"],spot["lon"]];
            coordinates.push(coordinate);
        }
    });
    var route = new L.Polyline(coordinates, routeStyle).addTo(map);
    return route
}

//-------------------------------------------------------------------------------------------------
//remove layer of map
//-------------------------------------------------------------------------------------------------
function RemoveAllLayers(){
    console.log("LoadRoute");
    //remove circles
    if(window.map.hasLayer(window.featureGroupCircles)){
        window.map.removeLayer(window.featureGroupCircles);
    }
    //remove markers
    if(window.map.hasLayer(window.featureGroupMarkers)){
        window.map.removeLayer(window.featureGroupMarkers);
    }
    //remove route
    if(window.map.hasLayer(window.route)){
        window.map.removeLayer(window.route);
    }
    
}


function LoadMapElements(baseJson){
    console.log("LoadMapElements");
    RemoveAllLayers();
    window.featureGroupCircles = LoadCircles(baseJson);
    window.featureGroupMarkers = LoadMarkers(baseJson);
    window.route = LoadRoute(baseJson);
    try {
        window.map.fitBounds(window.featureGroupCircles.getBounds());
      }
      catch(err) {
        console.log(err);
      }
}

