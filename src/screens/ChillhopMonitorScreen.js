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
  console.log('Design system import error in ChillhopMonitorScreen, using fallbacks:', error);
}

const { width, height } = Dimensions.get('window');

const ChillhopMonitorScreen = ({ route, navigation }) => {
  // Extract biometric data and mode from navigation
  const { 
    bpm = 75, 
    confidence = 85, 
    key = 'Dm', 
    mode = 'chillhop', 
    modeConfig,
    savedSession = false,    // Detect if this is playback
    savedData = null         // Get the saved session data
  } = route?.params || {};
  
  // Session mode - 'create' or 'playback'
  const [sessionMode] = useState(savedSession ? 'playback' : 'create');
  const isPlaybackMode = sessionMode === 'playback';
  
  // Initialize state based on session mode
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentBpm, setCurrentBpm] = useState(
    isPlaybackMode ? savedData?.heartRate || bpm : bpm
  );
  const [activityLevel, setActivityLevel] = useState(
    isPlaybackMode ? savedData?.activityLevel || 'moderate' : 'moderate'
  );
  const [biorhythmIntensity, setBiorhythmIntensity] = useState(0.5);
  
  // Chillhop-specific parameters
  const [beatParams, setBeatParams] = useState({
    tempo: isPlaybackMode ? savedData?.heartRate || bpm : bpm,
    swing: 0.6,
    layerIntensity: isPlaybackMode ? savedData?.layerIntensity || 0.7 : 0.7,
    bassWeight: 0.8,
    melodyComplexity: 0.5,
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
  const beatAnim = useRef(new Animated.Value(0)).current;
  const layerAnim = useRef(new Animated.Value(0)).current;
  const scanlineAnim = useRef(new Animated.Value(0)).current;
  
  // Activity levels configuration
  const activityLevels = {
    low: {
      name: 'LOW',
      description: 'minimal_beat_layers',
      color: colors.dimmed,
      pattern: '◯ ○ ◯\n○ ◯ ○\n◯ ○ ◯',
    },
    moderate: {
      name: 'MODERATE', 
      description: 'balanced_rhythmic_complexity',
      color: colors.signalOrange,
      pattern: '● ◉ ●\n◉ ● ◉\n● ◉ ●',
    },
    high: {
      name: 'HIGH',
      description: 'full_layer_engagement', 
      color: colors.pulseRed,
      pattern: '◆ ◆ ◆\n◆ ◆ ◆\n◆ ◆ ◆',
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
          
          // Determine activity level based on BPM ranges
          let newActivityLevel = 'moderate';
          if (newBpm < 70) newActivityLevel = 'low';
          else if (newBpm > 85) newActivityLevel = 'high';
          setActivityLevel(newActivityLevel);
          
          setBiorhythmIntensity(Math.max(0.2, Math.min(0.9, hrv / 50)));
          setBeatParams(prev => ({
            ...prev,
            tempo: newBpm,
            layerIntensity: Math.max(0.3, Math.min(0.9, normalizedBpm)),
            swing: Math.max(0.4, Math.min(0.8, hrv / 60)),
          }));
          
          const timestamp = new Date().toISOString().substr(14, 8);
          const logEntry = {
            timestamp,
            bpm: newBpm,
            activity: newActivityLevel,
            tempo: newBpm,
            layers: Math.round(normalizedBpm * 100) / 100,
            swing: Math.round((hrv / 60) * 100) / 100,
          };
          
          setTelemetryLog(prev => [logEntry, ...prev.slice(0, 5)]);
        } else {
          // CREATE MODE: Live heart rate variation simulation
          const variation = Math.sin(Date.now() * 0.001) * 3;
          const newBpm = bpm + variation;
          setCurrentBpm(Math.round(newBpm));
          
          const normalizedBpm = (newBpm - 60) / 40;
          const hrv = 35 + Math.random() * 15;
          
          let newActivityLevel = 'moderate';
          if (newBpm < 70) newActivityLevel = 'low';
          else if (newBpm > 85) newActivityLevel = 'high';
          setActivityLevel(newActivityLevel);
          
          setBiorhythmIntensity(Math.max(0.2, Math.min(0.9, hrv / 50)));
          setBeatParams(prev => ({
            ...prev,
            tempo: Math.round(newBpm),
            layerIntensity: Math.max(0.3, Math.min(0.9, normalizedBpm)),
            swing: Math.max(0.4, Math.min(0.8, hrv / 60)),
          }));
          
          const timestamp = new Date().toISOString().substr(14, 8);
          const logEntry = {
            timestamp,
            bpm: Math.round(newBpm),
            activity: newActivityLevel,
            tempo: Math.round(newBpm),
            layers: Math.round(normalizedBpm * 100) / 100,
            swing: Math.round((hrv / 60) * 100) / 100,
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
      // Beat animation
      const beatDuration = (60 / currentBpm) * 1000;
      Animated.loop(
        Animated.sequence([
          Animated.timing(beatAnim, {
            toValue: 1,
            duration: beatDuration * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(beatAnim, {
            toValue: 0,
            duration: beatDuration * 0.8,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Layer animation
      Animated.loop(
        Animated.timing(layerAnim, {
          toValue: 1,
          duration: beatDuration * 4, // One measure
          useNativeDriver: true,
        })
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
  
  const currentActivity = activityLevels[activityLevel];
  
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
      const sessionName = `chillhop_session_${timestamp.substr(11, 8).replace(/:/g, '')}`;
      
      const sessionData = {
        name: sessionName,
        mode: 'chillhop',
        heartRate: currentBpm,
        activityLevel: activityLevel,
        timestamp: timestamp,
        duration: sessionTime,
        avgBpm: currentBpm,
        layerIntensity: beatParams.layerIntensity,
        swing: beatParams.swing,
        quality: confidence,
        createdAt: timestamp,
      };
      
      const success = await SoundscapeStorageService.saveSoundscape(sessionData);
      
      if (success) {
        // Session saved successfully - no popup, just continue
        console.log('Chillhop session saved successfully');
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
      color: colors.signalOrange,
      text: 'CHILLHOP_SOUNDSCAPE_ACTIVE',
      subtitle: 'rhythmic_beat_generator'
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
            activity: <Text style={styles.accent}>{activityLevel.toUpperCase()}</Text>{'\n'}
            tempo: <Text style={styles.accent}>{beatParams.tempo} BPM</Text>
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
        
        {/* Activity Level Selector - disabled in playback mode */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>activity_level_selector</Text>
            <Text style={styles.moduleMeta}>
              {isPlaybackMode ? 'locked_to_original_settings' : 'beat_complexity_control'}
            </Text>
          </View>
          
          <View style={styles.activityGrid}>
            {Object.entries(activityLevels).map(([level, config]) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.activityCard,
                  activityLevel === level && styles.activityCardActive,
                  isPlaybackMode && styles.activityCardDisabled
                ]}
                onPress={() => !isPlaybackMode && setActivityLevel(level)}
                disabled={isPlaybackMode}
              >
                <Text style={[styles.activityPattern, { color: config.color }]}>
                  {config.pattern}
                </Text>
                <Text style={styles.activityName}>{config.name}</Text>
                <Text style={styles.activityDescription}>{config.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Beat Visualization */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>beat_pattern_display</Text>
            <Text style={styles.moduleMeta}>
              {isPlaybackMode ? 'saved_rhythm_visualization' : 'real_time_beat_visualization'}
            </Text>
          </View>
          
          <View style={styles.beatVisualization}>
            <Animated.View
              style={[
                styles.beatIndicator,
                {
                  backgroundColor: currentActivity.color,
                  opacity: beatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1.0],
                  }),
                  transform: [{
                    scale: beatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.2],
                    })
                  }]
                }
              ]}
            />
            
            <Animated.View
              style={[
                styles.layerOverlay,
                {
                  backgroundColor: modeInfo.color,
                  opacity: layerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.1, 0.4],
                  })
                }
              ]}
            />
          </View>
          
          <View style={styles.parameterRow}>
            <Text style={styles.parameterText}>
              Tempo: <Text style={[styles.accentText, { color: modeInfo.color }]}>{beatParams.tempo} BPM</Text> | 
              Layers: <Text style={[styles.accentText, { color: modeInfo.color }]}>{Math.round(beatParams.layerIntensity * 100)}%</Text> | 
              Swing: <Text style={[styles.accentText, { color: modeInfo.color }]}>{Math.round(beatParams.swing * 100)}%</Text>
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
              <Text style={[styles.mappingTarget, { color: modeInfo.color }]}>tempo</Text>
              <Text style={styles.mappingValue}>{beatParams.tempo} BPM</Text>
            </View>
            
            <View style={styles.mappingItem}>
              <Text style={styles.mappingSource}>hrv</Text>
              <Text style={[styles.mappingArrow, { color: modeInfo.color }]}>→</Text>
              <Text style={[styles.mappingTarget, { color: modeInfo.color }]}>swing_feel</Text>
              <Text style={styles.mappingValue}>{Math.round(beatParams.swing * 100)}%</Text>
            </View>
            
            <View style={styles.mappingItem}>
              <Text style={styles.mappingSource}>activity</Text>
              <Text style={[styles.mappingArrow, { color: modeInfo.color }]}>→</Text>
              <Text style={[styles.mappingTarget, { color: modeInfo.color }]}>layer_count</Text>
              <Text style={styles.mappingValue}>{Math.round(beatParams.layerIntensity * 100)}%</Text>
            </View>
          </View>
        </View>
        
        {/* Real-time Telemetry */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>
              {isPlaybackMode ? 'playback_telemetry' : 'chillhop_telemetry'}
            </Text>
            <Text style={styles.moduleMeta}>parameter_log_stream</Text>
          </View>
          
          <View style={styles.logContainer}>
            {telemetryLog.map((entry, index) => (
              <Text key={index} style={styles.logEntry}>
                <Text style={[styles.logTimestamp, { color: modeInfo.color }]}>[{entry.timestamp}]</Text>{' '}
                {entry.activity.toUpperCase()} | 
                HR=<Text style={styles.logValue}>{entry.bpm}</Text> | 
                T=<Text style={styles.logValue}>{entry.tempo}</Text> | 
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
                ? (isPlaybackMode ? '[STOP_PLAYBACK]' : '[STOP_BEAT_GENERATION]')
                : (isPlaybackMode ? '[START_PLAYBACK]' : '[START_BEAT_GENERATION]')
              }
            </Text>
          </TouchableOpacity>
          
          {!isPlaybackMode && (
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.signalOrange }]}
              onPress={handleSaveSession}
            >
              <Text style={styles.saveButtonText}>
                [SAVE_CHILLHOP_SESSION] →
              </Text>
            </TouchableOpacity>
          )}
          
          {isPlaybackMode && (
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.dimmed }]}
              onPress={() => Alert.alert(
                'playback_mode_notice',
                'this_is_a_saved_session_replay_tap_back_to_return_to_library'
              )}
            >
              <Text style={styles.saveButtonText}>
                [SAVED_SESSION_REPLAY] ℹ
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
    color: colors.signalOrange,
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
    color: colors.signalOrange,
    fontFamily: typography.fonts.mono,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moduleMeta: {
    fontSize: 9,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
  },
  activityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activityCardActive: {
    borderColor: colors.signalOrange,
    backgroundColor: colors.void,
  },
  activityCardDisabled: {
    opacity: 0.5,
  },
  activityPattern: {
    fontSize: 16,
    fontFamily: typography.fonts.mono,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  activityName: {
    fontSize: 10,
    color: colors.signalOrange,
    fontFamily: typography.fonts.mono,
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 8,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    textAlign: 'center',
  },
  beatVisualization: {
    height: 120,
    backgroundColor: colors.void,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  beatIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'absolute',
  },
  layerOverlay: {
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
    color: colors.signalOrange,
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

export default ChillhopMonitorScreen;