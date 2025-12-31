import Constants from 'expo-constants';

const OPENWEATHER_API_KEY = Constants.expoConfig?.extra?.openWeatherApiKey || process.env.OPENWEATHER_API_KEY;

function metarparser(data, lat, lon, callback) {
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

    // If bad data, try another METAR
    if (output.properties.WEATHER) {
        try {
            if (output.properties.WEATHER.toLowerCase().includes("automated observation")) throw new Error;
            console.log("First METAR data valid.");
        } catch {
            // Delete bad data
            console.log("Bad data from nearest METAR", output.properties.STATION + ". Trying another...")
            data.splice(data.indexOf(output), 1);

            // Try another METAR
            for (let i = 0; i < data.length; i++) {
                try {
                    if (data[i].DISTANCE < output.DISTANCE || !output.DISTANCE) {
                        output = data[i];
                    }
                } catch { }
            }
        }
    }

    // If distance is too large, or data is still bad, return openWeatherMap data
    const isAutomatedObs = (
        output && output.properties && typeof output.properties.WEATHER === 'string' &&
        output.properties.WEATHER.toLowerCase().includes("automated observation")
    );
    if (output.DISTANCE > 15 || isAutomatedObs) {

        console.log("Bad data from second nearest METAR", output.properties.STATION + ". Trying OpenWeatherMap...");
        if (OPENWEATHER_API_KEY) { // Remove negation to enable OWM fetch, this is used to prevent exceeding rate limit
            fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`)
                .then((response) => response.json())
                .then((json) => {
                    const owmData = {
                        STATION_NAME: null,
                        ICAO: "",
                        WEATHER: json.current.weather[0].description,
                        TEMP: json.current.temp,
                        DEW_POINT: json.current.dew_point,
                        WIND_DIRECT: json.current.wind_deg,
                        WIND_SPEED: json.current.wind_speed,
                        PRESSURE: json.current.pressure,
                        R_HUMIDITY: json.current.humidity > 100 ? 100 : json.current.humidity,
                        VISIBILITY: json.current.visibility > 10000 ? 10000 : json.current.visibility,
                        SKY_CONDTN: json.current.weather[0].main,
                    };
                    console.log("OpenWeatherMap data succeeded");
                    
                    // Fetch Open-Meteo and alerts after getting OWM data
                    console.log(`Fetching Open-Meteo forecast for lat=${lat}, lon=${lon}`);
                    Promise.all([
                        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&hourly=temperature_2m,relative_humidity_2m,cloud_cover,precipitation,snowfall,snow_depth,precipitation_probability,weather_code,cape,is_day&timezone=auto&forecast_days=14&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch`).then(r => r.json()).catch(e => { console.error("Open-Meteo error:", e); return null; }),
                        fetch(`https://api.weather.gov/alerts/active?message_type=alert&point=${lat},${lon}`).then(r => r.json()).catch(e => { console.error("Alerts error:", e); return null; })
                    ]).then(([forecastData, alertsData]) => {
                        if (forecastData) {
                            owmData.forecast = forecastData;
                        }
                        if (callback) {
                            callback(owmData, alertsData);
                        }
                    });
                })
                .catch((error) => {
                    console.error("Error fetching OpenWeatherMap data:", error);
                });
            // Return placeholder while fetching
            return {
                STATION_NAME: "Loading...",
                ICAO: "...",
                WEATHER: "...",
                TEMP: 0,
                DEW_POINT: 0,
                WIND_DIRECT: 0,
                WIND_SPEED: 0,
                PRESSURE: 0,
                R_HUMIDITY: 0,
                VISIBILITY: 0,
                SKY_CONDTN: "Loading"
            };
        } else {
            console.warn("OpenWeatherMap API key not configured");
        }
    }

    // Formatting
    output.properties.WEATHER = output.properties.WEATHER == "No significant weather present at this time." ? 
        output.properties.SKY_CONDTN : output.properties.WEATHER;

    // Now get forecasts from Open-Meteo
    // https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&hourly=temperature_2m,relative_humidity_2m,cloud_cover,precipitation,snowfall,snow_depth,precipitation_probability,weather_code,cape,is_day&timezone=auto&forecast_days=14&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch
    console.log(`Fetching Open-Meteo forecast for lat=${lat}, lon=${lon}`);
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&hourly=temperature_2m,relative_humidity_2m,cloud_cover,precipitation,snowfall,snow_depth,precipitation_probability,weather_code,cape,is_day&timezone=auto&forecast_days=14&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch`;
    
    Promise.all([
        fetch(openMeteoUrl).then(r => r.json()).catch(e => { console.error("Open-Meteo error:", e); return null; }),
        fetch(`https://api.weather.gov/alerts/active?message_type=alert&point=${lat},${lon}`).then(r => r.json()).catch(e => { console.error("Alerts error:", e); return null; })
    ]).then(([forecastData, alertsData]) => {
        console.log("Open-Meteo response:", forecastData);
        console.log("Alerts response:", alertsData);
        
        if (forecastData) {
            output.properties.forecast = forecastData;
        }
        
        console.log("Calling callback with data:", output.properties);
        if (callback) {
            callback(output.properties, alertsData);
        }
    });

    return output.properties;
}


module.exports = metarparser;