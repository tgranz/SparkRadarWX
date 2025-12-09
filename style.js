// Imports
import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';


// Stylesheet
function style() {
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
        },
        text: {
            fontFamily: 'Onest',
            fontSize: 14,
        },
        gradientBackground: {
            width: '100%',
            height: '100%',
        },
        cardContainer: {
            backgroundColor: 'white',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
            padding: 10,
            margin: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
        },
        wxicons: {
            fontFamily: 'WxIcons',
            fontSize: 50,
            textAlign: 'center',
        }
    });
}

// https://erikflowers.github.io/weather-icons/
function wxicons(id) {
    // Charactes are strange and appear ambiguous.
    // This function maps icon IDs to characters.
    return {
        "day-clear": '',
        "night-clear": '',
        "day-cloudy": '',
        "night-cloudy": '',
    }[id];
}

// Exports
module.exports = {
    style, wxicons
};