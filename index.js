const express = require ("express"); //web framework. Handles routing, req res middleware, etc.
const request = require ("request-promise-native"); //handles the web requests, callbacks, or in this case promises.
const fs = require ("fs");
const path = require ("path");
const e = require("express");
const app = new express();
app.set("view engine", "pug");

app.use(express.static(path.join(__dirname, 'views')));

//AVWX REST API get Auth token set up before Nov. 1
//get "the station has # runways" s fixed and TAF fixed for remote airports like CYKP
//swtiched from city name based loccation info to coordinate based info, switched from apixu api to GeoNames api

const preWeatherMap = new Map();
const discWeatherMap = new Map();
const midWeatherMap = new Map();
const postWeatherMap = new Map();



function numberToMonth (n) {
        return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(n, 10) - 1];
}

function cloudDecode (code) {
    if (code == "CLR") { //CLR and SKC means that there are no clouds
        return "CLR"
    }
    if (code == "SKC") {
        return "SKC" //no change if CLR or SKC since we will be replacing the clouds message if the skies are clear
    }
    if (code == "FEW") {
        return "Few clouds"
    }
    if (code == "SCT") {
        return "Scattered clouds"
    }
    if (code == "BKN") {
        return "Broken clouds"
    }
    if (code == "OVC") {
        return "Overcast"
    }
}
 
var diagramsList = "CYKF CYOW CYUL CYVR CYYC CYYZ KATL KAUS KBNA KBOS KBWI KCTL KDAL KDCA KDEN KDFW KDTW KEWR KFLL KIAD KIAH KJFK KLAS KLAX KLGA KMCO KMDW KMIA KMSP KORD KPDK KPHL KPHX KPHX KSAN KSEA KSFU KSLC KSTL KTPA PHNL";
 
app.get("/", middleware2);//if needed, multiple middleware functions can be put in one app.get, but only one res of course
function middleware2 (req, res, next) { //please keep in mind that a function name is not needed, also => may be used instead
    res.render ("index2");
}

app.get("/howto", middleware3);
function middleware3 (req, res, next) {
    res.render ("index3");
}


app.get("/metar/:airport", function(req, res, next) {
    middleware_Met (req, res, next);
});


function middleware_Met (req, res, next) {

    var airportCode = req.params.airport;
    airportCode = airportCode.toUpperCase(); 
    if (diagramsList.includes("K"+airportCode)) {
        airportCode = "K"+airportCode;
    } else if (diagramsList.includes("C"+airportCode)){
        airportCode = "C"+airportCode;
    } 


    res.set('Authorization', '8Tt5zTsc8i8BzFmPD7oIcFVPewB17gPdLvquubKStjU');
    var readings, tafReadings, airInfo, locInfo;//declarations for all the parsed bodies
    var requests = [request ({
                        "uri" : "https://avwx.rest/api/metar/"+airportCode+"?options=&format=json&onfail=cache", 
                        "headers" : {"Authorization" : "8Tt5zTsc8i8BzFmPD7oIcFVPewB17gPdLvquubKStjU"}
                    }), 
                    request ({
                        "uri" : "https://avwx.rest/api/taf/"+airportCode+"?options=summary&format=json&onfail=cache", 
                        "headers" : {"Authorization" : "8Tt5zTsc8i8BzFmPD7oIcFVPewB17gPdLvquubKStjU"}
                    }),    
                    request ({
                        "uri" : "https://avwx.rest/api/station/"+airportCode+"?format=json", 
                        "headers" : {"Authorization" : "8Tt5zTsc8i8BzFmPD7oIcFVPewB17gPdLvquubKStjU"}
                    })]; //requests is an array of promises, 1 for each request,

    
    Promise.all(requests).then(function(responses) {//returns a single promise for all of the promises in the array of requests, then executes the function, this function just takes reponses (which has all the metar info) and puts in into readings
        readings = JSON.parse(responses[0]); //first thing in the array of promises, has the readings for the METAR, the second has the readings for TAF, etc.
        tafReadings = JSON.parse(responses[1]);
        airInfo = JSON.parse(responses[2]);
        return request('http://api.geonames.org/timezoneJSON?lat='+airInfo.latitude+'&lng='+airInfo.longitude+'&username=type_kenye_03'); //return another request-promise, then executes the function in .then, we needed the info in responses[2] for this request, so we can't make the request-promise until now
    }).then (function (city_body){
        locInfo = JSON.parse (city_body);
        //everytjomg from the previous request-promises is now in scope

        //METAR STUFF========================================================================================================================================================
        //===================================================================================================================================================================

        var transDate = (readings.time.dt.substr(0, 4) +"-"+ numberToMonth(readings.time.dt.substr(5, 2)) +"-"+ readings.time.dt.substr(8, 2)); 
        var transTime = (readings.time.dt.substr(11, 5));

        var splitMet = (readings.raw).split (" ");
        var metLength = splitMet.length; //splitMet is now an array of strings, with each string being a section of the Metar. metLength is how many sections there are
        for (var i = 0; i<metLength; i++) {
            if (splitMet[i].includes("KT")){ // looking for the section on windspeed
                var windDir = (""+splitMet[i][0]+ splitMet[i][1]+ splitMet[i][2]+" degrees") //setting wind speed and direaction by connecting elemetns of the string together.
                var windSpeed = (""+splitMet[i][3]+ splitMet[i][4]+"")
                if (splitMet[i].includes("G")){ //checking for gusts
                    var windSpeed = windSpeed.concat(" knots, gusting to "+ splitMet[i][6] + splitMet[i][6] +"")
                }
                i++
                var windVar = "";
                if (splitMet[i+1].includes("V") && splitMet[i+1].includes("VC") == false){ //checking for variations in wind direction, V could mean variations, but could also be VC meaning weather in the vicinity, so check for both
                    windVar = "<br/>with variations in direction between " + splitMet[i+1][0] + splitMet[i+1][1] +splitMet[i+1][2]+" and "+ splitMet[i+1][4] + splitMet[i+1][5] +splitMet[i+1][6]+" degrees";
                }
                if (windDir == "VRB") { //checking for low wind resulting in variable direction.
                    windDir = "with variable direction";
                }
            }

            //=============PREDOMINANT WEATHER=============
            if (splitMet[i].includes("SM")){//using visibility section to find where the cloud and predominant weather section are
                i++;
                var predomWeather = ""
                
                if (splitMet[i].includes ("0") == false && splitMet[i].includes("CLR") == false && splitMet[i].includes("SKC") == false) {//looking for predominant weather by stopping before clouds (which will always include either 0, CLR or SKC)
                    predomWeather = "Current predominant weather includes:<br/>";
                }
                
                preWeatherMap.set("+", "heavy ");
                preWeatherMap.set("-", "light ");

                discWeatherMap.set("DR", "drifting ");
                discWeatherMap.set("FZ", "freezing ");
                discWeatherMap.set("BL", "blowing ");
                discWeatherMap.set("TI", "thin ");
                discWeatherMap.set("VC", "nearby ");
                discWeatherMap.set("SH", "showers<br/> ");
                discWeatherMap.set("TS", "thunderstorms<br/> ");
                discWeatherMap.set("BC", "patches<br/> ");

                midWeatherMap.set("RA", "rain<br/> ");
                midWeatherMap.set("DZ", "drizzle<br/> ");
                midWeatherMap.set("SG", "snow grains<br/> ");
                midWeatherMap.set("GR", "hail<br/> ");
                midWeatherMap.set("GS", "snow pellets<br/> ");
                midWeatherMap.set("UP", "unknown precepitation<br/> ");
                midWeatherMap.set("PL", "ice pellets<br/> ");
                midWeatherMap.set("SN", "snow<br/> ");

                postWeatherMap.set("HZ", "haze<br/> ");
                postWeatherMap.set("FU", "smoke<br/> ");
                postWeatherMap.set("SA", "sand<br/> ");
                postWeatherMap.set("FG", "fog with visbility less than 5 octas<br/> ");
                postWeatherMap.set("BR", "mist with visbility greater than 5 octas<br/> ");
                postWeatherMap.set("DU", "dust<br/> ");
                postWeatherMap.set("VA", "volcanic ash<br/> ");
                postWeatherMap.set("FC", "funnel clouds with possibilities of tornados<br/> ");
                postWeatherMap.set("SS", "sand storms<br/> ");
                postWeatherMap.set("PO", "dust devils<br/> ");
                postWeatherMap.set("SQ", "squalls<br/> ");
                postWeatherMap.set("DS", "dust storms<br/> ");


                for(;splitMet[i].includes("0") == false  && splitMet[i].includes("CLR") == false && splitMet[i].includes("SKC") == false;i++) { // if any of these are true, that means we are on the cloud section now, and there is no predominant weather section
                    var target = splitMet[i];
                    var charCounter = 0;
                    
                    if (preWeatherMap.has(target[charCounter])) {
                        predomWeather = predomWeather.concat(preWeatherMap.get(target[charCounter]));
                        charCounter++;
                    }

                    if (discWeatherMap.has(target.substr(charCounter, 2))) {
                        predomWeather = predomWeather.concat(discWeatherMap.get(target.substr(charCounter, 2)));
                        charCounter+=2;
                    }

                    if (midWeatherMap.has(target.substr(charCounter, 2))) {
                        predomWeather = predomWeather.concat(midWeatherMap.get(target.substr(charCounter, 2)));
                        charCounter+=2;
                    }

                    if (postWeatherMap.has(target.substr(charCounter, 2))) {
                        predomWeather = predomWeather.concat(postWeatherMap.get(target.substr(charCounter, 2)));
                        charCounter+=2;
                    }

                }

                if (predomWeather == "") { //removing the weather section if there is no weather/
                    predomWeather = "Currently no predominant weather.<br/>";
                }
                
                //=============CLOUDS=============
                var clouds = "";
                while (splitMet[i].includes("/") == false) {//looking for clouds by stopping before the temp/dew section, which will always contain "/"
                    clouds = clouds.concat("" + cloudDecode(splitMet[i][0] + splitMet[i][1] + splitMet[i][2]) + " at " + splitMet[i][3] + splitMet[i][4] + splitMet[i][5],"00 feet,<br />");
                    if (splitMet[i].includes("VV")) { //removing the clouds section if there is low lying obstructions
                        clouds = "Sky obscured by surface layer. <br/> Vertical visbility: "+splitMet[i][2]+splitMet[i][3]+splitMet[i][4]+"00 ft AGL.<br/>";
                        i++;
                        break;
                    }
                    i++;   
                }

                if (clouds.includes("CLR")||clouds.includes("SKC")) { //removing the clouds section if there is no clouds, some airports, such as CYYZ, use SKC instead of CLR
                    clouds = "Skies are currently clear of clouds.<br/>";
                }


            }

            //=============SEA LEVEL PREASSURE=============
            var slp = "";
            if (splitMet[i].includes("SLP")){//finding the remarks
                slp = (", Sea level preasure is 10" +splitMet[i][3]+splitMet[i][4]+"."+splitMet[i][5]+"hPa");
            }
        }
        //TAF STUFF==========================================================================================================================================================
        //===================================================================================================================================================================
        var reportCount = 0;
        var tafReport = "";
        if (tafReadings.error != null) {//some stations provide METARs but no TAFs
            var tafReport = "No TAF available from this station";
            tafReadings.raw = "Nil"
        } else {
            var splitTaf = (tafReadings.raw).split (" ");
            var tafDate = (tafReadings.time.dt.substr(0, 4) +"-"+ numberToMonth(readings.time.dt.substr(5, 2)) +"-"+ readings.time.dt.substr(8, 2)); 
            var tafTime = (tafReadings.time.dt.substr(11, 5));
            for (var i = 0; i< splitTaf.length; i++) {
                if (splitTaf[i].includes("KT")){
                    reportCount++;
                }
                
            }

            tafReport = tafReport.concat("Latest TAF from " +airportCode+ ", transmitted at "+tafTime+" on "+ tafDate + "<br/><br/>");
            for (var i = 0; i<reportCount;i++) {
                tafReport = tafReport.concat("From "+tafReadings.forecast[i].start_time.dt[0]+tafReadings.forecast[i].start_time.dt[1]+tafReadings.forecast[i].start_time.dt[2]+tafReadings.forecast[i].start_time.dt[3]+"-"); //concat current year
                tafReport = tafReport.concat(numberToMonth(tafReadings.forecast[i].start_time.dt[5]+tafReadings.forecast[i].start_time.dt[6])+"-"+tafReadings.forecast[i].start_time.repr[0]+tafReadings.forecast[i].start_time.repr[1]); //concat current month and validity day
                tafReport = tafReport.concat(" at "+tafReadings.forecast[i].start_time.repr[2]+tafReadings.forecast[i].start_time.repr[3]+"00 hours to "); //using repr time to get validity time
                tafReport = tafReport.concat(tafReadings.forecast[i].end_time.dt[0]+tafReadings.forecast[i].end_time.dt[1]+tafReadings.forecast[i].end_time.dt[2]+tafReadings.forecast[i].end_time.dt[3]+"-"); //same thing but for end time
                tafReport = tafReport.concat(numberToMonth(tafReadings.forecast[i].end_time.dt[5]+tafReadings.forecast[i].end_time.dt[6])+"-"+tafReadings.forecast[i].end_time.repr[0]+tafReadings.forecast[i].end_time.repr[1]); 
                tafReport = tafReport.concat(" at "+tafReadings.forecast[i].end_time.repr[2]+tafReadings.forecast[i].end_time.repr[3]+"00 hours:<br/>");
                tafReport = tafReport.concat(""+tafReadings.forecast[i].summary+"<br/><br/>");
            }
            var k =  tafReadings.remarks.length; //finding the end of the remarks to get the next transmission time.
            if (airportCode[0] == "C") {
                tafReport = tafReport.concat("Next report at " + tafReadings.remarks[k-5] + tafReadings.remarks[k-4] + tafReadings.remarks[k-3] + tafReadings.remarks[k-2] + " hours zulu");
            } 
        }
        //STATION INFO STUFF=================================================================================================================================================
        //===================================================================================================================================================================
        

        var locTime = (locInfo.time.substr(11, 5));
        var locDate = (locInfo.time.substr(0, 10));//local date and time

        //runway information
        var runwayInfo = "";
        if (airInfo.runways == null) { //some stations have no runways
            "This station has no runways"
        } else if (airInfo.runways.length == 1) { //length is not from the json, its the array length property from Javascript
            runwayInfo = ("This station has 1 runway.<br/>");
            runwayInfo = runwayInfo.concat(airInfo.runways[0].ident1+"-"+airInfo.runways[0].ident2+", "+ airInfo.runways[0].length_ft +" ft <br/>");
        } else {
            var rwyCount = airInfo.runways.length; 
            runwayInfo = ("This station has " + rwyCount + " runways.<br/>");
            for (var i = 0; i < rwyCount; i++){
                runwayInfo = runwayInfo.concat(airInfo.runways[i].ident1+"-"+airInfo.runways[i].ident2+", "+ airInfo.runways[i].length_ft +" ft <br/>");
            }
        }
        
        

        var city; //some stations are too remote to be considered inside a city, in that case only the country name will be displayed.
        if (airInfo.city == null) {
            city = ""
        } else {
            city = airInfo.city + ", ";
        }
        

        //DIAGRAMS ==================
        var diagramAddress = "";
        var diagramHeader = "";
        if (diagramsList.includes(airportCode)) { //basically diagramsList is a string containing every airport I have a diagram of.
            diagramAddress = "/diagrams/" + airportCode +".png";
            diagramHeader = "<h3>AIRPORT DIAGRAM</h3>"
        } else {
            diagramAddress = "/diagrams/blank.png";
        }

        res.render ("index1", {
            title : airportCode, 
            metarMessage : 
                "<h3>METAR Info</h3><p>Latest METAR from " + airportCode+", Transmitted at " +transTime +" zulu on "+ transDate + "<br/>"
                +"requested at timestamp " + readings.meta.timestamp + "<br/></p>"
                +"<h3>Visibility</h3><p>"+readings.visibility.value + " statute miles</p>"
                +"<h3>Altimeter Setting</h3><p>" + readings.altimeter.value + " inches of mercury" + slp + ".</p>"
                +"<h3>Wind</h3><p>"+ windDir + " at "+ windSpeed + " knots"+windVar+".</p>"
                +"<h3>Tempreture</h3><p>Currently "+readings.temperature.value+"°C, dewpoint at "+readings.dewpoint.value+"°C.</p>",
            cloudMessage : "<h3>Cloud Cover</h3><p>"+clouds+"</p>", 
            weatherMessage : "<h3>Predominant Weather</h3><p>"+predomWeather+"</p>", 
            tafMessage : "<h3>TAF</h3><p>"+tafReport+"</p>", 
            infoMessage : 
                "<h3>Station Information</h3><p>"
                + airInfo.name + "<br/>" + city + locInfo.countryName + "<br/>"
                +"Current local time is " +locTime+ " hours, "+ locDate +"</p>",
            runwayMessage : runwayInfo, 
            rawMessage : 
                "<h3>Raw METAR:</h3><p>" +readings.raw + "</p><h3>Raw TAF:</h3><p>" + tafReadings.raw+"</p>",
            diagramHeaderMessage : diagramHeader,
            diagramMessage : diagramAddress
        });

    }).catch(function (error){ //in resolved state, the .thens will execute, if there is a throw anywhere, (request will throw on its own) .catch will execute. throw new Error; anywhere would do the same.
        if (error.error && error.error.includes("is not a valid ICAO")) {
            res.render ("index1", {title : airportCode, metarMessage : "<h3>ERROR</h3><p>No METAR or TAF available from this station or station does not exist.</p>", diagramMessage : "/diagrams/blank.png"});
        } else {
            //next(error);
            res.render ("index1", {title : airportCode, metarMessage : "<h3>ERROR</h3><p>Station does not provide TAF transmissions.</p>", diagramMessage : "/diagrams/blank.png"});
        }
    });
};

const port = process.argv[2] || 4000;
app.listen(port, () => console.log(`App listening on port ${port}!`))


// fetch(url).then(function(value) {
//     console.log(value)
// })
// promise1 = fetch(url);
// promise2 = fetch(url2);
// promise3 = fetch(url3);
  
// Promise.all([promise1, promise2, promise3]).then(function(results) {
//     results[0];
// })
//