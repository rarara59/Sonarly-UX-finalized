import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Final 4 emotions for MVP
const emotions = [
  {
    id: 'calm',
    label: 'calm',
    color: '#A7C7E7',
    glowColor: 'rgba(167, 199, 231, 0.3)',
    backgroundColor: 'rgba(167, 199, 231, 0.1)',
  },
  {
    id: 'energized', 
    label: 'energized',
    color: '#FFB347',
    glowColor: 'rgba(255, 179, 71, 0.3)',
    backgroundColor: 'rgba(255, 179, 71, 0.1)',
  },
  {
    id: 'focused',
    label: 'focused', 
    color: '#6B73FF',
    glowColor: 'rgba(107, 115, 255, 0.3)',
    backgroundColor: 'rgba(107, 115, 255, 0.1)',
  },
  {
    id: 'sleepy',
    label: 'sleepy',
    color: '#9B7EC7', 
    glowColor: 'rgba(155, 126, 199, 0.3)',
    backgroundColor: 'rgba(155, 126, 199, 0.1)',
  },
];

const PremiumHomeScreen = () => {
  const navigation = useNavigation();
  
  // State management
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimer = useRef(null);
  const progressTimer = useRef(null);
  
  // Animation values
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const mainOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1.2)).current;
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const sonarAnim = useRef(new Animated.Value(1)).current;
  
  // Waveform animation
  const waveformBars = useRef(
    Array(12).fill(0).map(() => new Animated.Value(0.3))
  ).current;

  // Initialize splash screen animation
  useEffect(() => {
    // Start breathing animation loop
    const breathingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnim, {
          toValue: 1.05,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    breathingLoop.start();

    // Splash screen sequence
    const splashSequence = Animated.sequence([
      // Hold splash for 1.5 seconds
      Animated.delay(1500),
      // Fade out splash and scale logo
      Animated.parallel([
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(mainOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]);

    splashSequence.start(() => {
      setShowSplash(false);
    });

    return () => {
      breathingLoop.stop();
    };
  }, []);

  // Sonar ripple animation
  useEffect(() => {
    if (isListening) {
      const sonarLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(sonarAnim, {
            toValue: 1.4,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(sonarAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      );
      sonarLoop.start();
      
      // Animate waveform
      const animateWaveform = () => {
        waveformBars.forEach((bar, index) => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(bar, {
                toValue: Math.random() * 0.8 + 0.2,
                duration: 150 + index * 10,
                useNativeDriver: false,
              }),
              Animated.timing(bar, {
                toValue: Math.random() * 0.6 + 0.3,
                duration: 150 + index * 10,
                useNativeDriver: false,
              }),
            ])
          ).start();
        });
      };
      animateWaveform();
      
      return () => sonarLoop.stop();
    }
  }, [isListening]);

  const handleCenterPress = () => {
    //Clear any selected emotion when entering listening mode
    setSelectedEmotion(null);
    
    setIsPressed(true);
    setTimeout(() => {
      setIsListening(true);
    }, 300);
  };

  const handleCenterRelease = () => {
    setIsPressed(false);
    if (isListening) {
      setTimeout(() => {
        setIsListening(false);
        // Auto-proceed after voice input (simulated for now)
        // TODO: Replace with actual voice processing
        const simulatedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        handleVoiceComplete(simulatedEmotion);
      }, 500);
    }
  };

  const handleEmotionSelect = (emotion) => {
    setIsListening(false);

    setSelectedEmotion(emotion);
  };

  const handleContinue = () => {
    if (selectedEmotion) {
      // Navigate to next screen with emotion data
      navigation.navigate('BiometricCaptureScreen', {
        selectedEmotion: selectedEmotion.id,
        emotionData: selectedEmotion,
        timestamp: Date.now(),
      });
    }
  };

  const selectedEmotionData = emotions.find(e => e.id === selectedEmotion?.id);

  // Splash Screen Component
  const renderSplash = () => (
    <Animated.View 
      style={[
        styles.splashContainer,
        { 
          opacity: splashOpacity,
          display: showSplash ? 'flex' : 'none'
        }
      ]}
    >
      <Animated.Text 
        style={[
          styles.splashLogo,
          { transform: [{ scale: logoScale }] }
        ]}
      >
        sonarly
      </Animated.Text>
    </Animated.View>
  );

  // Main Interface Component  
  const renderMainInterface = () => (
    <Animated.View style={[styles.container, { opacity: mainOpacity }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafaf9" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>sonarly</Text>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Main Prompt - UPDATED to match SoundscapeGenerationScreen */}
        <Text style={styles.mainPrompt}>
          How do you want to feel right now?
        </Text>

        {/* Sonar Container */}
        <View style={styles.sonarContainer}>
          {/* Ambient Glow */}
          <View 
            style={[
              styles.ambientGlow,
              selectedEmotionData && {
                backgroundColor: selectedEmotionData.backgroundColor,
                shadowColor: selectedEmotionData.color,
              },
              isListening && styles.listeningGlow
            ]} 
          />

          {/* Breathing Rings */}
          <Animated.View
            style={[
              styles.breathingRing,
              styles.ring1,
              { transform: [{ scale: breathingAnim }] }
            ]}
          />
          <Animated.View
            style={[
              styles.breathingRing, 
              styles.ring2,
              { transform: [{ scale: breathingAnim }] }
            ]}
          />
          <Animated.View
            style={[
              styles.breathingRing,
              styles.ring3, 
              { transform: [{ scale: breathingAnim }] }
            ]}
          />

          {/* Sonar Ripples */}
          {isListening && (
            <>
              <Animated.View
                style={[
                  styles.sonarRipple,
                  { transform: [{ scale: sonarAnim }] }
                ]}
              />
              <Animated.View
                style={[
                  styles.sonarRipple,
                  styles.sonarRipple2,
                  { transform: [{ scale: sonarAnim }] }
                ]}
              />
            </>
          )}

          {/* Main Interactive Circle */}
          <TouchableOpacity
            style={[
              styles.mainCircle,
              selectedEmotionData && {
                borderColor: selectedEmotionData.color + '40',
                shadowColor: selectedEmotionData.color,
              },
              isListening && styles.listeningCircle,
              isPressed && styles.pressedCircle,
            ]}
            onPressIn={handleCenterPress}
            onPressOut={handleCenterRelease}
            activeOpacity={0.9}
          >
            {/* Depth Highlight */}
            <View style={styles.depthHighlight} />
            
            {/* Center Content */}
            <View style={styles.centerContent}>
              {isListening && (
                <View style={styles.waveformContainer}>
                  {waveformBars.map((bar, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.waveformBar,
                        {
                          height: bar.interpolate({
                            inputRange: [0, 1],
                            outputRange: [8, 32],
                          }),
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
              
              <Text
                style={[
                  styles.centerText,
                  selectedEmotionData && styles.emotionSelectedText,
                  isListening && styles.listeningText,
                ]}
              >
                {isListening
                  ? 'Listening...'
                  : selectedEmotionData
                  ? `You want to feel ${selectedEmotionData.label}.`
                  : 'Tell me how you want to feel'}
              </Text>
            </View>

            {/* Center Indicator */}
            <View
              style={[
                styles.centerIndicator,
                selectedEmotionData && {
                  backgroundColor: selectedEmotionData.color,
                  shadowColor: selectedEmotionData.color,
                },
                isListening && styles.listeningIndicator,
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Microphone Prompt */}
        <Text style={styles.micPrompt}>
          {selectedEmotion 
            ? `hold ${selectedEmotion.label} to confirm` 
            : 'tap or hold to speak'}
        </Text>

        {/* Emotion Selection Grid */}
        <View style={styles.emotionGrid}>
          {emotions.map((emotion) => (
            <TouchableOpacity
              key={emotion.id}
              style={[
                styles.emotionButton,
                selectedEmotion?.id === emotion.id && [
                  styles.emotionButtonSelected,
                  { 
                    borderColor: emotion.color + '99',
                    shadowColor: emotion.color,
                  }
                ],
              ]}
              onPress={() => handleEmotionSelect(emotion)}
              onPressIn={() => handleEmotionPressIn(emotion)}
              onPressOut={handleEmotionPressOut}
            >
              <Text
                style={[
                  styles.emotionButtonText,
                  selectedEmotion?.id === emotion.id && styles.emotionButtonTextSelected,
                ]}
              >
                {emotion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        {selectedEmotion && (
          <TouchableOpacity
            style={[
              styles.continueButton,
              { 
                backgroundColor: selectedEmotionData?.color || '#ec4899',
                shadowColor: selectedEmotionData?.color || '#ec4899',
              }
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  const handleEmotionPressIn = (emotion) => {
    if (selectedEmotion?.id === emotion.id) {
      setIsHolding(true);
      setHoldProgress(0);
      
      // Start progress animation
      progressTimer.current = setInterval(() => {
        setHoldProgress(prev => {
          if (prev >= 100) {
            // Hold complete - proceed to next screen
            handleEmotionConfirm(emotion);
            return 100;
          }
          return prev + 5; // 5% every 50ms = 1 second total
        });
      }, 50);
    }
  };
  
  const handleEmotionPressOut = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
    }
  };
  
  const handleEmotionConfirm = (emotion) => {
    // Clean up timers
    setIsHolding(false);
    setHoldProgress(0);
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
    }
    
    // Navigate to next screen
    navigation.navigate('BiometricCaptureScreen', {
      selectedEmotion: emotion.id,
      emotionData: emotion,
      timestamp: Date.now(),
    });
  };

  const handleVoiceComplete = (detectedEmotion) => {
    // Navigate directly to next screen with voice-detected emotion
    navigation.navigate('BiometricCaptureScreen', {
      selectedEmotion: detectedEmotion.id,
      emotionData: detectedEmotion,
      timestamp: Date.now(),
      inputMethod: 'voice'
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderSplash()}
      {renderMainInterface()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafaf9',
  },
  
  // Splash Screen Styles
  splashContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fafaf9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  splashLogo: {
    fontSize: 48,
    fontWeight: '300',
    color: '#475569',
    letterSpacing: 8,
  },

  // Main Interface Styles
  container: {
    flex: 1,
    backgroundColor: '#fafaf9',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#475569',
    letterSpacing: 8,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  // UPDATED: Main prompt to match SoundscapeGenerationScreen refined style
  mainPrompt: {
    fontSize: 24, // Reduced from 26 to match SoundscapeGenerationScreen
    fontWeight: '300', // Changed from '700' to light weight like SoundscapeGenerationScreen
    textAlign: 'center',
    color: '#475569', // Changed from '#0f172a' to match SoundscapeGenerationScreen
    marginBottom: 16,
    letterSpacing: -0.5,
    lineHeight: 30, // Adjusted for better spacing
    maxWidth: 320, // Increased slightly for better text flow
    alignSelf: 'center',
  },

  // Sonar Container Styles - MATCHED positioning to other screens
  sonarContainer: {
    width: 240,
    height: 240,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16, // Matched to other screens
    marginBottom: 24,
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.1,
    shadowRadius: 50,
    elevation: 25,
  },
  listeningGlow: {
    backgroundColor: 'rgba(236,72,153,0.15)',
    shadowColor: '#ec4899',
    shadowOpacity: 0.3,
  },

  // Breathing Rings
  breathingRing: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 1000,
    opacity: 0.3,
  },
  ring1: {
    width: 280,
    height: 280,
    borderColor: '#94a3b8',
  },
  ring2: {
    width: 216,
    height: 216,
    borderColor: '#64748b',
    opacity: 0.4,
  },
  ring3: {
    width: 152,
    height: 152,
    borderColor: '#475569',
    opacity: 0.5,
  },

  // Sonar Ripples
  sonarRipple: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: 'rgba(236,72,153,0.6)',
  },
  sonarRipple2: {
    borderColor: 'rgba(236,72,153,0.4)',
  },

  // Main Circle
  mainCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  listeningCircle: {
    backgroundColor: 'rgba(236,72,153,0.15)',
    borderColor: 'rgba(236,72,153,0.3)',
    shadowColor: '#ec4899',
    shadowOpacity: 0.4,
  },
  pressedCircle: {
    transform: [{ scale: 0.95 }],
  },
  depthHighlight: {
    position: 'absolute',
    top: 32,
    left: 32,
    right: 32,
    bottom: 32,
    borderRadius: 68,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },

  // Center Content - UPDATED for consistency
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerText: {
    fontSize: 16, // Slightly reduced for refinement
    lineHeight: 22, // Better line height
    textAlign: 'center',
    color: '#64748b', // Match SoundscapeGenerationScreen colors
    maxWidth: 160,
    fontWeight: '300', // Light weight to match overall style
  },
  emotionSelectedText: {
    color: '#475569',
    fontWeight: '400', // Slightly heavier when selected but still refined
  },
  listeningText: {
    color: '#ec4899',
    fontWeight: '400', // Consistent with selected state
  },

  // Waveform
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    height: 32,
  },
  waveformBar: {
    width: 2,
    backgroundColor: 'rgba(236,72,153,0.6)',
    borderRadius: 1,
    marginHorizontal: 1,
  },

  // Center Indicator
  centerIndicator: {
    position: 'absolute',
    bottom: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  listeningIndicator: {
    backgroundColor: '#ec4899',
    opacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },

  // Microphone Prompt - UPDATED for consistency
  micPrompt: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    fontSize: 14,
    color: '#64748b',
    opacity: 0.8,
    fontWeight: '300', // Added light weight
    letterSpacing: 0.2, // Subtle letter spacing
  },

  // Emotion Grid - UPDATED for consistency
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    maxWidth: 320,
    alignSelf: 'center',
  },
  emotionButton: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.7)',
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
    alignItems: 'center',
  },
  emotionButtonSelected: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    transform: [{ scale: 1.05 }],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 8,
  },
  emotionButtonText: {
    fontSize: 16,
    fontWeight: '300', // Consistent light weight
    color: '#475569',
    letterSpacing: 0.5,
  },
  emotionButtonTextSelected: {
    fontWeight: '400', // Slightly heavier when selected but still refined
  },

  // Continue Button - UPDATED for consistency
  continueButton: {
    backgroundColor: '#ec4899',
    paddingVertical: 18,
    paddingHorizontal: 64,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 32,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 20,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400', // Slightly increased from '300' for button readability
    letterSpacing: 0.5,
  },
});

export default PremiumHomeScreen;