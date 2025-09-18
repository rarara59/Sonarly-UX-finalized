// App.js - TEMPORARILY MODIFIED FOR PPG TESTING
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
// VisionCamera is imported in components that need it
import NoiseMonitorScreen from './src/screens/NoiseMonitorScreen';
import ChillhopMonitorScreen from './src/screens/ChillhopMonitorScreen';
import AmbientMonitorScreen from './src/screens/AmbientMonitorScreen';
import BiometricCaptureScreen from './src/screens/BiometricCaptureScreen';

// Import ALL components - now all fixed
import LibraryScreen from './src/screens/LibraryScreen';
import SoundService from './src/services/SoundService';
import PremiumHomeScreen from './src/screens/PremiumHomeScreen';
import SoundscapePlayerScreen from './src/screens/SoundscapePlayerScreen';

// 🎯 ADD THIS: Import the new SoundscapeGenerationScreen
import SoundscapeGenerationScreen from './src/screens/SoundscapeGenerationScreen';

// TEMPORARY: Import test component
import TestPPGPlugin from './src/components/TestPPGPlugin';

// Defensive import of design system
let colors = {
  void: '#0A0E1A',
  graphite: '#1B2735',
  border: '#2A3F5F',
  white: '#FFFFFF',
  muted: '#FFFFFF',
  biometricBlue: '#5CAEFF',
  signalOrange: '#FBA94C',
  dimmed: '#6B8CAA',
  pulseRed: '#FF5C5C',
};

try {
  const designSystem = require('./src/theme/design-system');
  colors = designSystem.colors || designSystem.default?.colors || colors;
} catch (error) {
  console.log('Design system import error in App.js, using fallbacks:', error);
}

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainStackNavigator = () => (
  <Stack.Navigator
  initialRouteName="HomeScreen"  // Start with premium emotional interface
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: colors.void }
    }}
  >
    {/* TEMPORARY: Add test screen first */}
    <Stack.Screen name="PPGTest" component={TestPPGPlugin} />
    
    {/* Original screens */}
    <Stack.Screen name="BiometricCaptureScreen" component={BiometricCaptureScreen} />
    
    {/* 🎯 ADD THIS: SoundscapeGeneration route */}
    <Stack.Screen name="SoundscapeGeneration" component={SoundscapeGenerationScreen} />
    
    <Stack.Screen name="Soundscape" component={SoundscapePlayerScreen} />
    <Stack.Screen name="HomeScreen" component={PremiumHomeScreen} />
    <Stack.Screen name="NoiseMonitor" component={NoiseMonitorScreen} />
    <Stack.Screen name="ChillhopMonitor" component={ChillhopMonitorScreen} />
    <Stack.Screen name="AmbientMonitor" component={AmbientMonitorScreen} />
  </Stack.Navigator>
);

export default function App() {
  useEffect(() => {
    const initApp = async () => {
      try {
        await SoundService.initAudio();
        console.log('Audio initialized successfully');
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };
    initApp();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Home') {
                iconName = focused ? 'ellipse' : 'ellipse-outline';
              } else if (route.name === 'Library') {
                iconName = focused ? 'stop' : 'stop-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#475569',
            tabBarInactiveTintColor: '#94a3b8',
            tabBarStyle: {
              backgroundColor: '#fafaf9',
              borderTopColor: 'rgba(203,213,225,0.3)',
              borderTopWidth: 1,
            },
            tabBarLabelStyle: {
              fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
              fontSize: 12,
              fontWeight: '300',
              letterSpacing: 0.5,
            },
          })}
        >
          <Tab.Screen name="Home" component={MainStackNavigator} />
          <Tab.Screen name="Library" component={LibraryScreen} />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}