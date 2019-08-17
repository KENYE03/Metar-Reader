const express = require ("express");
const request = require ("request");
const app = express();
app.set("view engine", "pug");


//AVWX REST API
//get Auth token set up before Nov. 1
//get "the station has # runways" s fixed


function numberToMonth (n) {
        return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(n, 10) + 1];
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
    if (code == "SCT") {n
        return "Scattered clouds"
    }
    if (code == "BKN") {
        return "Broken clouds"
    }
    if (code == "OVC") {
        return "Overcast"
    }
}

 
app.get("/", middleware2);//if needed, multiple middleware functions can be put in one app.get, but only one res of course
function middleware2 (req, res, next) { //please keep in mind that a function name is not needed, also => may be used instead
    res.render ("index", {homeMessage : "Welcome to the Metar reader!" 
        +"<br/> To start, type in a 4-letter ICAO code of any airport in the US or Canada."
        +"<br/>METARs are regular aviatioin weather reports issued regularly airports and weather stations."
        +"<br/>They are valid for one hour only."
        +"<br/>TAFs are longer reports with specific validity periods raging from 20 minuties to 30 hours."
        +"<br/>They report on specific weather conditions expected to affect the landing and takeoff of aircraft."
        +"<br/><br/>All altitues are given in AGL, all degrees are in degrees true" });
}

app.get("/howto", middleware3);
function middleware3 (req, res, next) {
    res.render ("index", {homeMessage : "something on how to read a Metar and Taf" });
}



app.get("/metar/:airport", middleware1);
function middleware1 (req, res) {
    request ("https://avwx.rest/api/metar/"+req.params.airport+"?options=&format=json&onfail=cache", function (met_error, met_response, met_body) { //first request for getting metar info
        var readings = JSON.parse(met_body);
        //decoding the Metar\
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
                if (splitMet[i+1].includes("V")){ //checking for variations in wind direction, windVar is a string that will be outputted every time, but it will be blank if theres no variations
                    windVar = "<br/>with variations in direction between " + splitMet[i+1][0] + splitMet[i+1][1] +splitMet[i+1][2]+" and "+ splitMet[i+1][4] + splitMet[i+1][5] +splitMet[i+1][6]+" degrees";
                }
                if (windDir == "VRB") { //checking for low wind resulting in variable direction.
                    windDir = "with variable direction";
                }
            }

            //=============PREDOMINANT WEATHER=============
            if (splitMet[i].includes("SM")){//using visibility section to find where the cloud and predominant weather section are
                i++;
                var preWeather = ""
                
                if (splitMet[i].includes ("0") == false && splitMet[i].includes("CLR") == false && splitMet[i].includes("SKC") == false) {//looking for predominant weather by stopping before clouds (which will always include either 0, CLR or SKC)
                    preWeather = "Current predominant weather includes:<br/>";
                }
                
                for(;splitMet[i].includes("0") == false  && splitMet[i].includes("CLR") == false && splitMet[i].includes("SKC") == false;i++) { // if any of these are true, that means we are on the cloud section now, and there is no predominant weather section
                    if (splitMet[i].includes ("+")) {
                        preWeather = preWeather.concat("heavy ");
                    }
                    if (splitMet[i].includes ("-")) {
                        preWeather = preWeather.concat("light ");
                    }
                    if (splitMet[i].includes ("DR")) {
                        preWeather = preWeather.concat("drifting ");
                    }
                    if (splitMet[i].includes ("FZ")) {
                        preWeather = preWeather.concat("freezing ");
                    }
                    if (splitMet[i].includes ("BL")) {
                        preWeather = preWeather.concat("blowing ");
                    }
                    if (splitMet[i].includes ("TI")) {
                        preWeather = preWeather.concat("thin ");
                    }
                    if (splitMet[i].includes ("SH")) {
                        preWeather = preWeather.concat("showers<br/> ");
                    }
                    if (splitMet[i].includes ("TS")) {
                        preWeather = preWeather.concat("thunderstorms<br/> ");
                    }
                    if (splitMet[i].includes ("BC")) {
                        preWeather = preWeather.concat("patches<br/> ");
                    }
                    if (splitMet[i].includes ("RA")) {
                        preWeather = preWeather.concat("rain<br/> ");
                    }
                    if (splitMet[i].includes ("DZ")) {
                        preWeather = preWeather.concat("drizzle<br/> ");
                    }
                    if (splitMet[i].includes ("SG")) {
                        preWeather = preWeather.concat("snow grains<br/> ");
                    }
                    if (splitMet[i].includes ("GR")) {
                        preWeather = preWeather.concat("hail<br/> ");
                    }
                    if (splitMet[i].includes ("PL")) {
                        preWeather = preWeather.concat("ice pellets<br/> ");
                    }
                    if (splitMet[i].includes ("HZ")) {
                        preWeather = preWeather.concat("haze<br/> ");
                    }
                    if (splitMet[i].includes ("FU")) {
                        preWeather = preWeather.concat("smoke<br/> ");
                    }
                    if (splitMet[i].includes ("SA")) {
                        preWeather = preWeather.concat("sand<br/> ");
                    }
                    if (splitMet[i].includes ("FG")) {
                        preWeather = preWeather.concat("fog with visbility less than 5 octas<br/> ");
                    }
                    if (splitMet[i].includes ("BR")) {
                        preWeather = preWeather.concat("mist with visbility greater than 5 octas<br/> ");
                    }
                    if (splitMet[i].includes ("DU")) {
                        preWeather = preWeather.concat("dust<br/> ");
                    }
                    if (splitMet[i].includes ("VA")) {
                        preWeather = preWeather.concat("volcanic ash<br/> ");
                    }
                    if (splitMet[i].includes ("FC")) {
                        preWeather = preWeather.concat("funnel clouds with possibilities of tornados<br/> ");
                    }
                    if (splitMet[i].includes ("SS")) {
                        preWeather = preWeather.concat("sand storms<br/> ");
                    }
                    if (splitMet[i].includes ("PO")) {
                        preWeather = preWeather.concat("dust devils<br/> ");
                    }
                    if (splitMet[i].includes ("SQ")) {
                        preWeather = preWeather.concat("squalls<br/> ");
                    }
                    if (splitMet[i].includes ("DS")) {
                        preWeather = preWeather.concat("dust storms<br/> ");
                    }
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

                
                if (preWeather == "") { //removing the weather section if there is no weather/
                    preWeather = "Currently no predominant weather.<br/>";
                }

            }
            if (splitMet[i].includes("SLP")){//finding the remarks
                var slp = (""+splitMet[i][3]+splitMet[i][4]+"."+splitMet[i][5]+"");
            }
        }
        
        
        
        request ("https://avwx.rest/api/taf/"+req.params.airport+"?options=summary&format=json&onfail=cache",function (taf_error, taf_response, taf_body) { //nested request for getting taf info, previous request is still in scope, would not be if i used multiple middlewares
            var tafReadings = JSON.parse(taf_body);
            var splitTaf = (tafReadings.raw).split (" ");
            var tafDate = (tafReadings.time.dt.substr(0, 4) +"-"+ numberToMonth(readings.time.dt.substr(5, 2)) +"-"+ readings.time.dt.substr(8, 2)); 
            var tafTime = (tafReadings.time.dt.substr(11, 5));

            var reportCount = 0;
            var tafReport = "";
            for (var i = 0; i< splitTaf.length; i++) {
                if (splitTaf[i].includes("KT")){
                    reportCount++;
                }
                
            }
            
            tafReport = tafReport.concat("Latest TAF from " +req.params.airport+ ", transmitted at "+tafTime+" on "+ tafDate + "<br/><br/>");
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
            if (req.params.airport[0] == "C") {
                tafReport = tafReport.concat("Next report at " + tafReadings.remarks[k-5] + tafReadings.remarks[k-4] + tafReadings.remarks[k-3] + tafReadings.remarks[k-2] + " hours zulu");
            } 
            
            
            
            request ("https://avwx.rest/api/station/"+req.params.airport+"?format=json",function (air_error, air_response, air_body) { //nested request for getting airport info
                var airInfo = JSON.parse(air_body);
                request('http://api.apixu.com/v1/current.json?key=5791c6742b044b8887a185604192906&q=' + airInfo.city, function (city_error, city_respose, city_body) {//using airport city to get local time info for that airport w/ weather api
                    var cityInfo = JSON.parse(city_body);
                    var loc_Time = (cityInfo.location.localtime.substr(11, 5));
                    var loc_Date = (cityInfo.location.localtime.substr(0, 10));//local date and time

                    //runway information
                    var runwayInfo = "";
                    rwyCount = airInfo.runways.length;
                    runwayInfo = ("This station has " + rwyCount + " runways.<br/>");
                    for (var i = 0; i < rwyCount; i++){
                        runwayInfo = runwayInfo.concat(airInfo.runways[i].ident1+"-"+airInfo.runways[i].ident2+", "+ airInfo.runways[i].length_ft +" ft <br/>");
                    }

                    
                    
                    res.render ("index", {
                        title : req.params.airport, 
                        metarMessage : 
                            "<h3>METAR Info</h3><p>Latest METAR from " + req.params.airport+", Transmitted at " +transTime +" zulu on "+ transDate + "<br/>"
                            +"requested at timestamp " + readings.meta.timestamp + "<br/></p>"
                            +"<h3>Visibility</h3><p>"+readings.visibility.value + " statute miles</p>"
                            +"<h3>Altimeter Setting</h3><p>" + readings.altimeter.value + " inches of mercury, Sea level preasure is 10"+ slp + " hPa.</p>"
                            +"<h3>Wind</h3><p>"+ windDir + " at "+ windSpeed + " knots"+windVar+".</p>"
                            +"<h3>Tempreture</h3><p>"+readings.temperature.value+"°C, Dewpoint: "+readings.dewpoint.value+"°C.</p>",
                        cloudMessage : "<h3>Cloud Cover</h3><p>"+clouds+"</p>", 
                        weatherMessage : "<h3>Predominant Weather</h3><p>"+preWeather+"</p>", 
                        tafMessage : "<h3>TAF</h3><p>"+tafReport+"</p>", //no idea how im going to deal with this  
                        infoMessage : 
                            "<h3>Station Information</h3><p>"
                            + airInfo.name + "<br/>" + cityInfo.location.name +", " + cityInfo.location.region + ", " + cityInfo.location.country +"<br/>"
                            +"Current local time is " +loc_Time+ " hours, "+ loc_Date +"</p>",
                        runwayMessage : runwayInfo, 
                        rawMessage : 
                            "<h3>Raw METAR:</h3><p>" +readings.raw + "</p><h3>Raw TAF:</h3><p>" + tafReadings.raw+"</p>"
                    });
                    
                }); 
            });
        }); // this is horrifying
    }   );
}




//res.send ("Latest METAR from " + req.params.airport+", at timestamp: " + readings.meta.timestamp + "(zulu)<br/>visibility: "+readings.visibility.value + " statute miles<br/>altimeter setting is " + readings.altimeter.value + " inches of mercury<br/>wind is blowing "+ splitMet[i][0]+ splitMet[i][1]+ splitMet[i][2] + " degrees at "+splitMet[i][3] + splitMet[i][4] + " knots gusting to " + splitMet[i][6] + splitMet[i][6] + " knots. <br/>" );




const port = 4000;

app.listen(port, () => console.log(`Example app listening on port ${port}!`))


// fetch(url).then(function(value) {
//     console.log(value)
// })
// promise1 = fetch(url);
// promise2 = fetch(url2);
// promise3 = fetch(url3);

// Promise.all([promise1, promise2, promise3]).then(function(results) {
//     results[0];
// })