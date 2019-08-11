const express = require ("express");
const request = require ("request");
const app = express();
app.set("view engine", "pug");


//note that if slow, the API has been having trouble getting the TAFs as they are implemented some changes I think.
//AVWX REST API
//get Auth token set up before Nov. 1


function numberToMonth (number) {
    if (number == "01") {
        return "Jan"
    }
    if (number == "02") {
        return "Feb"
    }
    if (number == "03") {
        return "Mar"
    }
    if (number == "04") {
        return "Apr"
    }
    if (number == "05") {
        return "May"
    }
    if (number == "06") {
        return "Jun"
    }
    if (number == "07") {
        return "Jul"
    }
    if (number == "08") {
        return "Aug"
    }
    if (number == "09") {
        return "Sep"
    }
    if (number == "10") {
        return "Oct"
    }
    if (number == "11") {
        return "Nov"
    }
    if (number == "12") {
        return "Dec"
    }
}

function cloudDecode (code) {
    if (number == "CLR") {
        return "Clear Skies"
    }
    if (number == "FEW") {
        return "Few"
    }
    if (number == "SCT") {
        return "Scattered"
    }
    if (number == "BKN") {
        return "Broken"
    }
    if (number == "OVC") {
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
                    var gusting = true;
                    var gustSpeed = (""+ splitMet[i][6] + splitMet[i][6] +"")
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
                
                var clouds = "";
                if (splitMet[i].includes("/") == false) { //looking for clouds
                    clouds = "Clouds are as follows:<br/>"
                }
                
                

                while (splitMet[i].includes("/") == false) {
                    clouds = clouds.concat("- "+splitMet[i][0], splitMet[i][1], splitMet[i][2]," at ", splitMet[i][3], splitMet[i][4], splitMet[i][5],"00 feet,<br />");
                    if (splitMet[i].includes("VV")) { //removing the clouds section if there is low lying obstructions
                        clouds = "Sky obscured by surface layer. <br/> Vertical visbility: "+splitMet[i][2]+splitMet[i][3]+splitMet[i][4]+"00 ft AGL.<br/>";
                        i++;
                        break;
                    }
                    i++;   
                }

                if (clouds.includes("CLR")) { //removing the clouds section if there is no clouds/
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
            
            tafReport = tafReport.concat("Latest TAF from " +req.params.airport+ ", transmitted at "+tafTime+" on "+ tafDate + "<br/>");
            for (var i = 0; i<reportCount;i++) {
                tafReport = tafReport.concat("From "+tafReadings.forecast[i].start_time.dt[0]+tafReadings.forecast[i].start_time.dt[1]+tafReadings.forecast[i].start_time.dt[2]+tafReadings.forecast[i].start_time.dt[3]+"-"); //concat current year
                tafReport = tafReport.concat(numberToMonth(tafReadings.forecast[i].start_time.dt[5]+tafReadings.forecast[i].start_time.dt[6])+"-"+tafReadings.forecast[i].start_time.repr[0]+tafReadings.forecast[i].start_time.repr[1]); //concat current month and validity day
                tafReport = tafReport.concat(" at "+tafReadings.forecast[i].start_time.repr[2]+tafReadings.forecast[i].start_time.repr[3]+"00 hours to "); //using repr time to get validity time
                tafReport = tafReport.concat(tafReadings.forecast[i].end_time.dt[0]+tafReadings.forecast[i].end_time.dt[1]+tafReadings.forecast[i].end_time.dt[2]+tafReadings.forecast[i].end_time.dt[3]+"-"); //same thing but for end time
                tafReport = tafReport.concat(numberToMonth(tafReadings.forecast[i].end_time.dt[5]+tafReadings.forecast[i].end_time.dt[6])+"-"+tafReadings.forecast[i].end_time.repr[0]+tafReadings.forecast[i].end_time.repr[1]); 
                tafReport = tafReport.concat(" at "+tafReadings.forecast[i].end_time.repr[2]+tafReadings.forecast[i].end_time.repr[3]+"00 hours:<br/>");
                // for (var j = 0; j < tafReadings.forecast[i].clouds.length; j++) { // getting clouds
                //     tafReport = tafReport.concat(tafReadings.forecast[i].clouds[j].type + " at " + tafReadings.forecast[i].clouds[j].altitude + "00 ft. <br/>");
                // } 
                // if (tafReadings.forecast[i].visibility.repr == "P6") { // getting visbility
                //     tafReport = tafReport.concat("Visbility is greater than 6 stat. miles.");
                // } else {
                //     tafReport = tafReport.concat("Visbility is "+tafReadings.forecast[i].visibility.repr +" stat. miles.");
                // }
                tafReport = tafReport.concat("- "+tafReadings.forecast[i].summary+"<br/>");
            }
            var k =  tafReadings.remarks.length; //finding the end of the remarks to get the next transmission time.
            if (req.params.airport[0] == "C") {
                tafReport = tafReport.concat("Next report at " + tafReadings.remarks[k-5] + tafReadings.remarks[k-4] + tafReadings.remarks[k-3] + tafReadings.remarks[k-2] + " hours zulu.");
                tafReport = tafReport.concat(".<br/>");
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

                    
                    if (gusting == true) {
                        res.render ("index", {title : req.params.airport, metarMessage : "Latest METAR from " + req.params.airport+", requested at timestamp " + readings.meta.timestamp + "<br />"
                        +"Transmitted at " +transTime +" zulu on "+ transDate + ".<br />"
                        +"visibility: "+readings.visibility.value + " statute miles<br/>"
                        +"altimeter: " + readings.altimeter.value + " inches of mercury<br/>"
                        +"wind: "+ windDir + " at "+ windSpeed + " knots, gusting to " + gustSpeed + " knots"+windVar+".<br/>"
                        +"Tempreture: "+readings.temperature.value+" degrees<br/>Dewpoint: "+readings.dewpoint.value+" degrees.<br />"
                        +"The current sea level preasure is 10"+ slp + " hPa."
                        +"", cloudMessage : clouds, weatherMessage : preWeather, tafMessage : tafReport, infoMessage : "<br />Station Information:<br /> "
                        +airInfo.name + "<br/>" + cityInfo.location.name +", " + cityInfo.location.region + ", " + cityInfo.location.country +"<br/>"
                        +"Current local time is " +loc_Time+ " hours, "+ loc_Date
                        +"", runwayMessage : runwayInfo, rawMessage : "<br/><br/> Raw Metar:<br/>" +readings.raw + "<br/><br/>Raw Taf" + tafReadings.raw});
                    } else {
                        res.render ("index", {title : req.params.airport, metarMessage : "Latest METAR from " + req.params.airport+", requested at timestamp " + readings.meta.timestamp + "<br />"
                        +"Transmitted at " +transTime +" zulu on "+ transDate + ".<br />"
                        +"visibility: "+readings.visibility.value + " statute miles<br />"
                        +"altimeter: " + readings.altimeter.value + " inches of mercury<br />"
                        +"wind: "+ windDir + " at "+ windSpeed + " knots"+windVar+".<br />"
                        +"Tempreture: "+readings.temperature.value+" degrees<br/>Dewpoint: "+readings.dewpoint.value+" degrees.<br />"
                        +"Sea level preasure: 10"+ slp + " hPa."
                        +"", cloudMessage : clouds, weatherMessage : preWeather, tafMessage : tafReport, infoMessage : "<br />Station Information:<br /> "
                        + airInfo.name + "<br/>" + cityInfo.location.name +", " + cityInfo.location.region + ", " + cityInfo.location.country +"<br/>"
                        +"Current local time is " +loc_Time+ " hours, "+ loc_Date
                        +"", runwayMessage : runwayInfo, rawMessage : "<br/><br/> Raw Metar:<br/>" +readings.raw + "<br/><br/>Raw Taf:<br/>" + tafReadings.raw});
                    }
                });
            });
        });
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