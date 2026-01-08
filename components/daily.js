import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { style, wxicons, getIconColor, getContrastYIQ } from '../style';
import { useTheme } from '../theme';

export default function DailyScreen({ onMenuOpen, onBack, data, coordinates }) {
    const { theme, isDark } = useTheme();
    const styles = style(theme);
    const [spcOutlooks, setSpcOutlooks] = useState({});

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            onBack();
            return true;
        });

        return () => backHandler.remove();
    }, [onBack]);

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
    
    // Weather code to condition mapping (WMO codes)
    const getConditionFromCode = (code) => {
        if (code === 0) return { icon: 'day-clear', condition: 'Clear' };
        if (code === 1) return { icon: 'day-clear', condition: 'Mostly Clear' };
        if (code === 2) return { icon: 'day-partlycloudy', condition: 'Partly Cloudy' };
        if (code === 3) return { icon: 'day-cloudy', condition: 'Cloudy' };
        if (code === 45 || code === 48) return { icon: 'day-fog', condition: 'Fog' };
        if (code === 51 || code === 53 || code === 55) return { icon: 'day-rain', condition: 'Drizzle' };
        if (code === 61 || code === 63 || code === 65) return { icon: 'day-rain', condition: 'Rain' };
        if (code === 71 || code === 73 || code === 75) return { icon: 'day-snow', condition: 'Snow' };
        if (code === 77) return { icon: 'day-snow', condition: 'Snow' };
        if (code === 80 || code === 81 || code === 82) return { icon: 'day-rain', condition: 'Rain Showers' };
        if (code === 85 || code === 86) return { icon: 'day-snow', condition: 'Snow Showers' };
        if (code === 95) return { icon: 'day-thunderstorm', condition: 'Thunderstorm' };
        if (code === 96 || code === 99) return { icon: 'day-thunderstorm', condition: 'Heavy Thunderstorms' };
        return { icon: 'day-clear', condition: 'Unknown' };
    };

    // Build daily data from Open-Meteo forecast
    const dailyData = [];
    if (data.forecast && data.forecast.daily) {
        const forecast = data.forecast.daily;
        const daysToShow = Math.min(7, forecast.time.length);
        
        for (let i = 0; i < daysToShow; i++) {
            const date = new Date(forecast.time[i]);
            const weatherInfo = getConditionFromCode(forecast.weather_code[i]);
            
            dailyData.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
                tempHigh: Math.round(forecast.temperature_2m_max[i]),
                tempLow: Math.round(forecast.temperature_2m_min[i]),
                icon: weatherInfo.icon,
                condition: weatherInfo.condition,
                precipitation: forecast.precipitation_probability_max[i] || 0,
                uvIndex: forecast.uv_index_max[i] || 0,
                sunrise: new Date(forecast.sunrise[i]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                sunset: new Date(forecast.sunset[i]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                spcOutlook: i < 3 ? spcOutlooks[i] : null,
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
                                <Text style={[styles.wxicons, { fontSize: 48, color: getIconColor(day.icon) }]}>
                                    {wxicons(day.icon)}
                                </Text>
                                <View style={{ marginLeft: 15 }}>
                                    <Text style={[localStyles.tempText, { color: theme.primaryText }]}>{day.tempHigh}°</Text>
                                    <Text style={[localStyles.tempLowText, { color: theme.secondaryText }]}>{day.tempLow}°</Text>
                                </View>
                            </View>
                        </View>

                        <Text style={[localStyles.conditionText, { color: theme.secondaryText }]}>{day.condition}</Text>

                        <View style={localStyles.detailsSection}>
                            <View style={localStyles.detailItem}>
                                <MaterialIcons name="water-drop" size={18} color={theme.weatherIconPrimary} />
                                <Text style={[localStyles.detailText, { color: theme.secondaryText }]}>{day.precipitation}%</Text>
                            </View>
                            <View style={localStyles.detailItem}>
                                <MaterialIcons name="wb-sunny" size={18} color={theme.weatherIconPrimary} />
                                <Text style={[localStyles.detailText, { color: theme.secondaryText }]}>UV {day.uvIndex}</Text>
                            </View>
                            <View style={localStyles.detailItem}>
                                <MaterialIcons name="wb-twilight" size={18} color={theme.weatherIconPrimary} />
                                <Text style={[localStyles.detailText, { color: theme.secondaryText }]}>{day.sunrise}</Text>
                            </View>
                            <View style={localStyles.detailItem}>
                                <MaterialIcons name="nights-stay" size={18} color={theme.weatherIconPrimary} />
                                <Text style={[localStyles.detailText, { color: theme.secondaryText }]}>{day.sunset}</Text>
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
        marginBottom: 12,
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
