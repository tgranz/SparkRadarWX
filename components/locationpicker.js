import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, TextInput, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
const { width, height } = Dimensions.get('window');

export default function Sidebar({ onClose }) {
    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

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
                <View style={styles.drawer}>
                    <View style={styles.handle} />
                    
                    <View style={styles.header}>
                        <Text style={styles.title}>Select Location</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <MaterialIcons name="close" size={28} color="black" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search for a location..."
                            placeholderTextColor="#999"
                        />
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Favorites</Text>
                            
                            <TouchableOpacity style={styles.locationItem}>
                                <MaterialIcons name="location-on" size={24} color="#2A7FFF" style={styles.locationIcon} />
                                <View style={styles.locationInfo}>
                                    <Text style={styles.locationName}>New York, NY</Text>
                                    <Text style={styles.locationDetails}>KJFK</Text>
                                </View>
                                <MaterialIcons name="star" size={24} color="#FFD700" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.locationItem}>
                                <MaterialIcons name="location-on" size={24} color="#2A7FFF" style={styles.locationIcon} />
                                <View style={styles.locationInfo}>
                                    <Text style={styles.locationName}>Los Angeles, CA</Text>
                                    <Text style={styles.locationDetails}>KLAX</Text>
                                </View>
                                <MaterialIcons name="star" size={24} color="#FFD700" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.locationItem}>
                                <MaterialIcons name="location-on" size={24} color="#2A7FFF" style={styles.locationIcon} />
                                <View style={styles.locationInfo}>
                                    <Text style={styles.locationName}>Chicago, IL</Text>
                                    <Text style={styles.locationDetails}>O'Hare International Airport</Text>
                                </View>
                                <MaterialIcons name="star" size={24} color="#FFD700" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Current Location</Text>
                            
                            <TouchableOpacity style={styles.locationItem}>
                                <MaterialIcons name="my-location" size={24} color="#2A7FFF" style={styles.locationIcon} />
                                <View style={styles.locationInfo}>
                                    <Text style={styles.locationName}>Use Current Location</Text>
                                    <Text style={styles.locationDetails}>Enable location services</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color="#999" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Recents</Text>

                            <TouchableOpacity style={styles.locationItem}>
                                <MaterialIcons name="location-on" size={24} color="#2A7FFF" style={styles.locationIcon} />
                                <View style={styles.locationInfo}>
                                    <Text style={styles.locationName}>Fort Wayne, IN</Text>
                                    <Text style={styles.locationDetails}>KFWA</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color="#999" />
                            </TouchableOpacity>
                        </View>
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
        backgroundColor: 'white',
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
        backgroundColor: '#F5F5F5',
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
        color: '#000',
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
        color: '#333',
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
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
        color: '#666',
    },
});
