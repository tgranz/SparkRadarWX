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
    
    // Helper function to get weather icon from condition
    const getIcon = (condition, time = 'day') => {
        if (typeof condition !== 'string' || !condition.trim()) {
            return `${time}-sunny`;
        }

        const cond = condition.toLowerCase();
        
        if (cond.includes("overcast")) return `${time}-cloudy`;
        if (cond.includes("partly")) return `${time}-partlycloudy`;
        if (cond.includes("cloud")) return `${time}-cloudy`;
        if (cond.includes("clear") || cond.includes("sunny") || cond.includes("fair")) return `${time}-clear`;
        if (cond.includes("light") && cond.includes("snow")) return `${time}-snow`;
        if (cond.includes("flurries")) return `${time}-snow`;
        if (cond.includes("heavy") && cond.includes("snow")) return `${time}-snow`;
        if (cond.includes("snow")) return `${time}-heavysnow`;
        if (cond.includes("thunderstorm") || cond.includes("storm")) return `${time}-thunderstorm`;
        if (cond.includes("rain") || cond.includes("shower")) return `${time}-rain`;
        if (cond.includes("drizzle")) return `${time}-rain`;
        if (cond.includes("haze")) return `${time}-haze`;
        if (cond.includes("fog")) return `${time}-fog`;
        if (cond.includes("mist")) return `${time}-mist`;
        
        return `${time}-clear`;
    };

    // Determine if time is day or night based on hour
    const getDayOrNight = (hour) => {
        // Simple approximation: 6 AM to 6 PM is day
        return (hour >= 6 && hour < 18) ? 'day' : 'night';
    };

    // Build hourly data from forecasts.hourly
    const hourlyData = [];
    if (data.forecasts?.hourly && Array.isArray(data.forecasts.hourly)) {
        const forecast = data.forecasts.hourly;
        const now = new Date();
        
        // Find the first forecast entry that is current or in the future
        let startIndex = 0;
        for (let i = 0; i < forecast.length; i++) {
            const forecastTime = new Date(forecast[i].time);
            if (forecastTime >= now) {
                startIndex = i;
                break;
            }
        }
        
        // Build hourly data starting from the first future hour - show all available hours
        for (let i = startIndex; i < forecast.length; i++) {
            const hourData = forecast[i];
            const forecastTime = new Date(hourData.time);
            const hour = forecastTime.getHours();
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            const dayOrNight = getDayOrNight(hour);
            
            // Extract condition string from condition object or use directly if it's already a string
            const conditionStr = hourData.condition?.condition || hourData.condition || 'Clear';
            const icon = getIcon(conditionStr, dayOrNight);
            
            hourlyData.push({
                time: `${displayHour} ${ampm}`,
                day: forecastTime.toLocaleDateString('en-US', { weekday: 'short' }),
                temp: Math.round(hourData.temperature || 0),
                icon: icon,
                condition: conditionStr,
                precipitation: hourData.precipitation_probability ? Math.round(hourData.precipitation_probability) : 0,
                humidity: hourData.humidity || 0,
                cloudCover: hourData.cloud_cover || 0,
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
