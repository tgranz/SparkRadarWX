import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, BackHandler, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { style } from '../style';
import { useTheme } from '../theme';

export default function SettingsScreen({ onBack }) {
  const { theme } = useTheme();
  const styles = style(theme);
  const [tempUnit, setTempUnit] = useState('fahrenheit');
  const [pressureUnit, setPressureUnit] = useState('inches');
  const [distanceUnit, setDistanceUnit] = useState('miles');
  const [speedUnit, setSpeedUnit] = useState('mph');
  const [activeDropdown, setActiveDropdown] = useState(null); // tracks which setting's modal is open

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTempUnit = await AsyncStorage.getItem('tempUnit');
      const savedPressureUnit = await AsyncStorage.getItem('pressureUnit');
      const savedDistanceUnit = await AsyncStorage.getItem('distanceUnit');
      const savedSpeedUnit = await AsyncStorage.getItem('speedUnit');

      if (savedPressureUnit !== null) {
        setPressureUnit(savedPressureUnit);
      }
      if (savedDistanceUnit !== null) {
        setDistanceUnit(savedDistanceUnit);
      }
      if (savedSpeedUnit !== null) {
        setSpeedUnit(savedSpeedUnit);
      }
      if (savedTempUnit !== null) {
        setTempUnit(savedTempUnit);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveTempUnit = async (unit) => {
    try {
      await AsyncStorage.setItem('tempUnit', unit);
      setTempUnit(unit);
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const savePressureUnit = async (unit) => {
    try {
      await AsyncStorage.setItem('pressureUnit', unit);
      setPressureUnit(unit);
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const saveDistanceUnit = async (unit) => {
    try {
      await AsyncStorage.setItem('distanceUnit', unit);
      setDistanceUnit(unit);
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const saveSpeedUnit = async (unit) => {
    try {
      await AsyncStorage.setItem('speedUnit', unit);
      setSpeedUnit(unit);
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const dropdownOptions = {
    temperature: [
      { label: 'Fahrenheit (°F)', value: 'fahrenheit' },
      { label: 'Celsius (°C)', value: 'celsius' },
    ],
    pressure: [
      { label: 'Inches of mercury (inHg)', value: 'inches' },
      { label: 'Millibars (mb)', value: 'millibars' },
      { label: 'Millimeters of mercury (mmHg)', value: 'mmHg' },
    ],
    distance: [
      { label: 'Miles (mi)', value: 'miles' },
      { label: 'Kilometers (km)', value: 'kilometers' },
    ],
    speed: [
      { label: 'Miles per hour (mph)', value: 'mph' },
      { label: 'Kilometers per hour (km/h)', value: 'kph' },
    ],
  };

  const currentValues = {
    temperature: tempUnit,
    pressure: pressureUnit,
    distance: distanceUnit,
    speed: speedUnit,
  };

  const saveHandlers = {
    temperature: saveTempUnit,
    pressure: savePressureUnit,
    distance: saveDistanceUnit,
    speed: saveSpeedUnit,
  };

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
          <Text style={styles.text}>Reload app to apply changes</Text>
        </View>

        <View style={styles.side} />
      </View>

      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={[styles.text, { margin: 15, fontSize: 18, fontWeight: 'bold' }]}>Units</Text>
        <View style={[styles.card, styles.settingItem, { backgroundColor: theme.cardBackground }]}>
          <Text style={styles.text}>Temperature</Text>
          <TouchableOpacity 
            onPress={() => setActiveDropdown('temperature')}
            style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: 10,
              backgroundColor: '#00000000',
              borderRadius: 50,
            }}
          >
            <Text style={styles.text}>
              {tempUnit === 'fahrenheit' ? 'Fahrenheit (°F)' : 'Celsius (°C)'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={theme.iconColor} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, {
          marginBottom: 5,
          marginHorizontal: 10,
          borderTopLeftRadius: 5,
          borderTopRightRadius: 5,
          borderBottomLeftRadius: 5,
          borderBottomRightRadius: 5,
          backgroundColor: theme.cardBackground,
          justifyContent: 'space-between',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 15,
          paddingVertical: 10
        }]}>
          <Text style={styles.text}>Pressure</Text>
          <TouchableOpacity
            onPress={() => setActiveDropdown('pressure')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 10,
              backgroundColor: '#00000000',
              borderRadius: 50,
            }}
          >
            <Text style={styles.text}>
              {pressureUnit === 'inches' ? 'Inches of mercury (inHg)' : pressureUnit === 'millibars' ? 'Millibars (mb)' : 'Millimeters of mercury (mmHg)'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={theme.iconColor} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, {
          marginBottom: 5,
          marginHorizontal: 10,
          borderTopLeftRadius: 5,
          borderTopRightRadius: 5,
          borderBottomLeftRadius: 5,
          borderBottomRightRadius: 5,
          backgroundColor: theme.cardBackground,
          justifyContent: 'space-between',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 15,
          paddingVertical: 10
        }]}>
          <Text style={styles.text}>Distance</Text>
          <TouchableOpacity
            onPress={() => setActiveDropdown('distance')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 10,
              backgroundColor: '#00000000',
              borderRadius: 50,
            }}
          >
            <Text style={styles.text}>
              {distanceUnit === 'miles' ? 'Miles (mi)' : 'Kilometers (km)'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={theme.iconColor} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, {
          marginBottom: 5,
          marginHorizontal: 10,
          borderTopLeftRadius: 5,
          borderTopRightRadius:5,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          backgroundColor: theme.cardBackground,
          justifyContent: 'space-between',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 15,
          paddingVertical: 10
        }]}>
          <Text style={styles.text}>Speed</Text>
          <TouchableOpacity
            onPress={() => setActiveDropdown('speed')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 10,
              backgroundColor: '#00000000',
              borderRadius: 50,
            }}
          >
            <Text style={styles.text}>
              {speedUnit === 'mph' ? 'Miles per hour (mph)' : 'Kilometers per hour (km/h)'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={theme.iconColor} />
          </TouchableOpacity>
        </View>

        <Modal visible={!!activeDropdown} transparent animationType="fade">
          <TouchableOpacity 
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', 
              justifyContent: 'center', 
              padding: 20
            }}
            activeOpacity={1}
            onPress={() => setActiveDropdown(null)}
          >
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderRadius: 20, padding: 0, overflow: 'hidden' }]}>
              {activeDropdown && dropdownOptions[activeDropdown].map((opt) => (
                <TouchableOpacity 
                  key={opt.value}
                  style={{ 
                    padding: 15,
                    backgroundColor: currentValues[activeDropdown] === opt.value ? theme.textColor + '10' : 'transparent'
                  }}
                  onPress={() => saveHandlers[activeDropdown](opt.value)}
                >
                  <Text style={styles.text}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </LinearGradient>
  );
}
