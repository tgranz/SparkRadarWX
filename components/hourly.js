import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { style, wxicons, getIconColor } from '../style';
import { useTheme } from '../theme';

export default function HourlyScreen({ onMenuOpen, data }) {
    const { theme, isDark } = useTheme();
    const styles = style(theme);
    // Sample hourly data - in production, this would come from an API
    const hourlyData = [
        { time: '12 PM', temp: 75, icon: 'day-clear', condition: 'Sunny', precipitation: 0 },
        { time: '1 PM', temp: 76, icon: 'day-clear', condition: 'Sunny', precipitation: 0 },
        { time: '2 PM', temp: 77, icon: 'day-partlycloudy', condition: 'Partly Cloudy', precipitation: 10 },
        { time: '3 PM', temp: 76, icon: 'day-partlycloudy', condition: 'Partly Cloudy', precipitation: 15 },
        { time: '4 PM', temp: 75, icon: 'day-cloudy', condition: 'Cloudy', precipitation: 20 },
        { time: '5 PM', temp: 73, icon: 'day-cloudy', condition: 'Cloudy', precipitation: 30 },
        { time: '6 PM', temp: 71, icon: 'day-rain', condition: 'Rain', precipitation: 60 },
        { time: '7 PM', temp: 69, icon: 'night-thunderstorm', condition: 'Storms', precipitation: 70 },
        { time: '8 PM', temp: 68, icon: 'night-cloudy', condition: 'Cloudy', precipitation: 40 },
        { time: '9 PM', temp: 67, icon: 'night-partlycloudy', condition: 'Partly Cloudy', precipitation: 20 },
        { time: '10 PM', temp: 66, icon: 'night-clear', condition: 'Clear', precipitation: 5 },
        { time: '11 PM', temp: 65, icon: 'night-clear', condition: 'Clear', precipitation: 0 },
    ];

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
