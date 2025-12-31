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
    if (icon === undefined || icon === null) return '#ffaa00';
    const lower = icon.toString().toLowerCase();
    if (lower.includes('partly')) return '#af8101ff';
    if (lower.includes('clear')) return '#ffaa00';
    if (lower.includes('cloud') || lower.includes('overcast')) return '#888888';
    if (lower.includes('rain') || lower.includes('snow')) return '#2a7fff';
    if (lower.includes('thunderstorm')) return '#333333';
    if (lower.includes('fog') || lower.includes('haze') || lower.includes('mist')) return '#999999';
    if (lower.includes('clear')) return '#8400ff';
    return '#ffaa00';
};

// Exports
module.exports = {
    style, wxicons, getIconColor
};