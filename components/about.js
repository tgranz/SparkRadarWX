import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { style } from '../style';
import { useTheme } from '../theme';
const version = require('../package.json').version;
const dependencies = Object.keys(require('../package.json').dependencies);
const reactversion = require('../package.json').dependencies.react;

export default function AboutScreen({ onBack }) {
  const { theme } = useTheme();
  const styles = style(theme);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => subscription.remove();
  }, [onBack]);

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
                <Text style={styles.header}>About</Text>
            </View>

            <View style={styles.side} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={[styles.cardContainer, { alignItems: 'flex-start', flexDirection: 'column' }]}>
                <Text style={[styles.header, { fontSize: 18 }]}>About</Text>
                <Text style={styles.text}>SparkRadarWX is an free and open-source weather app built around Spark Radar.
                    It has no ads and features integration with Spark Radar, hyper-local live weather data, alerts, and weather radios.
                </Text>
            </View>

            <View style={[styles.cardContainer, { alignItems: 'flex-start', flexDirection: 'column' }]}>
                <Text style={[styles.header, { fontSize: 18 }]}>Get involved</Text>
                <Text style={styles.text}>You can help make SparkRadarWX better by contributing to the code on Github, or supporting the app through BuyMeACoffee.
                    All proceeds go directly back into my projects.
                </Text>
            </View>
            
            <View style={[styles.cardContainer, { alignItems: 'flex-start', flexDirection: 'column' }]}>
                <Text style={[styles.header, { fontSize: 18 }]}>Frameworks</Text>
                <Text style={styles.text}>{dependencies.join('\n')}</Text>
            </View>

            <View style={[styles.cardContainer, { alignItems: 'flex-start', flexDirection: 'column' }]}>
                <Text style={[styles.header, { fontSize: 18 }]}>Versions</Text>
                <Text style={styles.text}>App: {version}</Text>
                <Text style={styles.text}>React Native: {reactversion}</Text>
            </View>
        </ScrollView>
    </LinearGradient>
);
}
