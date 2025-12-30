import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, BackHandler, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { style } from '../style';
import { useTheme } from '../theme';
import radio_streams from '../data/radio_streams.js';
import Toast from 'react-native-toast-message';


export default function RadiosScreen({ onBack, coordinates }) {
  const { theme } = useTheme();
  const styles = style(theme);
  const [selectedRadio, setSelectedRadio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => {
      subscription.remove();
      stopAudio();
    };
  }, [onBack]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (error) {
        console.log('Error stopping audio:', error);
      }
    }
    setIsPlaying(false);
    setIsLoading(false);
  };

  const playRadio = async (radio) => {
    try {
      setIsLoading(true);
      
      // Stop current audio if playing
      if (soundRef.current) {
        await stopAudio();
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      // Create and load new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: radio.radiourl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setSelectedRadio(radio);
      setIsPlaying(true);
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
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    if (!soundRef.current || !selectedRadio) return;

    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.log('Error toggling play/pause:', error);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      setIsPlaying(false);
    }
    if (status.error) {
      console.log('Playback error:', status.error);
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const handleRadioPress = (radio) => {
    if (selectedRadio?.key === radio.key && isPlaying) {
      stopAudio();
      setSelectedRadio(null);
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
                backgroundColor: selectedRadio?.key === radio.key ? theme.cardBackgroundAlt || theme.cardBackground : theme.cardBackground,
                borderWidth: selectedRadio?.key === radio.key ? 2 : 0,
                borderColor: selectedRadio?.key === radio.key ? theme.iconColor : 'transparent',
              }
            ]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.header, { fontSize: 18 }]}>{radio.call}</Text>
                <Text style={styles.text}>{radio.loc}</Text>
                <Text style={[styles.text, { fontSize: 12, opacity: 0.7 }]}>{radio.freq}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                <MaterialIcons 
                  name={selectedRadio?.key === radio.key && isPlaying ? "volume-up" : "radio"} 
                  size={24} 
                  color={theme.iconColor} 
                />
                <Text style={[styles.text, { fontSize: 12, marginTop: 4 }]}>
                  {(radio.distance * 69).toFixed(0)} mi
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedRadio && (
        <View style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          right: 10,
          borderRadius: 50,
          backgroundColor: theme.cardBackground,
          borderTopColor: theme.iconColor,
          paddingHorizontal: 20,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View style={{ flex: 1, marginRight: 15 }}>
            <Text style={[styles.header, { fontSize: 16 }]}>{selectedRadio.call}</Text>
            <Text style={[styles.text, { fontSize: 12 }]}>{selectedRadio.loc}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.iconColor} style={{ marginHorizontal: 10 }} />
            ) : (
              <>
                <TouchableOpacity onPress={togglePlayPause} style={{ marginHorizontal: 10 }}>
                  <MaterialIcons 
                    name={isPlaying ? "pause-circle-filled" : "play-circle-filled"} 
                    size={50} 
                    color={theme.iconColor} 
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { stopAudio(); setSelectedRadio(null); }}>
                  <MaterialIcons name="close" size={30} color={theme.iconColor} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
      <Toast />

    </LinearGradient>
  );
}
