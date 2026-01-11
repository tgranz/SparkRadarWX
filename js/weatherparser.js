// Script to fetch data from the NWS, or OpenWeatherMap
//
// Switch to NWS data in v0.1.7 instead of METARS...
// ... because METAR data is quite inaccurate
//
// Copyright 2025 Tyler Granzow
// FOSS software under Apache-2.0 License, see LICENSE.txt


/* New data return format:
{
    station: "",
    condition: "",
    temp: 0, in fahrenheit
    dew_point: 0, in fahrenheit
    wind_direction: 0, degrees
    wind_speed: 0, in mph
    pressure: 0, in hPa
    r_humidity: 0,
    visibility: 0, in miles
    forecast: { ... }
}
*/

// Imports
import Constants from 'expo-constants';
const OPENWEATHER_API_KEY = Constants.expoConfig?.extra?.openWeatherApiKey || process.env.OPENWEATHER_API_KEY;

// Main parser function
function weatherparser(lat, lon, callback) {
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

    // Fetch all data sources in parallel
    Promise.all([
        fetch(`https://forecast.weather.gov/MapClick.php?lon=${lon}&lat=${lat}&FcstType=json`)
            .then(r => r.json())
            .catch(e => { console.warn("NWS forecast error:", e); return null; }),
        fetch(`https://api.weather.gov/alerts/active?message_type=alert&point=${lat},${lon}`)
            .then(r => r.json())
            .catch(e => { console.warn("NWS alerts error:", e); return null; }),
        OPENWEATHER_API_KEY ? 
            fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`)
                .then(r => r.json())
                .catch(e => { console.warn("OpenWeatherMap error:", e); return null; })
            : Promise.resolve(null)
    ]).then(([nwsForecast, alertsData, owmData]) => {
        let baseData;
        let forecast;
        let hourlyForecast = null;

        const nwsConditions = nwsForecast?.currentobservation || null;

        // Propogate base data with OWM fallback
        baseData = {
            station: nwsConditions?.id || owmData?.name || "",
            condition: (nwsConditions?.Weather && nwsConditions.Weather.toLowerCase() !== "unknown" && !nwsConditions.Weather.toLowerCase().includes("unknown")) ? nwsConditions.Weather : (owmData && owmData.current ? owmData.current.weather[0].description : "Data unavailable"),
            temp: nwsConditions?.Temp || (owmData && owmData.current ? owmData.current.temp : 0),
            dew_point: nwsConditions?.Dewp || (owmData && owmData.current ? owmData.current.dew_point : 0),
            wind_direction: nwsConditions?.Windd || (owmData && owmData.current ? owmData.current.wind_deg : 0),
            wind_speed: nwsConditions?.Winds || (owmData && owmData.current ? owmData.current.wind_speed : 0),
            pressure: nwsConditions?.SLP || (owmData && owmData.current ? owmData.current.pressure / 33.864 : 0),
            r_humidity: nwsConditions?.Relh || (owmData && owmData.current ? (owmData.current.humidity > 100 ? 100 : owmData.current.humidity) : 0),
            visibility: nwsConditions?.Visibility || (owmData && owmData.current ? (owmData.current.visibility > 10 ? 10 : owmData.current.visibility) : 0),
        }
        
        // Determine daily forecast: NWS first, OWM fallback
        if (nwsForecast) {
            forecast = nwsForecast;
            console.log("Using NWS daily forecast");
        } else if (owmData && owmData.daily) {
            forecast = convertOWMToNWSFormat(owmData);
            console.log("Using OpenWeatherMap daily forecast (NWS unavailable)");
        } else {
            forecast = null;
            console.warn("No daily forecast available");
        }
        
        // Always use OWM for hourly forecast if available
        if (owmData && owmData.hourly) {
            hourlyForecast = owmData.hourly;
            console.log("Using OpenWeatherMap hourly forecast");
        }
        
        // Attach forecasts to baseData
        baseData.forecast = forecast;
        baseData.hourlyForecast = hourlyForecast;

        // Generate simple insight
        if (nwsConditions?.Gust && parseInt(nwsConditions?.Gust) - parseInt(baseData.wind_speed) >= 10) {
            baseData.insight = `Wind is gusting up to ${nwsConditions.Gust} mph.`;
        } else if (nwsConditions?.WindChill && parseInt(nwsConditions?.WindChill) < parseInt(baseData.temp)) {
            baseData.insight = `Wind chill is making it feel like ${nwsConditions.WindChill}°F.`;
        } else if (parseInt(baseData.r_humidity) > 99) {
            baseData.insight = "It's quite humid outside.";
        } else {
            if (baseData.temp <= 40) {
                baseData.insight = "It's quite cold outside, be sure to dress warm!";
            } else if (baseData.temp >= 80) {
                baseData.insight = "It's quite hot outside, be sure to stay hydrated!";
            } else {
                baseData.insight = "The weather is quite nice outside!";
            }
        }
        
        // Call the callback with complete data
        if (callback) {
            callback(baseData, alertsData);
        }

    }).catch(err => {
        console.error("Fatal error fetching weather data:", err);
        if (callback) {
            callback({
                station: "Error",
                condition: "Error fetching data",
                temp: 0,
                dew_point: 0,
                wind_direction: 0,
                wind_speed: 0,
                pressure: 0,
                r_humidity: 0,
                visibility: 0,
                forecast: null,
                hourlyForecast: null,
                insight: null,
            }, null);
        }
    });

    // Return placeholder while fetching
    return {
        station: "Loading...",
        condition: "Loading...",
        temp: 0,
        dew_point: 0,
        wind_direction: 0,
        wind_speed: 0,
        pressure: 0,
        r_humidity: 0,
        visibility: 0,
        forecast: null,
        hourlyForecast: null,
        insight: null,
    };
}

// Export the parser function
module.exports = weatherparser;