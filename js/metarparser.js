// Simple METAR parser for weather data

function metarparser(data, location) {
    for (let i = 0; i < data.length; i++) {
        const props = data[i].properties;
        const metar = props.METAR;

        // Basic parsing
        const parts = metar.split(' ');
        props.station = parts[0];
        props.time = parts[1];
        props.wind = parts[2];
        props.visibility = parts[3];
        props.temperature = parts[4].split('/')[0];
        props.dewpoint = parts[4].split('/')[1];
        props.altimeter = parts[5];

        // Additional parsing can be added here as needed
    }
    return data;
}


module.exports = metarparser;