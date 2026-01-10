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
            output.properties.source = "Source: " + output.properties.ICAO + " weather station";
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

    // If distance is too large, or data is still bad, use openWeatherMap data
    const isAutomatedObs = (
        output && output.properties && typeof output.properties.WEATHER === 'string' &&
        output.properties.WEATHER.toLowerCase().includes("automated observation")
    );
    
    // Function to fetch forecast and call callback
    const fetchForecastAndCallback = (baseData) => {
        console.log(`Fetching NWS forecast for lat=${lat}, lon=${lon}`);
        
        Promise.all([
            fetch(`https://forecast.weather.gov/MapClick.php?lon=${lon}&lat=${lat}&FcstType=json`).then(r => r.json()).catch(e => { console.warn("NWS error:", e); return null; }),
            fetch(`https://api.weather.gov/alerts/active?message_type=alert&point=${lat},${lon}`).then(r => r.json()).catch(e => { console.warn("Alerts error:", e); return null; })
        ]).then(([forecastData, alertsData]) => {
            
            if (forecastData) {
                console.log("NWS response received.");
                baseData.forecast = forecastData;
                if (callback) {
                    callback(baseData, alertsData);
                }
            } else {
                // NWS failed, try OpenWeatherMap forecast as fallback
                console.log("NWS forecast failed, falling back to OpenWeatherMap forecast");
                if (OPENWEATHER_API_KEY) {
                    fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`)
                        .then(r => r.json())
                        .then(owmData => {
                            // Convert OWM forecast to NWS-like format
                            const nwsLikeForecast = convertOWMToNWSFormat(owmData);
                            baseData.forecast = nwsLikeForecast;
                            console.log("OpenWeatherMap forecast data succeeded");
                            if (callback) {
                                callback(baseData, alertsData);
                            }
                        })
                        .catch(err => {
                            console.error("OpenWeatherMap forecast error:", err);
                            if (callback) {
                                callback(baseData, alertsData);
                            }
                        });
                } else {
                    console.warn("OpenWeatherMap API key not configured, cannot fetch fallback forecast");
                    if (callback) {
                        callback(baseData, alertsData);
                    }
                }
            }
        }).catch(err => {
            console.error("Promise.all error:", err);
            if (callback) {
                callback(baseData, null);
            }
        });
    };
    
    // Convert OpenWeatherMap forecast to NWS-compatible format
    const convertOWMToNWSFormat = (owmData) => {
        const time = {
            layoutKey: "owm-daily",
            startPeriodName: [],
            startValidTime: [],
            tempLabel: []
        };
        
        const data = {
            temperature: [],
            pop: [],
            weather: [],
            iconLink: [],
            text: []
        };
        
        // Convert daily forecast
        if (owmData.daily) {
            owmData.daily.forEach((day, index) => {
                const date = new Date(day.dt * 1000);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                
                // Day period
                time.startPeriodName.push(dayName);
                time.startValidTime.push(date.toISOString());
                time.tempLabel.push("High");
                data.temperature.push(Math.round(day.temp.max).toString());
                data.pop.push(day.pop ? Math.round(day.pop * 100).toString() : "0");
                data.weather.push(day.weather[0].main);
                data.iconLink.push(`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`);
                data.text.push(day.weather[0].description);
                
                // Night period
                time.startPeriodName.push(dayName + " Night");
                time.startValidTime.push(date.toISOString());
                time.tempLabel.push("Low");
                data.temperature.push(Math.round(day.temp.min).toString());
                data.pop.push(day.pop ? Math.round(day.pop * 100).toString() : "0");
                data.weather.push(day.weather[0].main);
                data.iconLink.push(`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`);
                data.text.push(day.weather[0].description);
            });
        }
        
        return { time, data };
    };
    
    if (output.DISTANCE > 15 || isAutomatedObs) {
        console.log("Bad data from second nearest METAR", output.properties.STATION + ". Trying NWS...");
        
        // Use NWS current observation data if available
        if (OPENWEATHER_API_KEY) {
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
                        source: "Source: OpenWeatherMap"
                    };
                    console.log("OpenWeatherMap data succeeded");
                    fetchForecastAndCallback(owmData);
                })
                .catch((error) => {
                    console.error("Error fetching OpenWeatherMap data:", error);
                    // Fallback to METAR data even if OWM fails
                    fetchForecastAndCallback(output.properties);
                });
        } else {
            console.warn("OpenWeatherMap API key not configured");
            // Fallback to METAR data
            fetchForecastAndCallback(output.properties);
        }

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
            SKY_CONDTN: "Loading",
            source: "..."
        };
        
    } else {
        // Good METAR data, use it
        output.properties.WEATHER = output.properties.WEATHER == "No significant weather present at this time." ? 
            output.properties.SKY_CONDTN : output.properties.WEATHER;

        output.properties.source = "Source: " + output.properties.ICAO + " weather station";
        console.log("Using METAR data from", output.properties.ICAO);
        
        fetchForecastAndCallback(output.properties);
    }

    return output.properties;
}


module.exports = metarparser;