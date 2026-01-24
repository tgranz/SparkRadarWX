// Script to fetch data from the NWS, or OpenWeatherMap
//
// Switch to NWS data in v0.1.7 instead of METARS...
// ... because METAR data is quite inaccurate
//
// This file is OBSOLETE as of v0.1.10 and will be removed in future versions.
//
// Copyright 2025 Tyler Granzow
// FOSS software under Apache-2.0 License, see LICENSE.txt


// Imports
import Constants from 'expo-constants';
const OPENWEATHER_API_KEY = Constants.expoConfig?.extra?.openWeatherApiKey || process.env.OPENWEATHER_API_KEY;

// Main parser function
function weatherparser(lat, lon, callback, units = {}) {
    const unitPrefs = {
        tempUnit: units.tempUnit || 'fahrenheit',
        speedUnit: units.speedUnit || 'mph',
    };

    // Conversion functions
    const convertTemperature = (tempF) => {
        if (unitPrefs.tempUnit === 'celsius') {
            return Math.round((tempF - 32) * 5 / 9);
        }
        return Math.round(tempF);
    };

    const convertSpeed = (mph) => {
        if (unitPrefs.speedUnit === 'kph') {
            return Math.round(mph * 1.60934);
        }
        return Math.round(mph);
    };

    const getTempUnit = () => unitPrefs.tempUnit === 'celsius' ? '°C' : '°F';
    const getSpeedUnit = () => unitPrefs.speedUnit === 'kph' ? 'km/h' : 'mph';

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
                data.text.push('owmdata');
                
                // Night period
                time.startPeriodName.push(dayName + " Night");
                time.startValidTime.push(date.toISOString());
                time.tempLabel.push("Low");
                data.temperature.push(Math.round(day.temp.min).toString());
                data.pop.push(day.pop ? Math.round(day.pop * 100).toString() : "0");
                data.weather.push(day.weather[0].main);
                data.iconLink.push(`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`);
                data.text.push('owmdata');
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
        let minutelyForecast = null;

        const nwsConditions = nwsForecast?.currentobservation || null;

        // Filter out NaN values from nwsConditions
        if (nwsConditions) {
            Object.keys(nwsConditions).forEach(key => {
                if ( nwsConditions[key] == 'NaN' || isNaN(nwsConditions[key])) {
                    nwsConditions[key] = undefined;
                }
            });
        }

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
            sunrise: owmData?.current?.sunrise ? new Date(owmData.current.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
            sunset: owmData?.current?.sunset ? new Date(owmData.current.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
            cloudcover: owmData?.current?.clouds || 0,
            uvindex: owmData?.current?.uvi || 0,
            lastUpdated: nwsConditions?.creationDateLocal || new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
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

        // Use OWM minutely forecast for next hour when available
        if (owmData && owmData.minutely) {
            minutelyForecast = owmData.minutely.slice(0, 60);
            console.log("Using OpenWeatherMap minutely forecast");
        }
        
        // Attach forecasts to baseData
        baseData.forecast = forecast;
        baseData.hourlyForecast = hourlyForecast;
        baseData.minutelyForecast = minutelyForecast;

        // Generate info on the next 24 hours
        const precipData = hourlyForecast.map(hour => (
            typeof hour.pop === 'number' ? hour.pop * 100 : 0
          ));

        // Generate simple insight
        if (precipData.some(prob => prob > 80)){
            baseData.insight = "There's a high chance of precipitation in the next 24 hours.";
        } else if (nwsConditions?.Gust && parseInt(nwsConditions?.Gust) - parseInt(baseData.wind_speed) >= 10) {
            baseData.insight = `Wind is gusting up to ${convertSpeed(parseInt(nwsConditions.Gust))} ${getSpeedUnit()}.`;
        } else if (nwsConditions?.WindChill && parseInt(baseData.temp) - parseInt(nwsConditions?.WindChill) >= 5) {
            baseData.insight = `Wind chill is making it feel like ${convertTemperature(parseInt(nwsConditions.WindChill))}${getTempUnit()}.`;
        } else if (baseData.uvindex >= 8) {
            baseData.insight = "UV index is very high, be sure to use sunscreen!";
        } else if (baseData.visibility <= 2) {
            baseData.insight = "Visibility is very low, exercise caution is driving.";
        } else if (parseInt(baseData.r_humidity) > 99) {
            baseData.insight = "It's quite humid outside.";
        } else if (parseInt(baseData.r_humidity) < 20) {
            if (baseData.wind_speed >= 15) {
                baseData.insight = "It's very dry and windy outside. Avoid burning.";
            } else {
                baseData.insight = "It's very dry outside. Exercise caution if burning.";
            }
        } else {
            if (baseData.temp <= 50) {
                baseData.insight = "It's quite cold outside, be sure to dress warm!";
            } else if (baseData.temp >= 85) {
                baseData.insight = "It's quite hot outside, be sure to stay hydrated!";
            } else {
                baseData.insight = "The temperature is quite nice outside!";
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
                minutelyForecast: null,
                insight: null,
                sunrise: null,
                sunset: null,
                cloudcover: null,
                uvindex: null
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
        minutelyForecast: null,
        insight: null,
        sunrise: null,
        sunset: null,
        cloudcover: null,
        uvindex: null
    };
}

// Export the parser function
module.exports = weatherparser;