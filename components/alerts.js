import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { style, alertcolor, getContrastYIQ } from '../style';
import { useTheme } from '../theme';

const convertIsoToLocal = (isoString) => {
    const date = new Date(isoString);
    var hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    if (hours > 12) {
        hours -= 12;
    } else if (hours === 0) {
        hours = 12;
    }

    const timezone = date.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
    return `${hours}:${minutes} ${ampm} ${timezone}, ${month}/${day}`;
}

export default function AlertsScreen({ onBack, alerts }) {
    const { theme, isDark } = useTheme();
    const styles = style(theme);
    const features = alerts && alerts.features ? alerts.features : [];

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            onBack();
            return true;
        });

        return () => backHandler.remove();
    }, [onBack]);

    return (

        <View style={{ flex: 1 }}>
            <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={[styles.gradientBackground, { zIndex: -1 }]} >
                <View style={[styles.headerContainer]}>
                    <View style={styles.side}>
                        <TouchableOpacity onPress={onBack}>
                            <MaterialIcons name="arrow-back" size={35} color={theme.iconColor} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.header}>Weather Alerts</Text>
                        <Text style={styles.text}>{features.length} active</Text>
                    </View>
                    <View style={styles.side} />
                </View>

                <ScrollView style={{ flex: 1 }}>
                    {features.length === 0 && (
                        <View style={[styles.cardContainer]}>
                            <Text style={styles.text}>No active alerts for this area.</Text>
                        </View>
                    )}

                    {features.map((f, idx) => {
                        var p = f.properties || {};
                        var event = p.event || 'Alert';
                        var headline = p.headline || '';
                        var desc = p.description || p.instruction || '';
                        var area = p.areaDesc || '';
                        var effective = p.effective || '';
                        var expires = p.expires || '';
                        var instruction = p.instruction || '';

                        desc = desc.replace(/\n\n/g, '\n'); // Double newlines to single
                        desc = desc.replace(/\n/g, ' '); // Remove newlines for better display
                        instruction = instruction.replace(/\n\n/g, '\n'); // Double newlines to single
                        instruction = instruction.replace(/\n/g, ' '); // Remove newlines for better display

                        var effectiveLocal = effective ? convertIsoToLocal(effective) : '';
                        var expiresLocal = expires ? convertIsoToLocal(expires) : '';

                        effective = effectiveLocal;
                        expires = expiresLocal;

                        var thiscolor = alertcolor(event);
                        var thisTextColor = getContrastYIQ(thiscolor);

                        return (
                            <View key={idx} style={[styles.cardContainer, { paddingHorizontal: 10, alignItems: 'flex-start', flexDirection: 'column' }]}>
                                <Text style={[styles.header, {
                                    backgroundColor: thiscolor, color: thisTextColor, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 5,
                                    width: '100%', textAlign: 'center', marginBottom: 10, fontSize: 16
                                }]}>{event}</Text>
                                {headline ? (<Text style={[styles.text, { fontWeight: 'bold', marginBottom: 10 }]}>{headline}</Text>) : null}
                                {effective ? (<Text style={[styles.text, { fontWeight: 'bold' }]}>Issued: {effective}</Text>) : null}
                                {expires ? (<Text style={[styles.text, { marginBottom: 10, fontWeight: 'bold' }]}>Expires: {expires}</Text>) : null}
                                {area ? (<Text style={[styles.text, { marginBottom: 10 }]}>{area}</Text>) : null}
                                {desc ? (<Text style={[styles.text]}>{desc}</Text>) : null}
                                {instruction ? (<Text style={[styles.text, { marginTop: 10, fontWeight: 'bold' }]}>{instruction}</Text>) : null}
                            </View>
                        );
                    })}
                </ScrollView>
            </LinearGradient>
        </View>
    );
}
