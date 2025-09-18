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
import SoundService from '../services/SoundService';

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
  console.log('Design system import error in SoundscapePlayerScreen, using fallbacks:', error);
}

const { width, height } = Dimensions.get('window');

const SoundscapePlayerScreen = ({ route, navigation }) => {
  const { bpm = 75, confidence = 85, key = 'Dm' } = route?.params || {};
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentBpm, setCurrentBpm] = useState(bpm);
  const [audioParams, setAudioParams] = useState({
    resonance: 0.6,
    cutoff: 0.7,
    depth: 0.5,
    decay: 0.4,
    reverbSize: 0.65,
    amplitude: 0.8,
  });
  
  const [telemetryLog, setTelemetryLog] = useState([]);
  
  // Animation references
  const waveformAnim = useRef(new Animated.Value(0)).current;
  const spectrumAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const oscilloscopeAnim = useRef(new Animated.Value(0)).current;
  
  // Simulated live biometric data
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        // Simulate slight heart rate variation
        const variation = Math.sin(Date.now() * 0.001) * 3;
        const newBpm = bpm + variation;
        setCurrentBpm(Math.round(newBpm));
        
        // Map biometric changes to audio parameters
        const normalizedBpm = (newBpm - 60) / 40; // Normalize 60-100 BPM to 0-1
        const hrv = 35 + Math.random() * 15; // Simulated HRV
        const breathRate = 14 + Math.sin(Date.now() * 0.0005) * 4;
        
        setAudioParams(prev => ({
          ...prev,
          cutoff: Math.max(0.2, Math.min(0.9, normalizedBpm)),
          reverbSize: Math.max(0.3, Math.min(0.8, hrv / 50)),
          amplitude: Math.max(0.4, Math.min(1.0, breathRate / 20)),
        }));
        
        // Add telemetry log
        const timestamp = new Date().toISOString().substr(14, 8);
        const logEntry = {
          timestamp,
          bpm: Math.round(newBpm),
          cutoff: Math.round(normalizedBpm * 440 + 220), // Convert to Hz
          reverbSize: Math.round((hrv / 50) * 100) / 100,
          amplitude: Math.round((breathRate / 20) * 100) / 100,
          hrv: Math.round(hrv),
        };
        
        setTelemetryLog(prev => [logEntry, ...prev.slice(0, 6)]);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, bpm]);
  
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
      // Waveform animation
      Animated.loop(
        Animated.timing(waveformAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
      
      // Spectrum analyzer
      Animated.loop(
        Animated.timing(spectrumAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        })
      ).start();
      
      // Pulse based on BPM
      const pulseDuration = (60 / currentBpm) * 1000;
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: pulseDuration * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: pulseDuration * 0.7,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Oscilloscope
      Animated.loop(
        Animated.timing(oscilloscopeAnim, {
          toValue: 1,
          duration: 1500,
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
      setSessionTime(0);
      setTelemetryLog([]);
    }
  };
  
  const KnobControl = ({ label, value, onValueChange, color = colors.biometricBlue }) => {
    const rotation = value * 270 - 135; // Map 0-1 to -135° to +135°
    
    return (
      <View style={styles.knobContainer}>
        <View style={styles.knob}>
          <View 
            style={[
              styles.knobIndicator,
              { 
                transform: [{ rotate: `${rotation}deg` }],
                backgroundColor: color,
              }
            ]} 
          />
        </View>
        <Text style={styles.knobLabel}>{label}</Text>
        <Text style={styles.knobValue}>{Math.round(value * 100)}</Text>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.void} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.logo}>sonαrly</Text>
          <Text style={styles.subtitle}>biomusicological_soundscape</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.sessionInfo}>
            session: <Text style={styles.accent}>{formatTime(sessionTime)}</Text>{'\n'}
            latency: <Text style={styles.accent}>8ms</Text>{'\n'}
            buffer: <Text style={styles.accent}>512</Text>
          </Text>
        </View>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Primary Audio Engine */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>primary_audio_engine</Text>
            <Text style={styles.moduleMeta}>biometric_soundscape_generator</Text>
          </View>
          
          {/* Waveform display */}
          <View style={styles.waveformContainer}>
            <Animated.View
              style={[
                styles.waveformOverlay,
                {
                  transform: [{
                    translateX: waveformAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -50],
                    })
                  }]
                }
              ]}
            />
            {/* Simplified waveform without SVG */}
            <View style={styles.simpleWaveform}>
              <View style={styles.waveformLine} />
            </View>
            
            <View style={styles.playbackControls}>
              <TouchableOpacity 
                style={[styles.playButton, isPlaying && styles.playButtonActive]}
                onPress={togglePlayback}
              >
                <Text style={styles.playButtonText}>
                  {isPlaying ? '[PAUSE]' : '[PLAY]'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Current parameters */}
          <View style={styles.parameterRow}>
            <Text style={styles.parameterText}>
              HR: <Text style={styles.accentText}>{currentBpm} BPM</Text> | 
              Key: <Text style={styles.accentText}>{key}</Text> | 
              Tempo: <Text style={styles.accentText}>{Math.round(currentBpm * 0.85)}</Text>
            </Text>
          </View>
        </View>
        
        {/* Modulation Matrix */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>modulation_matrix</Text>
            <Text style={styles.moduleMeta}>biometric_parameter_mapping</Text>
          </View>
          
          <View style={styles.knobGrid}>
            <KnobControl 
              label="resonance" 
              value={audioParams.resonance}
              color={colors.pulseRed}
            />
            <KnobControl 
              label="cutoff" 
              value={audioParams.cutoff}
              color={colors.biometricBlue}
            />
            <KnobControl 
              label="depth" 
              value={audioParams.depth}
              color={colors.biometricBlue}  // FIXED: was colors.waveformLavender
            />
            <KnobControl 
              label="decay" 
              value={audioParams.decay}
              color={colors.signalOrange}  // FIXED: was colors.offGold
            />
          </View>
          
          <Text style={styles.routingInfo}>
            routing: HR→filter_freq | HRV→reverb_size | breath→amplitude
          </Text>
        </View>
        
        {/* Anatomical Audio Modules */}
        <View style={styles.anatomicalGrid}>
          <View style={styles.organModule}>
            <Text style={styles.organGlyph}>❤️</Text>
            <Text style={styles.organName}>cardiac_oscillator</Text>
            <Text style={styles.organFunction}>rhythm_generator</Text>
            <View style={styles.organParams}>
              <View style={styles.organParam}>
                <Text style={styles.paramLabel}>bpm</Text>
                <Text style={styles.paramValue}>{currentBpm}</Text>
              </View>
              <View style={styles.organParam}>
                <Text style={styles.paramLabel}>key</Text>
                <Text style={styles.paramValue}>{key}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.organModule}>
            <Text style={styles.organGlyph}>🫁</Text>
            <Text style={styles.organName}>respiratory_modulator</Text>
            <Text style={styles.organFunction}>envelope_controller</Text>
            <View style={styles.organParams}>
              <View style={styles.organParam}>
                <Text style={styles.paramLabel}>rate</Text>
                <Text style={styles.paramValue}>{Math.round(currentBpm / 4.5)}</Text>
              </View>
              <View style={styles.organParam}>
                <Text style={styles.paramLabel}>depth</Text>
                <Text style={styles.paramValue}>{Math.round(audioParams.amplitude * 100)}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Spectrum Analyzer */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>spectral_analyzer</Text>
            <Text style={styles.moduleMeta}>frequency_domain_analysis</Text>
          </View>
          
          <View style={styles.spectrumContainer}>
            {Array.from({ length: 64 }, (_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.spectrumBar,
                  {
                    height: spectrumAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        10 + Math.sin(i * 0.1) * 5,
                        30 + Math.sin(i * 0.1 + sessionTime * 0.1) * 20
                      ],
                    }),
                    backgroundColor: i < 16 ? colors.pulseRed : 
                                   i < 32 ? colors.biometricBlue :
                                   i < 48 ? colors.biometricBlue :  // FIXED: was colors.waveformLavender
                                            colors.signalOrange,    // FIXED: was colors.offGold
                  }
                ]}
              />
            ))}
          </View>
        </View>
        
        {/* Real-time Telemetry */}
        <View style={styles.module}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>real_time_telemetry</Text>
            <Text style={styles.moduleMeta}>parameter_log_stream</Text>
          </View>
          
          <View style={styles.logContainer}>
            {telemetryLog.map((entry, index) => (
              <Text key={index} style={styles.logEntry}>
                <Text style={styles.logTimestamp}>[{entry.timestamp}]</Text>{' '}
                HR = <Text style={styles.logValue}>{entry.bpm}</Text>
                <Text style={styles.logUnit}>bpm</Text> | 
                Filter = <Text style={styles.logValue}>{entry.cutoff}</Text>
                <Text style={styles.logUnit}>Hz</Text> | 
                Reverb = <Text style={styles.logValue}>{entry.reverbSize}</Text>
              </Text>
            ))}
          </View>
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
    color: colors.biometricBlue,  // FIXED: was colors.waveformLavender
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
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    fontFamily: typography.fonts.mono,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moduleMeta: {
    fontSize: 9,
    color: colors.white, 
    fontFamily: typography.fonts.mono,
  },
  waveformContainer: {
    position: 'relative',
    height: 80,
    backgroundColor: colors.void,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  waveformOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.biometricBlue,
    opacity: 0.1,
  },
  simpleWaveform: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformLine: {
    width: '80%',
    height: 2,
    backgroundColor: colors.biometricBlue,
    opacity: 0.8,
    borderRadius: 1,
  },
  playbackControls: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  playButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  playButtonActive: {
    backgroundColor: colors.pulseRed,
    borderColor: colors.pulseRed,
  },
  playButtonText: {
    fontSize: 10,
    color: colors.text,
    fontFamily: typography.fonts.mono,
    fontWeight: typography.weights.semibold,
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
    color: colors.biometricBlue,  // FIXED: was colors.waveformLavender
    fontWeight: typography.weights.semibold,
  },
  knobGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  knobContainer: {
    alignItems: 'center',
  },
  knob: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  knobIndicator: {
    position: 'absolute',
    top: 4,
    width: 2,
    height: 15,
    borderRadius: 1,
    transformOrigin: 'bottom center',
  },
  knobLabel: {
    fontSize: 8,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    textTransform: 'uppercase',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  knobValue: {
    fontSize: 10,
    color: colors.text,
    fontFamily: typography.fonts.mono,
    fontWeight: typography.weights.semibold,
  },
  routingInfo: {
    fontSize: 9,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    textAlign: 'center',
    lineHeight: 12,
  },
  anatomicalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  organModule: {
    flex: 1,
    backgroundColor: colors.graphite,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
  },
  organGlyph: {
    fontSize: 32,
    marginBottom: 8,
  },
  organName: {
    fontSize: 10,
    color: colors.biometricBlue,
    fontFamily: typography.fonts.mono,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 4,
  },
  organFunction: {
    fontSize: 8,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    textAlign: 'center',
    marginBottom: 12,
  },
  organParams: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  organParam: {
    alignItems: 'center',
  },
  paramLabel: {
    fontSize: 8,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    textTransform: 'uppercase',
  },
  paramValue: {
    fontSize: 12,
    color: colors.pulseRed,
    fontFamily: typography.fonts.mono,
    fontWeight: typography.weights.semibold,
  },
  spectrumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    paddingHorizontal: 4,
  },
  spectrumBar: {
    flex: 1,
    marginHorizontal: 0.5,
    borderRadius: 0.5,
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
    fontSize: 9,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    lineHeight: 14,
    marginBottom: 2,
  },
  logTimestamp: {
    color: colors.biometricBlue,  // FIXED: was colors.waveformLavender
  },
  logValue: {
    color: colors.biometricBlue,
    fontWeight: typography.weights.semibold,
  },
  logUnit: {
    color: colors.pulseRed,
  },
});

export default SoundscapePlayerScreen;