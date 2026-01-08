import React, { useEffect } from 'react';
import { View, TouchableOpacity, BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { style } from '../style';
import { useTheme } from '../theme';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RadarScreen({ onBack, coordinates }) {
    const { theme, isDark } = useTheme();
    const styles = style(theme);
    const insets = useSafeAreaInsets();
    
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            onBack();
            return true;
        });

        return () => backHandler.remove();
    }, [onBack]);

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }}>
            <View style={[styles.headerContainer, { position: 'absolute', top: -10, left: 0, right: 0, zIndex: 1000, backgroundColor: 'rgba(45, 45, 45, 0.9)' }]}>
            </View>
            
            <WebView
                source={{ uri: `https://sparkradar.app?mode=app&lat=${coordinates.lat}&lon=${coordinates.lon}` }}
                style={{ flex: 1, marginTop: Constants.statusBarHeight, marginBottom: insets.bottom }}
                startInLoadingState={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />
        </View>
    );
}
