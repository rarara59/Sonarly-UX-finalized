import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import SoundscapeStorageService from '../services/SoundscapeStorageService';

// Defensive import with fallbacks
let colors = {
  void: '#0A0E1A',
  graphite: '#1B2735',
  surface: '#243447',
  border: '#2A3F5F',
  white: '#FFFFFF',
  muted: '#FFFFFF',
  biometricBlue: '#5CAEFF',
  signalOrange: '#FBA94C',
  dimmed: '#6B8CAA',
  pulseRed: '#FF5C5C',
  text: '#5CAEFF',
};

let typography = {
  fonts: { mono: 'monospace' },
  sizes: { title: 24, metadata: 12, label: 14 },
  weights: { regular: '400', semibold: '600', bold: '700', black: '800' },
};

try {
  const designSystem = require('../theme/design-system');
  colors = designSystem.colors || designSystem.default?.colors || colors;
  typography = designSystem.typography || designSystem.default?.typography || typography;
} catch (error) {
  console.log('Design system import error in NoiseMonitorScreen, using fallbacks:', error);
}

const { width, height } = Dimensions.get('window');

// Move noiseTypes outside component to prevent recreation
const noiseTypes = {
  white: {
    name: 'WHITE',
    description: 'full_spectrum_static',
    color: colors.white,
    pattern: '● ● ●\n● ● ●\n● ● ●',
  },
  pink: {
    name: 'PINK', 
    description: '1/f_frequency_curve',
    color: colors.pulseRed,
    pattern: '◆ ◆ ◆\n◆ ◆ ◆\n◆ ◆ ◆',
  },
  brown: {
    name: 'BROWN',
    description: 'low_frequency_emphasis', 
    color: colors.signalOrange,
    pattern: '▲ ▲ ▲\n▲ ▲ ▲\n▲ ▲ ▲',
  },
};

const NoiseMonitorScreen = ({ route, navigation }) => {
  // Extract biometric data and mode from navigation
  const { 
    bpm = 75, 
    confidence = 85, 
    key = 'Dm', 
    mode = 'noise', 
    modeConfig,
    savedSession = false,    // Detect if this is playback
    savedData = null         // Get the saved session data
  } = route?.params || {};
  
  // FIX #2: Use useMemo for synchronous playback mode detection
  const isPlaybackMode = useMemo(() => {
    return savedSession === true && savedData != null;
  }, [savedSession, savedData]);
  
  // Debug logging - moved to useEffect to reduce console spam
  useEffect(() => {
    console.log('NoiseMonitorScreen params:', route?.params);
    console.log('savedSession:', savedSession);
    console.log('savedData:', savedData);
    console.log('isPlaybackMode:', isPlaybackMode);
  }, []); // Only log once on mount
  
  // FIX: Scroll to top when in playback mode
  useEffect(() => {
    if (isPlaybackMode && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    }
  }, [isPlaybackMode]);
  
  // Initialize state based on session mode
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionTime, setSessionTime] = useState(0); // Always start from 0
  const [currentBpm, setCurrentBpm] = useState(
    isPlaybackMode ? savedData?.heartRate || bpm : bpm
  );
  const [selectedNoiseType, setSelectedNoiseType] = useState(
    isPlaybackMode ? savedData?.noiseType || 'white' : 'white'
  );
  const [biorhythmIntensity, setBiorhythmIntensity] = useState(0.5);
  
  // Noise-specific parameters - initialize from saved data if in playback mode
  const [noiseParams, setNoiseParams] = useState({
    amplitude: isPlaybackMode ? savedData?.amplitude || 0.8 : 0.8,
    cutoffFreq: 0.7,
    resonance: 0.3,
    density: 0.6,
    drift: 0.4,
    modulation: isPlaybackMode ? savedData?.modulation || 0.5 : 0.5,
  });
  
  // FIX #1: Use useRef for biometricIndex to prevent useEffect loop
  const biometricIndexRef = useRef(0);
  
  // Playback-specific state - memoize savedBiometricData
  const savedBiometricData = useMemo(() => {
    if (isPlaybackMode && savedData) {
      // Create a biometric loop from saved data
      const baseHR = savedData.heartRate;
      // Generate a realistic HRV pattern around the saved heart rate
      return Array.from({ length: 30 }, (_, i) => {
        const variation = Math.sin(i * 0.2) * 3 + (Math.random() - 0.5) * 2;
        return Math.round(baseHR + variation);
      });
    }
    return [];
  }, [isPlaybackMode, savedData]);
  
  const [telemetryLog, setTelemetryLog] = useState([]);
  
  // Animation references
  const staticAnim = useRef(new Animated.Value(0)).current;
  const biorhythmAnim = useRef(new Animated.Value(0)).current;
  const scanlineAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  
  // FIX #1: Biometric simulation - removed biometricIndex from dependencies
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        if (isPlaybackMode && savedBiometricData.length > 0) {
          // PLAYBACK MODE: Loop through saved biometric data
          const currentIndex = biometricIndexRef.current % savedBiometricData.length;
          const newBpm = savedBiometricData[currentIndex];
          setCurrentBpm(newBpm);
          biometricIndexRef.current += 1; // Use ref instead of state
          
          // Calculate parameters from saved biometric data
          const normalizedBpm = (newBpm - 60) / 40;
          const hrv = 35 + Math.sin(currentIndex * 0.3) * 10; // Simulated HRV pattern
          
          setBiorhythmIntensity(Math.max(0.2, Math.min(0.9, hrv / 50)));
          setNoiseParams(prev => ({
            ...prev,
            amplitude: Math.max(0.4, Math.min(1.0, normalizedBpm)),
            cutoffFreq: Math.max(0.3, Math.min(0.8, hrv / 60)),
            modulation: Math.max(0.2, Math.min(0.7, (newBpm % 10) / 10)),
          }));
          
          // Add telemetry entry
          const timestamp = new Date().toISOString().substr(14, 8);
          const logEntry = {
            timestamp,
            bpm: newBpm,
            noiseType: selectedNoiseType,
            amplitude: Math.round(normalizedBpm * 100) / 100,
            modulation: Math.round(((newBpm % 10) / 10) * 100) / 100,
            hrv: Math.round(hrv),
          };
          
          setTelemetryLog(prev => [logEntry, ...prev.slice(0, 5)]);
        } else {
          // CREATE MODE: Live heart rate variation simulation
          const variation = Math.sin(Date.now() * 0.001) * 3;
          const newBpm = bpm + variation;
          setCurrentBpm(Math.round(newBpm));
          
          const normalizedBpm = (newBpm - 60) / 40;
          const hrv = 35 + Math.random() * 15;
          
          setBiorhythmIntensity(Math.max(0.2, Math.min(0.9, hrv / 50)));
          setNoiseParams(prev => ({
            ...prev,
            amplitude: Math.max(0.4, Math.min(1.0, normalizedBpm)),
            cutoffFreq: Math.max(0.3, Math.min(0.8, hrv / 60)),
            modulation: Math.max(0.2, Math.min(0.7, (newBpm % 10) / 10)),
          }));
          
          const timestamp = new Date().toISOString().substr(14, 8);
          const logEntry = {
            timestamp,
            bpm: Math.round(newBpm),
            noiseType: selectedNoiseType,
            amplitude: Math.round(normalizedBpm * 100) / 100,
            modulation: Math.round(((newBpm % 10) / 10) * 100) / 100,
            hrv: Math.round(hrv),
          };
          
          setTelemetryLog(prev => [logEntry, ...prev.slice(0, 5)]);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, bpm, selectedNoiseType, isPlaybackMode, savedBiometricData]); // Removed biometricIndex
  
  // Session timer
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);
  
  // Animations
  useEffect(() => {
    if (isPlaying) {
      // Static noise pattern animation
      Animated.loop(
        Animated.timing(staticAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ).start();
      
      // Biorhythm overlay animation
      const pulseDuration = (60 / currentBpm) * 1000;
      Animated.loop(
        Animated.sequence([
          Animated.timing(biorhythmAnim, {
            toValue: 1,
            duration: pulseDuration * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(biorhythmAnim, {
            toValue: 0,
            duration: pulseDuration * 0.7,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Scanline effect
      Animated.loop(
        Animated.timing(scanlineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isPlaying, currentBpm]);
  
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  const togglePlayback = useCallback(() => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      if (!isPlaybackMode) {
        setSessionTime(0);
      }
      setTelemetryLog([]);
      biometricIndexRef.current = 0; // Reset ref instead of state
    }
  }, [isPlaying, isPlaybackMode]);
  
  const currentNoise = noiseTypes[selectedNoiseType];
  
  const handleSaveSession = useCallback(async () => {
    if (isPlaybackMode) {
      Alert.alert(
        'playback_mode_active',
        'cannot_save_during_session_replay'
      );
      return;
    }
    
    try {
      const timestamp = new Date().toISOString();
      const sessionName = `noise_session_${timestamp.substr(11, 8).replace(/:/g, '')}`;
      
      const sessionData = {
        name: sessionName,
        mode: 'noise',
        heartRate: currentBpm,
        noiseType: selectedNoiseType,
        timestamp: timestamp,
        duration: sessionTime,
        avgBpm: currentBpm,
        amplitude: noiseParams.amplitude,
        modulation: noiseParams.modulation,
        quality: confidence,
        createdAt: timestamp,
      };
      
      const success = await SoundscapeStorageService.saveSoundscape(sessionData);
      
      if (success) {
        // Session saved successfully - navigate to library tab
        console.log('Session saved successfully');
        // Try multiple navigation approaches
        try {
          // First try: direct navigation to Library tab
          navigation.navigate('Library');
        } catch (error) {
          try {
            // Second try: navigate to parent then Library
            navigation.getParent()?.navigate('Library');
          } catch (error2) {
            try {
              // Third try: reset to Library tab
              navigation.reset({
                index: 0,
                routes: [{ name: 'Library' }],
              });
            } catch (error3) {
              // Fallback: just go back
              navigation.goBack();
            }
          }
        }
      } else {
        console.error('Save operation failed');
      }
    } catch (error) {
      console.error('Save session error:', error);
      Alert.alert('system_error', 'unexpected_save_failure');
    }
  }, [isPlaybackMode, currentBpm, selectedNoiseType, sessionTime, noiseParams.amplitude, noiseParams.modulation, confidence, navigation]);
  
  // FIX #3: Memoize getModeInfo to prevent recreation on every render
  const modeInfo = useMemo(() => {
    if (isPlaybackMode) {
      return {
        color: colors.signalOrange,
        text: 'PLAYBACK_MODE_ACTIVE',
        subtitle: 'replaying_saved_biometric_data'
      };
    }
    return {
      color: colors.biometricBlue,
      text: 'NOISE_SOUNDSCAPE_ACTIVE',
      subtitle: 'static_pattern_generator'
    };
  }, [isPlaybackMode]);
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.void} />
      
      {/* Header - MODE-AWARE */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.logo}>sonαrly</Text>
          <Text style={styles.subtitle}>{modeInfo.subtitle}</Text>
          <Text style={[styles.modeIndicator, { color: modeInfo.color }]}>{modeInfo.text}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.sessionInfo}>
            session: <Text style={styles.accent}>{formatTime(sessionTime)}</Text>{'\n'}
            type: <Text style={styles.accent}>{selectedNoiseType.toUpperCase()}</Text>{'\n'}
            biorhythm: <Text style={styles.accent}>{Math.round(biorhythmIntensity * 100)}%</Text>
            {isPlaybackMode && (
              <>
                {'\n'}mode: <Text style={[styles.accent, { color: colors.signalOrange }]}>REPLAY</Text>
              </>
            )}
          </Text>
        </View>
      </View>
      
      {/* Mode indicator line - different color for playback */}
      <View style={[styles.modeIndicatorLine, { backgroundColor: modeInfo.color }]} />
      
      {/* Scanline effect */}
      <Animated.View 
        style={[
          styles.scanline,
          {
            backgroundColor: modeInfo.color,
            transform: [{
              translateX: scanlineAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-width, width],
              })
            }]
          }
        ]} 
      />
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Playback Mode Notice */}
        {isPlaybackMode && (
          <View style={styles.playbackNotice}>
            <Text style={styles.playbackNoticeTitle}>🔄 session_playback_mode</Text>
            <Text style={styles.playbackNoticeText}>
              replaying_saved_session: <Text style={styles.accent}>{savedData?.name || 'unnamed_session'}</Text>{'\n'}
              original_duration: <Text style={styles.accent}>{savedData?.duration || 0}s</Text> | 
              recorded_hr: <Text style={styles.accent}>{savedData?.heartRate || 0} BPM</Text>
            </Text>
          </View>
        )}
        
        {/* Noise Type Selector - disabled in playback mode */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>noise_type_selector</Text>
            <Text style={styles.moduleMeta}>
              {isPlaybackMode ? 'locked_to_original_settings' : 'spectral_distribution_control'}
            </Text>
          </View>
          
          <View style={styles.noiseTypeGrid}>
            {Object.entries(noiseTypes).map(([type, config]) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.noiseTypeCard,
                  selectedNoiseType === type && styles.noiseTypeCardActive,
                  isPlaybackMode && styles.noiseTypeCardDisabled
                ]}
                onPress={() => !isPlaybackMode && setSelectedNoiseType(type)}
                disabled={isPlaybackMode}
              >
                <Text style={[styles.noisePattern, { color: config.color }]}>
                  {config.pattern}
                </Text>
                <Text style={styles.noiseTypeName}>{config.name}</Text>
                <Text style={styles.noiseTypeDescription}>{config.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Static Pattern Visualization */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>static_pattern_display</Text>
            <Text style={styles.moduleMeta}>
              {isPlaybackMode ? 'saved_biometric_visualization' : 'real_time_noise_visualization'}
            </Text>
          </View>
          
          <View style={styles.staticVisualization}>
            <Animated.View
              style={[
                styles.staticPattern,
                {
                  opacity: staticAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1.0],
                  })
                }
              ]}
            >
              {Array.from({ length: 64 }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.staticDot,
                    {
                      backgroundColor: currentNoise.color,
                      opacity: Math.random() * 0.8 + 0.2,
                    }
                  ]}
                />
              ))}
            </Animated.View>
            
            <Animated.View
              style={[
                styles.biorhythmOverlay,
                {
                  backgroundColor: modeInfo.color,
                  opacity: biorhythmAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [biorhythmIntensity * 0.3, biorhythmIntensity * 0.8],
                  })
                }
              ]}
            />
          </View>
          
          <View style={styles.parameterRow}>
            <Text style={styles.parameterText}>
              HR: <Text style={[styles.accentText, { color: modeInfo.color }]}>{currentBpm} BPM</Text> | 
              Amp: <Text style={[styles.accentText, { color: modeInfo.color }]}>{Math.round(noiseParams.amplitude * 100)}%</Text> | 
              Mod: <Text style={[styles.accentText, { color: modeInfo.color }]}>{Math.round(noiseParams.modulation * 100)}%</Text>
            </Text>
          </View>
        </View>
        
        {/* Biometric Mapping */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>biometric_mapping</Text>
            <Text style={styles.moduleMeta}>
              {isPlaybackMode ? 'replaying_saved_parameters' : 'physiological_parameter_routing'}
            </Text>
          </View>
          
          <View style={styles.mappingGrid}>
            <View style={styles.mappingItem}>
              <Text style={styles.mappingSource}>heart_rate</Text>
              <Text style={[styles.mappingArrow, { color: modeInfo.color }]}>→</Text>
              <Text style={[styles.mappingTarget, { color: modeInfo.color }]}>amplitude</Text>
              <Text style={styles.mappingValue}>{Math.round(noiseParams.amplitude * 100)}%</Text>
            </View>
            
            <View style={styles.mappingItem}>
              <Text style={styles.mappingSource}>hrv</Text>
              <Text style={[styles.mappingArrow, { color: modeInfo.color }]}>→</Text>
              <Text style={[styles.mappingTarget, { color: modeInfo.color }]}>cutoff_freq</Text>
              <Text style={styles.mappingValue}>{Math.round(noiseParams.cutoffFreq * 100)}%</Text>
            </View>
            
            <View style={styles.mappingItem}>
              <Text style={styles.mappingSource}>variability</Text>
              <Text style={[styles.mappingArrow, { color: modeInfo.color }]}>→</Text>
              <Text style={[styles.mappingTarget, { color: modeInfo.color }]}>modulation</Text>
              <Text style={styles.mappingValue}>{Math.round(noiseParams.modulation * 100)}%</Text>
            </View>
          </View>
        </View>
        
        {/* Real-time Telemetry */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>
              {isPlaybackMode ? 'playback_telemetry' : 'noise_telemetry'}
            </Text>
            <Text style={styles.moduleMeta}>parameter_log_stream</Text>
          </View>
          
          <View style={styles.logContainer}>
            {telemetryLog.map((entry, index) => (
              <Text key={index} style={styles.logEntry}>
                <Text style={[styles.logTimestamp, { color: modeInfo.color }]}>[{entry.timestamp}]</Text>{' '}
                {entry.noiseType.toUpperCase()} | 
                HR=<Text style={styles.logValue}>{entry.bpm}</Text> | 
                A=<Text style={styles.logValue}>{entry.amplitude}</Text> | 
                M=<Text style={styles.logValue}>{entry.modulation}</Text>
              </Text>
            ))}
          </View>
        </View>
        
        {/* Control Interface */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[
              styles.controlButton, 
              isPlaying && styles.controlButtonActive,
              isPlaybackMode && { borderColor: colors.signalOrange }
            ]}
            onPress={togglePlayback}
          >
            <Text style={styles.controlButtonText}>
              {isPlaying 
                ? (isPlaybackMode ? '[STOP_PLAYBACK]' : '[STOP_NOISE_GENERATION]')
                : (isPlaybackMode ? '[START_PLAYBACK]' : '[START_NOISE_GENERATION]')
              }
            </Text>
          </TouchableOpacity>
          
          {!isPlaybackMode && (
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.biometricBlue }]}
              onPress={handleSaveSession}
            >
              <Text style={styles.saveButtonText}>
                [SAVE_NOISE_SESSION] →
              </Text>
            </TouchableOpacity>
          )}
          
          {isPlaybackMode && (
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.dimmed }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.saveButtonText}>
                [BACK_TO_LIBRARY] ←
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.graphite,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  backButton: {
    fontSize: 12,
    color: colors.pulseRed,
    fontFamily: typography.fonts.mono,
    fontWeight: typography.weights.semibold,
  },
  headerCenter: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 20,
    fontWeight: typography.weights.bold,
    color: colors.text,
    fontFamily: typography.fonts.mono,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 8,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    marginTop: 2,
  },
  modeIndicator: {
    fontSize: 7,
    fontFamily: typography.fonts.mono,
    marginTop: 1,
    letterSpacing: 0.5,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  sessionInfo: {
    fontSize: 9,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    textAlign: 'right',
    lineHeight: 12,
  },
  accent: {
    color: colors.biometricBlue,
  },
  modeIndicatorLine: {
    height: 2,
    width: '100%',
    opacity: 0.8,
  },
  scanline: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    opacity: 0.3,
    zIndex: 10,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  playbackNotice: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.signalOrange,
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  playbackNoticeTitle: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.signalOrange,
    fontFamily: typography.fonts.mono,
    marginBottom: 4,
  },
  playbackNoticeText: {
    fontSize: 9,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    lineHeight: 12,
  },
  module: {
    backgroundColor: colors.graphite,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moduleTitle: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.biometricBlue,
    fontFamily: typography.fonts.mono,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moduleMeta: {
    fontSize: 9,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
  },
  noiseTypeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noiseTypeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  noiseTypeCardActive: {
    borderColor: colors.biometricBlue,
    backgroundColor: colors.void,
  },
  noiseTypeCardDisabled: {
    opacity: 0.5,
  },
  noisePattern: {
    fontSize: 16,
    fontFamily: typography.fonts.mono,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  noiseTypeName: {
    fontSize: 10,
    color: colors.biometricBlue,
    fontFamily: typography.fonts.mono,
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
  },
  noiseTypeDescription: {
    fontSize: 8,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    textAlign: 'center',
  },
  staticVisualization: {
    height: 120,
    backgroundColor: colors.void,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
  },
  staticPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  staticDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    margin: 2,
  },
  biorhythmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  parameterRow: {
    alignItems: 'center',
  },
  parameterText: {
    fontSize: 11,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    letterSpacing: 1,
  },
  accentText: {
    fontWeight: typography.weights.semibold,
  },
  mappingGrid: {
    gap: 12,
  },
  mappingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.void,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 4,
    padding: 12,
  },
  mappingSource: {
    fontSize: 10,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    flex: 1,
  },
  mappingArrow: {
    fontSize: 12,
    fontFamily: typography.fonts.mono,
    marginHorizontal: 8,
  },
  mappingTarget: {
    fontSize: 10,
    fontFamily: typography.fonts.mono,
    flex: 1,
    textAlign: 'center',
  },
  mappingValue: {
    fontSize: 10,
    color: colors.white,
    fontFamily: typography.fonts.mono,
    fontWeight: typography.weights.semibold,
    flex: 1,
    textAlign: 'right',
  },
  logContainer: {
    backgroundColor: colors.void,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 4,
    padding: 12,
    height: 120,
  },
  logEntry: {
    fontSize: 8,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    lineHeight: 12,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  logTimestamp: {
    fontWeight: typography.weights.semibold,
  },
  logValue: {
    color: colors.biometricBlue,
    fontWeight: typography.weights.semibold,
  },
  controlsContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  controlButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  controlButtonActive: {
    backgroundColor: colors.pulseRed,
    borderColor: colors.pulseRed,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    fontFamily: typography.fonts.mono,
    letterSpacing: 1,
  },
  saveButton: {
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: typography.weights.semibold,
    color: colors.void,
    fontFamily: typography.fonts.mono,
    letterSpacing: 1,
  },
});

export default NoiseMonitorScreen;