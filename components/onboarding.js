import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { style } from '../style';
import { useTheme } from '../theme';

export default function OnboardingScreen({ onComplete }) {
  const { theme } = useTheme();
  const styles = style(theme);
  const [currentStep, setCurrentStep] = useState(0);

  // Define onboarding steps here
  const steps = [
    {
      title: 'Welcome to SparkRadarWX',
      description: 'Your go-to weather app with real-time alerts and detailed forecasts.',
      icon: 'cloud',
    },
    {
      title: 'Real-time Weather',
      description: 'Get accurate weather data including temperature, humidity, wind speed, and more.',
      icon: 'water-drop',
    },
    {
      title: 'Weather Alerts',
      description: 'Receive notifications about severe weather conditions in your area.',
      icon: 'warning',
    },
    {
      title: 'Radar Integration',
      description: 'View live weather radar to track storms and precipitation.',
      icon: 'cloud-queue',
    },
    {
      title: 'Customizable Units',
      description: 'Set your preferred units for temperature, pressure, distance, and speed.',
      icon: 'tune',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentStepData = steps[currentStep];

  return (
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={[styles.gradientBackground, { flex: 1 }]}
    >
      <StatusBar style="auto" />
      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 40 }}>
        {/* Skip button */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.text, { fontSize: 16 }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {/* Icon */}
          <MaterialIcons
            name={currentStepData.icon}
            size={80}
            color={theme.iconColor}
            style={{ marginBottom: 30 }}
          />

          {/* Title */}
          <Text style={[styles.header, { fontSize: 28, marginBottom: 15, textAlign: 'center' }]}>
            {currentStepData.title}
          </Text>

          {/* Description */}
          <Text
            style={[
              styles.text,
              {
                fontSize: 16,
                textAlign: 'center',
                lineHeight: 24,
                marginHorizontal: 10,
              },
            ]}
          >
            {currentStepData.description}
          </Text>
        </View>

        {/* Progress dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 30 }}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: index === currentStep ? theme.iconColor : theme.iconColor + '40',
                marginHorizontal: 5,
              }}
            />
          ))}
        </View>

        {/* Navigation buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Previous button */}
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={currentStep === 0}
            style={{ opacity: currentStep === 0 ? 0.5 : 1 }}
          >
            <MaterialIcons name="arrow-back" size={32} color={theme.iconColor} />
          </TouchableOpacity>

          {/* Next/Finish button */}
          <TouchableOpacity
            onPress={handleNext}
            style={{
              paddingHorizontal: 30,
              paddingVertical: 12,
              backgroundColor: theme.iconColor,
              borderRadius: 25,
            }}
          >
            <Text
              style={[
                styles.text,
                {
                  color: theme.gradientStart,
                  fontSize: 16,
                  fontWeight: 'bold',
                },
              ]}
            >
              {currentStep === steps.length - 1 ? 'Start' : 'Next'}
            </Text>
          </TouchableOpacity>

          {/* Placeholder for alignment */}
          <View style={{ width: 32 }} />
        </View>
      </View>
    </LinearGradient>
  );
}
