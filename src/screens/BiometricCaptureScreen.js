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
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Platform, Linking } from 'react-native';
import { 
  Camera as VisionCamera, 
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor
} from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import { detectPPG } from '../frameProcessors/detectPPG';
const { width, height } = Dimensions.get('window');

const BiometricCaptureScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get params from navigation (emotion data, mode, etc.)
  const { selectedEmotion, emotionData, mode } = route.params || {};
  
  // State management
  const [currentState, setCurrentState] = useState(0);
  const [isReturningUser, setIsReturningUser] = useState(false); // TODO: Get from AsyncStorage
  const [readingProgress, setReadingProgress] = useState(0);
  const [currentBpm, setCurrentBpm] = useState('--');
  const [debugInfo, setDebugInfo] = useState(''); // Debug overlay state
  const [ppgData, setPpgData] = useState(null); // PPG frame processor results
  const [frameCount, setFrameCount] = useState(0); // Track frame processing
  const [cameraMounted, setCameraMounted] = useState(false);
  const [cameraPaused, setCameraPaused] = useState(false);
  
  // Camera permission and device hooks
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraDevice = useCameraDevice('back'); // Use back camera for PPG
  
  // Animation refs
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const sonarAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const cameraGlowAnim = useRef(new Animated.Value(1)).current;
  const coverGestureAnim = useRef(new Animated.Value(1.2)).current;
  const coverGestureOpacity = useRef(new Animated.Value(0)).current;
  const tooltipAnim = useRef(new Animated.Value(0)).current;
  
  // Waveform animation refs
  const waveformBars = useRef(
    Array(12).fill(0).map(() => new Animated.Value(0.3))
  ).current;
  
  const states = ['permission', 'placement', 'reading', 'success', 'error', 'permission-denied'];
  
  // Camera ref
  const camera = useRef(null);
  
  // Determine if camera should be active
  const isCameraActive = !cameraPaused && cameraMounted && currentState === 2; // Only active during reading
  
  // Frame processor for PPG detection
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const result = detectPPG(frame);
    if (result && result.ok) {
      runOnJS(handlePPGDetected)(result);
    }
  }, []);
  
  /**
   * Handle PPG detection result
   * This replaces faceDetectionCallback from the example
   * 
   * @param {any} ppgData Detection result 
   * @param {Frame} frame Current frame
   * @returns {void}
   */
  function handlePPGDetected(ppgData) {
    // Avoid per-frame logging to prevent console noise
    
    // Update frame count
    setFrameCount(prev => prev + 1);
    
    // Update debug info
    const debugMsg = `📊 Frame ${frameCount}: luma=${ppgData?.luma?.toFixed?.(2) ?? '—'}`;
    setDebugInfo(prev => `${debugMsg}\n${prev}`.slice(0, 500));
    
    // Simulate PPG data processing
    if (frameCount > 30) { // After 30 frames, start showing BPM
      const simulatedBpm = 65 + Math.floor(Math.random() * 20);
      setCurrentBpm(simulatedBpm.toString());
    }
    
    // Store PPG data
    setPpgData(ppgData);
    
    // Only process if camera ref is defined (reserved for future use)
    // if (camera.current) { }
  }
  
  // Add a simple frame counter effect for testing
  useEffect(() => {
    if (isCameraActive) {
      const frameTimer = setInterval(() => {
        // Simulate frame processing
        handlePPGDetected({ timestamp: Date.now() }, null);
      }, 100); // 10 FPS simulation
      
      return () => clearInterval(frameTimer);
    }
  }, [isCameraActive, frameCount]);
  
  // Timer refs
  const readingTimer = useRef(null);
  const waveformTimer = useRef(null);

  // State data for first-time users
  const firstTimeStateData = {
    permission: {
      title: 'Let\'s find your rhythm.',
      helper: '',
      showPermissionExplanation: true,
      buttonText: 'Continue with Camera',
      buttonStyle: 'outline'
    },
    placement: {
      title: 'Listen to your heart',
      helper: 'Cover the camera with your fingertip to begin.',
      helper2: 'Light from the lens detects your pulse through touch.',
      showPermissionExplanation: false,
      showOnboardingTooltip: true,
      buttonText: 'I\'m Ready',
      buttonStyle: 'outline'
    },
    reading: {
      title: 'Reading your rhythm',
      helper: 'Just a moment — we\'re tuning to your heartbeat.',
      showPermissionExplanation: false,
      showReadingTimer: true
    },
    success: {
      title: 'Got it. You\'re at 75 BPM.',
      helper: 'Let\'s build your soundscape to match.',
      showPermissionExplanation: false,
      buttonText: 'Create My Soundscape',
      buttonStyle: 'outline'
    },
    error: {
      title: 'Hmm, we couldn\'t get a clear reading',
      helper: 'Let\'s try a few adjustments',
      showPermissionExplanation: false,
      showErrorTips: true,
      buttonText: 'Try Again',
      buttonStyle: 'outline'
    },
    'permission-denied': {
      title: 'Camera Access Needed',
      helper: 'Sonarly needs access to your camera to read your heart rhythm. Please enable access in your device settings.',
      showPermissionExplanation: false,
      showPermissionDenied: true,
      buttonText: 'Open Settings',
      buttonStyle: 'outline'
    }
  };

  // State data for returning users
  const returningUserStateData = {
    permission: {
      title: 'Welcome Back',
      helper: 'We\'re ready to scan your heart rhythm.',
      showPermissionExplanation: false,
      buttonText: 'Begin Scan',
      buttonStyle: 'outline'
    },
    placement: {
      title: 'Listen to your heart',
      helper: 'Cover the camera with your fingertip to begin.',
      showPermissionExplanation: false,
      showOnboardingTooltip: false,
      buttonText: 'I\'m Ready',
      buttonStyle: 'outline'
    },
    reading: {
      title: 'Reading your rhythm',
      helper: 'Just a moment — we\'re tuning to your heartbeat.',
      showPermissionExplanation: false,
      showReadingTimer: true
    },
    success: {
      title: 'Got it. You\'re at 75 BPM.',
      helper: 'Let\'s build your soundscape to match.',
      showPermissionExplanation: false,
      buttonText: 'Create My Soundscape',
      buttonStyle: 'outline'
    },
    error: {
      title: 'Hmm, we couldn\'t get a clear reading',
      helper: 'Let\'s try a few adjustments',
      showPermissionExplanation: false,
      showErrorTips: true,
      buttonText: 'Try Again',
      buttonStyle: 'outline'
    },
    'permission-denied': {
      title: 'Camera Access Needed',
      helper: 'Sonarly needs access to your camera to read your heart rhythm. Please enable access in your device settings.',
      showPermissionExplanation: false,
      showPermissionDenied: true,
      buttonText: 'Open Settings',
      buttonStyle: 'outline'
    }
  };

  // Get current state data based on user type
  const getCurrentStateData = () => {
    return isReturningUser ? returningUserStateData : firstTimeStateData;
  };

  // Initialize camera permission on mount
  useEffect(() => {
    if (hasPermission === false) {
      console.log('📷 No camera permission yet');
    } else if (hasPermission === true) {
      console.log('✅ Camera permission granted');
      if (cameraDevice) {
        console.log('📷 Camera device available:', cameraDevice.id);
        setDebugInfo(prev => `📷 Camera: ${cameraDevice.id}\n${prev}`);
      }
    }
  }, [hasPermission, cameraDevice]);
  
  // Initialize animations
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

    // Start camera glow animation
    const cameraGlowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cameraGlowAnim, {
          toValue: 1.4,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(cameraGlowAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Only start camera glow if not returning user
    if (!isReturningUser) {
      cameraGlowLoop.start();
    }

    // Start cover gesture animation
    const coverGestureLoop = Animated.loop(
      Animated.parallel([
        Animated.timing(coverGestureAnim, {
          toValue: 0.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(coverGestureOpacity, {
            toValue: 0.6,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(coverGestureOpacity, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(coverGestureOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    
    if (currentState === 1) { // placement state
      coverGestureLoop.start();
    }

    return () => {
      breathingLoop.stop();
      cameraGlowLoop.stop();
      coverGestureLoop.stop();
      if (readingTimer.current) clearInterval(readingTimer.current);
      if (waveformTimer.current) clearInterval(waveformTimer.current);
    };
  }, [currentState, isReturningUser]);

  // Sonar ripple animation for reading state
  useEffect(() => {
    if (currentState === 2) { // reading state
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
  }, [currentState]);

  // Success celebration animation
  useEffect(() => {
    if (currentState === 3) { // success state
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(celebrationAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(celebrationAnim, {
            toValue: 2.5,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start();
      }, 300);
    }
  }, [currentState]);

  const requestCameraPermission = async () => {
    try {
      console.log("🎥 Requesting camera permission...");
      console.log("🎥 Platform:", Platform.OS);
      setDebugInfo(prev => `📱 Requesting permission on ${Platform.OS}\n${prev}`);
      
      // Request camera permission using the hook
      const granted = await requestPermission();
      
      console.log("🎥 Permission result:", granted);
      setDebugInfo(prev => `🎥 Permission: ${granted ? 'granted' : 'denied'}\n${prev}`);
      
      if (granted) {
        // Permission granted - go to placement
        console.log("✅ Camera permission granted");
        setCurrentState(1);
      } else {
        // Permission denied - show denied state
        console.log("❌ Camera permission denied");
        setCurrentState(5);
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      // On error, offer to skip
      Alert.alert(
        'Permission Error',
        'There was an issue accessing camera permissions. Would you like to continue without biometric data?',
        [
          {
            text: 'Try Again',
            onPress: requestCameraPermission
          },
          {
            text: 'Skip',
            onPress: () => skipToSoundscape(72)
          }
        ]
      );
    }
  }; 

  const startReading = () => {
    console.log('🔴 Starting PPG reading...');
    setDebugInfo(prev => `🔴 Starting PPG reading...\n${prev}`);
    
    // Mount and activate camera for frame processing
    setCameraMounted(true);
    setCameraPaused(false);
    setFrameCount(0); // Reset frame count
    setDebugInfo(prev => `🎥 Camera mounted and active\n${prev}`);
    
    let timeRemaining = 10;
    let bpm = Math.floor(Math.random() * 20) + 65; // 65-85 BPM
    
    readingTimer.current = setInterval(() => {
      timeRemaining--;
      
      // Update progress
      const progress = (10 - timeRemaining) / 10;
      setReadingProgress(progress);
      
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 100,
        useNativeDriver: false,
      }).start();
      
      // Simulate BPM detection based on frame count
      if (frameCount > 30) {
        bpm += Math.floor(Math.random() * 6) - 3; // Slight variation
        bpm = Math.max(60, Math.min(100, bpm));
        setCurrentBpm(bpm.toString());
      }
      
      if (timeRemaining <= 0) {
        clearInterval(readingTimer.current);
        
        // Pause camera
        setCameraPaused(true);
        setDebugInfo(prev => `🎥 Camera paused\n${prev}`);
        
        // Simulate success (90% chance) or error (10% chance)
        if (Math.random() > 0.1) {
          // Update success title with dynamic BPM
          const stateData = getCurrentStateData();
          stateData.success.title = `Got it. You're at ${bpm} BPM.`;
          setTimeout(() => {
            setCurrentState(3); // success
            setCameraMounted(false); // Unmount camera after success
          }, 500);
        } else {
          setTimeout(() => {
            setCurrentState(4); // error
            setCameraMounted(false); // Unmount camera after error
          }, 500);
        }
      }
    }, 1000);
  };

  // NEW: Skip to soundscape function with estimated/default BPM
  const skipToSoundscape = (estimatedBpm = 72) => {
    console.log('Skipping biometric capture, navigating to soundscape with estimated BPM:', estimatedBpm);
    
    navigation.navigate('SoundscapeGeneration', {
      selectedEmotion: selectedEmotion || 'energized', // Default fallback
      emotionData,
      biometricData: {
        heartRate: estimatedBpm,
        timestamp: Date.now(),
        isEstimated: true, // Flag to indicate this is estimated data
      },
    });
  };

  // NEW: Open device settings for camera permission
  const openSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert(
        'Settings Unavailable',
        'Unable to open settings. Please manually enable camera permissions for Sonarly in your device settings.',
        [
          {
            text: 'Skip',
            onPress: () => skipToSoundscape(72)
          },
          {
            text: 'Retry',
            onPress: requestCameraPermission
          }
        ]
      );
    });
  };

  const handleMainAction = () => {
    switch (states[currentState]) {
      case 'permission':
        requestCameraPermission();
        break;
      case 'placement':
        setCurrentState(2); // reading
        startReading();
        break;
      case 'success':
        // Navigate to Mode Selection Screen with biometric data
        navigation.navigate('SoundscapeGeneration', {
          selectedEmotion,
          emotionData,
          biometricData: {
            heartRate: parseInt(currentBpm) || 72,
            timestamp: Date.now(),
            isEstimated: false,
          },
        });
        break;
      case 'error':
        setCurrentState(1); // retry - go back to placement
        break;
      case 'permission-denied':
        openSettings(); // Open device settings instead of just retrying
        break;
    }
  };

  const handleSecondaryAction = () => {
    if (states[currentState] === 'error') {
      // Skip to success with estimated BPM
      skipToSoundscape(72);
    } else if (states[currentState] === 'permission-denied') {
      // Skip camera permission - proceed without biometric data
      skipToSoundscape(72);
    }
  };

  // FIXED: Skip button now actually skips to soundscape
  const handleSkipStep = () => {
    console.log('Skip this step pressed - going directly to soundscape generation');
    skipToSoundscape(72); // Use estimated 72 BPM and skip to soundscape
  };

  const goBack = () => {
    navigation.goBack();
  };

  const getCurrentData = () => {
    const stateData = getCurrentStateData();
    return stateData[states[currentState]];
  };

  const data = getCurrentData();

  const renderStateContent = () => {
    switch (states[currentState]) {
      case 'permission':
        return (
          <View style={styles.centerContent}>
            {/* Camera glow rings - only for first-time users */}
            {!isReturningUser && (
              <>
                <Animated.View
                  style={[
                    styles.cameraGlowRing,
                    styles.glowRing1,
                    { transform: [{ scale: cameraGlowAnim }] }
                  ]}
                />
                <Animated.View
                  style={[
                    styles.cameraGlowRing,
                    styles.glowRing2,
                    { transform: [{ scale: cameraGlowAnim }] }
                  ]}
                />
                <Animated.View
                  style={[
                    styles.cameraGlowRing,
                    styles.glowRing3,
                    { transform: [{ scale: cameraGlowAnim }] }
                  ]}
                />
              </>
            )}
            
            {/* Camera Icon - simplified SVG replacement */}
            <View style={styles.cameraIcon}>
              <View style={styles.cameraBody}>
                <View style={styles.cameraLens} />
              </View>
            </View>
          </View>
        );

      case 'placement':
        return (
          <View style={styles.centerContent}>
            <View style={styles.lensContainer}>
              <View style={styles.lensRing}>
                <View style={styles.lensCenter} />
                <Animated.View style={styles.lensGlow} />
              </View>
              
              {/* Cover gesture animation */}
              <Animated.View
                style={[
                  styles.coverGesture,
                  {
                    transform: [{ scale: coverGestureAnim }],
                    opacity: coverGestureOpacity,
                  }
                ]}
              />
            </View>
          </View>
        );

      case 'reading':
        return (
          <View style={styles.centerContent}>
            {/* Waveform */}
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
            
            {/* BPM Display */}
            <View style={styles.bpmDisplay}>
              <Text style={styles.bpmNumber}>{currentBpm}</Text>
              <Text style={styles.bpmLabel}>BPM</Text>
            </View>
          </View>
        );

      case 'success':
        return (
          <View style={styles.centerContent}>
            <View style={styles.successSonar}>
              <Animated.View style={[styles.sonarPulseRing, styles.ringA]} />
              <Animated.View style={[styles.sonarPulseRing, styles.ringB]} />
              <Animated.View style={[styles.sonarPulseRing, styles.ringC]} />
              <View style={styles.successCenter}>
                <View style={styles.successDot} />
              </View>
            </View>
          </View>
        );

      case 'error':
        return (
          <View style={styles.centerContent}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>!</Text>
            </View>
          </View>
        );

      case 'permission-denied':
        return (
          <View style={styles.centerContent}>
            <View style={styles.permissionDeniedIcon}>
              <View style={styles.cameraBody}>
                <View style={styles.cameraLens} />
                <View style={styles.deniedSlash} />
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderAdditionalContent = () => {
    return (
      <View style={styles.additionalContent}>
        {/* Permission explanation */}
        {data.showPermissionExplanation && (
          <View style={styles.permissionExplanation}>
            <Text style={styles.permissionLine}>
              We use your camera to gently detect your heart rhythm through your fingertip.
            </Text>
            <Text style={styles.permissionLine}>
              Your data never leaves your device.
            </Text>
          </View>
        )}

        {/* Helper text 2 (for placement screen) */}
        {data.helper2 && (
          <Text style={styles.helperText2}>{data.helper2}</Text>
        )}

        {/* Onboarding tooltip */}
        {data.showOnboardingTooltip && (
          <Animated.View
            style={[
              styles.onboardingTooltip,
              { opacity: tooltipAnim }
            ]}
          >
            <Text style={styles.tooltipText}>
              💡 Why? This helps us personalize your soundscape.
            </Text>
          </Animated.View>
        )}

        {/* Reading timer */}
        {data.showReadingTimer && (
          <Text style={styles.readingTimer}>
            {Math.max(0, 10 - Math.floor(readingProgress * 10))} seconds remaining
          </Text>
        )}

        {/* Error tips */}
        {data.showErrorTips && (
          <View style={styles.errorTips}>
            <Text style={styles.errorTip}>Try repositioning your finger on the camera.</Text>
            <Text style={styles.errorTip}>Make sure the flash isn't blocked.</Text>
            <Text style={styles.errorTip}>Stay as still as you can.</Text>
          </View>
        )}

        {/* Permission denied explanation */}
        {data.showPermissionDenied && (
          <View style={styles.permissionDeniedExplanation}>
            <Text style={styles.permissionDeniedLine}>
              Please enable camera access in your device settings, then try again.
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafaf9" />
      
      {/* Skip intro button - FIXED: Now actually skips to soundscape */}
      {!isReturningUser && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipStep}>
          <Text style={styles.skipButtonText}>Skip this step</Text>
        </TouchableOpacity>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>sonarly</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Camera view - now using the pattern from the working example */}
      {cameraMounted && hasPermission && cameraDevice && (
        <View style={styles.hiddenCameraContainer}>
          <VisionCamera
            ref={camera}
            style={styles.hiddenCamera}
            device={cameraDevice}
            isActive={isCameraActive}
            fps={30}
            frameProcessorFps={30}
            torch={isCameraActive ? 'on' : 'off'} // Enable flash only when active
            frameProcessor={isCameraActive ? frameProcessor : undefined}
          />
        </View>
      )}
      
      {/* Main content */}
      <View style={styles.mainContent}>
        <View style={styles.container}>
          {/* Main title */}
          <Text style={styles.mainPrompt}>{data.title}</Text>
          
          {/* Debug overlay */}
          {debugInfo !== '' && (
            <View style={styles.debugOverlay}>
              <Text style={styles.debugTitle}>🔍 Debug Info:</Text>
              <Text style={styles.debugText}>{debugInfo}</Text>
              {ppgData && (
                <>
                  <Text style={styles.debugText}>📊 PPG Data:</Text>
                  <Text style={styles.debugText}>Frames: {frameCount}</Text>
                  {typeof ppgData.luma === 'number' && (
                    <Text style={styles.debugText}>Luma: {ppgData.luma.toFixed(2)}</Text>
                  )}
                  {ppgData.ts && <Text style={styles.debugText}>Time: {ppgData.ts}</Text>}
                </>
              )}
            </View>
          )}
          
          {/* Sonar container */}
          <View style={styles.sonarContainer}>
            {/* Ambient texture */}
            <View style={styles.ambientTexture} />
            
            {/* Ambient glow */}
            <Animated.View 
              style={[
                styles.ambientGlow,
                currentState === 2 && styles.ambientGlowReading
              ]} 
            />

            {/* Breathing rings */}
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

            {/* Sonar ripples - only during reading */}
            {currentState === 2 && (
              <>
                <Animated.View
                  style={[
                    styles.sonarRipple,
                    styles.ripple1,
                    { transform: [{ scale: sonarAnim }] }
                  ]}
                />
                <Animated.View
                  style={[
                    styles.sonarRipple,
                    styles.ripple2,
                    { transform: [{ scale: sonarAnim }] }
                  ]}
                />
              </>
            )}

            {/* Progress ring - only during reading */}
            {currentState === 2 && (
              <View style={styles.progressRingContainer}>
                <Svg width={240} height={240} style={styles.progressRingSvg}>
                  <Circle
                    cx={120}
                    cy={120}
                    r={110}
                    fill="none"
                    stroke="rgba(148,163,184,0.15)"
                    strokeWidth={2}
                  />
                  <Circle
                    cx={120}
                    cy={120}
                    r={110}
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray={691.15}
                    strokeDashoffset={691.15 - (readingProgress * 691.15)}
                  />
                  <Defs>
                    <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor="#ec4899" stopOpacity={0.6} />
                      <Stop offset="50%" stopColor="#a855f7" stopOpacity={0.7} />
                      <Stop offset="100%" stopColor="#ec4899" stopOpacity={0.6} />
                    </LinearGradient>
                  </Defs>
                </Svg>
              </View>
            )}

            {/* Celebration burst - only during success */}
            {currentState === 3 && (
              <Animated.View
                style={[
                  styles.celebrationBurst,
                  { transform: [{ scale: celebrationAnim }] }
                ]}
              />
            )}

            {/* Main circle */}
            <Animated.View 
              style={[
                styles.mainCircle,
                currentState === 2 && styles.mainCircleReading,
                { transform: [{ scale: breathingAnim }] }
              ]}
            >
              <View style={styles.depthHighlight} />
              {renderStateContent()}
            </Animated.View>
          </View>

          {/* Helper text */}
          {data.helper && (
            <Text style={styles.helperText}>{data.helper}</Text>
          )}

          {/* Additional content */}
          {renderAdditionalContent()}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {data.buttonText && (
              <TouchableOpacity
                style={[
                  styles.neutralButton,
                  data.buttonStyle === 'solid' && styles.solidButton
                ]}
                onPress={handleMainAction}
              >
                <Text style={[
                  styles.neutralButtonText,
                  data.buttonStyle === 'solid' && styles.solidButtonText
                ]}>
                  {data.buttonText}
                </Text>
              </TouchableOpacity>
            )}

            {(states[currentState] === 'error' || states[currentState] === 'permission-denied') && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleSecondaryAction}
              >
                <Text style={styles.secondaryButtonText}>
                  {states[currentState] === 'error' ? 'Skip for Now' : 'Skip this step'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafaf9',
  },
  
  // Hidden camera for PPG detection
  hiddenCameraContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    zIndex: -1,
  },
  hiddenCamera: {
    width: 100,
    height: 100,
  },
  
  // Debug overlay styles
  debugOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
    maxHeight: 150,
  },
  debugTitle: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugText: {
    color: '#00ff00',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  
  // Skip intro button
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.3)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    zIndex: 100,
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '400', // Slightly increased for button readability
    color: '#64748b',
    letterSpacing: 0.5,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#94a3b8',
    opacity: 0.6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '200', // Lighter weight for header consistency
    color: '#475569',
    letterSpacing: 8, // Increased to match other screens
  },
  headerSpacer: {
    width: 32,
  },

  // Main content
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  container: {
    flex: 1,
  },
  mainPrompt: {
    fontSize: 24, // Reduced to match SoundscapeGenerationScreen
    fontWeight: '300', // Changed from '600' to light weight
    textAlign: 'center',
    color: '#475569',
    marginBottom: 16,
    letterSpacing: -0.5,
    lineHeight: 30, // Adjusted for better spacing
    maxWidth: 320, // Slightly increased for better text flow
    alignSelf: 'center',
    paddingHorizontal: 16, // Added to prevent text cutoff
  },

  // Sonar container - ADJUSTED to match SoundscapeGenerationScreen position
  sonarContainer: {
    width: 240,
    height: 240,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16, // Reduced from 32 to move circle up to match other screens
    marginBottom: 24,
    position: 'relative',
  },
  ambientTexture: {
    position: 'absolute',
    width: 400,
    height: 400,
    top: -80,
    left: -80,
    borderRadius: 200,
    backgroundColor: 'rgba(236,72,153,0.03)',
  },
  ambientGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.1,
    shadowRadius: 50,
    elevation: 25,
  },
  ambientGlowReading: {
    backgroundColor: 'rgba(236,72,153,0.08)',
    shadowColor: '#ec4899',
    shadowOpacity: 0.15,
  },

  // Breathing rings
  breathingRing: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 1000,
    opacity: 0.08,
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
    opacity: 0.1,
  },
  ring3: {
    width: 152,
    height: 152,
    borderColor: '#475569',
    opacity: 0.12,
  },

  // Sonar ripples
  sonarRipple: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
  },
  ripple1: {
    borderColor: 'rgba(236,72,153,0.2)',
  },
  ripple2: {
    borderColor: 'rgba(236,72,153,0.15)',
  },

  // Progress ring
  progressRingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 240,
    height: 240,
    zIndex: 1,
  },
  progressRingSvg: {
    transform: [{ rotate: '-90deg' }],
  },

  // Celebration burst
  celebrationBurst: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(100,255,218,0.15)',
    top: -50,
    left: -50,
  },

  // Main circle
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
    zIndex: 2,
  },
  mainCircleReading: {
    backgroundColor: 'rgba(236,72,153,0.08)',
    borderColor: 'rgba(236,72,153,0.15)',
    shadowColor: '#ec4899',
    shadowOpacity: 0.2,
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

  // Center content
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // Camera icon (permission state)
  cameraIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBody: {
    width: 48,
    height: 36,
    backgroundColor: '#64748b',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cameraLens: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#334155',
    borderWidth: 2,
    borderColor: '#475569',
  },

  // Camera glow rings
  cameraGlowRing: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.2)',
  },
  glowRing1: {
    width: 80,
    height: 80,
  },
  glowRing2: {
    width: 100,
    height: 100,
  },
  glowRing3: {
    width: 120,
    height: 120,
  },

  // Camera lens (placement state)
  lensContainer: {
    width: 80,
    height: 80,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lensRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#374151',
    borderWidth: 3,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  lensCenter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#475569',
  },
  lensGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(100,255,218,0.2)',
    top: -8,
    left: -8,
  },

  // Cover gesture
  coverGesture: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(251,191,36,0.4)',
    top: -20,
    left: -20,
  },

  // Waveform (reading state)
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

  // BPM display
  bpmDisplay: {
    alignItems: 'center',
  },
  bpmNumber: {
    fontSize: 48,
    fontWeight: '200', // Lighter weight for more elegant look
    color: '#ec4899',
    marginBottom: 8,
    letterSpacing: -1,
  },
  bpmLabel: {
    fontSize: 14,
    color: '#64748b',
    letterSpacing: 1,
    fontWeight: '400', // Slightly reduced for consistency
  },

  // Success sonar
  successSonar: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sonarPulseRing: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#64ffda',
  },
  ringA: {
    width: 40,
    height: 40,
  },
  ringB: {
    width: 70,
    height: 70,
  },
  ringC: {
    width: 100,
    height: 100,
  },
  successCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  successDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64ffda',
  },

  // Error icon
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    shadowColor: '#f59e0b',
    elevation: 25,
  },
  errorIconText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },

  // Permission denied icon
  permissionDeniedIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  deniedSlash: {
    position: 'absolute',
    width: 60,
    height: 2,
    backgroundColor: '#64748b',
    transform: [{ rotate: '45deg' }],
  },

  // Helper text
  helperText: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
    color: '#64748b',
    opacity: 0.8,
    fontWeight: '300', // Added light weight for consistency
    letterSpacing: 0.2, // Added subtle letter spacing
  },
  helperText2: {
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 24,
    fontSize: 14,
    color: '#64748b',
    opacity: 0.8,
    fontWeight: '300', // Added light weight for consistency
    letterSpacing: 0.2, // Added subtle letter spacing
  },

  // Additional content
  additionalContent: {
    alignItems: 'center',
  },

  // Permission explanation
  permissionExplanation: {
    alignItems: 'center',
    marginBottom: 40, // Increased from 24 to create more space before button
    marginTop: 48,
  },
  permissionLine: {
    fontSize: 14,
    color: '#64748b',
    opacity: 0.8,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: 320,
    fontWeight: '300', // Light weight for consistency
    letterSpacing: 0.2, // Subtle letter spacing
  },

  // Onboarding tooltip
  onboardingTooltip: {
    marginTop: 16,
    marginBottom: 16,
  },
  tooltipText: {
    fontSize: 13,
    color: '#64748b',
    opacity: 0.7,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.3)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    letterSpacing: 0.2,
    fontWeight: '300', // Light weight for consistency
  },

  // Reading timer
  readingTimer: {
    fontSize: 14,
    color: '#64748b',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '300', // Light weight for consistency
    letterSpacing: 0.2, // Subtle letter spacing
  },

  // Error tips
  errorTips: {
    maxWidth: 280,
    marginBottom: 32,
    alignItems: 'center',
  },
  errorTip: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 0.025,
    lineHeight: 20,
    marginBottom: 16,
  },

  // Permission denied explanation
  permissionDeniedExplanation: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 32,
  },
  permissionDeniedLine: {
    fontSize: 14,
    color: '#64748b',
    opacity: 0.8,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
    fontWeight: '300', // Light weight for consistency
    letterSpacing: 0.2, // Subtle letter spacing
  },

  // Buttons
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: 32,
    alignItems: 'center',
    gap: 16,
  },
  neutralButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1.5,
    borderColor: '#ec4899',
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 48,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    shadowColor: '#ec4899',
    elevation: 8,
  },
  neutralButtonText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#ec4899',
    letterSpacing: 0.3,
  },
  solidButton: {
    backgroundColor: '#ec4899',
  },
  solidButtonText: {
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.3)',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#475569',
    letterSpacing: 0.5,
  },
});

export default BiometricCaptureScreen;
