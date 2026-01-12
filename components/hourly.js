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
    
    // OpenWeatherMap weather condition mapping
    const getConditionFromOWM = (weather) => {
        if (!weather || !weather[0]) return { icon: 'day-clear', condition: 'Unknown' };
        
        const main = weather[0].main.toLowerCase();
        const desc = weather[0].description.toLowerCase();
        
        // Determine if day or night based on sunrise/sunset if available
        const timePrefix = 'day'; // Default to day; can be enhanced with sunrise/sunset
        
        if (main.includes('clear') || main.includes('sunny')) {
            if (main.includes('mostly')) return { icon: `${timePrefix}-clear`, condition: 'Mostly Clear' };
            else return { icon: `${timePrefix}-clear`, condition: 'Clear' };
        } else if (main.includes('cloud')) {
            if (main.includes('mostly')) return { icon: `${timePrefix}-cloudy`, condition: 'Mostly Cloudy' };
            else return { icon: `${timePrefix}-cloudy`, condition: 'Cloudy' };
        } else if (main.includes('rain') || main.includes('drizzle')) {
            return { icon: `${timePrefix}-rain`, condition: weather[0].main };
        } else if (main.includes('snow')) {
            return { icon: `${timePrefix}-snow`, condition: 'Snow' };
        } else if (main.includes('thunder')) {
            return { icon: `${timePrefix}-thunderstorm`, condition: 'Thunderstorm' };
        } else if (main.includes('fog') || main.includes('mist')) {
            return { icon: `${timePrefix}-fog`, condition: weather[0].main };
        }
        return { icon: `${timePrefix}-clear`, condition: weather[0].main };
    };

    // Build hourly data from OpenWeatherMap forecast
    const hourlyData = [];
    if (data.hourlyForecast && Array.isArray(data.hourlyForecast)) {
        const forecast = data.hourlyForecast;
        const hoursToShow = 48; // Show next 48 hours
        const now = new Date();
        
        // Find the first forecast entry that is current or in the future
        let startIndex = 0;
        for (let i = 0; i < forecast.length; i++) {
            const forecastTime = new Date(forecast[i].dt * 1000);
            if (forecastTime >= now) {
                startIndex = i;
                break;
            }
        }
        
        // Build hourly data starting from the first future hour
        for (let i = startIndex; i < Math.min(startIndex + hoursToShow, forecast.length); i++) {
            const hourData = forecast[i];
            const forecastTime = new Date(hourData.dt * 1000);
            const hour = forecastTime.getHours();
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            
            const weatherInfo = getConditionFromOWM(hourData.weather);
            
            hourlyData.push({
                time: `${displayHour} ${ampm}`,
                day: forecastTime.toLocaleDateString('en-US', { weekday: 'short' }),
                temp: Math.round(hourData.temp),
                icon: weatherInfo.icon,
                condition: weatherInfo.condition,
                precipitation: hourData.pop ? Math.round(hourData.pop * 100) : 0,
                humidity: hourData.humidity || 0,
                cloudCover: hourData.clouds || 0,
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
