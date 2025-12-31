// SparkRadarWX
// A FLOSS React Native weather app

// Apache License 2.0

// GIT SYNC CHECKLIST;
// * Double check .gitignore
// * Increment package.json version


// Imports
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity, Image, Animated, ScrollView, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { style, wxicons, getIconColor } from './style';
import { useTheme } from './theme';
import metarparser from './js/metarparser.js';
import Toast from 'react-native-toast-message';


// Components for main screen
import Sidebar from './components/sidebar.js';
import LocationPicker from './components/locationpicker.js';
import HourlyScreen from './components/hourly.js';
import AlertsScreen from './components/alerts.js';
import RadarScreen from './components/radar.js';
import SettingsScreen from './components/settings.js';
import AboutScreen from './components/about.js';
import RadiosScreen from './components/radios.js';

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
  } else if (condition.toLowerCase().includes("mist")) {
    id = "mist";
    newCondition = "Mist";
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
  // Get current theme
  const { theme, isDark } = useTheme();
  
  // Create styles with theme colors
  const styles = style(theme);
  
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const FALLBACK_COORDS = { lat: 40.97959, lon: -85.17173 };
  const [coordinates, setCoordinates] = useState({ lat: null, lon: null });
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [locationName, setLocationName] = useState("Current Location");
  const hasLoadedData = useRef(false);

  // Fetch and parse
  const loadCurrentConditions = (lat, lon) => {
    setLoading(true);
    fetch('https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/NOAA_METAR_current_wind_speed_direction_v1/FeatureServer/0/query?where=1=1&outFields=*&f=geojson', { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36" })
      .then((response) => response.json())
      .then((json) => {
        const parsedData = metarparser(json.features, lat, lon, (updatedData, alertsToAdd) => {
          // Callback: Update data when async fetches complete (OpenWeatherMap or forecast data)
          // updatedData now includes: current conditions + forecast data from Open-Meteo (updatedData.forecast)
          // alertsToAdd contains weather alerts from NWS
          if (updatedData) setData(updatedData);
          if (alertsToAdd) setAlerts(alertsToAdd);
          setLoading(false);
          setRefreshing(false);
        });
        setData(parsedData);
        setLoading(false);
        setRefreshing(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
        setRefreshing(false);
      });
  };

  // Pull to refresh handler
  const onRefresh = () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    const cooldownTime = 30000; // 30 seconds

    if (timeSinceLastRefresh < cooldownTime) {
      console.log(`Please wait ${Math.ceil((cooldownTime - timeSinceLastRefresh) / 1000)} seconds before refreshing again`);
      Toast.show({
        type: 'info',
        text1: 'Please wait before refreshing again.',
        position: 'bottom',
        visibilityTime: 3000,
      });
      return;
    }

    setRefreshing(true);
    setLastRefreshTime(now);
    loadCurrentConditions(coordinates.lat, coordinates.lon);
  };

  useEffect(() => {
    // Fetch current location on app open
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission denied; using fallback coordinates');
          setCoordinates(FALLBACK_COORDS);
          return;
        }

        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoordinates({ lat: location.coords.latitude, lon: location.coords.longitude });
      } catch (err) {
        console.error('Error fetching location; using fallback coordinates', err);
        setCoordinates(FALLBACK_COORDS);
      }
    })();
  }, []);
    

  useEffect(() => {
    if (coordinates.lat !== null && coordinates.lon !== null && !hasLoadedData.current) {
      loadCurrentConditions(coordinates.lat, coordinates.lon);
      hasLoadedData.current = true;
    }
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

      var formattedDate = "";
      if (alert.properties.expires) {
        var effectiveDate = new Date(alert.properties.expires);
        const month = (effectiveDate.getMonth() + 1).toString().padStart(2, '0');
        const day = effectiveDate.getDate().toString().padStart(2, '0');
        let hours = effectiveDate.getHours();
        const minutes = effectiveDate.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        formattedDate += `In effect until ${month}/${day} ${hours}:${minutes} ${ampm}`;
      }

      alertelements = alertelements.concat(
        (
          <TouchableOpacity onPress={() => navigateToScreen('alerts')}>
            <View style={[styles.cardContainer, open && { pointerEvents: 'none' }, { flexDirection: 'row', alignItems: 'center', backgroundColor: thiscolor, justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <MaterialIcons name="warning" size={32} color={thisTextColor} style={{ marginLeft: 0 }} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={[styles.header, { fontSize: 16, color: thisTextColor, textAlign: 'right' }]}>{alert.properties.event}</Text>
                  <Text style={[styles.text, { color: thisTextColor, textAlign: 'right' }]}>{formattedDate}</Text>
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.gradientStart }}>
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
      <View style={{ flex: 1, backgroundColor: theme.gradientStart }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <HourlyScreen onMenuOpen={() => setOpen(true)} onBack={() => navigateToScreen('home')} data={data} />
        </Animated.View>
        { open && <Sidebar onClose={() => setOpen(false)} onNavigate={navigateToScreen} /> }
      </View>
    );
  }

  // Show alerts screen if selected
  if (currentScreen === 'alerts') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.gradientStart }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <AlertsScreen onBack={() => navigateToScreen('home')} alerts={alerts} />
        </Animated.View>
      </View>
    );
  }

  // Show settings screen if selected
  if (currentScreen === 'settings') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.gradientStart }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <SettingsScreen onBack={() => navigateToScreen('home')} />
        </Animated.View>
      </View>
    );
  }

  // Show about screen if selected
  if (currentScreen === 'about') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.gradientStart }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <AboutScreen onBack={() => navigateToScreen('home')} />
        </Animated.View>
      </View>
    );
  }

  // Show radios screen if selected
  if (currentScreen === 'radios') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.gradientStart }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <RadiosScreen onBack={() => navigateToScreen('home')} coordinates={coordinates} />
        </Animated.View>
      </View>
    );
  }

  // Show radar screen if selected
  if (currentScreen === 'radar') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.gradientStart }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <RadarScreen onBack={() => navigateToScreen('home')} coordinates={coordinates} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.gradientStart }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={[styles.gradientBackground, { zIndex: 1 }]} >

        <StatusBar style="auto" />
        <View style={[styles.headerContainer, (open || locationOpen) && { pointerEvents: 'none' }]}>
          <View style={styles.side}>
              <TouchableOpacity onPress={() => { setOpen(true) }}>
              <MaterialIcons name="menu" size={35} color={theme.iconColor} />
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
              <MaterialIcons name="star" size={35} color={theme.iconColor} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.iconColor}
              colors={[theme.iconColor]}
            />
          }
        >

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
          <View>
            {data.forecast && data.forecast.hourly && data.forecast.hourly.precipitation_probability && (
              <View style={{ width: '100%' }}>
                <Text style={[styles.header, { fontSize: 18, marginBottom: 10 }]}>Precipitation next 24hr</Text>
                <View style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 50, flexWrap: 'nowrap' }}>
                  {data.forecast.hourly.precipitation_probability.slice(0, 24).map((prob, index) => (
                    <View key={index} style={{ alignItems: 'center', flex: 1, maxWidth: '4.16%' }}>
                      <View 
                        style={{ 
                          width: '90%', 
                          backgroundColor: '#27beff', 
                          height: prob/2, 
                          borderRadius: 10,
                        }} 
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }]}>
          <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-around' }}>
            <View style={{ gap: 15 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="opacity" size={24} color={theme.weatherIconPrimary} />
                <View>
                  <Text style={styles.text}>Dew Point</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{Math.round(data.DEW_POINT)}°</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="compress" size={24} color={theme.weatherIconPrimary} />
                <View>
                  <Text style={styles.text}>Pressure</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{data.PRESSURE} mb</Text>
                </View>
              </View>
            </View>
            <View style={{ gap: 15 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="water-drop" size={24} color={theme.weatherIconPrimary} />
                <View>
                  <Text style={styles.text}>Humidity</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{Math.round(data.R_HUMIDITY)}%</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="visibility" size={24} color={theme.weatherIconPrimary} />
                <View>
                  <Text style={styles.text}>Visibility</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{Math.round(data.VISIBILITY / 1000)} mi</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }, { paddingHorizontal: 10 }]}>
          <TouchableOpacity 
            style={{ width: '100%', height: 200, borderRadius: 16, overflow: 'hidden' }}
            onPress={() => navigateToScreen('radar')}
            activeOpacity={0.8}
          >
            <WebView
              source={{ uri: `https://sparkradar.app?mode=preview&lat=${coordinates.lat}&lon=${coordinates.lon}` }}
              style={{ flex: 1 }}
              pointerEvents="none"
              scrollEnabled={false}
              bounces={false}
            />
          </TouchableOpacity>
        </View>

        </ScrollView>

          <Toast />

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