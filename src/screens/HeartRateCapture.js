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
} from 'react-native';

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
  console.log('Design system import error in HeartRateCapture, using fallbacks:', error);
}

const { width, height } = Dimensions.get('window');

const HeartRateCapture = ({ navigation, route, onHeartRateDetected }) => {
  // Extract mode from navigation params
  const selectedMode = route?.params?.mode || route?.params?.selectedMode || 'unknown';
  
  console.log('HeartRateCapture received mode:', selectedMode); // Debug log
  
  const [bpm, setBpm] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [signalQuality, setSignalQuality] = useState(0);
  const [key, setKey] = useState('--');
  const [telemetryLog, setTelemetryLog] = useState([]);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const spectrumAnim = useRef(new Animated.Value(0)).current;
  const scanlineAnim = useRef(new Animated.Value(0)).current;
  
  // Mode-specific configuration
  const getModeConfig = (mode) => {
    switch (mode) {
      case 'noise':
        return {
          title: 'STATIC MODE',
          subtitle: 'static_rhythm_generator',
          description: 'white/pink/brown noise synthesis',
          accentColor: colors.biometricBlue,
          targetName: 'static_soundscape',
        };
      case 'chillhop':
        return {
          title: 'LOFI MODE', 
          subtitle: 'beat_layer_generator',
          description: 'lo-fi rhythmic composition',
          accentColor: colors.signalOrange,
          targetName: 'lofi_soundscape',
        };
      case 'ambient':
        return {
          title: 'AMBIENT MODE',
          subtitle: 'atmospheric_pad_generator', 
          description: 'cinematic soundscape synthesis',
          accentColor: colors.pulseRed,
          targetName: 'ambient_soundscape',
        };
      default:
        return {
          title: 'BIOMETRIC MODE',
          subtitle: 'unknown_mode_generator',
          description: 'generic biometric interface',
          accentColor: colors.biometricBlue,
          targetName: 'generic_soundscape',
        };
    }
  };
  
  const modeConfig = getModeConfig(selectedMode);
  
  // Mock data simulation (replace with real PPG when ready)
  useEffect(() => {
    let interval;
    if (isCapturing) {
      interval = setInterval(() => {
        // Mock biometric data with musical mapping
        const mockBpm = 72 + Math.sin(Date.now() * 0.001) * 8;
        const mockConfidence = 85 + Math.random() * 10;
        const mockQuality = 88 + Math.random() * 8;
        
        setBpm(Math.round(mockBpm));
        setConfidence(Math.round(mockConfidence));
        setSignalQuality(Math.round(mockQuality));
        
        // Map BPM to musical key (simplified)
        const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const keyIndex = Math.floor(mockBpm) % 12;
        const mode = mockBpm < 75 ? 'm' : 'M'; // minor for lower BPM
        setKey(keys[keyIndex] + mode);
        
        // Add telemetry log entry with mode context
        const timestamp = new Date().toISOString().substr(14, 8);
        const logEntry = {
          timestamp,
          bpm: Math.round(mockBpm),
          confidence: Math.round(mockConfidence),
          key: keys[keyIndex] + mode,
          hrv: Math.round(35 + Math.random() * 15),
          quality: Math.round(mockQuality),
          mode: selectedMode,
        };
        
        setTelemetryLog(prev => [logEntry, ...prev.slice(0, 4)]);
        
        // Trigger callback for navigation with mode context
        if (onHeartRateDetected && mockConfidence > 90) {
          onHeartRateDetected({
            bpm: Math.round(mockBpm),
            confidence: Math.round(mockConfidence),
            key: keys[keyIndex] + mode,
            mode: selectedMode,
          });
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isCapturing, onHeartRateDetected, selectedMode]);
  
  // Session timer
  useEffect(() => {
    let timer;
    if (isCapturing) {
      timer = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCapturing]);
  
  // Pulse animation
  useEffect(() => {
    if (bpm > 0) {
      const duration = (60 / bpm) * 1000; // Convert BPM to milliseconds
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: duration * 0.7,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [bpm]);
  
  // Spectrum animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(spectrumAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      })
    ).start();
  }, []);
  
  // Scanline animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(scanlineAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const toggleCapture = () => {
    setIsCapturing(!isCapturing);
    if (!isCapturing) {
      setSessionTime(0);
      setTelemetryLog([]);
    }
  };

  const navigateToSoundscape = () => {
    if (bpm > 0 && confidence > 80) {
      if (selectedMode === 'noise') {
        navigation.navigate('NoiseMonitor', {
          bpm, confidence, key, mode: selectedMode, modeConfig,
        });
      } else if (selectedMode === 'chillhop') {
        navigation.navigate('ChillhopMonitor', {
          bpm, confidence, key, mode: selectedMode, modeConfig,
        });
      } else if (selectedMode === 'ambient') {
        navigation.navigate('AmbientMonitor', {
          bpm, confidence, key, mode: selectedMode, modeConfig,
        });
      } else {
        // Fallback to generic player
        navigation.navigate('Soundscape', {
          bpm, confidence, key, mode: selectedMode, modeConfig,
        });
      }
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.void} />
      
      {/* Header - MODE AWARE */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.logo, {color: colors.white}]}>sonarly</Text>
          <Text style={styles.subtitle}>{modeConfig.subtitle}</Text>
          <Text style={styles.modeDescription}>{modeConfig.description}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.modeTitle, { color: modeConfig.accentColor }]}>
            {modeConfig.title}
          </Text>
          <Text style={styles.sessionInfo}>
            session_id: <Text style={styles.accent}>0x{selectedMode.slice(0,2).toUpperCase()}4F</Text>{'\n'}
            runtime: <Text style={styles.accent}>{formatTime(sessionTime)}</Text>{'\n'}
            target: <Text style={styles.accent}>{modeConfig.targetName}</Text>
          </Text>
        </View>
      </View>
      
      {/* Mode indicator line */}
      <View style={[styles.modeIndicator, { backgroundColor: modeConfig.accentColor }]} />
      
      {/* Scanline effect */}
      <Animated.View 
        style={[
          styles.scanline,
          {
            backgroundColor: modeConfig.accentColor,
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
        {/* Primary Oscillator Module */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>heart_rate_monitor</Text>
            <Text style={styles.moduleMeta}>cardiac_rhythm_generator</Text>
          </View>
          
          {/* BPM Display */}
          <View style={styles.bpmContainer}>
            <Animated.View 
              style={[
                styles.bpmDisplay,
                {
                  transform: [{
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05],
                    })
                  }]
                }
              ]}
            >
              <Text style={styles.bpmReading}>{bpm || '--'}</Text>
              <Text style={styles.bpmLabel}>BPM</Text>
            </Animated.View>
            
            {/* Waveform overlay - simplified without SVG */}
            <View style={styles.waveformOverlay}>
              <View style={[styles.waveformLine, { backgroundColor: modeConfig.accentColor }]} />
            </View>
          </View>
          
          {/* Musical notation with mode context */}
          <Text style={styles.notation}>
            key: <Text style={[styles.accentText, { color: modeConfig.accentColor }]}>{key}</Text> | 
            tempo: <Text style={[styles.accentText, { color: modeConfig.accentColor }]}>{bpm} BPM</Text> | 
            mode: <Text style={[styles.accentText, { color: modeConfig.accentColor }]}>{selectedMode.toUpperCase()}</Text>
          </Text>
          
          {/* Sequencer grid */}
          <View style={styles.sequencerGrid}>
            {Array.from({ length: 16 }, (_, i) => (
              <View 
                key={i} 
                style={[
                  styles.sequencerStep,
                  (i % 4 === 0) && [styles.stepBeat, { backgroundColor: modeConfig.accentColor }],
                  (i === (Math.floor(sessionTime * 2) % 16)) && styles.stepActive,
                ]} 
              />
            ))}
          </View>
        </View>
        
        {/* Spectral Analysis Module */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>signal_quality</Text>
            <Text style={styles.moduleMeta}>biometric_data_analysis</Text>
          </View>
          
          {/* Frequency spectrum */}
          <View style={styles.spectrumContainer}>
          {Array.from({ length: 80 }, (_, i) => (  // ← Increased from 32 to 80 bars
            <Animated.View
              key={i}
              style={[
                styles.frequencyBar,
                {
                  backgroundColor: modeConfig.accentColor,
                  borderTopLeftRadius: 1,        // ← Smaller radius for smoother look
                  borderTopRightRadius: 1,       
                  height: spectrumAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      // Smooth sine wave calculation
                      30 + Math.sin(i * 0.15) * 20,
                      35 + Math.sin(i * 0.15 + sessionTime * 0.05) * 25
                    ],
                  })
                }
              ]}
            />
          ))}
        </View>
          
          {/* Status indicators */}
          <View style={styles.statusRow}>
            <View style={styles.statusChip}>
              <Text style={styles.statusText}>
                Signal: <Text style={[styles.accentText, { color: modeConfig.accentColor }]}>{signalQuality}%</Text>
              </Text>
            </View>
            <View style={styles.statusChip}>
              <Text style={styles.statusText}>
                Conf: <Text style={[styles.accentText, { color: modeConfig.accentColor }]}>{confidence}%</Text>
              </Text>
            </View>
          </View>
        </View>
        
        {/* Telemetry Log */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>activity_log</Text>
            <Text style={styles.moduleMeta}>{selectedMode}_data_stream</Text>
          </View>
          
          <View style={styles.logContainer}>
            {telemetryLog.map((entry, index) => (
              <Text key={index} style={styles.logEntry}>
                <Text style={[styles.logTimestamp, { color: modeConfig.accentColor }]}>[{entry.timestamp}]</Text>{' '}
                HR = <Text style={styles.logValue}>{entry.bpm}</Text>
                <Text style={styles.logUnit}>bpm</Text> | 
                Key = <Text style={styles.logValue}>{entry.key}</Text> | 
                Mode = <Text style={[styles.logValue, { color: modeConfig.accentColor }]}>{entry.mode}</Text>
              </Text>
            ))}
          </View>
        </View>
        
        {/* Control Interface */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, isCapturing && styles.controlButtonActive]}
            onPress={toggleCapture}
          >
            <Text style={styles.controlButtonText}>
              {isCapturing ? '[STOP_CAPTURE]' : '[START_CAPTURE]'}
            </Text>
          </TouchableOpacity>
          
          {bpm > 0 && confidence > 80 && (
            <TouchableOpacity 
              style={[styles.navigateButton, { backgroundColor: modeConfig.accentColor }]}
              onPress={navigateToSoundscape}
            >
              <Text style={styles.navigateButtonText}>
                [GENERATE_{selectedMode.toUpperCase()}_SOUNDSCAPE] →
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
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: colors.graphite,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    fontSize: 24,
    fontWeight: typography.weights.bold,
    color: colors.white,
    fontFamily: typography.fonts.mono,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 10,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    marginTop: 4,
  },
  modeDescription: {
    fontSize: 8,
    color: colors.muted,
    fontFamily: typography.fonts.mono,
    marginTop: 2,
    fontStyle: 'italic',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  modeTitle: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.mono,
    letterSpacing: 1,
    marginBottom: 4,
  },
  sessionInfo: {
    fontSize: 10,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    textAlign: 'right',
    lineHeight: 14,
  },
  accent: {
    color: colors.pulseRed,
  },
  modeIndicator: {
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
    fontSize: 12,
    fontWeight: typography.weights.semibold,
    color: colors.biometricBlue,
    fontFamily: typography.fonts.mono,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moduleMeta: {
    fontSize: 10,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
  },
  bpmContainer: {
    alignItems: 'center',
    marginVertical: 24,
    position: 'relative',
  },
  bpmDisplay: {
    alignItems: 'center',
    zIndex: 2,
  },
  bpmReading: {
    fontSize: 72,
    fontWeight: typography.weights.bold,
    color: colors.pulseRed,
    fontFamily: typography.fonts.mono,
    letterSpacing: -4,
  },
  bpmLabel: {
    fontSize: 14,
    color: colors.muted,
    fontFamily: typography.fonts.mono,
    letterSpacing: 2,
    marginTop: -8,
  },
  waveformOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -25 }],
    width: 200,
    height: 50,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformLine: {
    width: '80%',
    height: 2,
    opacity: 0.3,
    borderRadius: 1,
  },
  notation: {
    fontSize: 12,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 16,
  },
  accentText: {
    fontWeight: typography.weights.semibold,
  },
  sequencerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  sequencerStep: {
    width: (width - 64) / 16 - 2,
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    marginBottom: 2,
  },
  stepBeat: {
    // Dynamic color based on mode
  },
  stepActive: {
    backgroundColor: colors.biometricBlue,
  },
  spectrumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    marginBottom: 16,
  },
  frequencyBar: {
    flex: 1,
    marginHorizontal: 0.25,
    borderRadius: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusChip: {
    backgroundColor: colors.void,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 10,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
  },
  logContainer: {
    height: 120,
    backgroundColor: colors.void,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 4,
    padding: 12,
  },
  logEntry: {
    fontSize: 10,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    lineHeight: 16,
    marginBottom: 4,
  },
  logTimestamp: {
    // Dynamic color based on mode
  },
  logValue: {
    color: colors.biometricBlue,
    fontWeight: typography.weights.semibold,
  },
  logUnit: {
    color: colors.pulseRed,
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
  navigateButton: {
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
  },
  navigateButtonText: {
    fontSize: 14,
    fontWeight: typography.weights.semibold,
    color: colors.void,
    fontFamily: typography.fonts.mono,
    letterSpacing: 1,
  },
});

export default HeartRateCapture;