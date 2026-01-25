import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { style, wxicons, getIconColor, getContrastYIQ } from '../style';
import { useTheme } from '../theme';

export default function DailyScreen({ onMenuOpen, onBack, data, coordinates }) {
    const { theme, isDark } = useTheme();
    const styles = style(theme);
    const [tempUnit, setTempUnit] = useState('fahrenheit');

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            onBack();
            return true;
        });

        return () => backHandler.remove();
    }, [onBack]);

    useEffect(() => {
        // Load temperature unit preference
        const loadTempUnit = async () => {
            try {
                const savedTempUnit = await AsyncStorage.getItem('tempUnit');
                if (savedTempUnit !== null) {
                    setTempUnit(savedTempUnit);
                }
            } catch (error) {
                console.error('Error loading temperature unit:', error);
            }
        };
        loadTempUnit();
    }, []);



    const pointInPolygon = (point, polygon) => {
        if (!Array.isArray(polygon) || polygon.length === 0) return false;
        const inOuter = pointInRing(point, polygon[0]);
        if (!inOuter) return false;
        for (let i = 1; i < polygon.length; i++) {
            if (pointInRing(point, polygon[i])) return false;
        }
        return true;
    };

    const convertTemperature = (tempF) => {
        if (tempUnit === 'celsius') {
            return Math.round((tempF - 32) * 5 / 9);
        }
        return tempF;
    };

    const getSpcIndex = (level) => {
        switch (level) {
            case 'MRGL': return '1';
            case 'SLGT': return '2';
            case 'ENH': return '3';
            case 'MDT': return '4';
            case 'HIGH': return '5';
            default: return '0';
        }
    };
    
    // Helper function to get weather icon from condition
    const getIcon = (condition, time = 'day') => {
        if (typeof condition !== 'string' || !condition.trim()) {
            return `${time}-sunny`;
        }

        const cond = condition.toLowerCase();
        
        if (cond.includes("overcast")) return `${time}-cloudy`;
        if (cond.includes("partly")) return `${time}-partlycloudy`;
        if (cond.includes("cloud")) return `${time}-cloudy`;
        if (cond.includes("cold")) return `${time}-cold`;
        if (cond.includes("hot")) return `${time}-hot`;
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

    // Build daily data from forecasts.daily
    const dailyData = [];
    
    // Safety check: ensure data structure exists before processing
    if (!data || !data.forecasts || !data.forecasts.daily || data.forecasts.daily.length === 0) {
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
                        <Text style={styles.header}>Daily Forecast</Text>
                    </View>
                    <View style={styles.side} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: theme.primaryText }}>Loading forecast data...</Text>
                </View>
            </LinearGradient>
        );
    }
    
    const dailyForecasts = data.forecasts.daily;

    dailyForecasts.forEach((day, index) => {
        // Parse date in local timezone to avoid day-offset issues
        const [year, month, dayNum] = day.date.split('-').map(Number);
        const date = new Date(year, month - 1, dayNum);
        const isToday = index === 0;
        
        // Extract condition string from condition object or use directly if it's already a string
        const conditionStr = day.condition?.condition || day.condition || 'Clear';
        const nightConditionStr = day.night?.condition?.condition || day.night?.condition || conditionStr;
        
        // Get SPC outlook from API data if available
        const spcData = data.forecasts?.spc?.[index];
        const spcOutlook = spcData && spcData.level && spcData.level !== 'NONE' && spcData.level !== 'TSTM' ? {
            label: spcData.level,
            description: spcData.description,
            fill: spcData.color,
            stroke: spcData.altcolor,
        } : null;

        dailyData.push({
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            dayName: isToday ? "Today" : date.toLocaleDateString('en-US', { weekday: 'long' }),
            tempHigh: Math.round(day.high || 0),
            tempLow: Math.round(day.low || 0),
            iconDay: getIcon(conditionStr, 'day'),
            iconNight: getIcon(nightConditionStr, 'night'),
            condition: conditionStr,
            popDay: day.precipitation_probability !== null ? Math.round((day.precipitation_probability || 0)) : 0,
            popNight: day.night?.precipitation_probability !== null ? Math.round((day.night?.precipitation_probability || 0)) : 0,
            spcOutlook: spcOutlook,
            description: day.description || null,
        });
    });

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
                    <Text style={styles.header}>Daily Forecast</Text>
                </View>

                <View style={styles.side} />
            </View>

            <ScrollView 
                style={{ flex: 1, marginTop: 20 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            >
                {dailyData.map((day, index) => (
                    <View key={index} style={[localStyles.dayCard, { backgroundColor: theme.cardBackground }]}>
                        <View style={localStyles.headerSection}>
                            <View style={{ flex: 1 }}>
                                <Text style={[localStyles.dayText, { color: theme.primaryText }]}>{day.dayName}</Text>
                                <Text style={[localStyles.dateText, { color: theme.secondaryText }]}>{day.date}</Text>
                            </View>
                            
                            <View style={localStyles.iconTempSection}>
                                <Text style={[styles.wxicons, { fontSize: 48, color: getIconColor(day.iconDay) }]}>
                                    {wxicons(day.iconDay, 'day')}
                                </Text>
                                {day.iconDay !== day.iconNight ? <Text style={[styles.wxicons, { fontSize: 24, color: getIconColor(day.iconNight) }]}>
                                    {wxicons(day.iconNight, 'night')}
                                </Text> : null}
                                <View style={{ marginLeft: 15 , alignItems: 'flex-end' }}>
                                    <Text style={[localStyles.tempText, { color: theme.primaryText }]}>{day.tempHigh !== undefined && day.tempHigh !== null ? day.tempHigh : '--'}°</Text>
                                    <Text style={[localStyles.tempLowText, { color: theme.secondaryText }]}>{day.tempLow !== undefined && day.tempLow !== null ? day.tempLow : '--'}°</Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center', marginBottom: 0 }}>
                            <Text style={[localStyles.conditionText, { color: theme.secondaryText }]}>{day.condition}</Text>
                            <View style={localStyles.detailItem}>
                                <MaterialIcons name="water-drop" size={18} color={theme.weatherIconPrimary} />
                                <Text style={[localStyles.detailText, { color: theme.secondaryText }]}>{ day.popDay === day.popNight ? `${day.popDay}%` : `${day.popDay}% / ${day.popNight}%`}</Text>
                            </View>
                        </View>

                        {day.description && <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center', marginBottom: 0 }}>
                            <Text style={[localStyles.conditionDescription, { color: theme.secondaryText }]}>{day.description}</Text>
                        </View>}

                        {day.spcOutlook && getSpcIndex(day.spcOutlook.label) > 0 && (
                            <View style={[localStyles.spcSection, { backgroundColor: day.spcOutlook.fill, borderColor: day.spcOutlook.stroke }]}>
                                <MaterialIcons name="warning" size={18} color={getContrastYIQ(day.spcOutlook.fill)} />
                                <Text style={[localStyles.spcText, { color: getContrastYIQ(day.spcOutlook.fill) }]}>
                                    Severe Risk: {day.spcOutlook.description} ({getSpcIndex(day.spcOutlook.label)}/5)
                                </Text>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        </LinearGradient>
    );
}

const localStyles = StyleSheet.create({
    dayCard: {
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 15,
    },
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    dayText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 14,
        marginTop: 2,
    },
    iconTempSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tempText: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    tempLowText: {
        fontSize: 20,
        marginTop: -4,
    },
    conditionText: {
        fontSize: 16,
        marginBottom: 0,
    },
    conditionDescription: {
        fontSize: 12,
        marginBottom: 0,
        marginTop: 4,
    },
    detailsSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    detailText: {
        fontSize: 14,
    },
    spcSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        gap: 8,
    },
    spcText: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
});
