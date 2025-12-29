import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { style } from '../style';
import { useTheme } from '../theme';
import radio_streams from '../data/radio_streams.js';

export default function RadiosScreen({ onBack, coordinates }) {
  const { theme } = useTheme();
  const styles = style(theme);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => subscription.remove();
  }, [onBack]);

  function loadRadioStreams() {
    const radiosWithDistance = Object.entries(radio_streams).map(([key, value]) => {
        const lat = parseFloat(value.lat);
        const lon = parseFloat(value.long);
        const distance = Math.sqrt(
          Math.pow(coordinates.lat - lat, 2) + 
          Math.pow(coordinates.lon - lon, 2)
        );
        return { key, ...value, distance };
    });

    return radiosWithDistance.sort((a, b) => a.distance - b.distance);
  }

  const sortedRadios = loadRadioStreams();

  return (
    <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={[styles.gradientBackground, { zIndex: 1 }]}> 
      <StatusBar style="auto" />
      <View style={[styles.headerContainer]}>
        <View style={styles.side}>
          <TouchableOpacity onPress={onBack}>
            <MaterialIcons name="arrow-back" size={35} color={theme.iconColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.header}>Weather Radios</Text>
        </View>

        <View style={styles.side} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        {sortedRadios.map((radio, index) => (
          <TouchableOpacity key={radio.key}>
            <View style={[styles.cardContainer, { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.header, { fontSize: 18 }]}>{radio.call}</Text>
                <Text style={styles.text}>{radio.loc}</Text>
                <Text style={[styles.text, { fontSize: 12, opacity: 0.7 }]}>{radio.freq}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                <MaterialIcons name="radio" size={24} color={theme.iconColor} />
                <Text style={[styles.text, { fontSize: 12, marginTop: 4 }]}>
                  {(radio.distance * 69).toFixed(0)} mi
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}
