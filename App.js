// SparkRadarWX
// A FOSS React Native weather app

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
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { style, wxicons, getIconColor, getContrastYIQ } from './style';
import { useTheme } from './theme';
import weatherparser from './js/weatherparser.js';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';


// Components for main screen
import Sidebar from './components/sidebar.js';
import LocationPicker from './components/locationpicker.js';
import HourlyScreen from './components/hourly.js';
import DailyScreen from './components/daily.js';
import AlertsScreen from './components/alerts.js';
import RadarScreen from './components/radar.js';
import SettingsScreen from './components/settings.js';
import AboutScreen from './components/about.js';
import RadiosScreen from './components/radios.js';
import OnboardingScreen from './components/onboarding.js';


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
  } else if (condition.toLowerCase().includes("rain")) {
    id = "rain";
    newCondition = "Rain";
  } else if (condition.toLowerCase().includes("drizzle")) {
    id = "rain";
    newCondition = "Light Rain";
  }

  return {
    icon: wxicons(time + '-' + id),
    condition: newCondition
  };
}

// Main app component
function AppContent() {
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
  const [spcRisk, setSpcRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const FALLBACK_COORDS = { lat: 40.97959, lon: -85.17173 };
  const [coordinates, setCoordinates] = useState({ lat: null, lon: null });
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [locationName, setLocationName] = useState("Current Location");
  const hasLoadedData = useRef(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Unit preferences
  const [tempUnit, setTempUnit] = useState('fahrenheit');
  const [pressureUnit, setPressureUnit] = useState('inches');
  const [distanceUnit, setDistanceUnit] = useState('miles');
  const [speedUnit, setSpeedUnit] = useState('mph');

  const SPC_OUTLOOK_URL = 'https://www.spc.noaa.gov/products/outlook/day1otlk_cat.nolyr.geojson';

  const pointInRing = (point, ring) => {
    const [px, py] = point;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const pointInPolygon = (point, polygon) => {
    if (!Array.isArray(polygon) || polygon.length === 0) return false;
    const inOuter = pointInRing(point, polygon[0]);
    if (!inOuter) return false;
    for (let i = 1; i < polygon.length; i++) {
      if (pointInRing(point, polygon[i])) return false;
    }
    return true;
  };

  const loadSpcRisk = async (lat, lon) => {
    if (lat == null || lon == null) return;
    try {
      const response = await fetch(SPC_OUTLOOK_URL);
      const json = await response.json();
      const point = [lon, lat];
      let bestFeature = null;

      json.features?.forEach((feature) => {
        if (!feature?.geometry || !feature?.properties) return;
        const { geometry, properties } = feature;

        const checkPolygon = (polyCoords) => {
          if (pointInPolygon(point, polyCoords)) {
            if (!bestFeature || (properties.DN ?? 0) > (bestFeature.properties.DN ?? 0)) {
              bestFeature = feature;
            }
          }
        };

        if (geometry.type === 'Polygon') {
          checkPolygon(geometry.coordinates);
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach((poly) => checkPolygon(poly));
        }
      });

      if (bestFeature) {
        const { LABEL, LABEL2, fill, stroke } = bestFeature.properties;
        setSpcRisk({ label: LABEL, description: LABEL2, fill, stroke });
      } else {
        setSpcRisk({ label: 'None', description: 'No SPC risk for this location today.', fill: '#3b9b5f', stroke: '#2f7b4c' });
      }
    } catch (err) {
      console.error('Error fetching SPC outlook', err);
      setSpcRisk({ label: 'Unavailable', description: 'SPC outlook could not be loaded.', fill: theme.cardBackground, stroke: theme.cardBackground });
    }
  };

  const getSpcPercent = (label) => {
    switch (label) {
      case 'MRGL': return 0.2;
      case 'SLGT': return 0.4;
      case 'ENH': return 0.6;
      case 'MDT': return 0.8;
      case 'HIGH': return 1.0;
      default: return 0;
    }
  };

  const getSpcIndex = (label) => {
    switch (label) {
      case 'MRGL': return '1';
      case 'SLGT': return '2';
      case 'ENH': return '3';
      case 'MDT': return '4';
      case 'HIGH': return '5';
      default: return '0';
    }
  };

  // Load unit preferences
  const loadUnitPreferences = async () => {
    try {
      const [savedTempUnit, savedPressureUnit, savedDistanceUnit, savedSpeedUnit, hasSeenOnboarding] = await Promise.all([
        AsyncStorage.getItem('tempUnit'),
        AsyncStorage.getItem('pressureUnit'),
        AsyncStorage.getItem('distanceUnit'),
        AsyncStorage.getItem('speedUnit'),
        AsyncStorage.getItem('hasSeenOnboarding'),
      ]);

      if (savedTempUnit !== null) setTempUnit(savedTempUnit);
      if (savedPressureUnit !== null) setPressureUnit(savedPressureUnit);
      if (savedDistanceUnit !== null) setDistanceUnit(savedDistanceUnit);
      if (savedSpeedUnit !== null) setSpeedUnit(savedSpeedUnit);
      
      // Show onboarding if user hasn't seen it
      if (hasSeenOnboarding === null) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error loading unit preferences:', error);
    }
  };

  // Conversion functions
  const convertTemperature = (tempF, unit) => {
    if (unit === 'celsius') {
      return (tempF - 32) * 5 / 9;
    }
    return tempF;
  };

  const convertPressure = (inHg, unit) => {
    inHg = parseFloat(inHg);
    switch (unit) {
      case 'millibars':
        return (inHg * 33.8639).toFixed(0); // Convert inHg to mb/hPa
      case 'mmHg':
        return (inHg * 25.4).toFixed(2); // Convert inHg to mmHg
      case 'inches':
      default:
        return inHg.toFixed(2); // Already in inches
    }
  };

  const convertDistance = (miles, unit) => {
    if (unit === 'kilometers') {
      return miles * 1.60934;
    }
    return miles;
  };

  const convertSpeed = (mph, unit) => {
    if (unit === 'kph') {
      return mph * 1.60934;
    }
    return mph;
  };

  // Convert entire data object based on unit preferences
  const convertData = (rawData) => {
    if (!rawData) return rawData;

    const converted = { ...rawData };
    converted.temp = convertTemperature(rawData.temp, tempUnit);
    converted.dew_point = convertTemperature(rawData.dew_point, tempUnit);
    converted.pressure = convertPressure(rawData.pressure, pressureUnit);
    converted.visibility = convertDistance(rawData.visibility, distanceUnit);
    converted.wind_speed = convertSpeed(rawData.wind_speed, speedUnit);

    // Convert forecast data if it exists
    if (converted.dailyForecast && Array.isArray(converted.dailyForecast)) {
      converted.dailyForecast = converted.dailyForecast.map(day => ({
        ...day,
        temp_max: convertTemperature(day.temp_max, tempUnit),
        temp_min: convertTemperature(day.temp_min, tempUnit),
        wind_speed: convertSpeed(day.wind_speed, speedUnit),
      }));
    }

    if (converted.hourlyForecast && Array.isArray(converted.hourlyForecast)) {
      converted.hourlyForecast = converted.hourlyForecast.map(hour => ({
        ...hour,
        temp: convertTemperature(hour.temp, tempUnit),
        wind_speed: convertSpeed(hour.wind_speed, speedUnit),
      }));
    }

    if (converted.minutelyForecast && Array.isArray(converted.minutelyForecast)) {
      converted.minutelyForecast = converted.minutelyForecast.map(min => ({ ...min }));
    }

    return converted;
  };

  // Fetch and parse
  const loadCurrentConditions = (lat, lon) => {
    setLoading(true);
    const startTime = Date.now();
    
    // Set a timeout to hide loading spinner after 3 seconds
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);
    
    loadSpcRisk(lat, lon);

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime >= 3000) {
        setLoading(false);
      }

      const parsedData = weatherparser(lat, lon, (updatedData, alertsToAdd) => {
        // Callback: Update data when async fetches complete
        if (updatedData) setData(convertData(updatedData));
        if (alertsToAdd) setAlerts(alertsToAdd);
        setRefreshing(false);
        setLoading(false);
      }, { tempUnit, speedUnit });
      setData(convertData(parsedData));
      setRefreshing(false);
  };

  // Function to convert degrees to cardinal direction
  function degToCardinal(deg) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.floor((deg / 22.5) + 0.5) % 16;
    return directions[index];
  }

  // Helper functions to get unit symbols
  const getTempUnit = () => tempUnit === 'celsius' ? '°C' : '°F';
  const getPressureUnit = () => {
    switch (pressureUnit) {
      case 'millibars':
        return 'mb';
      case 'mmHg':
        return 'mmHg';
      case 'inches':
      default:
        return 'inHg';
    }
  };
  const getDistanceUnit = () => distanceUnit === 'kilometers' ? 'km' : 'mi';
  const getSpeedUnit = () => speedUnit === 'kph' ? 'km/h' : 'mph';

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  };

  // Pull to refresh handler
  const onRefresh = () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    const cooldownTime = 30000; // 30 seconds

    if (timeSinceLastRefresh < cooldownTime) {
      Toast.show({
        type: 'info',
        text1: 'Please wait ' + Math.ceil((cooldownTime - timeSinceLastRefresh) / 1000) + ' seconds before refreshing again',
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

    // Load unit preferences on app start
    loadUnitPreferences();
  }, []);
    

  useEffect(() => {
    if (coordinates.lat !== null && coordinates.lon !== null && !hasLoadedData.current) {
      loadCurrentConditions(coordinates.lat, coordinates.lon);
      hasLoadedData.current = true;
    }
  }, [coordinates]);

  // Re-convert data when unit preferences change
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setData(convertData(data));
    }
  }, [tempUnit, pressureUnit, distanceUnit, speedUnit]);

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

  // Show onboarding screen if this is first launch
  if (showOnboarding) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.gradientStart }}>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
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

  // Show daily screen if selected
  if (currentScreen === 'daily') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.gradientStart }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <DailyScreen onMenuOpen={() => setOpen(true)} onBack={() => navigateToScreen('home')} data={data} coordinates={coordinates} />
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
            <TouchableOpacity onPress={() => { setOpen(true); }}>
              <MaterialIcons name="menu" size={35} color={theme.iconColor} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.titleContainer} onPress={() => setLocationOpen(true)}>
            <View style={styles.titleContainer}>
              <Text style={styles.header}>{ data.station ? data.station : locationName }</Text>
              <Text style={styles.text}>{data.station}</Text>
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
              progressBackgroundColor={theme.gradientEnd}
            />
          }
        >

        <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }, { paddingHorizontal: 60, flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={[styles.wxicons, { color: getIconColor(data.condition) }]}>{ getDataFromCondition(data.condition).icon}</Text>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.header}>{getDataFromCondition(data.condition).condition.charAt(0).toUpperCase() + getDataFromCondition(data.condition).condition.slice(1)}</Text>
            <Text style={[styles.header, { fontSize: 28 }]}>{Math.round(data.temp)}°</Text>
          </View>
        </View>

        <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }, { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', gap: 10 }]}>
          <MaterialIcons name="info" size={22} color={theme.iconColor} />
          <Text style={[styles.text, { width: '80%' }]}>{data.insight}</Text>
        </View>

        {(spcRisk && getSpcIndex(spcRisk.label) > 0) && (
          <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }, { backgroundColor: spcRisk.fill, borderWidth: 1, borderColor: spcRisk.stroke || theme.cardBackground }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View>
                  <Text style={[styles.header, { color: getContrastYIQ(spcRisk.fill), fontSize: 18 }]}>Severe Outlook</Text>
                  <Text style={[styles.text, { color: getContrastYIQ(spcRisk.fill) }]}>{spcRisk.description} ({getSpcIndex(spcRisk.label)}/5)</Text>
                </View>
              </View>
              <View style={{ width: 60, height: 60, justifyContent: 'center', alignItems: 'center' }}>
                <Svg width={60} height={60}>
                  <Circle
                    cx={30}
                    cy={30}
                    r={26}
                    stroke={spcRisk.stroke || theme.cardBackground}
                    strokeWidth={6}
                    fill="none"
                    opacity={0.25}
                  />
                  <Circle
                    cx={30}
                    cy={30}
                    r={26}
                    stroke={spcRisk.stroke || theme.iconColor}
                    strokeWidth={6}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26} ${2 * Math.PI * 26}`}
                    strokeDashoffset={(1 - getSpcPercent(spcRisk.label)) * 2 * Math.PI * 26}
                    rotation={-90}
                    origin="30,30"
                  />
                </Svg>
                <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={[styles.header, { color: getContrastYIQ(spcRisk.fill), fontSize: 18, fontWeight: 'bold' }]}>{getSpcIndex(spcRisk.label)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {alertelements.map((element, index) => (
          <React.Fragment key={index}>{element}</React.Fragment>
        ))}

        {(() => {
          if (!data.minutelyForecast || data.minutelyForecast.length === 0) return null;

          // Use next 60 minutes of precipitation probability/intensity
          const minuteData = data.minutelyForecast.slice(0, 60);
          const precipData = minuteData.map(min => min.precipitation || 0); // mm of precip per minute

          // If all zero/near-zero, don't render
          if (!precipData.some(val => val > 0)) return null;

          // Normalize heights for bar chart
          const maxPrecip = Math.max(...precipData, 0.01);
          const bars = precipData.map(val => (val / maxPrecip) * 50); // max height 50

          const now = new Date();
          const mid = new Date(now.getTime() + 30 * 60 * 1000);
          const end = new Date(now.getTime() + 60 * 60 * 1000);
          
          return (
            <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }]}>
              <View style={{ width: '100%' }}>
                <Text style={[styles.header, { fontSize: 18, marginBottom: 10 }]}>Precipitation next 60 min</Text>
                <View style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 60, flexWrap: 'nowrap' }}>
                  {bars.map((height, index) => (
                    <View key={index} style={{ alignItems: 'center', flex: 1, maxWidth: '1.66%' }}>
                      <View 
                        style={{ 
                          width: '90%', 
                          backgroundColor: height < 22 ? '#444444' : height < 44 ? '#2a7fff' : '#27beff', 
                          height, 
                          borderRadius: 6,
                        }} 
                      />
                    </View>
                  ))}
                </View>
                <View style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <Text style={styles.text}>{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</Text>
                  <Text style={styles.text}>{mid.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</Text>
                  <Text style={styles.text}>{end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</Text>
                </View>
              </View>
            </View>
          );
        })()}

        {(() => {
          if (!data.hourlyForecast || data.hourlyForecast.length === 0) return null;
          const now = new Date();
          let startIndex = 0;
          for (let i = 0; i < data.hourlyForecast.length; i++) {
            const forecastTime = new Date(data.hourlyForecast[i].dt * 1000);
            if (forecastTime >= now) {
              startIndex = i;
              break;
            }
          }
          const hourlyData = data.hourlyForecast.slice(startIndex, startIndex + 24);
          // Ensure numeric probability values; default to 0 if missing
          const precipData = hourlyData.map(hour => (
            typeof hour.pop === 'number' ? hour.pop * 100 : 0
          ));
          if (!precipData.some(prob => prob > 30)) return null;
          
          return (
            <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }]}>
              <View>
                <View style={{ width: '100%' }}>
                  <Text style={[styles.header, { fontSize: 18, marginBottom: 10 }]}>Precipitation next 24hr</Text>
                  <View style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 50, flexWrap: 'nowrap' }}>
                    {precipData.map((prob, index) => (
                      <View key={index} style={{ alignItems: 'center', flex: 1, maxWidth: '4.16%' }}>
                        <View 
                          style={{ 
                            width: '90%', 
                            backgroundColor: prob < 17 ? '#444444' : prob < 34 ? '#2a7fff' : '#27beff', 
                            height: prob/2, 
                            borderRadius: 10,
                          }} 
                        />
                      </View>
                    ))}
                  </View>
                    <View style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                      <Text style={styles.text}>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}</Text>
                      <Text style={styles.text}>{new Date(new Date().getTime() + 12 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}</Text>
                      <Text style={styles.text}>{new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}</Text>
                    </View>
                </View>
              </View>
            </View>
          );
        })()}

        <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }]}> 
          <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginVertical: 10 }}>
            <View style={{ gap: 15 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="opacity" size={24} color={theme.weatherIconPrimary} />
                <View>
                  <Text style={styles.text}>Dew Point</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{Math.round(data.dew_point)}{getTempUnit()}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="compress" size={24} color={theme.weatherIconPrimary} />
                <View>
                  <Text style={styles.text}>Pressure</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{parseFloat(data.pressure)} {getPressureUnit()}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="speed" size={24} color={theme.weatherIconPrimary} />
                <View>
                  <Text style={styles.text}>Wind Speed</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{Math.round(data.wind_speed)} {getSpeedUnit()}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="sunny" size={24} color={theme.weatherIconPrimary} />
                <View>
                  <Text style={styles.text}>UV Index</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{Math.round(data.uvindex)}</Text>
                </View>
              </View>
            </View>
            <View style={{ gap: 15 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="water-drop" size={24} color={theme.weatherIconPrimary} />
                <View>
                  <Text style={styles.text}>Humidity</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{Math.round(data.r_humidity)}%</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="visibility" size={24} color={theme.weatherIconPrimary} />
                <View>
                  <Text style={styles.text}>Visibility</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{parseInt(data.visibility)} {getDistanceUnit()}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="wind-power" size={24} color={theme.weatherIconPrimary} />
                <View>
                  <Text style={styles.text}>Wind Direction</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{ degToCardinal(Math.round(data.wind_direction))} ({Math.round(data.wind_direction)}°)</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="cloud" size={24} color={theme.weatherIconPrimary} />
                <View>
                  <Text style={styles.text}>Cloud Cover</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{parseInt(data.cloudcover)}%</Text>
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

        {(data.sunrise || data.sunset) && (
          <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }, { flexDirection: 'column', alignItems: 'center' }]}>
            <Text style={[styles.header, { fontSize: 18, marginBottom: 15 }]}>Sunrise & Sunset</Text>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {(() => {
                const calculateSunPosition = () => {
                  const parseTime = (timeStr) => {
                    if (!timeStr) return null;
                    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
                    if (!match) return null;
                    let hours = parseInt(match[1], 10);
                    const minutes = parseInt(match[2], 10);
                    const period = match[3].toUpperCase();
                    if (period === 'PM' && hours !== 12) hours += 12;
                    if (period === 'AM' && hours === 12) hours = 0;
                    return hours * 60 + minutes;
                  };

                  const sunriseMinutes = parseTime(data.sunrise);
                  const sunsetMinutes = parseTime(data.sunset);
                  
                  if (sunriseMinutes == null || sunsetMinutes == null) return { x: 100, y: 15 };
                  
                  const now = new Date();
                  const currentMinutes = now.getHours() * 60 + now.getMinutes();
                  const clampedMinutes = Math.max(sunriseMinutes, Math.min(sunsetMinutes, currentMinutes));
                  
                  const ratio = (clampedMinutes - sunriseMinutes) / (sunsetMinutes - sunriseMinutes);
                  const angle = ratio * 180;
                  const radians = angle * Math.PI / 180;
                  
                  const x = 100 + 85 * Math.cos(radians);
                  const y = 100 - 85 * Math.sin(radians);
                  
                  return { x, y };
                };
                
                const sunPos = calculateSunPosition();

                return (
                  <Svg width={200} height={100} viewBox="0 0 200 70">
                    {/* Sun arc */}
                    <Circle
                      cx={100}
                      cy={100}
                      r={85}
                      stroke={theme.iconColor}
                      strokeWidth={1}
                      fill="none"
                      opacity={0.3}
                    />
                    {/* Sun on arc at proportional position */}
                    <Circle
                      cx={sunPos.x}
                      cy={sunPos.y}
                      r={10}
                      fill="#ffcc00"
                    />
                  </Svg>
                );
              })()}
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 15, paddingHorizontal: 0 }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <MaterialIcons name="wb-twilight" size={28} color={theme.iconColor} style={{ marginBottom: 8 }} />
                  <Text style={[styles.text, { fontSize: 12 }]}>Sunrise</Text>
                  <Text style={[styles.header, { fontSize: 16 }]}>{data.sunrise || "—"}</Text>
                </View>
                
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <MaterialIcons name="nights-stay" size={28} color={theme.iconColor} style={{ marginBottom: 8 }} />
                  <Text style={[styles.text, { fontSize: 12 }]}>Sunset</Text>
                  <Text style={[styles.header, { fontSize: 16 }]}>{data.sunset || "—"}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <Text style={[ styles.text, { textAlign: 'center', marginTop: 10, marginBottom: 30 }]}>Source: NWS and OpenWeatherMap</Text>

        </ScrollView>

        <Toast />

        </LinearGradient>
      </Animated.View>

      { open && <Sidebar onClose={() => setOpen(false)} onNavigate={navigateToScreen} /> }
      {locationOpen && (
        <LocationPicker
          onClose={() => setLocationOpen(false)}
          onLocationSelect={(lat, lon, name) => {
            setCoordinates({ lat, lon });
            loadCurrentConditions(lat, lon);
            setLocationOpen(false);
            setLocationName(name.split(",")[0]);
          }}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}