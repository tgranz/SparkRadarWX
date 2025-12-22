import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
const { width } = Dimensions.get('window');

export default function Sidebar({ onClose, onNavigate }) {
    const slideAnim = useRef(new Animated.Value(-width * 0.7)).current;
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
                toValue: -width * 0.7,
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
            
            <Animated.View style={[styles.sidebarContainer, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.sidebar}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Menu</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <MaterialIcons name="close" size={28} color="black" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.item} onPress={() => { onNavigate('home'); }}>
                        <MaterialIcons style={styles.sideIcon} name="home" size={30} color="black" />
                        <Text style={styles.itemText}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.item} onPress={() => { onNavigate('hourly'); }}>
                        <MaterialIcons style={styles.sideIcon} name="timer" size={30} color="black" />
                        <Text style={styles.itemText}>Hourly</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.item}>
                        <MaterialIcons style={styles.sideIcon} name="calendar-month" size={30} color="black" />
                        <Text style={styles.itemText}>Daily</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.item} onPress={() => { onNavigate('radar'); }}>
                        <MaterialIcons style={styles.sideIcon} name="radar" size={30} color="black" />
                        <Text style={styles.itemText}>Radar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.item}>
                        <MaterialIcons style={styles.sideIcon} name="radio" size={30} color="black" />
                        <Text style={styles.itemText}>Radios</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.item}>
                        <MaterialIcons style={styles.sideIcon} name="settings" size={30} color="black" />
                        <Text style={styles.itemText}>Settings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.item}>
                        <MaterialIcons style={styles.sideIcon} name="info" size={30} color="black" />
                        <Text style={styles.itemText}>About</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.item}>
                        <MaterialIcons style={styles.sideIcon} name="coffee" size={30} color="black" />
                        <Text style={styles.itemText}>Buy me a coffee</Text>
                    </TouchableOpacity>
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
    sidebarContainer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: width * 0.7,
    },
    sidebar: {
        flex: 1,
        backgroundColor: 'white',
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        padding: 20,
        paddingTop: Constants.statusBarHeight + 10,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    itemText: {
        fontSize: 18,
    },
    sideIcon: {
        marginRight: 15,
    }
});
