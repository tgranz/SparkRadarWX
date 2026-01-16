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
    const [spcOutlooks, setSpcOutlooks] = useState({});
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

    useEffect(() => {
        // Fetch SPC outlooks for days 1-3
        if (coordinates?.lat && coordinates?.lon) {
            fetchSpcOutlooks(coordinates.lat, coordinates.lon);
        }
    }, [coordinates]);

    const fetchSpcOutlooks = async (lat, lon) => {
        const outlooks = {};
        const days = ['day1otlk_cat', 'day2otlk_cat', 'day3otlk_cat'];
        
        for (let i = 0; i < days.length; i++) {
            try {
                const response = await fetch(`https://www.spc.noaa.gov/products/outlook/${days[i]}.nolyr.geojson`);
                const json = await response.json();
                const point = [lon, lat];
                let bestFeature = null;

                json.features?.forEach((feature) => {
                    if (!feature?.geometry || !feature?.properties) return;
                    const { geometry, properties } = feature;

                    const checkPolygon = (polyCoords) => {
                        if (pointInPolygon(point, polyCoords)) {
                            if (!bestFeature || (properties.DN ?? 0) > (bestFeature.properties.DN ?? 0)) {
                                bestFeature = feature;
                            }
                        }
                    };

                    if (geometry.type === 'Polygon') {
                        checkPolygon(geometry.coordinates);
                    } else if (geometry.type === 'MultiPolygon') {
                        geometry.coordinates.forEach((poly) => checkPolygon(poly));
                    }
                });

                if (bestFeature) {
                    const { LABEL, LABEL2, fill, stroke } = bestFeature.properties;
                    outlooks[i] = { label: LABEL, description: LABEL2.replace(" Risk", ""), fill, stroke };
                }
            } catch (err) {
                console.error(`Error fetching SPC day ${i + 1} outlook:`, err);
            }
        }
        
        setSpcOutlooks(outlooks);
    };

    const pointInRing = (point, ring) => {
        const [px, py] = point;
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];
            const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }
        return inside;
    };

    const convertTemperature = (tempF) => {
        if (tempUnit === 'celsius') {
            return Math.round((tempF - 32) * 5 / 9);
        }
        return tempF;
    };

    const pointInPolygon = (point, polygon) => {
        if (!Array.isArray(polygon) || polygon.length === 0) return false;
        const inOuter = pointInRing(point, polygon[0]);
        if (!inOuter) return false;
        for (let i = 1; i < polygon.length; i++) {
            if (pointInRing(point, polygon[i])) return false;
        }
        return true;
    };

    const getSpcIndex = (label) => {
        switch (label) {
            case 'MRGL': return '1';
            case 'SLGT': return '2';
            case 'ENH': return '3';
            case 'MDT': return '4';
            case 'HIGH': return '5';
            default: return '0';
        }
    };
    
    // Weather text to condition mapping
    const getConditionFromText = (weatherText, dayOrNight='day') => {
        const text = (weatherText || '').toLowerCase();
        
        if (text.includes('showers')){
            if (text.includes('snow')) return { icon: `${dayOrNight}-snow`, condition: 'Wintry Mix' };
            return { icon: `${dayOrNight}-rain`, condition: 'Showers' };
        }
        if (text.includes('rain') && text.includes('snow')) return { icon: `${dayOrNight}-rain`, condition: 'Wintry Mix' };
        if (text.includes('thunderstorm')) return { icon: `${dayOrNight}-thunderstorm`, condition: 'Thunderstorm' };
        if (text.includes('rain')) return { icon: `${dayOrNight}-rain`, condition: 'Rain' };
        if (text.includes('snow')) return { icon: `${dayOrNight}-heavysnow`, condition: 'Snow' };
        if (text.includes('sleet')) return { icon: `${dayOrNight}-rain`, condition: 'Sleet' };
        if (text.includes('freezing')) return { icon: `${dayOrNight}-rain`, condition: 'Freezing Rain' };
        if (text.includes('fog') || text.includes('mist')) return { icon: `${dayOrNight}-fog`, condition: 'Fog' };
        if (text.includes('drizzle')) return { icon: `${dayOrNight}-rain`, condition: 'Drizzle' };
        if (text.includes('cloudy') || text.includes('overcast')) return { icon: `${dayOrNight}-cloudy`, condition: 'Cloudy' };
        if (text.includes('partly') || text.includes('mostly cloudy')) return { icon: `${dayOrNight}-partlycloudy`, condition: 'Partly Cloudy' };
        if (text.includes('mostly sunny') || text.includes('sunny') || text.includes('clear')) return { icon: `${dayOrNight}-clear`, condition: 'Clear' };
        
        return { icon: `${dayOrNight}-clear`, condition: 'Clear' };
    };

    // Build daily data from NWS forecast
    // NWS forecast has a day AND night period
    const dailyData = [];
    
    // Safety check: ensure data structure exists before processing
    if (!data || !data.forecast || !data.forecast.time || !data.forecast.data) {
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
    
    const forecasttime = data.forecast.time;
    const forecast = data.forecast.data;
    const daysToShow = forecasttime.startValidTime.length;

    var thisHigh = null;
    var thisLow = null;
    var thisConditionDay = null;
    var thisConditionNight = null;
    var iconDay = null;
    var iconNight = null;
    var popDay = null;
    var popNight = null;
    var dayIndex = 0;
    var first = true;
    
    for (let i = 0; i < daysToShow; i++) {
        // Use tempLabel to determine if this is a High or Low period
        const isHighPeriod = forecasttime.tempLabel[i] === "High";
        
        if (isHighPeriod) {
            // Daytime segment
            thisHigh = parseInt(forecast.temperature[i]) || 0;
            thisConditionDay = forecast.weather[i];
            iconDay = getConditionFromText(thisConditionDay).icon;
            popDay = forecast.pop[i];
            continue; // Loop to next iteration to find the night segment
        } else {
            // Nighttime segment
            thisLow = parseInt(forecast.temperature[i]) || 0;
            thisConditionNight = forecast.weather[i];
            iconNight = getConditionFromText(thisConditionNight, 'night').icon;
            popNight = forecast.pop[i];
        }

        const date = new Date(forecasttime.startValidTime[i]);
        
        // Use day condition if available, otherwise use night condition
        const weatherText = thisConditionDay || thisConditionNight || '';
        const conditionInfo = getConditionFromText(weatherText);
        
        dailyData.push({
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            dayName: first ? "Today" : date.toLocaleDateString('en-US', { weekday: 'long' }),
            tempHigh: thisHigh,
            tempLow: thisLow,
            iconDay: iconDay,
            iconNight: iconNight,
            condition: conditionInfo.condition,
            popDay: (popDay !== null && popDay !== undefined) ? popDay : '0',
            popNight: (popNight !== null && popNight !== undefined) ? popNight : '0',
            spcOutlook: dayIndex < 3 ? spcOutlooks[dayIndex] : null,
        });
        
        dayIndex++;
        first = false;
        thisHigh = null;
        thisLow = null;
        thisConditionDay = null;
        thisConditionNight = null;
        iconDay = null;
        iconNight = null;
        popDay = null;
        popNight = null;
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
                                <Text style={[styles.wxicons, { fontSize: 24, color: getIconColor(day.iconNight) }]}>
                                    {wxicons(day.iconNight, 'night')}
                                </Text>
                                <View style={{ marginLeft: 15 , alignItems: 'flex-end' }}>
                                    <Text style={[localStyles.tempText, { color: theme.primaryText }]}>{day.tempHigh ? convertTemperature(day.tempHigh) : '--'}°</Text>
                                    <Text style={[localStyles.tempLowText, { color: theme.secondaryText }]}>{convertTemperature(day.tempLow)}°</Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center', marginBottom: 0 }}>
                            <Text style={[localStyles.conditionText, { color: theme.secondaryText }]}>{day.condition}</Text>
                            <View style={localStyles.detailItem}>
                                <MaterialIcons name="water-drop" size={18} color={theme.weatherIconPrimary} />
                                <Text style={[localStyles.detailText, { color: theme.secondaryText }]}>{day.popDay}% / {day.popNight}%</Text>
                            </View>
                        </View>

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
