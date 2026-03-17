import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { style } from '../style';
import { useTheme } from '../theme';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RadarScreen({ onBack, coordinates }) {
    const { theme, isDark } = useTheme();
    const styles = style(theme);
    const insets = useSafeAreaInsets();
    const [radarMode, setRadarMode] = useState('lite');

    useEffect(() => {
        const loadRadarMode = async () => {
            try {
                const savedRadarMode = await AsyncStorage.getItem('radarMode');
                if (savedRadarMode === 'regular' || savedRadarMode === 'lite') {
                    setRadarMode(savedRadarMode);
                }
            } catch (error) {
                console.error('Error loading radar mode:', error);
            }
        };

        loadRadarMode();
    }, []);
    
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            onBack();
            return true;
        });

        return () => backHandler.remove();
    }, [onBack]);

    const radarBaseUrl = radarMode === 'regular' ? 'https://sparkradar.app' : 'https://lite.sparkradar.app';

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }}>
            <View style={[styles.headerContainer, { position: 'absolute', top: -10, left: 0, right: 0, zIndex: 1000, backgroundColor: 'rgba(45, 45, 45, 0.9)' }]}>
            </View>
            
            <WebView
                source={{ uri: `${radarBaseUrl}?mode=app&lat=${coordinates.lat}&lon=${coordinates.lon}` }}
                style={{ flex: 1, marginTop: Constants.statusBarHeight, marginBottom: insets.bottom }}
                startInLoadingState={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />
        </View>
    );
}
