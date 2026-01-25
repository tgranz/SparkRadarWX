// Imports
import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';


// Stylesheet
function style(themeColors = {}) {
    // Default colors for light theme if no theme provided
    const colors = {
        cardBackground: themeColors.cardBackground || '#FFFFFF',
        primaryText: themeColors.primaryText || '#000000',
        secondaryText: themeColors.secondaryText || '#666666',
        borderColor: themeColors.borderColor || '#F0F0F0',
        shadowColor: themeColors.shadowColor || '#000000',
        ...themeColors
    };
    
    return StyleSheet.create({
        headerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: Constants.statusBarHeight,
            paddingHorizontal: 10,
            paddingVertical: 10,
            backgroundColor: 'transparent',
            width: '100%',
        },
        side: {
            // Reserve equal space on both sides so the title can be truly centered
            width: 48,            // slightly larger than icon size for touch target
            alignItems: 'center',
            justifyContent: 'center',
        },
        titleContainer: {
            flex: 1,              // middle area grows to fill available width
            alignItems: 'center', // center the text horizontally within middle
        },
        header: {
            fontFamily: 'Onest',
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.primaryText,
        },
        text: {
            fontFamily: 'Onest',
            fontSize: 14,
            color: colors.primaryText,
        },
        gradientBackground: {
            width: '100%',
            height: '100%',
        },
        cardContainer: {
            backgroundColor: colors.cardBackground,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
            paddingHorizontal: 20,
            paddingVertical: 10,
            marginHorizontal: 20,
            marginVertical: 10,
            shadowColor: colors.shadowColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
        },
        wxicons: {
            fontFamily: 'WxIcons',
            fontSize: 50,
            textAlign: 'center',
            marginRight: 20,
        },
        cardTextContainer: {
            margin: 20,
        },
        settingItem: { 
            marginBottom: 5,
            marginHorizontal: 10,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: 5,
            borderBottomRightRadius: 5,
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
            paddingVertical: 10
        }
    });
}

// https://erikflowers.github.io/weather-icons/
function wxicons(id) {
    if (id === undefined || id === null) id = '';
    id = id.toString().toLowerCase();
    // Charactes are strange and appear ambiguous.
    // This function maps icon IDs to characters.
    return {
        "day-cold": '',
        "night-cold": '',
        "day-hot": '',
        "night-hot": '',
        "day-clear": '',
        "day-sunny": '',
        "night-clear": '',
        "day-cloudy": '',
        "night-cloudy": '',
        "day-partlycloudy": '',
        "night-partlycloudy": '',
        "day-rain": '',
        "night-rain": '',
        "day-thunderstorm": '',
        "night-thunderstorm": '',
        "day-snow": '',
        "night-snow": '',
        'day-heavysnow': '',
        'night-heavysnow': '',
        'day-haze': '',
        'night-haze': '',
        'night-fog': '',
        'day-fog': '',
        'night-mist': '',
        'day-mist': '',
        '': '',
    }[id];
}

function getIconColor (icon) {
    if (icon === undefined || icon === null) return '#ffcc00';
    const lower = icon.toString().toLowerCase();
    if (lower.includes('cold')) return '#2189ffff';
    if (lower.includes('hot')) return '#ff4500ff';
    if (lower.includes('partly')) return '#c59e00ff';
    if (lower.includes('clear') || lower.includes('sunny') || lower.includes('fair')) return '#ffcc00';
    if (lower.includes('cloud') || lower.includes('overcast')) return '#888888';
    if (lower.includes('snow') || lower.includes('flurries')) return '#00d4ff';
    if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) return '#2a7fff';
    if (lower.includes('storm')) return '#ff2121';
    if (lower.includes('fog') || lower.includes('haze') || lower.includes('mist')) return '#999999';
    if (lower.includes('clear')) return '#8400ff';
    return '#ffcc00';
};

function alertcolor(alert) {
    // From SparkRadar
    // To migrate to OneCall API later
    const defaultAlerts = {
        "Air Quality Alert":
            { enabled: true, color: "#768b00", border: "#768b00", flash: null },
        "Avalanche Warning":
            { enabled: true, color: "#ff00ff", border: "#ff00ff", flash: null },
        "Dust Advisory":
            { enabled: true, color: "#706e00", border: "#706e00", flash: null },
        "Dust Storm Warning":
            { enabled: true, color: "#776b00", border: "#776b00", flash: null },
        "Flash Flood Emergency":
            { enabled: true, color: "#00ff00", border: "#00ff00", flash: "#00b600" },
        "Flash Flood Warning":
            { enabled: true, color: "#00ff00", border: "#00ff00", flash: null },
        "Flood Advisory":
            { enabled: true, color: "#00538b", border: "#00538b", flash: null },
        "Flood Warning":
            { enabled: true, color: "#1E90FF", border: "#1E90FF", flash: null },
        "Flood Watch":
            { enabled: true, color: "#60fd82", border: "#60fd82", flash: null },
        "Marine Weather Statement":
            { enabled: true, color: "#690083", border: "#690083", flash: null },
        "PDS Tornado Warning":
            { enabled: true, color: "#e900dd", border: "#e900dd", flash: "#e90000" },
        "Severe Thunderstorm Warning":
            { enabled: true, color: "#f1a500", border: "#f1a500", flash: null },
        "Snow Squall Warning":
            { enabled: true, color: "#0096aa", border: "#0096aa", flash: null },
        "Special Marine Warning":
            { enabled: true, color: "#8b3300", border: "#8b3300", flash: null },
        "Special Weather Statement":
            { enabled: true, color: "#eeff00", border: "#eeff00", flash: null },
        "Tornado Emergency":
            { enabled: true, color: "#9f00e9", border: "#9f00e9", flash: "#e900dd" },
        "Tornado Warning":
            { enabled: true, color: "#e90000", border: "#e90000", flash: null },
        "Tropical Storm Watch":
            { enabled: true, color: "#3f0072", border: "#3f0072", flash: null },
        "Ice Storm Warning":
            { enabled: true, color: "#00ffff", border: "#00ffff", flash: null },
        "Winter Storm Warning":
            { enabled: true, color: "#0099ff", border: "#0099ff", flash: null },
        "Winter Storm Watch":
            { enabled: true, color: "#0066cc", border: "#0066cc", flash: null },
        "Winter Weather Advisory":
            { enabled: true, color: "#004c99", border: "#004c99", flash: null },
    };
    if (alert in defaultAlerts) {
        return defaultAlerts[alert]["color"];
    } else {
        if (alert.toLowerCase().includes("tornado")) {
            return "#da1990";
        } else if (alert.toLowerCase().includes("warning")) {
            return "#ff2121";
        } else if (alert.toLowerCase().includes("watch")) {
            return "#ff7e00";
        } else {
            return "#ffff00";
        }
    }
}

// Contrast formula
function getContrastYIQ(hexcolor) {
    if (typeof hexcolor !== 'string' || !hexcolor) return 'black';

    hexcolor = hexcolor.replace('#', '');

    // Convert the hex color to RGB values
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);

    // Calculate the YIQ value
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    // Return black or white based on the YIQ value
    return yiq >= 128 ? 'black' : 'white';
}

// Exports
module.exports = {
    style, wxicons, getIconColor, getContrastYIQ, alertcolor
};