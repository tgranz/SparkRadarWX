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
import LocationPicker from './components/locationpicker.js';

// Styles
const styles = style();

function getDataFromCondition(condition) {
  var id = 'sunny';
  var time = "day";
  var color = "#ffaa00";
  var newCondition = condition.toLowerCase();

  if (condition.toLowerCase().includes("overcast")) {
    id = "cloudy";
    color = "#888888";
    newCondition = "Overcast";
  } else if (condition.toLowerCase().includes("cloud")) {
    id = "cloudy";
    color = "#888888";
    newCondition = "Cloudy";
  } else if (condition.toLowerCase().includes("clear") || condition.toLowerCase().includes("sunny")) {
    id = "clear";
    color = "#ffaa00";
    newCondition = "Clear";
  }

  return {
    icon: wxicons(time + '-' + id),
    color: color,
    condition: newCondition
  };
}

// Main app component
export default function App() {
  // Load fonts
  const [fontsLoaded] = useFonts({
    Onest: require('./assets/fonts/onest.ttf'),
    WxIcons: require('./assets/fonts/weathericons.ttf'),
  });

  // Load components and variables
  const [open, setOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch and parse
  useEffect(() => {
    fetch('https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/NOAA_METAR_current_wind_speed_direction_v1/FeatureServer/0/query?where=1=1&outFields=*&f=geojson', { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36" })
      .then((response) => response.json())
      .then((json) => {
        setData(metarparser(json.features, 40.979596303057065, -85.17173642523534));
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  // Alert elements
  var alertelements = (
    <TouchableOpacity>
      <View style={[styles.cardContainer, open && { pointerEvents: 'none' }, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <MaterialIcons name="warning" size={32} color="#ff2121" style={{ marginLeft: 0 }} />
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.header, { fontSize: 16, textAlign: 'right' }]}>Severe Thunderstorm Warning</Text>
            <Text style={[styles.text, { textAlign: 'right' }]}>In effect until 6:30PM 12/30</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
  

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
        <View style={[styles.headerContainer, (open || locationOpen) && { pointerEvents: 'none' }]}>
          <View style={styles.side}>
            <TouchableOpacity onPress={() => setOpen(true)}>
              <MaterialIcons name="menu" size={35} color="black" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.titleContainer} onPress={() => setLocationOpen(true)}>
            <View style={styles.titleContainer}>
              <Text style={styles.header}>{data.STATION_NAME}</Text>
              <Text style={styles.text}>{data.ICAO}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.side}>
            <TouchableOpacity>
              <MaterialIcons name="star" size={35} color="black" />
            </TouchableOpacity>
          </View>
        </View>


        <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }, { marginTop: 20, paddingHorizontal: 60, flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={[styles.wxicons, { color: getDataFromCondition(data.WEATHER).color }]}>{ getDataFromCondition(data.WEATHER).icon}</Text>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.header}>{getDataFromCondition(data.WEATHER).condition}</Text>
            <Text style={[styles.header, { fontSize: 28 }]}>{Math.round(data.TEMP)}°</Text>
          </View>
        </View>

        {alertelements}

        <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }]}>
          <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
            <View style={{ gap: 15 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="opacity" size={24} color="#2a7fff" />
                <View>
                  <Text style={styles.text}>Dew Point</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{Math.round(data.DEW_POINT)}°</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="compress" size={24} color="#2a7fff" />
                <View>
                  <Text style={styles.text}>Pressure</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{data.PRESSURE} mb</Text>
                </View>
              </View>
            </View>
            <View style={{ gap: 15 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="water-drop" size={24} color="#2a7fff" />
                <View>
                  <Text style={styles.text}>Humidity</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{Math.round(data.R_HUMIDITY)}%</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="visibility" size={24} color="#2a7fff" />
                <View>
                  <Text style={styles.text}>Visibility</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{Math.round(data.VISIBILITY)} m</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

      </LinearGradient>

      { open && <Sidebar onClose={() => setOpen(false)} /> }
      { locationOpen && <LocationPicker onClose={() => setLocationOpen(false)} /> }
    </>
  );
}