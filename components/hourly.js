import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { style, wxicons, getIconColor } from '../style';
import { useTheme } from '../theme';

export default function HourlyScreen({ onMenuOpen, onBack, data }) {
    const { theme, isDark } = useTheme();
    const styles = style(theme);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            onBack();
            return true;
        });

        return () => backHandler.remove();
    }, [onBack]);
    
    // Weather code to condition mapping (WMO codes)
    const getConditionFromCode = (code, isDay) => {
        const timePrefix = isDay ? 'day' : 'night';
        if (code === 0) return { icon: `${timePrefix}-clear`, condition: 'Clear' };
        if (code === 1) return { icon: `${timePrefix}-clear`, condition: 'Mostly Clear' };
        if (code === 2) return { icon: `${timePrefix}-partlycloudy`, condition: 'Partly Cloudy' };
        if (code === 3) return { icon: `${timePrefix}-cloudy`, condition: 'Cloudy' };
        if (code === 45 || code === 48) return { icon: `${timePrefix}-fog`, condition: 'Fog' };
        if (code === 51 || code === 53 || code === 55) return { icon: `${timePrefix}-rain`, condition: 'Drizzle' };
        if (code === 61 || code === 63 || code === 65) return { icon: `${timePrefix}-rain`, condition: 'Rain' };
        if (code === 71 || code === 73 || code === 75) return { icon: `${timePrefix}-snow`, condition: 'Snow' };
        if (code === 77) return { icon: `${timePrefix}-snow`, condition: 'Snow' };
        if (code === 80 || code === 81 || code === 82) return { icon: `${timePrefix}-rain`, condition: 'Rain Showers' };
        if (code === 85 || code === 86) return { icon: `${timePrefix}-snow`, condition: 'Snow Showers' };
        if (code === 95) return { icon: `${timePrefix}-thunderstorm`, condition: 'Thunderstorm' };
        if (code === 96 || code === 99) return { icon: `${timePrefix}-thunderstorm`, condition: 'Heavy Thunderstorms' };
        return { icon: `${timePrefix}-clear`, condition: 'Unknown' };
    };

    // Build hourly data from Open-Meteo forecast
    const hourlyData = [];
    if (data.forecast && data.forecast.hourly) {
        const forecast = data.forecast.hourly;
        const hoursToShow = 164; // Show next 164 hours
        const now = new Date();
        
        // Find the first forecast entry that is current or in the future
        let startIndex = 0;
        for (let i = 0; i < forecast.time.length; i++) {
            const forecastTime = new Date(forecast.time[i]);
            if (forecastTime >= now) {
                startIndex = i;
                break;
            }
        }
        
        // Build hourly data starting from the first future hour
        for (let i = startIndex; i < Math.min(startIndex + hoursToShow, forecast.time.length); i++) {
            const forecastTime = new Date(forecast.time[i]);
            const hour = forecastTime.getHours();
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            
            const weatherInfo = getConditionFromCode(forecast.weather_code[i], forecast.is_day[i]);
            
            hourlyData.push({
                time: `${displayHour} ${ampm}`,
                day: forecastTime.toLocaleDateString('en-US', { weekday: 'short' }),
                temp: Math.round(forecast.temperature_2m[i]),
                icon: weatherInfo.icon,
                condition: weatherInfo.condition,
                precipitation: forecast.precipitation_probability[i] || 0,
                humidity: forecast.relative_humidity_2m[i] || 0,
                cloudCover: forecast.cloud_cover[i] || 0,
            });
        }
    }

    return (
        <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={[styles.gradientBackground, { zIndex: 1 }]}>
            <StatusBar style="auto" />
            
            <View style={[styles.headerContainer]}>
                <View style={styles.side}>
                    <TouchableOpacity onPress={onMenuOpen}>
                        <MaterialIcons name="menu" size={35} color={theme.iconColor} />
                    </TouchableOpacity>
                </View>

                <View style={styles.titleContainer}>
                    <Text style={styles.header}>Hourly Forecast</Text>
                </View>

                <View style={styles.side} />
            </View>

            <ScrollView 
                style={{ flex: 1, marginTop: 20 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            >
                {hourlyData.map((hour, index) => (
                    <View key={index} style={[localStyles.hourCard, { backgroundColor: theme.cardBackground }]}>
                        <View style={localStyles.timeSection}>
                            <Text style={[localStyles.timeText, { color: theme.primaryText }]}>{hour.day}</Text>
                            <Text style={[localStyles.timeText, { color: theme.primaryText }]}>{hour.time}</Text>
                        </View>

                        <View style={localStyles.iconSection}>
                            <Text style={[styles.wxicons, { fontSize: 40, color: getIconColor(hour.icon) }]}>
                                {wxicons(hour.icon)}
                            </Text>
                        </View>

                        <View style={localStyles.dataSection}>
                            <Text style={[localStyles.tempText, { color: theme.primaryText }]}>{hour.temp}°</Text>
                            <Text style={[localStyles.conditionText, { color: theme.secondaryText }]}>{hour.condition}</Text>
                        </View>

                        <View style={localStyles.precipSection}>
                            <MaterialIcons name="water-drop" size={20} color={theme.weatherIconPrimary} />
                            <Text style={[localStyles.precipText, { color: theme.secondaryText }]}>{hour.precipitation}%</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </LinearGradient>
    );
}

const localStyles = StyleSheet.create({
    hourCard: {
        borderRadius: 20,
        padding: 15,
        marginHorizontal: 20,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeSection: {
        flex: 1,
    },
    timeText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    iconSection: {
        flex: 1,
        alignItems: 'center',
    },
    dataSection: {
        flex: 1.5,
        alignItems: 'center',
    },
    tempText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    conditionText: {
        fontSize: 12,
        marginTop: 2,
    },
    precipSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 5,
    },
    precipText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
