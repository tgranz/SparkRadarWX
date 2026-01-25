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
import { style, wxicons, alertcolor, getIconColor, getContrastYIQ } from './style';
import { useTheme } from './theme';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';
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

// Main app component
function AppContent() {
  // Get current theme
  const { theme, isDark } = useTheme();

  // Get API key from environment
  const ONECALL_API_KEY = Constants.expoConfig?.extra?.onecallApiKey || '';

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
  const [data, setData] = useState({});
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


  // Unit conversion functions
  const convertTemperature = (tempF, unit) => {
    if (unit === 'celsius') {
      return (tempF - 32) * 5 / 9;
    }
    return tempF;
  };
  const convertPressure = (hpa, unit) => {
    const inHg = parseFloat(hpa) / 33.8639;
    switch (unit) {
      case 'millibars':
        return parseFloat(hpa).toFixed(0); // Already in millibars
      case 'mmHg':
        return (inHg * 25.4).toFixed(2); // Convert inHg to mmHg
      case 'inches':
      default:
        return inHg.toFixed(2); // Convert hPa to inches
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


  // Function to return an icon for a given condition
  function getIcon(condition, time = 'day') {
    var id = 'sunny';
    if (typeof condition !== 'string' || !condition.trim()) {
      return wxicons(`${time}-sunny`);
    }

    condition = condition.toLowerCase();

    if (condition.toLowerCase().includes("overcast")) {
      id = "cloudy";
    } else if (condition.toLowerCase().includes("partly")) {
      id = "partlycloudy";
    } else if (condition.toLowerCase().includes("cloud")) {
      id = "cloudy";
    } else if (condition.toLowerCase().includes("clear") || condition.toLowerCase().includes("sunny") || condition.toLowerCase().includes("fair")) {
      id = "clear";
    } else if (condition.toLowerCase().includes("light") && condition.toLowerCase().includes("snow")) {
      id = "snow";
    } else if (condition.toLowerCase().includes("flurries")) {
      id = "snow";
    } else if (condition.toLowerCase().includes("heavy") && condition.toLowerCase().includes("snow")) {
      id = "snow";
    } else if (condition.toLowerCase().includes("snow")) {
      id = "heavysnow";
    } else if (condition.toLowerCase().includes("thunderstorm") || condition.toLowerCase().includes("storm")) {
      id = "thunderstorm";
    } else if (condition.toLowerCase().includes("rain") || condition.toLowerCase().includes("shower")) {
      id = "rain";
    } else if (condition.toLowerCase().includes("drizzle")) {
      id = "rain";
    } else if (condition.toLowerCase().includes("haze")) {
      id = "haze";
    } else if (condition.toLowerCase().includes("fog")) {
      id = "fog";
    } else if (condition.toLowerCase().includes("mist")) {
      id = "mist";
    }

    return wxicons(time + '-' + id);
  }


  // Helper functions for SPC Risk
  const getSpcIndex = (label) => {
    if (typeof label !== 'string' || !label) return 0;
    
    // Try to extract a digit from the start of the string (e.g., "1-Marginal", "2-Slight")
    const digitMatch = label.match(/^(\d)/);
    if (digitMatch) return parseInt(digitMatch[1]);
    
    // Try to find a digit anywhere in the string
    const anyDigitMatch = label.match(/(\d)/);
    if (anyDigitMatch) return parseInt(anyDigitMatch[1]);
    
    // Map common SPC level names to their numeric values
    const labelUpper = label.toUpperCase();
    if (labelUpper.includes('MRGL') || labelUpper.includes('MARGINAL')) return 1;
    if (labelUpper.includes('SLGT') || labelUpper.includes('SLIGHT')) return 2;
    if (labelUpper.includes('ENH') || labelUpper.includes('ENHANCED')) return 3;
    if (labelUpper.includes('MDT') || labelUpper.includes('MODERATE')) return 4;
    if (labelUpper.includes('HIGH')) return 5;
    
    return 0;
  };
  const getSpcPercent = (label) => {
    if (typeof label !== 'string' || !label) return 0;
    const index = getSpcIndex(label);
    return index / 5;
  };


  // Function to convert Kelvin to Fahrenheit
  const kelvinToFahrenheit = (kelvin) => {
    return (kelvin - 273.15) * 9 / 5 + 32;
  };

  // Function to convert m/s to mph
  const mpsToMph = (mps) => {
    return mps * 2.23694;
  };

  // Function to convert km to miles
  const kmToMiles = (km) => {
    return km / 1.60934;
  };

  // Function to convert data into selected units
  const convertData = (rawData) => {
    if (!rawData) return rawData;

    const converted = { ...rawData };
    converted.current = { ...rawData.current };

    // Convert temperature from Kelvin to Fahrenheit, then to selected unit
    const tempF = kelvinToFahrenheit(rawData.current.temperature);
    converted.current.temperature = convertTemperature(tempF, tempUnit);
    
    // Convert dew point from Kelvin to Fahrenheit, then to selected unit
    const dewF = kelvinToFahrenheit(rawData.current.dew_point);
    converted.current.dew_point = convertTemperature(dewF, tempUnit);
    
    // Pressure is already in hPa, just convert to selected unit
    converted.current.pressure = convertPressure(rawData.current.pressure, pressureUnit);
    
    // Convert visibility from km to miles, then to selected unit
    const visibilityMiles = kmToMiles(rawData.current.visibility);
    converted.current.visibility = convertDistance(visibilityMiles, distanceUnit);
    
    // Convert wind speed from m/s to mph, then to selected unit
    const windMph = mpsToMph(rawData.current.wind_speed);
    converted.current.wind_speed = convertSpeed(windMph, speedUnit);

    // Convert forecast data if it exists
    if (converted.forecasts?.daily && Array.isArray(converted.forecasts.daily)) {
      converted.forecasts.daily = converted.forecasts.daily.map(day => ({
        ...day,
        // Daily highs/lows came in Kelvin but were derived from Fahrenheit without the +32 step;
        // subtracting 32 after the Kelvin→F conversion restores the original Fahrenheit value.
        high: convertTemperature(kelvinToFahrenheit(day.high) - 32, tempUnit),
        low: convertTemperature(kelvinToFahrenheit(day.low) - 32, tempUnit),
        wind_speed: convertSpeed(mpsToMph(day.wind_speed), speedUnit),
      }));
    }

    if (converted.forecasts?.hourly && Array.isArray(converted.forecasts.hourly)) {
      converted.forecasts.hourly = converted.forecasts.hourly.map(hour => ({
        ...hour,
        temperature: convertTemperature(kelvinToFahrenheit(hour.temperature), tempUnit),
        wind_speed: convertSpeed(mpsToMph(hour.wind_speed), speedUnit),
      }));
    }

    if (converted.forecasts?.minutely && Array.isArray(converted.forecasts.minutely)) {
      converted.forecasts.minutely = converted.forecasts.minutely.map(min => ({ ...min }));
    }

    return converted;
  };


  // Fetch and parse
  const loadCurrentConditions = (lat, lon) => {
    setLoading(true);
    const startTime = Date.now();

    // Set a timeout to hide loading spinner after 5 seconds
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      setRefreshing(false);
    }, 5000);

    const url = `https://onecall.sparkradar.app/onecall?lat=${lat}&lon=${lon}&key=${ONECALL_API_KEY}`;

    console.log('Fetching weather data from', url);
    console.log('Fetch start time:', new Date().toISOString());

    fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'SparkRadarWX/1.0',
        'Accept': 'application/json',
        'Connection': 'close',
      },
    })
      .then(response => {
        const elapsed = Date.now() - startTime;
        console.log('Fetch response received in', elapsed, 'ms, status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(apiData => {
        const elapsed = Date.now() - startTime;
        console.log('Weather data parsed in', elapsed, 'ms');
        console.log('Data keys:', Object.keys(apiData));
        
        setData(convertData(apiData.data));
        clearTimeout(loadingTimeout);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(error => {
        const elapsed = Date.now() - startTime;
        console.warn('Fetch failed after', elapsed, 'ms. Error:', error.message);
        console.warn('Error details:', JSON.stringify(error));
        
        Toast.show({
          type: 'error',
          text1: 'Weather data error: ' + error.message.substring(0, 50),
          position: 'bottom',
          visibilityTime: 5000,
        });
        
        clearTimeout(loadingTimeout);
        setLoading(false);
        setRefreshing(false);
      });
  };

  // Function to convert degrees to cardinal direction
  function degToCardinal(deg) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.floor((deg / 22.5) + 0.5) % 16;
    return directions[index];
  }

  // Helper function to determine if current time is day or night
  const getDayOrNight = () => {
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

    if (sunriseMinutes == null || sunsetMinutes == null) return 'day';

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes) {
      return 'day';
    }
    return 'night';
  };

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
  if (data?.alerts && data.alerts.length > 0) {
    for (var i = 0; i < data.alerts.length; i++) {
      var alert = data.alerts[i];

      // Skip if event is null or undefined
      if (!alert.properties || !alert.product.event) {
        console.log("Skipping alert with no event data");
        continue;
      }

      var thiscolor = "#ff2121";
      var thisTextColor = "#ffffff";

      thiscolor = alert.properties.color || alertcolor(alert.product.event);
      thisTextColor = getContrastYIQ(thiscolor);

      var formattedDate = "";
      if (alert.properties.end) {
        var effectiveDate = new Date(alert.properties.end);
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
                  <Text style={[styles.header, { fontSize: 16, color: thisTextColor, textAlign: 'right' }]}>{alert.product.event}</Text>
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
        {open && <Sidebar onClose={() => setOpen(false)} onNavigate={navigateToScreen} />}
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
        {open && <Sidebar onClose={() => setOpen(false)} onNavigate={navigateToScreen} />}
      </View>
    );
  }

  // Show alerts screen if selected
  if (currentScreen === 'alerts') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.gradientStart }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <AlertsScreen onBack={() => navigateToScreen('home')} alerts={data.alerts} />
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
          <View style={[styles.headerContainer, { marginBottom: 5 }, (open || locationOpen) && { pointerEvents: 'none' }]}>
            <View style={styles.side}>
              <TouchableOpacity onPress={() => { setOpen(true); }}>
                <MaterialIcons name="menu" size={35} color={theme.iconColor} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.titleContainer} onPress={() => setLocationOpen(true)}>
              <View style={styles.titleContainer}>
                <Text style={styles.header}>{locationName ? locationName : data.station}</Text>
                <Text style={styles.text}>{data.location?.wfo || 'Loading...'}</Text>
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
              <Text style={[styles.wxicons, { color: getIconColor(data.current?.condition?.condition || data.current?.condition) }]}>{getIcon(data.current?.condition?.condition || null, getDayOrNight())}</Text>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.header}>{data.current?.condition?.condition || 'Unknown'}</Text>
                <Text style={[styles.header, { fontSize: 28 }]}>{Math.round(data.current?.temperature || 0)}°</Text>
              </View>
            </View>

            {data.insight && <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }, { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', gap: 10 }]}>
              <MaterialIcons name="info" size={22} color={theme.iconColor} />
              <Text style={[styles.text, { width: '80%' }]}>{data.insight}</Text>
            </View>}

            {(data?.forecasts?.spc[0] && data?.forecasts?.spc[0].level != 'NONE' && data?.forecasts?.spc[0].level != 'TSTM') && (
              <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }, { backgroundColor: data.forecasts.spc[0].color, borderWidth: 1, borderColor: data.forecasts.spc[0].altcolor || theme.cardBackground }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View>
                      <Text style={[styles.header, { color: getContrastYIQ(data.forecasts.spc[0].color), fontSize: 18 }]}>Severe Outlook</Text>
                      <Text style={[styles.text, { color: getContrastYIQ(data.forecasts.spc[0].color) }]}>{data.forecasts.spc[0].description} ({getSpcIndex(data.forecasts.spc[0].level)}/5)</Text>
                    </View>
                  </View>
                  <View style={{ width: 60, height: 60, justifyContent: 'center', alignItems: 'center' }}>
                    <Svg width={60} height={60}>
                      <Circle
                        cx={30}
                        cy={30}
                        r={26}
                        stroke={data.forecasts.spc[0].altcolor || theme.cardBackground}
                        strokeWidth={6}
                        fill="none"
                        opacity={0.25}
                      />
                      <Circle
                        cx={30}
                        cy={30}
                        r={26}
                        stroke={data.forecasts.spc[0].altcolor || theme.iconColor}
                        strokeWidth={6}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 26} ${2 * Math.PI * 26}`}
                        strokeDashoffset={(1 - getSpcPercent(data.forecasts.spc[0].level)) * 2 * Math.PI * 26}
                        rotation={-90}
                        origin="30,30"
                      />
                    </Svg>
                    <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={[styles.header, { color: getContrastYIQ(data.forecasts.spc[0].color), fontSize: 18, fontWeight: 'bold' }]}>{getSpcIndex(data.forecasts.spc[0].level)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {alertelements.map((element, index) => (
              <React.Fragment key={index}>{element}</React.Fragment>
            ))}

            {data.forecasts?.daily && data.forecasts.daily.length > 0 && (
              <TouchableOpacity onPress={() => navigateToScreen('daily')} activeOpacity={0.8}>
                <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }]}>
                  <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={[styles.header, { fontSize: 18, marginBottom: 5 }]}>{getDayOrNight() === 'day' ? "Later today" : "Later tonight"}</Text>
                      <Text style={[styles.text, { color: theme.secondaryText }]}>
                        {`${Math.round(data.forecasts.daily[0].low || 0)}°`}
                        {' / '}
                        {`${Math.round(data.forecasts.daily[0].high || 0)}°`}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[styles.wxicons, { fontSize: 48, color: getIconColor(data.forecasts.daily[0].condition?.condition || data.forecasts.daily[0].condition) }]}>
                        {getIcon(data.forecasts.daily[0].condition?.condition || data.forecasts.daily[0].condition, getDayOrNight())}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {(() => {
              if (!data.forecasts?.minutely || data.forecasts.minutely.length === 0) return null;

              // Use next 60 minutes of precipitation probability/intensity
              const minuteData = data.forecasts.minutely.slice(0, 60);
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
                <TouchableOpacity onPress={() => navigateToScreen('hourly')} activeOpacity={0.8}>
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
                </TouchableOpacity>
              );
            })()}

            {(() => {
              if (!data.forecasts?.hourly || data.forecasts.hourly.length === 0) return null;
              const now = new Date();
              let startIndex = 0;
              for (let i = 0; i < data.forecasts.hourly.length; i++) {
                const forecastTime = new Date(data.forecasts.hourly[i].time);
                if (forecastTime >= now) {
                  startIndex = i;
                  break;
                }
              }
              const hourlyData = data.forecasts.hourly.slice(startIndex, startIndex + 24);
              // Ensure numeric probability values; default to 0 if missing
              const precipData = hourlyData.map(hour => (
                typeof hour.precipitation_probability === 'number' ? hour.precipitation_probability : 0
              ));
              if (!precipData.some(prob => prob > 30)) return null;

              return (
                <TouchableOpacity onPress={() => navigateToScreen('hourly')} activeOpacity={0.8}>
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
                                  height: prob / 2,
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
                </TouchableOpacity>
              );
            })()}

            <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }]}>
              <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginVertical: 10 }}>
                <View style={{ gap: 15 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialIcons name="opacity" size={24} color={theme.weatherIconPrimary} />
                    <View>
                      <Text style={styles.text}>Dew Point</Text>
                      <Text style={[styles.text, { fontWeight: 'bold' }]}>{Math.round(data.current?.dew_point || 0)}{getTempUnit()}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialIcons name="compress" size={24} color={theme.weatherIconPrimary} />
                    <View>
                      <Text style={styles.text}>Pressure</Text>
                      <Text style={[styles.text, { fontWeight: 'bold' }]}>{parseFloat(data.current?.pressure || 0).toFixed(2)} {getPressureUnit()}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialIcons name="speed" size={24} color={theme.weatherIconPrimary} />
                    <View>
                      <Text style={styles.text}>Wind Speed</Text>
                      <Text style={[styles.text, { fontWeight: 'bold' }]}>{(data.current?.wind_speed || 0) == 0 ? 'Calm' : `${Math.round(data.current?.wind_speed)} ${getSpeedUnit()}`}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialIcons name="sunny" size={24} color={theme.weatherIconPrimary} />
                    <View>
                      <Text style={styles.text}>UV Index</Text>
                      <Text style={[styles.text, { fontWeight: 'bold' }]}>{data.current?.uvindex ? Math.round(data.current?.uvindex || 0) : 'N/A'}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ gap: 15 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialIcons name="water-drop" size={24} color={theme.weatherIconPrimary} />
                    <View>
                      <Text style={styles.text}>Humidity</Text>
                      <Text style={[styles.text, { fontWeight: 'bold' }]}>{Math.round(data.current?.humidity || 0)}%</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialIcons name="visibility" size={24} color={theme.weatherIconPrimary} />
                    <View>
                      <Text style={styles.text}>Visibility</Text>
                      <Text style={[styles.text, { fontWeight: 'bold' }]}>{parseInt((data.current?.visibility) || 0)} {getDistanceUnit()}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialIcons name="wind-power" size={24} color={theme.weatherIconPrimary} />
                    <View>
                      <Text style={styles.text}>Wind Direction</Text>
                      <Text style={[styles.text, { fontWeight: 'bold' }]}>{(data.current?.wind_direction || 0) == 999 ? "Variable" : (data.current?.wind_direction || 0) == 0 ? "N/A" : `${degToCardinal(Math.round(data.current?.wind_direction || 0))} (${Math.round(data.current?.wind_direction || 0)}°)`}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialIcons name="cloud" size={24} color={theme.weatherIconPrimary} />
                    <View>
                      <Text style={styles.text}>Cloud Cover</Text>
                      <Text style={[styles.text, { fontWeight: 'bold' }]}>{parseInt(data.current?.cloud_cover || 0)}%</Text>
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
                  source={{ uri: `https://sparkradar.app?mode=preview&zoom=7&lat=${coordinates.lat}&lon=${coordinates.lon}` }}
                  style={{ flex: 1 }}
                  pointerEvents="none"
                  scrollEnabled={false}
                  bounces={false}
                />
              </TouchableOpacity>
            </View>

            {(data?.location?.sunrise || data?.location?.sunset) && (
              <View style={[styles.cardContainer, (open || locationOpen) && { pointerEvents: 'none' }, { flexDirection: 'column', alignItems: 'center' }]}>
                <Text style={[styles.header, { fontSize: 18, marginBottom: 15 }]}>Sunrise & Sunset</Text>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  {(() => {
                    const parseISO8601ToMinutes = (isoStr) => {
                      if (!isoStr) return null;
                      try {
                        const date = new Date(isoStr);
                        if (isNaN(date.getTime())) return null;
                        return date.getHours() * 60 + date.getMinutes();
                      } catch (e) {
                        return null;
                      }
                    };

                    const formatISO8601ToTime = (isoStr) => {
                      if (!isoStr) return "—";
                      try {
                        const date = new Date(isoStr);
                        if (isNaN(date.getTime())) return "—";
                        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                      } catch (e) {
                        return "—";
                      }
                    };

                    const calculateSunPosition = () => {
                      const sunriseMinutes = parseISO8601ToMinutes(data.location.sunrise);
                      const sunsetMinutes = parseISO8601ToMinutes(data.location.sunset);

                      if (sunriseMinutes == null || sunsetMinutes == null) return { x: 15, y: 100 };

                      const now = new Date();
                      const currentMinutes = now.getHours() * 60 + now.getMinutes();
                      const clampedMinutes = Math.max(sunriseMinutes, Math.min(sunsetMinutes, currentMinutes));

                      const ratio = (clampedMinutes - sunriseMinutes) / (sunsetMinutes - sunriseMinutes);
                      const angle = 180 - (ratio * 180);
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
                      <Text style={[styles.header, { fontSize: 16 }]}>{(() => {
                        const date = new Date(data.location.sunrise);
                        return isNaN(date.getTime()) ? "—" : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                      })()}</Text>
                    </View>

                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <MaterialIcons name="nights-stay" size={28} color={theme.iconColor} style={{ marginBottom: 8 }} />
                      <Text style={[styles.text, { fontSize: 12 }]}>Sunset</Text>
                      <Text style={[styles.header, { fontSize: 16 }]}>{(() => {
                        const date = new Date(data.location.sunset);
                        return isNaN(date.getTime()) ? "—" : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                      })()}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <Text style={[styles.text, { textAlign: 'center', marginTop: 10, marginBottom: 10 }]}>Source: NWS and OpenWeatherMap</Text>
            <Text style={[styles.text, { textAlign: 'center', marginTop: 10, marginBottom: 30 }]}>{data.lastUpdated ? `Last updated: ${data.lastUpdated}` : ""}</Text>

          </ScrollView>

          <Toast />

        </LinearGradient>
      </Animated.View>

      {open && <Sidebar onClose={() => setOpen(false)} onNavigate={navigateToScreen} />}
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