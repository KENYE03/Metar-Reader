# Metar-Reader
Aviation WX decoder for METARs and TAFs.

Currently live on: http://www.metarreader.ca/

METARs (Meteorological Terminal Air Reports) are ICAO standardized observational weather reports transmitted periodically from airports and weather stations all over the world.

TAFs (Terminal Aerodrome Forecasts) are ICAO standardized weather forecasts transmiited from major civil aerodromes. Both are used by pilots to know the current and future flight conditions at airports and stations.

Here is an example of a METAR: 
`METAR CYOW 110400Z 34008G15KT 15SM -FZRN FEW022 OVC060 03/M01 A3008 RMK SLP194=`

This web-based implementation of a METAR and TAF decoder, taking an ICAO airport code as input. The application also displays location information and ground diagrams for major North American airports.

## Future Plans
* More support for stations outside of North America.
* Additional AIR-SIGMET information.
* Decoder for aribitrary METAR input, not just for specific ICAO codes.
* IATA code support along with ICAO codes.
