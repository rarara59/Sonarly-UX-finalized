// src/screens/LibraryScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  SafeAreaView,
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
  console.log('Design system import error in LibraryScreen, using fallbacks:', error);
}

export default function LibraryScreen({ navigation }) {
  const [savedSoundscapes, setSavedSoundscapes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // FIX: Add navigation guard state
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Load soundscapes whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSavedSoundscapes();
    }, [])
  );
  
  // Load saved soundscapes from storage
  const loadSavedSoundscapes = useCallback(async () => {
    setIsLoading(true);
    try {
      const soundscapes = await SoundscapeStorageService.getSavedSoundscapes();
      // Sort by creation date (newest first)
      soundscapes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSavedSoundscapes(soundscapes);
    } catch (error) {
      console.error('Error loading soundscapes:', error);
      Alert.alert('Error', 'Failed to load saved soundscapes');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Format date for display (clinical style)
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `today_${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(':', '')}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `yesterday_${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(':', '')}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        year: '2-digit', 
        month: '2-digit', 
        day: '2-digit' 
      }).replace(/\//g, '');
    }
  }, []);
  
  // Get mode configuration for theming
  const getModeConfig = useCallback((soundscape) => {
    // Try to determine mode from data or default to noise
    const mode = soundscape.mode || 'noise'; // Assuming mode might be stored
    switch (mode) {
      case 'chillhop':
        return { color: colors.signalOrange, icon: '▫', label: 'CHILLHOP' };
      case 'ambient':
        return { color: colors.pulseRed, icon: '~', label: 'AMBIENT' };
      default:
        return { color: colors.biometricBlue, icon: '●', label: 'NOISE' };
    }
  }, []);
  
  // Delete a soundscape
  const handleDelete = useCallback((id) => {
    Alert.alert(
      'delete_soundscape_confirmation',
      'confirm_session_deletion_operation',
      [
        {
          text: 'cancel',
          style: 'cancel'
        },
        {
          text: 'delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await SoundscapeStorageService.deleteSoundscape(id);
              if (success) {
                // Remove from state
                setSavedSoundscapes(current => 
                  current.filter(soundscape => soundscape.id !== id)
                );
              } else {
                Alert.alert('operation_failed', 'session_deletion_error');
              }
            } catch (error) {
              console.error('Error deleting soundscape:', error);
              Alert.alert('system_error', 'unexpected_deletion_failure');
            }
          }
        }
      ]
    );
  }, []);

  // FIX: Play a saved soundscape with stronger navigation guard
  const handlePlay = useCallback((soundscape) => {
    // Prevent multiple navigation calls with stronger guard
    if (isNavigating) {
      console.log('Navigation already in progress, ignoring handlePlay');
      return;
    }
    
    console.log('LibraryScreen handlePlay called with:', soundscape);
    
    // Set navigation guard immediately and synchronously
    setIsNavigating(true);
    
    // Use setTimeout to ensure state is set before navigation
    setTimeout(() => {
      const mode = soundscape.mode || 'noise';
      const screenName = mode === 'noise' ? 'NoiseMonitor' : 
                        mode === 'chillhop' ? 'ChillhopMonitor' :
                        mode === 'ambient' ? 'AmbientMonitor' : 'NoiseMonitor';
      
      const navigationParams = {
        bpm: soundscape.heartRate,
        confidence: 90,
        key: 'Dm',
        mode: mode,
        savedSession: true,
        savedData: soundscape,
        // Add unique key to force re-render
        sessionKey: `playback_${soundscape.id}_${Date.now()}`,
      };
      
      console.log('Navigating to:', screenName);
      console.log('With params:', navigationParams);
      
      try {
        navigation.navigate('Create', {
          screen: screenName,
          params: navigationParams
        });
      } catch (error) {
        console.error('Navigation error:', error);
        setIsNavigating(false); // Reset on error
      }
      
      // Reset navigation guard after successful navigation
      setTimeout(() => {
        setIsNavigating(false);
      }, 2000); // Increased timeout
    }, 50); // Small delay to ensure state update
  }, [isNavigating, navigation]);
  
  // Generate session name in clinical style
  const getSessionName = useCallback((soundscape) => {
    const mode = soundscape.mode || 'noise';
    const timeStamp = formatDate(soundscape.createdAt);
    return `${mode}_session_${timeStamp}`;
  }, [formatDate]);
  
  // Render each soundscape item (clinical style)
  const renderSoundscapeItem = useCallback(({ item }) => {
    const modeConfig = getModeConfig(item);
    
    return (
      <TouchableOpacity 
        style={[
          styles.soundscapeItem,
          isNavigating && styles.soundscapeItemDisabled
        ]}
        onPress={() => handlePlay(item)}
        activeOpacity={0.8}
        disabled={isNavigating}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionLeft}>
            <Text style={[styles.sessionMode, { color: modeConfig.color }]}>
              {modeConfig.icon} {modeConfig.label}
            </Text>
            <Text style={styles.sessionName}>{getSessionName(item)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
            disabled={isNavigating}
          >
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sessionStats}>
          <Text style={styles.sessionDetail}>
            hr: <Text style={styles.sessionValue}>{item.heartRate}</Text>bpm | 
            type: <Text style={styles.sessionValue}>{item.noiseType}</Text> | 
            created: <Text style={styles.sessionValue}>{formatDate(item.createdAt)}</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [getModeConfig, getSessionName, handlePlay, handleDelete, formatDate, isNavigating]);
  
  // Render empty state (clinical style)
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>◯</Text>
      </View>
      <Text style={styles.emptyTitle}>no_sessions_recorded</Text>
      <Text style={styles.emptyText}>
        initiate_biometric_capture_session_to_populate_library_database
      </Text>
      <TouchableOpacity 
        style={[
          styles.createButton,
          isNavigating && styles.createButtonDisabled
        ]}
        onPress={() => navigation.navigate('Create', { 
          screen: 'ModeSelection',
          params: { reset: true }
        })}
        disabled={isNavigating}
      >
        <Text style={styles.createButtonText}>[NEW_SESSION] →</Text>
      </TouchableOpacity>
    </View>
  ), [navigation, isNavigating]);
  
  const getTotalStats = useCallback(() => {
    const totalSessions = savedSoundscapes.length;
    const avgHeartRate = totalSessions > 0 
      ? Math.round(savedSoundscapes.reduce((sum, s) => sum + s.heartRate, 0) / totalSessions)
      : 0;
    
    return { totalSessions, avgHeartRate };
  }, [savedSoundscapes]);

  const stats = getTotalStats();
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.void} />
      
      {/* Clinical Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>sonarly</Text>
          <Text style={styles.subtitle}>session_library_manager</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.sessionCount}>
            sessions: <Text style={styles.accent}>{stats.totalSessions}</Text>{'\n'}
            avg_hr: <Text style={styles.accent}>{stats.avgHeartRate}</Text>bpm{'\n'}
            status: <Text style={styles.accent}>
              {isLoading ? 'loading' : isNavigating ? 'navigating' : 'ready'}
            </Text>
          </Text>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>loading_session_database...</Text>
        </View>
      ) : (
        <FlatList
          data={savedSoundscapes}
          renderItem={renderSoundscapeItem}
          keyExtractor={item => item.id}
          contentContainerStyle={
            savedSoundscapes.length === 0 ? { flex: 1 } : { paddingBottom: 20 }
          }
          ListEmptyComponent={renderEmptyState}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isNavigating}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  logo: {
    fontSize: typography.sizes.title,
    fontFamily: typography.fonts.mono,
    color: colors.white,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: typography.sizes.metadata,
    fontFamily: typography.fonts.mono,
    color: colors.muted,
  },
  sessionCount: {
    fontSize: typography.sizes.metadata,
    fontFamily: typography.fonts.mono,
    color: colors.dimmed,
    textAlign: 'right',
    lineHeight: 14,
  },
  accent: {
    color: colors.biometricBlue,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
  },
  soundscapeItem: {
    backgroundColor: colors.graphite,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  soundscapeItemDisabled: {
    opacity: 0.6,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionLeft: {
    flex: 1,
  },
  sessionMode: {
    fontSize: 10,
    fontFamily: typography.fonts.mono,
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
  },
  sessionName: {
    fontSize: 12,
    color: colors.white,
    fontFamily: typography.fonts.mono,
    fontWeight: typography.weights.semibold,
  },
  deleteButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.pulseRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 12,
    color: colors.white,
    fontFamily: typography.fonts.mono,
    fontWeight: typography.weights.bold,
  },
  sessionStats: {
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    paddingTop: 8,
  },
  sessionDetail: {
    fontSize: 9,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    lineHeight: 12,
  },
  sessionValue: {
    color: colors.biometricBlue,
    fontWeight: typography.weights.semibold,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.biometricBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 24,
    color: colors.biometricBlue,
    fontFamily: typography.fonts.mono,
  },
  emptyTitle: {
    fontSize: 12,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 10,
    color: colors.dimmed,
    fontFamily: typography.fonts.mono,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: colors.biometricBlue,
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: typography.weights.semibold,
    color: colors.void,
    fontFamily: typography.fonts.mono,
    letterSpacing: 1,
  },
});