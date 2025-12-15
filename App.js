// SparkRadarWX
// A FLOSS React Native weather app

// Apache License 2.0

// GIT SYNC CHECKLIST;
// * Double check .gitignore
// * Increment app.json version


// Imports
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity, Image, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { style, wxicons, getIconColor } from './style';
import metarparser from './js/metarparser.js';


// Components for main screen
import Sidebar from './components/sidebar.js';
import LocationPicker from './components/locationpicker.js';
import HourlyScreen from './components/hourly.js';
import AlertsScreen from './components/alerts.js';

// Styles
const styles = style();

function getDataFromCondition(condition) {
  var id = 'sunny';
  var time = "day";
  
  // Handle null/undefined condition
  if (!condition) {
    return {
      icon: wxicons(time + '-' + id),
      condition: 'Unknown'
    };
  }
  
  var newCondition = condition.toLowerCase();

  if (condition.toLowerCase().includes("overcast")) {
    id = "cloudy";
    newCondition = "Overcast";
  } else if (condition.toLowerCase().includes("cloud")) {
    id = "cloudy";
    newCondition = "Cloudy";
  } else if (condition.toLowerCase().includes("clear") || condition.toLowerCase().includes("sunny")) {
    id = "clear";
    newCondition = "Clear";
  } else if (condition.toLowerCase().includes("light") && condition.toLowerCase().includes("snow")) {
    id = "snow";
    newCondition = "Light snow";
  } else if (condition.toLowerCase().includes("heavy") && condition.toLowerCase().includes("snow")) {
    id = "snow";
    newCondition = "Heavy snow";
  } else if (condition.toLowerCase().includes("snow")) {
    id = "heavysnow";
    newCondition = "Snow";
  } else if (condition.toLowerCase().includes("haze")) {
    id = "haze";
    newCondition = "Haze";
  } else if (condition.toLowerCase().includes("fog")) {
    id = "fog";
    newCondition = "Fog";
  } else if (condition.toLowerCase().includes("thunderstorm") || condition.toLowerCase().includes("storm")) {
    id = "thunderstorm";
    newCondition = "Thunderstorm";
  } else if (condition.toLowerCase().includes("rain") || condition.toLowerCase().includes("drizzle")) {
    id = "rain";
    newCondition = "Rain";
  }

  return {
    icon: wxicons(time + '-' + id),
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
  const [currentScreen, setCurrentScreen] = useState('home');
  const [data, setData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState({ lat: 40.97959, lon: -85.17173 });
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [locationName, setLocationName] = useState("Current Location");

  // Fetch and parse
  const loadCurrentConditions = (lat, lon) => {
    setLoading(true);
    fetch('https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/NOAA_METAR_current_wind_speed_direction_v1/FeatureServer/0/query?where=1=1&outFields=*&f=geojson', { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36" })
      .then((response) => response.json())
      .then((json) => {
        const parsedData = metarparser(json.features, lat, lon, (owmData, alertsToAdd) => {
          // Callback: Update data when OpenWeatherMap fetch completes
          if (owmData) setData(owmData);
          if (alertsToAdd) setAlerts(alertsToAdd);
          setLoading(false);
        });
        setData(parsedData);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCurrentConditions(coordinates.lat, coordinates.lon);
  }, [coordinates]);

  // Animate screen transitions
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentScreen]);

  const navigateToScreen = (screen) => {
    if (screen === currentScreen) {
      setOpen(false);
      return;
    }
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentScreen(screen);
      setOpen(false);
    });
  };

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '360deg'],
  });

  // Alert elements
  var alertelements = [];
  if (alerts && alerts.features && alerts.features.length > 0) {
    for (var i = 0; i < alerts.features.length; i++) {
      var alert = alerts.features[i];
      
      // Skip if event is null or undefined
      if (!alert.properties || !alert.properties.event) {
        console.log("Skipping alert with no event data");
        continue;
      }
      
      var thiscolor = "#ff2121";
      var thisTextColor = "#ffffff";

      if (alert.properties.event.toLowerCase().includes("tornado")) {
        thiscolor = "#da1990ff";
        thisTextColor = "#ffffff";
      } else if (alert.properties.event.toLowerCase().includes("warning")) {
        thiscolor = "#ff2121";
        thisTextColor = "#ffffff";
      } else if (alert.properties.event.toLowerCase().includes("watch")) {
        thiscolor = "#ff7e00";
        thisTextColor = "#000000";
      } else {
        thiscolor = "#ffff00";
        thisTextColor = "#000000";
      }

      alertelements = alertelements.concat(
        (
          <TouchableOpacity onPress={() => navigateToScreen('alerts')}>
            <View style={[styles.cardContainer, open && { pointerEvents: 'none' }, { flexDirection: 'row', alignItems: 'center', backgroundColor: thiscolor, justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <MaterialIcons name="warning" size={32} color={thisTextColor} style={{ marginLeft: 0 }} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={[styles.header, { fontSize: 16, color: thisTextColor, textAlign: 'right' }]}>{alert.properties.event}</Text>
                  <Text style={[styles.text, { color: thisTextColor, textAlign: 'right' }]}>In effect until 6:30PM 12/30</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ),
      );
    }
  }
  

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.Image 
        source={require('./assets/spinner.png')} 
        style={{ width: 75, height: 75, transform: [{ rotate: spin }] }} 
      />
      </View>
    );
  }

  // Wait for fonts to load
  if (!fontsLoaded) return null;

  // Show hourly screen if selected
  if (currentScreen === 'hourly') {
    return (
      <View style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <HourlyScreen onMenuOpen={() => setOpen(true)} data={data} />
        </Animated.View>
        { open && <Sidebar onClose={() => setOpen(false)} onNavigate={navigateToScreen} /> }
      </View>
    );
  }

  // Show alerts screen if selected
  if (currentScreen === 'alerts') {
    return (
      <View style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <AlertsScreen onBack={() => navigateToScreen('home')} alerts={alerts} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <LinearGradient colors={['#27BEFF', '#2A7FFF']} style={[styles.gradientBackground, { zIndex: 1 }]} >

        <StatusBar style="auto" />
        <View style={[styles.headerContainer, (open || locationOpen) && { pointerEvents: 'none' }]}>
          <View style={styles.side}>
              <TouchableOpacity onPress={() => { setOpen(true) }}>
              <MaterialIcons name="menu" size={35} color="black" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.titleContainer} onPress={() => setLocationOpen(true)}>
            <View style={styles.titleContainer}>
              <Text style={styles.header}>{ data.STATION_NAME ? data.STATION_NAME : locationName }</Text>
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
          <Text style={[styles.wxicons, { color: getIconColor(data.WEATHER) }]}>{ getDataFromCondition(data.WEATHER).icon}</Text>
          <View style={{ marginLeft: 10 }}>
              <Text style={styles.header}>{getDataFromCondition(data.WEATHER).condition.charAt(0).toUpperCase() + getDataFromCondition(data.WEATHER).condition.slice(1)}</Text>
            <Text style={[styles.header, { fontSize: 28 }]}>{Math.round(data.TEMP)}°</Text>
          </View>
        </View>

        {alertelements.map((element, index) => (
          <React.Fragment key={index}>{element}</React.Fragment>
        ))}

        <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }]}>
          <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-around' }}>
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
      </Animated.View>

      { open && <Sidebar onClose={() => setOpen(false)} onNavigate={navigateToScreen} /> }
      {locationOpen && <LocationPicker
        onClose={() => setLocationOpen(false)}
        onLocationSelect={(lat, lon, name) => {
          setCoordinates({ lat, lon });
          setLocationOpen(false);
          setLocationName(name.split(",")[0]);
        }}
      />}
    </View>
  );
}