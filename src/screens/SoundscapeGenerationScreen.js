import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Slider from '@react-native-community/slider';

const { width, height } = Dimensions.get('window');

// Design Tokens
const SPACING = {
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
};

const SoundscapeGenerationScreen = ({ navigation, route }) => {
  // Props from navigation
  const { selectedEmotion = 'energized', biometricData = { heartRate: 68 } } = route.params || {};

  // State management
  const [currentMood, setCurrentMood] = useState(selectedEmotion);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCustomizeDrawer, setShowCustomizeDrawer] = useState(false);
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Customization state
  const [selectedTempo, setSelectedTempo] = useState(0);
  const [selectedSession, setSelectedSession] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [pulseValue, setPulseValue] = useState(50);

  // Animation refs
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;
  const ring3Anim = useRef(new Animated.Value(0)).current;
  const waveformAnims = useRef(Array.from({ length: 8 }, () => new Animated.Value(1))).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  // Mood theme configurations
  const moodThemes = {
    calm: {
      title: "Ready to find calm?",
      tagline: "Let stillness settle in.",
      track: "You're listening to: Calm Loop #1",
      customizeButton: "Customize Calm",
      playButtonText: { play: "Begin Calm", pause: "Pause Calm" },
      statusText: "Calming session in progress",
      drawerTitle: "Center Yourself",
      drawerSubtitle: "Design your calm moment.",
      intensityQuestion: "Set your emotional tone",
      intensityDescription: "Choose your mindful state",
      rhythmLabel: "Control your breathing rhythm",
      rhythmDescription: "Guide your inner rhythm",
      rhythmLabels: ["Light flow", "Grounded pulse"],
      durationQuestion: "⏱ How long do you need to clear your mind?",
      applyButton: "🧘 Start My Calm Session",
      mindfulQuote: "Inhale presence. Exhale noise.",
      colors: {
        primary: '#84cc16',
        primaryRgba: 'rgba(132, 204, 22, 0.4)',
        light: 'rgba(132, 204, 22, 0.2)',
        medium: 'rgba(132, 204, 22, 0.3)',
        dark: 'rgba(132, 204, 22, 0.8)',
      },
      tempoOptions: [
        { id: 'gentle', label: 'Gentle' },
        { id: 'balanced', label: 'Balanced' },
        { id: 'deep', label: 'Deep Calm' }
      ],
      sessionTypes: [
        { id: 'reset', title: 'Emotional Reset', subtitle: 'Let tension dissolve' },
        { id: 'center', title: 'Center My Mind', subtitle: 'Find clarity in the moment' },
        { id: 'release', title: 'Let Go of Stress', subtitle: 'Release the mental load' }
      ],
      durations: ['5m', '10m', '15m', '20m'],
      animationSpeed: { breathe: 2000, rings: 3000, wave: 1500 }
    },
    focused: {
      title: "Breathe in. Press play.",
      tagline: "Tune into your clarity.",
      track: "You're listening to: Focus Flow #1",
      customizeButton: "Customize Focus",
      playButtonText: { play: "Begin Focus", pause: "Pause Focus" },
      statusText: "Focus session in progress",
      drawerTitle: "Customize Your Focus Zone",
      drawerSubtitle: "",
      intensityQuestion: "How sharp should it feel?",
      intensityDescription: "Concentration intensity level",
      rhythmLabel: "Adjust the structure",
      rhythmDescription: "Background rhythm patterns",
      rhythmLabels: ["Ambient", "Structured rhythm"],
      durationQuestion: "⏱ How long should we focus you?",
      applyButton: "🎯 Start My Focus Zone",
      colors: {
        primary: '#1d4ed8',
        primaryRgba: 'rgba(29, 78, 216, 0.4)',
        light: 'rgba(29, 78, 216, 0.2)',
        medium: 'rgba(29, 78, 216, 0.3)',
        dark: 'rgba(29, 78, 216, 0.8)',
      },
      tempoOptions: [
        { id: 'light', label: 'Light' },
        { id: 'steady', label: 'Steady' },
        { id: 'intense', label: 'Intense Focus' }
      ],
      sessionTypes: [
        { id: 'deep', title: 'Deep Work', subtitle: 'Lock in' },
        { id: 'study', title: 'Study Session', subtitle: 'Learn mode' },
        { id: 'creative', title: 'Creative Flow', subtitle: 'Think freely' }
      ],
      durations: ['15m', '25m', '45m', '60m'],
      animationSpeed: { breathe: 2000, rings: 3000, wave: 1500 }
    },
    energized: {
      title: "Fuel your focus. Hit play.",
      tagline: "Power up from within.",
      track: "You're listening to: Energy Boost #1",
      customizeButton: "Customize Boost",
      playButtonText: { play: "Begin Boost", pause: "Pause Boost" },
      statusText: "Energy boost in progress",
      drawerTitle: "Customize Your Energy Boost",
      drawerSubtitle: "",
      intensityQuestion: "How intense should it feel?",
      intensityDescription: "Energy boost strength",
      rhythmLabel: "Adjust the rhythm",
      rhythmDescription: "Beat emphasis and drive",
      rhythmLabels: ["Gentle pulse", "Strong rhythm"],
      durationQuestion: "⏱ How long should we energize you?",
      applyButton: "⚡ Start My Energy Boost",
      colors: {
        primary: '#f97316',
        primaryRgba: 'rgba(249, 115, 22, 0.4)',
        light: 'rgba(249, 115, 22, 0.2)',
        medium: 'rgba(249, 115, 22, 0.3)',
        dark: 'rgba(249, 115, 22, 0.8)',
      },
      tempoOptions: [
        { id: 'steady', label: 'Steady' },
        { id: 'elevated', label: 'Elevated' },
        { id: 'peak', label: 'Peak Boost' }
      ],
      sessionTypes: [
        { id: 'morning', title: 'Morning Spark', subtitle: 'Gentle wake-up' },
        { id: 'midday', title: 'Midday Boost', subtitle: 'Beat the slump' },
        { id: 'workout', title: 'Workout Pulse', subtitle: 'Power up' }
      ],
      durations: ['1m', '3m', '5m', '10m'],
      animationSpeed: { breathe: 1500, rings: 1500, wave: 1000 }
    },
    sleepy: {
      title: "Ready to wind down?",
      tagline: "Sink into stillness.",
      track: "You're listening to: Dream Drift #1",
      customizeButton: "Customize Sleep",
      playButtonText: { play: "Begin Sleep", pause: "Pause Sleep" },
      statusText: "Sleep preparation in progress",
      drawerTitle: "Customize Your Sleep Journey",
      drawerSubtitle: "",
      intensityQuestion: "How deep should it feel?",
      intensityDescription: "Sleep preparation depth",
      rhythmLabel: "Adjust the waves",
      rhythmDescription: "Gentle sound patterns",
      rhythmLabels: ["Whisper soft", "Gentle waves"],
      durationQuestion: "⏱ How long should we help you drift?",
      applyButton: "😴 Start My Sleep Journey",
      colors: {
        primary: '#7c3aed',
        primaryRgba: 'rgba(124, 58, 237, 0.4)',
        light: 'rgba(124, 58, 237, 0.2)',
        medium: 'rgba(124, 58, 237, 0.3)',
        dark: 'rgba(124, 58, 237, 0.8)',
      },
      tempoOptions: [
        { id: 'light', label: 'Light' },
        { id: 'gentle', label: 'Gentle' },
        { id: 'deep', label: 'Deep Rest' }
      ],
      sessionTypes: [
        { id: 'gentle', title: 'Gentle Drift', subtitle: 'Soft landing' },
        { id: 'deep', title: 'Deep Sleep', subtitle: 'Full restore' },
        { id: 'nap', title: 'Power Nap', subtitle: 'Quick recharge' }
      ],
      durations: ['10m', '20m', '30m', '60m', '∞ Loop'],
      animationSpeed: { breathe: 3000, rings: 4000, wave: 2500 }
    }
  };

  const currentTheme = moodThemes[currentMood];

  // Animation effects
  useEffect(() => {
    // Breathing animation
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.05,
          duration: currentTheme.animationSpeed.breathe,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: currentTheme.animationSpeed.breathe,
          useNativeDriver: true,
        }),
      ])
    );

    // Ring pulse animations
    const ringAnimation1 = Animated.loop(
      Animated.sequence([
        Animated.timing(ring1Anim, {
          toValue: 1,
          duration: currentTheme.animationSpeed.rings / 2,
          useNativeDriver: true,
        }),
        Animated.timing(ring1Anim, {
          toValue: 0,
          duration: currentTheme.animationSpeed.rings / 2,
          useNativeDriver: true,
        }),
      ])
    );

    const ringAnimation2 = Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(ring2Anim, {
          toValue: 1,
          duration: currentTheme.animationSpeed.rings / 2,
          useNativeDriver: true,
        }),
        Animated.timing(ring2Anim, {
          toValue: 0,
          duration: currentTheme.animationSpeed.rings / 2,
          useNativeDriver: true,
        }),
      ])
    );

    const ringAnimation3 = Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(ring3Anim, {
          toValue: 1,
          duration: currentTheme.animationSpeed.rings / 2,
          useNativeDriver: true,
        }),
        Animated.timing(ring3Anim, {
          toValue: 0,
          duration: currentTheme.animationSpeed.rings / 2,
          useNativeDriver: true,
        }),
      ])
    );

    // Waveform animations
    const waveformAnimations = waveformAnims.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 100),
          Animated.timing(anim, {
            toValue: 1.5,
            duration: currentTheme.animationSpeed.wave / 2,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: currentTheme.animationSpeed.wave / 2,
            useNativeDriver: true,
          }),
        ])
      )
    );

    // Glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.02,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    // Start animations
    breatheAnimation.start();
    ringAnimation1.start();
    ringAnimation2.start();
    ringAnimation3.start();
    waveformAnimations.forEach(anim => anim.start());
    glowAnimation.start();

    return () => {
      breatheAnimation.stop();
      ringAnimation1.stop();
      ringAnimation2.stop();
      ringAnimation3.stop();
      waveformAnimations.forEach(anim => anim.stop());
      glowAnimation.stop();
    };
  }, [currentMood]);

  // Handler functions
  const handlePlayPause = () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    setHasInteracted(true);
    console.log('Play/Pause toggled. New state:', newPlayingState);
    // Here you would integrate with your audio system
    if (newPlayingState) {
      console.log('▶️ Starting audio playback for mood:', currentMood);
    } else {
      console.log('⏸️ Pausing audio playback');
    }
  };

  const handleMoodChange = (mood) => {
    setCurrentMood(mood);
    setShowMoodDropdown(false);
    // Reset customization to defaults
    setSelectedTempo(0);
    setSelectedSession(0);
    setSelectedDuration(1);
  };

  const handleCustomizePress = () => {
    setShowCustomizeDrawer(true);
    // Don't set hasInteracted here - only when they actually apply settings
  };

  const handleApplySettings = () => {
    setShowCustomizeDrawer(false);
    setHasInteracted(true); // Set interaction state when they actually apply
    // Here you would apply the settings to the audio system
    console.log('Applied settings:', {
      mood: currentMood,
      tempo: selectedTempo,
      session: selectedSession,
      duration: selectedDuration,
      pulse: pulseValue,
    });
  };

  const handleSaveToLibrary = () => {
    console.log('Saving current configuration to library:', {
      mood: currentMood,
      tempo: selectedTempo,
      session: selectedSession,
      duration: selectedDuration,
      pulse: pulseValue,
      biometricData,
    });
    // Here you would save to user's library
  };

  // Component renderers
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>sonarly</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderMoodSelector = () => (
    <View style={styles.moodSelector}>
      <TouchableOpacity
        style={styles.moodButton}
        onPress={() => setShowMoodDropdown(!showMoodDropdown)}
      >
        <Text style={styles.moodButtonText}>
          {currentMood.charAt(0).toUpperCase() + currentMood.slice(1)}
        </Text>
      </TouchableOpacity>
      {showMoodDropdown && (
        <View style={styles.moodDropdown}>
          {Object.keys(moodThemes).map((mood) => (
            <TouchableOpacity
              key={mood}
              style={styles.moodOption}
              onPress={() => handleMoodChange(mood)}
            >
              <Text style={styles.moodOptionText}>
                {mood.charAt(0).toUpperCase() + mood.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderVisualization = () => (
    <View style={styles.visualizationArea}>
      {/* Frequency Rings */}
      <Animated.View
        style={[
          styles.frequencyRing,
          styles.ring3,
          {
            opacity: ring3Anim,
            transform: [
              {
                scale: ring3Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1.1],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width={250} height={250} style={styles.svgRing}>
          <Circle
            cx={125}
            cy={125}
            r={123}
            stroke={currentTheme.colors.light}
            strokeWidth={2}
            fill="transparent"
          />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          styles.frequencyRing,
          styles.ring2,
          {
            opacity: ring2Anim,
            transform: [
              {
                scale: ring2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1.1],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width={225} height={225} style={styles.svgRing}>
          <Circle
            cx={112.5}
            cy={112.5}
            r={110.5}
            stroke={currentTheme.colors.medium}
            strokeWidth={2}
            fill="transparent"
          />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          styles.frequencyRing,
          styles.ring1,
          {
            opacity: ring1Anim,
            transform: [
              {
                scale: ring1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1.1],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width={200} height={200} style={styles.svgRing}>
          <Circle
            cx={100}
            cy={100}
            r={98}
            stroke={currentTheme.colors.primaryRgba}
            strokeWidth={2}
            fill="transparent"
          />
        </Svg>
      </Animated.View>

      {/* Main Circle with Enhanced Active State */}
      <Animated.View
        style={[
          styles.mainCircle,
          {
            shadowColor: currentTheme.colors.primary,
            transform: [{ scale: breatheAnim }],
          },
          isPlaying && {
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.25,
            shadowRadius: 35,
            elevation: 18,
            backgroundColor: 'rgba(255,255,255,1.0)',
            borderWidth: 2,
            borderColor: `${currentTheme.colors.primary}30`,
          }
        ]}
      >
        <View style={styles.waveformDots}>
          {waveformAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveformDot,
                {
                  backgroundColor: currentTheme.colors.dark,
                  height: [12, 20, 25, 18, 22, 16, 14, 10][index],
                  transform: [{ scaleY: anim }],
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );

  const renderCustomizeDrawer = () => (
    <Modal
      visible={showCustomizeDrawer}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCustomizeDrawer(false)}
      presentationStyle="overFullScreen"
    >
      <View style={styles.drawerOverlay}>
        <TouchableOpacity 
          style={styles.drawerBackdrop} 
          activeOpacity={1} 
          onPress={() => setShowCustomizeDrawer(false)}
        />
        <View style={styles.customizeDrawer}>
          {/* Drawer Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.drawerTitleSection}>
              <Text style={styles.drawerTitle}>{currentTheme.drawerTitle}</Text>
              {currentTheme.drawerSubtitle && (
                <Text style={styles.drawerSubtitle}>{currentTheme.drawerSubtitle}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeDrawer}
              onPress={() => setShowCustomizeDrawer(false)}
            >
              <Text style={styles.closeDrawerText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
            {/* Mindful Quote for Calm */}
            {currentMood === 'calm' && (
              <View style={[styles.mindfulQuote, { borderLeftColor: currentTheme.colors.medium }]}>
                <Text style={[styles.mindfulQuoteText, { color: currentTheme.colors.primary }]}>
                  {currentTheme.mindfulQuote}
                </Text>
              </View>
            )}

            {/* Session Type Selector */}
            <View style={styles.controlSection}>
              <Text style={styles.controlLabel}>What's the occasion?</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.sessionCarousel}
                contentContainerStyle={styles.sessionCarouselContent}
                bounces={false}
              >
                {currentTheme.sessionTypes.map((session, index) => (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.sessionOption,
                      selectedSession === index && [
                        styles.sessionOptionActive,
                        { borderColor: currentTheme.colors.primary, backgroundColor: `${currentTheme.colors.primary}15` }
                      ],
                    ]}
                    onPress={() => setSelectedSession(index)}
                  >
                    <Text style={[
                      styles.sessionTitle,
                      selectedSession === index && { color: currentTheme.colors.primary }
                    ]}>
                      {session.title}
                    </Text>
                    <Text style={styles.sessionSubtitle}>{session.subtitle}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Tempo Control */}
            <View style={styles.controlSection}>
              <Text style={styles.controlLabel}>{currentTheme.intensityQuestion}</Text>
              <View style={styles.tempoOptions}>
                {currentTheme.tempoOptions.map((tempo, index) => (
                  <TouchableOpacity
                    key={tempo.id}
                    style={[
                      styles.tempoOption,
                      selectedTempo === index && [
                        styles.tempoOptionActive,
                        { borderColor: currentTheme.colors.primary, backgroundColor: `${currentTheme.colors.primary}15` }
                      ],
                    ]}
                    onPress={() => setSelectedTempo(index)}
                  >
                    <Text style={[
                      styles.tempoOptionText,
                      selectedTempo === index && { color: currentTheme.colors.primary, fontWeight: '500' }
                    ]}>
                      {tempo.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pulse Emphasis Control */}
            <View style={styles.controlSection}>
              <Text style={styles.controlLabel}>{currentTheme.rhythmLabel}</Text>
              <View style={styles.pulseSliderContainer}>
                <Text style={styles.sliderValueText}>Pulse: {pulseValue}%</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={pulseValue}
                  onValueChange={setPulseValue}
                  minimumTrackTintColor={currentTheme.colors.primary}
                  maximumTrackTintColor="rgba(203,213,225,0.3)"
                  thumbStyle={{
                    backgroundColor: currentTheme.colors.primary,
                    width: 20,
                    height: 20,
                  }}
                  trackStyle={{
                    height: 4,
                    borderRadius: 2,
                  }}
                  step={5}
                />
                <View style={styles.pulseLabels}>
                  <Text style={styles.pulseLabelText}>{currentTheme.rhythmLabels[0]}</Text>
                  <Text style={styles.pulseLabelText}>{currentTheme.rhythmLabels[1]}</Text>
                </View>
              </View>
            </View>

            {/* Duration Control */}
            <View style={styles.controlSection}>
              <Text style={styles.controlLabel}>{currentTheme.durationQuestion}</Text>
              <View style={styles.durationOptions}>
                {currentTheme.durations.map((duration, index) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationOption,
                      selectedDuration === index && [
                        styles.durationOptionActive,
                        { borderColor: currentTheme.colors.primary, backgroundColor: `${currentTheme.colors.primary}15` }
                      ],
                    ]}
                    onPress={() => setSelectedDuration(index)}
                  >
                    <Text style={[
                      styles.durationOptionText,
                      selectedDuration === index && { color: currentTheme.colors.primary, fontWeight: '500' }
                    ]}>
                      {duration}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: currentTheme.colors.primary }]}
              onPress={handleApplySettings}
            >
              <Text style={styles.applyButtonText}>{currentTheme.applyButton}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafaf9" />
      
      {renderMoodSelector()}
      {renderHeader()}
      
      <View style={styles.mainContent}>
        {/* Top Section */}
        <View style={styles.contentTop}>
          <Text style={styles.mainTitle}>{currentTheme.title}</Text>
          <Text style={styles.topTagline}>{currentTheme.tagline}</Text>
        </View>
        
        {/* Center Section with Visualization - Fixed Position */}
        <View style={styles.contentCenter}>
          {renderVisualization()}
          <Text style={[styles.trackInfo, { color: currentTheme.colors.primary }]}>
            {currentTheme.track}
          </Text>
          <Text style={styles.biometricInfo}>({biometricData.heartRate} BPM)</Text>
        </View>

        {/* Bottom Section with Action Buttons - Always Visible */}
        <View style={styles.contentBottom}>
          <View style={styles.actionSection}>
            {/* Primary Play/Pause Button - Filled and Dominant */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: currentTheme.colors.primary, // Always filled for primary action
                  borderColor: currentTheme.colors.primary,
                }
              ]}
              onPress={handlePlayPause}
            >
              <Text style={styles.primaryButtonText}>
                {isPlaying ? currentTheme.playButtonText.pause : currentTheme.playButtonText.play}
              </Text>
            </TouchableOpacity>

            {/* Status Text - Removed per feedback */}
            {/* {isPlaying && (
              <Text style={[styles.statusText, { color: currentTheme.colors.primary }]}>
                {currentTheme.statusText}
              </Text>
            )} */}

            {/* Customize Button - Secondary Action */}
            <TouchableOpacity
              style={[
                styles.customizeButton,
                { borderColor: currentTheme.colors.primary }
              ]}
              onPress={handleCustomizePress}
            >
              <Text style={[styles.customizeButtonText, { color: currentTheme.colors.primary }]}>
                ✧ {currentTheme.customizeButton}
              </Text>
            </TouchableOpacity>

            {/* Save Button - Only after interaction with smooth transition */}
            <View style={[styles.saveButtonContainer, { opacity: hasInteracted ? 1 : 0 }]}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { borderColor: currentTheme.colors.primary }
                ]}
                onPress={handleSaveToLibrary}
                disabled={!hasInteracted}
              >
                <Text style={[styles.saveButtonText, { color: currentTheme.colors.primary }]}>
                  Save to Library
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {renderCustomizeDrawer()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#94a3b8',
    opacity: 0.6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '200',
    color: '#475569',
    letterSpacing: 10,
  },
  headerSpacer: {
    width: 32,
  },
  moodSelector: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 100,
  },
  moodButton: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  moodButtonText: {
    color: 'white',
    fontSize: 12,
  },
  moodDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    minWidth: 120,
  },
  moodOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  moodOptionText: {
    color: 'white',
    fontSize: 12,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  contentTop: {
    alignItems: 'center',
    paddingBottom: SPACING.medium,
  },
  contentCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.medium,
    flex: 0.55, // Reduced from 0.6 to give more space to buttons
  },
  contentBottom: {
    flex: 0.45, // Increased from 0.4 to accommodate all buttons
    justifyContent: 'flex-start',
    paddingTop: SPACING.medium,
    paddingBottom: SPACING.large, // Add bottom padding to prevent cutoff
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '300',
    textAlign: 'center',
    color: '#475569',
    marginBottom: 12,
    letterSpacing: -0.5,
    lineHeight: 30,
    maxWidth: 320,
    paddingHorizontal: 16,
  },
  topTagline: {
    fontSize: 14,
    fontWeight: '200',
    textAlign: 'center',
    color: '#64748b',
    opacity: 0.9,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
  },
  visualizationArea: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    margin: SPACING.medium,
  },
  frequencyRing: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring1: {
    width: 200,
    height: 200,
  },
  ring2: {
    width: 225,
    height: 225,
  },
  ring3: {
    width: 250,
    height: 250,
  },
  svgRing: {
    position: 'absolute',
  },
  mainCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  waveformDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 20,
  },
  waveformDot: {
    width: 4,
    borderRadius: 2,
  },
  trackInfo: {
    textAlign: 'center',
    marginTop: SPACING.small, // Reduced from SPACING.medium to move text up
    marginBottom: SPACING.small,
    fontSize: 13,
    opacity: 0.8,
    fontWeight: '300',
  },
  biometricInfo: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    opacity: 0.7,
    fontWeight: '300',
    marginBottom: 0, // No bottom margin needed now
  },
  // CLEAN ACTION SECTION - Single layout path with proper spacing
  actionSection: {
    alignItems: 'center',
    paddingTop: SPACING.medium, // Reduced back to medium for better spacing
  },
  primaryButton: {
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 16, // Slightly larger for primary action
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48, // Taller for primary action
    minWidth: 180, // Wider for primary action
    marginBottom: SPACING.small, // Reduced margin to save space
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12,
  },
  primaryButtonText: {
    fontSize: 17, // Larger text for primary action
    fontWeight: '600', // Bolder for primary action
    letterSpacing: 0.5,
    color: 'white', // Always white on filled background
  },
  statusText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
    marginBottom: SPACING.medium, // Increased for better spacing between status and buttons
  },
  customizeButton: {
    backgroundColor: 'transparent', // Outlined style for secondary action
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 10, // Smaller for secondary action
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 140, // Narrower for secondary action
    marginBottom: SPACING.small, // Reduced margin to save space
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  customizeButtonText: {
    fontSize: 14, // Smaller for secondary action
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  saveButtonContainer: {
    minHeight: 48, // Reduced from 56 to save space
    marginTop: 0, // Removed extra margin
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 160,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  // Drawer Styles
  drawerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  customizeDrawer: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 20,
    minHeight: '75%',
    maxHeight: '90%',
    zIndex: 1000,
    width: '100%',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  drawerTitleSection: {
    flex: 1,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 4,
  },
  drawerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '300',
    opacity: 0.8,
  },
  closeDrawer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDrawerText: {
    fontSize: 18,
    color: '#64748b',
  },
  drawerContent: {
    flex: 1,
  },
  mindfulQuote: {
    textAlign: 'center',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 20,
    opacity: 0.9,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(132, 204, 22, 0.05)',
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  mindfulQuoteText: {
    textAlign: 'center',
  },
  controlSection: {
    marginBottom: 25,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 15, // Increased since we removed controlDescription
  },
  tempoOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  tempoOption: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'rgba(132, 204, 22, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  tempoOptionActive: {
    // Colors applied dynamically based on mood
  },
  tempoOptionText: {
    fontSize: 13,
    color: '#64748b',
  },
  sessionCarousel: {
    marginVertical: 5,
  },
  sessionCarouselContent: {
    paddingRight: 16,
    paddingLeft: 0,
    alignItems: 'stretch',
  },
  sessionOption: {
    width: 108,
    paddingHorizontal: 6,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'rgba(132, 204, 22, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'white',
    marginRight: 6,
  },
  sessionOptionActive: {
    // Colors applied dynamically based on mood
  },
  sessionTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 3,
    textAlign: 'center',
    lineHeight: 12,
  },
  sessionSubtitle: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 10,
  },
  pulseSliderContainer: {
    marginVertical: 15,
  },
  sliderValueText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    fontWeight: '400',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  pulseLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pulseLabelText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  durationOption: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'rgba(132, 204, 22, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  durationOptionActive: {
    // Colors applied dynamically based on mood
  },
  durationOptionText: {
    fontSize: 13,
    color: '#64748b',
  },
  applyButton: {
    width: '100%',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 4,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SoundscapeGenerationScreen;