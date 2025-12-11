// Simple METAR parser for weather data

function metarparser(data, lat, lon) {
    var output = {};

    // Calculate distances
    for (let i = 0; i < data.length; i++) {
        try {
            var thisLat = data[i].properties.LATITUDE;
            var thisLon = data[i].properties.LONGITUDE;

            // Calculate distance (Haversine formula)
            var R = 6371; // Radius of the Earth in km
            var dLat = (thisLat - lat) * Math.PI / 180;
            var dLon = (thisLon - lon) * Math.PI / 180;
            var a = 
                0.5 - Math.cos(dLat)/2 + 
                Math.cos(lat * Math.PI / 180) * Math.cos(thisLat * Math.PI / 180) * 
                (1 - Math.cos(dLon))/2;

            var distance = R * 2 * Math.asin(Math.sqrt(a)); // Distance in km
            data[i].DISTANCE = distance;
        }
        catch (e) {
            data[i].DISTANCE = Infinity;
        }
    }

    // Locate nearest station
    for (let i = 0; i < data.length; i++) {
        try {
            if (data[i].DISTANCE < output.DISTANCE || !output.DISTANCE) {
                output = data[i];
            }
        } catch {}
    }    

    // Formatting
    output.properties.WEATHER = output.properties.WEATHER == "No significant weather present at this time." ? 
        output.properties.SKY_CONDTN : output.properties.WEATHER;

    return output.properties;
}


module.exports = metarparser;