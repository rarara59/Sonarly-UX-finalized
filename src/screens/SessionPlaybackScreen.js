// SessionPlaybackScreen.js - New screen needed
import React, { useState, useEffect } from 'react';

const SessionPlaybackScreen = ({ route, navigation }) => {
  const { sessionData } = route.params; // Passed from Library
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMode, setPlaybackMode] = useState('frozen'); // or 'live'
  const [currentBpmIndex, setCurrentBpmIndex] = useState(0);
  
  // Core state for playback
  const [sessionInfo] = useState({
    originalBpm: sessionData.avgBpm,
    mode: sessionData.mode,
    duration: sessionData.duration,
    biometricLoop: sessionData.biometricSnapshot || [sessionData.avgBpm],
    parameters: sessionData.parameters || {}
  });
  
  // Playback logic
  useEffect(() => {
    if (isPlaying && playbackMode === 'frozen') {
      // Loop through saved biometric data
      const interval = setInterval(() => {
        setCurrentBpmIndex(prev => 
          (prev + 1) % sessionInfo.biometricLoop.length
        );
      }, 1000); // Update every second
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, playbackMode]);
  
  const currentBpm = playbackMode === 'frozen' 
    ? sessionInfo.biometricLoop[currentBpmIndex]
    : sessionData.avgBpm; // Would connect to live biometric in Phase 2
  
  return (
    <View style={styles.container}>
      {/* Session Header */}
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionTitle}>{sessionData.name}</Text>
        <Text style={styles.sessionMeta}>
          {sessionData.mode.toUpperCase()} | {sessionData.duration}s | {sessionData.avgBpm} BPM avg
        </Text>
      </View>
      
      {/* Playback Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity 
          style={[styles.modeButton, playbackMode === 'frozen' && styles.modeActive]}
          onPress={() => setPlaybackMode('frozen')}
        >
          <Text style={styles.modeText}>REPLAY ORIGINAL</Text>
        </TouchableOpacity>
        
        {/* Phase 2: Live mode toggle */}
        <TouchableOpacity 
          style={[styles.modeButton, styles.modeDisabled]}
          disabled={true}
        >
          <Text style={[styles.modeText, styles.modeTextDisabled]}>LIVE MODE (COMING SOON)</Text>
        </TouchableOpacity>
      </View>
      
      {/* Reuse existing monitor screen components based on mode */}
      {sessionData.mode === 'noise' && (
        <NoiseVisualization 
          bpm={currentBpm}
          parameters={sessionInfo.parameters}
          isPlaying={isPlaying}
        />
      )}
      
      {sessionData.mode === 'ambient' && (
        <AmbientVisualization 
          bpm={currentBpm}
          parameters={sessionInfo.parameters}
          isPlaying={isPlaying}
        />
      )}
      
      {/* Playback Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.playButton, isPlaying && styles.playButtonActive]}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? '[STOP_PLAYBACK]' : '[START_PLAYBACK]'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>[BACK_TO_LIBRARY]</Text>
        </TouchableOpacity>
      </View>
      
      {/* Session Details */}
      <View style={styles.sessionDetails}>
        <Text style={styles.detailsTitle}>session_parameters</Text>
        <Text style={styles.detailsText}>
          Created: {new Date(sessionData.createdAt).toLocaleString()}{'\n'}
          Mode: {sessionData.mode.toUpperCase()}{'\n'}
          Avg BPM: {sessionData.avgBpm}{'\n'}
          Quality: {sessionData.quality}%
        </Text>
      </View>
    </View>
  );
};