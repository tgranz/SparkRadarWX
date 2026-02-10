import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, BackHandler, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { style } from '../style';
import { useTheme } from '../theme';
import radio_streams from '../data/radio_streams.js';
import Toast from 'react-native-toast-message';


export default function RadiosScreen({ onBack, coordinates }) {
  const { theme } = useTheme();
  const styles = style(theme);
  const [selectedRadio, setSelectedRadio] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const player = useAudioPlayer();
  const slideAnim = useRef(new Animated.Value(150)).current;

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => {
      subscription.remove();
      try {
        if (player && player.playing) {
          player.pause();
        }
      } catch (error) {
        console.log('Error pausing player on unmount:', error);
      }
    };
  }, [onBack]);

  useEffect(() => {
    if (selectedRadio) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 150,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedRadio]);

  const playRadio = async (radio) => {
    try {
      setIsLoading(true);
      
      // Replace the current source
      if (player) {
        player.replace(radio.radiourl);
        player.play();
      }
      
      setSelectedRadio(radio);
      setIsLoading(false);
    } catch (error) {
      console.log('Error playing radio:', error);
      var message = '';
      if (error.toString().toLowerCase().includes('host unreachable') || error.toString().toLowerCase().includes('404')) {
        message = radio.call + ' stream offline.';
      } else {
        message = 'An error occurred while trying to play the radio.';
      }
      Toast.show({
        type: 'error',
        text1: message,
        position: 'bottom',
        visibilityTime: 3000,
      });
      setIsLoading(false);
    }
  };

  const stopAudio = () => {
    try {
      if (player && player.playing) {
        player.pause();
      }
      setSelectedRadio(null);
    } catch (error) {
      console.log('Error stopping audio:', error);
      setSelectedRadio(null);
    }
  };

  const handleRadioPress = (radio) => {
    if (selectedRadio?.key === radio.key && player.playing) {
      stopAudio();
    } else {
      playRadio(radio);
    }
  };

  function loadRadioStreams() {
    const radiosWithDistance = Object.entries(radio_streams).map(([key, value]) => {
        const lat = parseFloat(value.lat);
        const lon = parseFloat(value.long);

        try { if (value.radiourl === '') return null; } catch {}
        
        value.radiourl = value.radiourl.replace('\\', '');

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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: selectedRadio ? 100 : 20 }}>
        {sortedRadios.map((radio, index) => (
          <TouchableOpacity key={radio.key} onPress={() => handleRadioPress(radio)}>
            <View style={[
              styles.cardContainer, 
              { 
                alignItems: 'flex-start', 
                flexDirection: 'row', 
                justifyContent: 'space-between',
                backgroundColor: theme.cardBackground,
                borderBottomWidth: index === sortedRadios.length - 1 ? 0 : 1,
                borderBottomColor: theme.borderColor,
                paddingHorizontal: 20,
                paddingVertical: 15,
                marginHorizontal: 10,
                marginBottom: 0,
                marginTop: 0,
                borderRadius: 0,
                borderTopLeftRadius: index === 0 ? 20 : 0,
                borderTopRightRadius: index === 0 ? 20 : 0,
                borderBottomLeftRadius: index === sortedRadios.length - 1 ? 20 : 0,
                borderBottomRightRadius: index === sortedRadios.length - 1 ? 20 : 0,
              }
            ]}>
              <View style={{ alignItems: 'flex-start', justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                  <MaterialIcons 
                    name={selectedRadio?.key === radio.key && player.playing ? "equalizer" : "radio"} 
                    size={24} 
                    color={theme.iconColor} 
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.header, { fontSize: 18 }]}>{radio.call}</Text>
                </View>
                <Text style={[styles.text, { fontSize: 12, opacity: 0.7 }]}>{radio.freq}</Text>
              </View>
              <View style={{ flex: 1 , alignItems: 'flex-end', justifyContent: 'center', flexDirection: 'column' }}>
                <Text style={styles.text}>{radio.loc}</Text>
                <Text style={[styles.text, { fontSize: 12, opacity: 0.7 }]}>
                  {(radio.distance * 69).toFixed(0)} mi away
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {(selectedRadio || true) && (
        <Animated.View style={{
          position: 'absolute',
          bottom: -5,
          left: 0,
          right: 0,
          borderRadius: 0,
          borderTopWidth: 1,
          backgroundColor: theme.cardBackground,
          borderTopColor: theme.iconColor,
          paddingHorizontal: 20,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 30,
          transform: [{ translateY: slideAnim }],
          pointerEvents: selectedRadio ? 'auto' : 'none',
        }}>
          <MaterialIcons 
            name="cell-tower"
            size={30} 
            color={theme.iconColor} 
            style={{ marginRight: 15 }}
          />

          <View style={{ flex: 1, marginRight: 15 }}>
            <Text style={[styles.header, { fontSize: 16 }]}>{selectedRadio?.call}</Text>
            <Text style={[styles.text, { fontSize: 12 }]}>{selectedRadio?.loc}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.iconColor} style={{ marginHorizontal: 10 }} />
            ) : (
              <>
                <TouchableOpacity onPress={() => { stopAudio(); }}>
                  <MaterialIcons name="stop-circle" size={50} color={theme.iconColor} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      )}
      <Toast />

    </LinearGradient>
  );
}
