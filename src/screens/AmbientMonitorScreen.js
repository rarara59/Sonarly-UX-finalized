import React, { useState, useEffect, useRef } from 'react';
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
  console.log('Design system import error in AmbientMonitorScreen, using fallbacks:', error);
}

const { width, height } = Dimensions.get('window');

const AmbientMonitorScreen = ({ route, navigation }) => {
  // Extract biometric data and mode from navigation
  const { 
    bpm = 75, 
    confidence = 85, 
    key = 'Dm', 
    mode = 'ambient', 
    modeConfig,
    savedSession = false,    // Detect if this is playback
    savedData = null         // Get the saved session data
  } = route?.params || {};
  
  // Debug logging
  console.log('AmbientMonitorScreen params:', route?.params);
  console.log('savedSession:', savedSession);
  console.log('savedData:', savedData);
  
  // Session mode - 'create' or 'playback' - compute directly from props
  const isPlaybackMode = Boolean(savedSession && savedData);
  
  console.log('isPlaybackMode:', isPlaybackMode);
  
  // Initialize state based on session mode
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentBpm, setCurrentBpm] = useState(
    isPlaybackMode ? savedData?.heartRate || bpm : bpm
  );
  const [intensityLevel, setIntensityLevel] = useState(
    isPlaybackMode ? savedData?.intensityLevel || 'moderate' : 'moderate'
  );
  const [biorhythmIntensity, setBiorhythmIntensity] = useState(0.5);
  
  // Ambient-specific parameters
  const [ambientParams, setAmbientParams] = useState({
    reverbSize: isPlaybackMode ? savedData?.reverbSize || 0.7 : 0.7,
    filterCutoff: 0.6,
    padLayers: isPlaybackMode ? savedData?.padLayers || 4 : 4,
    atmosphericDensity: 0.8,
    evolutionRate: 0.3,
  });
  
  // Playback-specific state
  const [biometricIndex, setBiometricIndex] = useState(0);
  const [savedBiometricData] = useState(() => {
    if (isPlaybackMode && savedData) {
      const baseHR = savedData.heartRate;
      return Array.from({ length: 30 }, (_, i) => {
        const variation = Math.sin(i * 0.2) * 3 + (Math.random() - 0.5) * 2;
        return Math.round(baseHR + variation);
      });
    }
    return [];
  });
  
  const [telemetryLog, setTelemetryLog] = useState([]);
  
  // Animation references
  const flowAnim = useRef(new Animated.Value(0)).current;
  const intensityAnim = useRef(new Animated.Value(0)).current;
  const scanlineAnim = useRef(new Animated.Value(0)).current;
  
  // Intensity levels configuration
  const intensityLevels = {
    gentle: {
      name: 'GENTLE',
      description: 'minimal_atmospheric_presence',
      color: colors.dimmed,
      pattern: '∼ ∼ ∼\n∼ ∼ ∼\n∼ ∼ ∼',
    },
    moderate: {
      name: 'MODERATE', 
      description: 'balanced_ambient_flow',
      color: colors.pulseRed,
      pattern: '≈ ≈ ≈\n≈ ≈ ≈\n≈ ≈ ≈',
    },
    intense: {
      name: 'INTENSE',
      description: 'full_atmospheric_immersion', 
      color: colors.signalOrange,
      pattern: '≋ ≋ ≋\n≋ ≋ ≋\n≋ ≋ ≋',
    },
  };
  
  // Biometric simulation - different behavior for playback vs create mode
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        if (isPlaybackMode && savedBiometricData.length > 0) {
          // PLAYBACK MODE: Loop through saved biometric data
          const currentIndex = biometricIndex % savedBiometricData.length;
          const newBpm = savedBiometricData[currentIndex];
          setCurrentBpm(newBpm);
          setBiometricIndex(prev => prev + 1);
          
          // Calculate parameters from saved biometric data
          const normalizedBpm = (newBpm - 60) / 40;
          const hrv = 35 + Math.sin(currentIndex * 0.3) * 10;
          
          // Determine intensity level based on BPM ranges
          let newIntensityLevel = 'moderate';
          if (newBpm < 70) newIntensityLevel = 'gentle';
          else if (newBpm > 85) newIntensityLevel = 'intense';
          setIntensityLevel(newIntensityLevel);
          
          setBiorhythmIntensity(Math.max(0.2, Math.min(0.9, hrv / 50)));
          setAmbientParams(prev => ({
            ...prev,
            reverbSize: Math.max(0.3, Math.min(0.9, normalizedBpm)),
            filterCutoff: Math.max(0.2, Math.min(0.8, hrv / 60)),
            padLayers: Math.round(Math.max(2, Math.min(6, normalizedBpm * 6))),
          }));
          
          const timestamp = new Date().toISOString().substr(14, 8);
          const logEntry = {
            timestamp,
            bpm: newBpm,
            intensity: newIntensityLevel,
            reverb: Math.round(normalizedBpm * 100) / 100,
            filter: Math.round((hrv / 60) * 100) / 100,
            layers: Math.round(normalizedBpm * 6),
          };
          
          setTelemetryLog(prev => [logEntry, ...prev.slice(0, 5)]);
        } else {
          // CREATE MODE: Live heart rate variation simulation
          const variation = Math.sin(Date.now() * 0.001) * 3;
          const newBpm = bpm + variation;
          setCurrentBpm(Math.round(newBpm));
          
          const normalizedBpm = (newBpm - 60) / 40;
          const hrv = 35 + Math.random() * 15;
          
          let newIntensityLevel = 'moderate';
          if (newBpm < 70) newIntensityLevel = 'gentle';
          else if (newBpm > 85) newIntensityLevel = 'intense';
          setIntensityLevel(newIntensityLevel);
          
          setBiorhythmIntensity(Math.max(0.2, Math.min(0.9, hrv / 50)));
          setAmbientParams(prev => ({
            ...prev,
            reverbSize: Math.max(0.3, Math.min(0.9, normalizedBpm)),
            filterCutoff: Math.max(0.2, Math.min(0.8, hrv / 60)),
            padLayers: Math.round(Math.max(2, Math.min(6, normalizedBpm * 6))),
          }));
          
          const timestamp = new Date().toISOString().substr(14, 8);
          const logEntry = {
            timestamp,
            bpm: Math.round(newBpm),
            intensity: newIntensityLevel,
            reverb: Math.round(normalizedBpm * 100) / 100,
            filter: Math.round((hrv / 60) * 100) / 100,
            layers: Math.round(normalizedBpm * 6),
          };
          
          setTelemetryLog(prev => [logEntry, ...prev.slice(0, 5)]);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, bpm, isPlaybackMode, biometricIndex, savedBiometricData]);
  
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
      // Flow animation
      Animated.loop(
        Animated.timing(flowAnim, {
          toValue: 1,
          duration: 8000, // Slow ambient flow
          useNativeDriver: true,
        })
      ).start();
      
      // Intensity animation based on heart rate
      const pulseDuration = (60 / currentBpm) * 1000 * 4; // Slower than heartbeat
      Animated.loop(
        Animated.sequence([
          Animated.timing(intensityAnim, {
            toValue: 1,
            duration: pulseDuration * 0.5,
            useNativeDriver: true,
          }),
          Animated.timing(intensityAnim, {
            toValue: 0,
            duration: pulseDuration * 0.5,
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
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      if (!isPlaybackMode) {
        setSessionTime(0);
      }
      setTelemetryLog([]);
    }
  };
  
  const currentIntensity = intensityLevels[intensityLevel];
  
  const handleSaveSession = async () => {
    if (isPlaybackMode) {
      Alert.alert(
        'playback_mode_active',
        'cannot_save_during_session_replay'
      );
      return;
    }
    
    try {
      const timestamp = new Date().toISOString();
      const sessionName = `ambient_session_${timestamp.substr(11, 8).replace(/:/g, '')}`;
      
      const sessionData = {
        name: sessionName,
        mode: 'ambient',
        heartRate: currentBpm,
        intensityLevel: intensityLevel,
        timestamp: timestamp,
        duration: sessionTime,
        avgBpm: currentBpm,
        reverbSize: ambientParams.reverbSize,
        padLayers: ambientParams.padLayers,
        quality: confidence,
        createdAt: timestamp,
      };
      
      const success = await SoundscapeStorageService.saveSoundscape(sessionData);
      
      if (success) {
        // Session saved successfully - navigate to library tab
        console.log('Ambient session saved successfully');
        navigation.navigate('Library');
      } else {
        console.error('Save operation failed');
      }
    } catch (error) {
      console.error('Save session error:', error);
      Alert.alert('system_error', 'unexpected_save_failure');
    }
  };
  
  // Get mode indicator color and text
  const getModeInfo = () => {
    if (isPlaybackMode) {
      return {
        color: colors.signalOrange,
        text: 'PLAYBACK_MODE_ACTIVE',
        subtitle: 'replaying_saved_biometric_data'
      };
    }
    return {
      color: colors.pulseRed,
      text: 'AMBIENT_SOUNDSCAPE_ACTIVE',
      subtitle: 'atmospheric_pad_generator'
    };
  };
  
  const modeInfo = getModeInfo();
  
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
            intensity: <Text style={styles.accent}>{Math.round(biorhythmIntensity * 100)}%</Text>{'\n'}
            density: <Text style={styles.accent}>{Math.round(ambientParams.atmosphericDensity * 100)}%</Text>
            {isPlaybackMode && (
              <>
                {'\n'}mode: <Text style={[styles.accent, { color: colors.signalOrange }]}>REPLAY</Text>
              </>
            )}
          </Text>
        </View>
      </View>
      
      {/* Mode indicator line */}
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
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
        
        {/* Intensity Level Selector - disabled in playback mode */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>intensity_level_selector</Text>
            <Text style={styles.moduleMeta}>
              {isPlaybackMode ? 'locked_to_original_settings' : 'atmospheric_depth_control'}
            </Text>
          </View>
          
          <View style={styles.intensityGrid}>
            {Object.entries(intensityLevels).map(([level, config]) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.intensityCard,
                  intensityLevel === level && styles.intensityCardActive,
                  isPlaybackMode && styles.intensityCardDisabled
                ]}
                onPress={() => !isPlaybackMode && setIntensityLevel(level)}
                disabled={isPlaybackMode}
              >
                <Text style={[styles.intensityPattern, { color: config.color }]}>
                  {config.pattern}
                </Text>
                <Text style={styles.intensityName}>{config.name}</Text>
                <Text style={styles.intensityDescription}>{config.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Intensity Flow Display */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>intensity_flow_display</Text>
            <Text style={styles.moduleMeta}>
              {isPlaybackMode ? 'saved_atmosphere_visualization' : 'biometric_atmosphere_viz'}
            </Text>
          </View>
          
          <View style={styles.intensityVisualization}>
            <View style={styles.intensityMeter}>
              <Text style={styles.intensityLabel}>INTENSITY LEVEL</Text>
              <Text style={[styles.intensityValue, { color: currentIntensity.color }]}>
                {currentIntensity.name}
              </Text>
              <Text style={styles.intensityPercent}>
                {Math.round(biorhythmIntensity * 100)}%
              </Text>
            </View>
            
            <View style={styles.flowBars}>
              {Array.from({ length: 5 }, (_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.flowBar,
                    {
                      backgroundColor: currentIntensity.color,
                      transform: [{
                        scaleY: intensityAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3 + i * 0.2, 1.0 + i * 0.3],
                        })
                      }],
                      opacity: flowAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.3, 1, 0.3],
                      })
                    }
                  ]}
                />
              ))}
            </View>
          </View>
          
          <View style={styles.parameterRow}>
            <Text style={styles.parameterText}>
              HR: <Text style={[styles.accentText, { color: modeInfo.color }]}>{currentBpm} BPM</Text> | 
              Reverb: <Text style={[styles.accentText, { color: modeInfo.color }]}>{Math.round(ambientParams.reverbSize * 100)}%</Text> | 
              Layers: <Text style={[styles.accentText, { color: modeInfo.color }]}>{ambientParams.padLayers}</Text>
            </Text>
          </View>
        </View>
        
        {/* Pad Layer Control */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>pad_layer_control</Text>
            <Text style={styles.moduleMeta}>texture_management</Text>
          </View>
          
          <View style={styles.padLayerGrid}>
            {Array.from({ length: 5 }, (_, i) => {
              const layerActive = i < ambientParams.padLayers;
              const flowLevel = ['30%', '50%', '70%', '40%', '90%'][i];
              return (
                <View
                  key={i}
                  style={[
                    styles.padLayerCard,
                    layerActive && { borderColor: currentIntensity.color }
                  ]}
                >
                  <View
                    style={[
                      styles.padLayerIndicator,
                      {
                        backgroundColor: layerActive ? currentIntensity.color : colors.surface,
                      }
                    ]}
                  />
                  <Text style={styles.padLayerLabel}>
                    flow:{'\n'}{flowLevel}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Event Timeline */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>event_timeline</Text>
            <Text style={styles.moduleMeta}>progression_log</Text>
          </View>
          
          <View style={styles.timelineContainer}>
            <Text style={styles.timelineTitle}>NEXT EVENT IN:</Text>
            <Text style={[styles.timelineCountdown, { color: currentIntensity.color }]}>
              {Math.floor(Math.random() * 10)}s
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
              <Text style={styles.mappingSource}>hrv</Text>
              <Text style={[styles.mappingArrow, { color: modeInfo.color }]}>→</Text>
              <Text style={[styles.mappingTarget, { color: modeInfo.color }]}>reverb_size</Text>
              <Text style={styles.mappingValue}>{Math.round(ambientParams.reverbSize * 100)}%</Text>
            </View>
            
            <View style={styles.mappingItem}>
              <Text style={styles.mappingSource}>breathing</Text>
              <Text style={[styles.mappingArrow, { color: modeInfo.color }]}>→</Text>
              <Text style={[styles.mappingTarget, { color: modeInfo.color }]}>filter_cutoff</Text>
              <Text style={styles.mappingValue}>{Math.round(ambientParams.filterCutoff * 100)}%</Text>
            </View>
            
            <View style={styles.mappingItem}>
              <Text style={styles.mappingSource}>combined</Text>
              <Text style={[styles.mappingArrow, { color: modeInfo.color }]}>→</Text>
              <Text style={[styles.mappingTarget, { color: modeInfo.color }]}>pad_layers</Text>
              <Text style={styles.mappingValue}>{ambientParams.padLayers}</Text>
            </View>
          </View>
        </View>
        
        {/* Real-time Telemetry */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>
              {isPlaybackMode ? 'playback_telemetry' : 'ambient_telemetry'}
            </Text>
            <Text style={styles.moduleMeta}>parameter_log_stream</Text>
          </View>
          
          <View style={styles.logContainer}>
            {telemetryLog.map((entry, index) => (
              <Text key={index} style={styles.logEntry}>
                <Text style={[styles.logTimestamp, { color: modeInfo.color }]}>[{entry.timestamp}]</Text>{' '}
                {entry.intensity.toUpperCase()} | 
                HR=<Text style={styles.logValue}>{entry.bpm}</Text> | 
                R=<Text style={styles.logValue}>{entry.reverb}</Text> | 
                L=<Text style={styles.logValue}>{entry.layers}</Text>
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
                ? (isPlaybackMode ? '[STOP_PLAYBACK]' : '[STOP_AMBIENT_GENERATION]')
                : (isPlaybackMode ? '[START_PLAYBACK]' : '[START_AMBIENT_GENERATION]')
              }
            </Text>
          </TouchableOpacity>
          
          {!isPlaybackMode && (
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.pulseRed }]}
              onPress={handleSaveSession}
            >
              <Text style={styles.saveButtonText}>
                [SAVE_AMBIENT_SESSION] →
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
    color: colors.pulseRed,
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
    color: colors.pulseRed,
    fontFamily: typography.fonts.mono,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moduleMeta: {
    fontSize: 9,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
  },
  intensityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intensityCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  intensityCardActive: {
    borderColor: colors.pulseRed,
    backgroundColor: colors.void,
  },
  intensityCardDisabled: {
    opacity: 0.5,
  },
  intensityPattern: {
    fontSize: 16,
    fontFamily: typography.fonts.mono,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  intensityName: {
    fontSize: 10,
    color: colors.pulseRed,
    fontFamily: typography.fonts.mono,
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
  },
  intensityDescription: {
    fontSize: 8,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    textAlign: 'center',
  },
  intensityVisualization: {
    height: 120,
    backgroundColor: colors.void,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 4,
    flexDirection: 'row',
    marginBottom: 16,
  },
  intensityMeter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.surface,
  },
  intensityLabel: {
    fontSize: 8,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    marginBottom: 4,
  },
  intensityValue: {
    fontSize: 14,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.mono,
    marginBottom: 4,
  },
  intensityPercent: {
    fontSize: 12,
    color: colors.white,
    fontFamily: typography.fonts.mono,
  },
  flowBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    padding: 16,
  },
  flowBar: {
    width: 8,
    height: 40,
    borderRadius: 4,
  },
  padLayerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  padLayerCard: {
    flex: 1,
    backgroundColor: colors.void,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 4,
    padding: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  padLayerIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  padLayerLabel: {
    fontSize: 8,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    textAlign: 'center',
    lineHeight: 10,
  },
  timelineContainer: {
    backgroundColor: colors.void,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
  },
  timelineTitle: {
    fontSize: 10,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    marginBottom: 8,
  },
  timelineCountdown: {
    fontSize: 24,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.mono,
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
    color: colors.pulseRed,
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

export default AmbientMonitorScreen;