// SparkRadarWX
// A FLOSS React Native weather app

// Apache License 2.0

// GIT SYNC CHECKLIST;
// * Double check .gitignore
// * Increment app.json version


// Imports
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { style, wxicons } from './style';
import metarparser from './js/metarparser.js';

// Components for main screen
import Sidebar from './components/sidebar.js';

// Styles
const styles = style();

// Main app component
export default function App() {
  // Load fonts
  const [fontsLoaded] = useFonts({
    Onest: require('./assets/fonts/onest.ttf'),
    WxIcons: require('./assets/fonts/weathericons.ttf'),
  });

  // Load components and variables
  const [open, setOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch and parse
  useEffect(() => {
    fetch('', { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36" })
      .then((response) => response.json())
      .then((json) => {
        setData(metarparser(json.features, "New York, NY"));
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Wait for fonts to load
  if (!fontsLoaded) return null;

  return (
    <>
      <LinearGradient colors={['#27BEFF', '#2A7FFF']} style={[styles.gradientBackground, { zIndex: 1 }]} >

        <StatusBar style="auto" />
        <View style={[styles.headerContainer, open && { pointerEvents: 'none' }]}>
          <View style={styles.side}>
            <TouchableOpacity onPress={() => setOpen(true)}>
              <MaterialIcons name="menu" size={35} color="black" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.titleContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.header}>New York, NY</Text>
              <Text style={styles.text}>New York International Airport</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.side}>
            <TouchableOpacity>
              <MaterialIcons name="star" size={35} color="black" />
            </TouchableOpacity>
          </View>
        </View>


        <View style={[styles.cardContainer, open && {  pointerEvents: 'none' }]}>
          <Text style={[styles.wxicons, { color: '#ffaa00' }]}>{ wxicons("day-clear") }</Text>
          <View style={{ marginLeft: '20%' }}>
            <Text style={styles.header}>Sunny</Text>
            <Text style={[styles.header, { fontSize: 28 }]}>75°</Text>
          </View>
        </View>

      </LinearGradient>

      { open && <Sidebar onClose={() => setOpen(false)} /> }
    </>
  );
}