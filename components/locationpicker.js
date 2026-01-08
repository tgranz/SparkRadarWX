import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, TextInput, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { useTheme } from '../theme';
const { width, height } = Dimensions.get('window');

export default function Sidebar({ onClose, onLocationSelect }) {
    const { theme, isDark } = useTheme();
    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [isSearching, setIsSearching] = React.useState(false);
    const [gettingLocation, setGettingLocation] = React.useState(false);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => onClose());
    };

    function locationSearch(queryString) {
        if (!queryString.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        fetch(`https://nominatim.openstreetmap.org/search?q=${queryString.replace(/ /g, '+')}&format=geojson&limit=10`, {
            headers: {
                'User-Agent': 'SparkRadarWX, https://github.com/tgranz/SparkRadarWX',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.features && data.features.length > 0) {
                const results = data.features.map(feature => ({
                    name: feature.properties.name,
                    expanded_name: feature.properties.display_name,
                    lat: feature.geometry.coordinates[1],
                    lon: feature.geometry.coordinates[0],
                    type: feature.properties.type || 'location'
                }));
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        })
        .catch(error => {
            console.error('Error fetching location data:', error);
            setSearchResults([]);
        });
    }

    const handleSearch = () => {
        if (searchQuery.length > 0) {
            locationSearch(searchQuery);
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    };
    const handleLocationSelect = (location) => {
        console.log('Selected location:', location);
        if (onLocationSelect) {
            onLocationSelect(location.lat, location.lon, location.name);
        }
        handleClose();
    };

    const handleCurrentLocation = async () => {
        setGettingLocation(true);
        try {
            // Request permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required to use this feature. Please enable location services in your device settings.',
                    [{ text: 'OK' }]
                );
                setGettingLocation(false);
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = location.coords;

            // Get address name from coordinates using reverse geocoding
            const address = await Location.reverseGeocodeAsync({
                latitude,
                longitude
            });

            let locationName = 'Current Location';
            if (address.length > 0) {
                const { city, region, country } = address[0];
                locationName = [city, region, country].filter(Boolean).join(', ');
            }

            if (onLocationSelect) {
                onLocationSelect(latitude, longitude, locationName);
            }
            handleClose();
        } catch (error) {
            console.error('Error getting current location:', error);
            Alert.alert(
                'Location Error',
                'Unable to get your current location. Please try again or search manually.',
                [{ text: 'OK' }]
            );
        } finally {
            setGettingLocation(false);
        }
    };

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={handleClose}
                />
            </Animated.View>

            <Animated.View style={[styles.drawerContainer, { transform: [{ translateY: slideAnim }] }]}>
                <View style={[StyleSheet.absoluteFill, styles.drawer, { backgroundColor: theme.cardBackground }]}>
                    {/*<View style={styles.handle} />*/}
                    
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.primaryText }]}>Select Location</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <MaterialIcons name="close" size={28} color={theme.iconColor} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.searchContainer, { backgroundColor: theme.searchBackground }]}>
                        <MaterialIcons name="search" size={24} color={theme.secondaryText} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.primaryText }]}
                            placeholder="Search for a location..."
                            placeholderTextColor={theme.secondaryText}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => {
                                setSearchQuery('');
                                setSearchResults([]);
                                setIsSearching(false);
                            }}>
                                <MaterialIcons name="clear" size={20} color={theme.secondaryText} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {isSearching && searchResults.length === 0 && searchQuery.length > 0 ? (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Search Results</Text>
                                <Text style={[styles.noResults, { color: theme.secondaryText }]}>Searching...</Text>
                            </View>
                        ) : searchResults.length > 0 ? (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Search Results</Text>
                                {searchResults.map((result, index) => (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={[styles.locationItem, { borderBottomColor: theme.borderColor }]}
                                        onPress={() => handleLocationSelect(result)}
                                    >
                                        <MaterialIcons name="location-on" size={24} color={theme.weatherIconPrimary} style={styles.locationIcon} />
                                        <View style={styles.locationInfo}>
                                            <Text style={[styles.locationName, { color: theme.primaryText }]}>{result.name}</Text>
                                            <Text style={[styles.locationDetails, { color: theme.secondaryText }]}>
                                                {result.expanded_name}
                                            </Text>
                                        </View>
                                        <MaterialIcons name="chevron-right" size={24} color={theme.secondaryText} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : searchQuery.length > 0 && !isSearching ? (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Search Results</Text>
                                <Text style={[styles.noResults, { color: theme.secondaryText }]}>No locations found</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.section}>
                                    <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Favorites</Text>
                            
                                    <TouchableOpacity style={[styles.locationItem, { borderBottomColor: theme.borderColor }]}>
                                        <MaterialIcons name="location-on" size={24} color={theme.weatherIconPrimary} style={styles.locationIcon} />
                                        <View style={styles.locationInfo}>
                                            <Text style={[styles.locationName, { color: theme.primaryText }]}>New York, NY</Text>
                                            <Text style={[styles.locationDetails, { color: theme.secondaryText }]}>KJFK</Text>
                                        </View>
                                        <MaterialIcons name="star" size={24} color="#FFD700" />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.locationItem, { borderBottomColor: theme.borderColor }]}>
                                        <MaterialIcons name="location-on" size={24} color={theme.weatherIconPrimary} style={styles.locationIcon} />
                                        <View style={styles.locationInfo}>
                                            <Text style={[styles.locationName, { color: theme.primaryText }]}>Los Angeles, CA</Text>
                                            <Text style={[styles.locationDetails, { color: theme.secondaryText }]}>KLAX</Text>
                                        </View>
                                        <MaterialIcons name="star" size={24} color="#FFD700" />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.locationItem, { borderBottomColor: theme.borderColor }]}>
                                        <MaterialIcons name="location-on" size={24} color={theme.weatherIconPrimary} style={styles.locationIcon} />
                                        <View style={styles.locationInfo}>
                                            <Text style={[styles.locationName, { color: theme.primaryText }]}>Chicago, IL</Text>
                                            <Text style={[styles.locationDetails, { color: theme.secondaryText }]}>O'Hare International Airport</Text>
                                        </View>
                                        <MaterialIcons name="star" size={24} color="#FFD700" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.section}>
                                    <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Current Location</Text>
                            
                                    <TouchableOpacity 
                                        style={[styles.locationItem, { borderBottomColor: theme.borderColor }]}
                                        onPress={handleCurrentLocation}
                                        disabled={gettingLocation}
                                    >
                                        <MaterialIcons name="my-location" size={24} color={theme.weatherIconPrimary} style={styles.locationIcon} />
                                        <View style={styles.locationInfo}>
                                            <Text style={[styles.locationName, { color: theme.primaryText }]}>
                                                {gettingLocation ? 'Getting location...' : 'Use Current Location'}
                                            </Text>
                                            <Text style={[styles.locationDetails, { color: theme.secondaryText }]}>
                                                {gettingLocation ? 'Please wait' : 'Using location services'}
                                            </Text>
                                        </View>
                                        <MaterialIcons name="chevron-right" size={24} color={theme.secondaryText} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.section}>
                                    <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Recents</Text>

                                    <TouchableOpacity style={[styles.locationItem, { borderBottomColor: theme.borderColor }]}>
                                        <MaterialIcons name="location-on" size={24} color={theme.weatherIconPrimary} style={styles.locationIcon} />
                                        <View style={styles.locationInfo}>
                                            <Text style={[styles.locationName, { color: theme.primaryText }]}>Fort Wayne, IN</Text>
                                            <Text style={[styles.locationDetails, { color: theme.secondaryText }]}>KFWA</Text>
                                        </View>
                                        <MaterialIcons name="chevron-right" size={24} color={theme.secondaryText} />
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </ScrollView>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    drawerContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: height * 0.85,
    },
    drawer: {
        flex: 1,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#DDD',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 20,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 48,
        fontSize: 16,
    },
    content: {
        flex: 1,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    locationIcon: {
        marginRight: 12,
    },
    locationInfo: {
        flex: 1,
    },
    locationName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    locationDetails: {
        fontSize: 14,
    },
    noResults: {
        fontSize: 16,
        textAlign: 'center',
        paddingVertical: 20,
    },
});
