import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { style } from '../style';
import { useTheme } from '../theme';

export default function SettingsScreen({ onBack }) {
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
          <Text style={styles.header}>Settings</Text>
        </View>

        <View style={styles.side} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text>Placeholder</Text>
      </ScrollView>
    </LinearGradient>
  );
}
