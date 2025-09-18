// src/screens/HeartRateScreen.js (Mock Version - No Camera Dependencies)
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
// REMOVED: import { Camera } from 'expo-camera';
import HeartRateDetector from '../components/HeartRateDetector';

export default function HeartRateScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(true); // Mock as granted
  const [heartRate, setHeartRate] = useState('--');
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  
  // Mock camera permissions check
  useEffect(() => {
    const mockPermissionCheck = async () => {
      try {
        console.log("Mock: HeartRateScreen camera permission check - simulating granted");
        setHasPermission(true);
        // No error in mock mode
      } catch (err) {
        console.log("Mock: HeartRateScreen permission error:", err);
        setError('Mock: Camera access simulation failed');
      }
    };
    
    mockPermissionCheck();
  }, []);
  
  const handleHeartRateDetected = (rate, confidence, errorInfo) => {
    console.log("HeartRateScreen: Heart rate detected:", rate, "confidence:", confidence);
    
    // Handle error case
    if (errorInfo && errorInfo.error) {
      console.log("HeartRateScreen: Heart rate detection error:", errorInfo.error);
      setError(`Detection failed: ${errorInfo.error}`);
      setIsCapturing(false);
      return;
    }
    
    setHeartRate(rate.toString());
    setIsCapturing(false);
    setProgress(100);
    
    // Navigate to soundscape player after detection
    setTimeout(() => {
      navigation.navigate('SoundscapePlayer', {
        id: `soundscape-${Date.now()}`,
        name: `Heart Rate ${rate} BPM`,
        heartRate: rate,
        tempo: Math.min(Math.max(rate * 0.7, 60), 90),
        duration: 300 // 5 minutes in seconds
      });
    }, 1500);
  };
  
  const startCapture = () => {
    setError('');
    setHeartRate('--');
    setProgress(0);
    setIsCapturing(true);
    
    console.log("HeartRateScreen: Starting mock capture");
    
    // Simulate progress for UI feedback
    const interval = setInterval(() => {
      setProgress(prev => {
        // When real detection happens, this will be updated differently
        if (prev >= 95) {
          clearInterval(interval);
          return 95; // Keep at 95% until actual detection completes
        }
        return prev + 5;
      });
    }, 500);
  };
  
  const stopCapture = () => {
    setIsCapturing(false);
    setProgress(0);
    console.log("HeartRateScreen: Stopping capture");
  };
  
  const toggleCapture = () => {
    if (isCapturing) {
      stopCapture();
    } else {
      startCapture();
    }
  };
  
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Mock: Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Mock: Camera access is needed to measure your heart rate
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.captureButton}
          onPress={() => Alert.alert(
            'Mock Permission Required', 
            'Mock: Please enable camera access in your device settings.'
          )}
        >
          <Text style={styles.captureButtonText}>Enable Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      
      <Text style={styles.headerText}>Capture Heart Rate</Text>
      <Text style={styles.mockIndicator}>Mock Mode - No Camera Required</Text>
      
      <View style={styles.circleContainer}>
        <View style={styles.circle}>
          {isCapturing ? (
            <>
              <Text style={styles.progressText}>{`${progress}%`}</Text>
              <Text style={styles.progressLabel}>Capturing</Text>
            </>
          ) : (
            <>
              <Text style={styles.heartRateText}>{heartRate}</Text>
              <Text style={styles.bpmText}>BPM</Text>
            </>
          )}
        </View>
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      
      <TouchableOpacity
        style={[
          styles.captureButton,
          isCapturing && styles.captureButtonActive
        ]}
        onPress={toggleCapture}
        disabled={isCapturing && progress > 0}
      >
        <Text style={styles.captureButtonText}>
          {isCapturing ? 'Cancel' : 'Start Mock Capture'}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Mock Mode Instructions:</Text>
        
        <View style={styles.instructionRow}>
          <Text style={styles.instructionEmoji}>🧪</Text>
          <Text style={styles.instructionText}>
            This is a test version with simulated heart rate detection
          </Text>
        </View>
        
        <View style={styles.instructionRow}>
          <Text style={styles.instructionEmoji}>▶️</Text>
          <Text style={styles.instructionText}>
            Click "Start Mock Capture" to simulate PPG measurement
          </Text>
        </View>
        
        <View style={styles.instructionRow}>
          <Text style={styles.instructionEmoji}>⏱️</Text>
          <Text style={styles.instructionText}>
            Wait about 4 seconds for mock heart rate result
          </Text>
        </View>
        
        <View style={styles.instructionRow}>
          <Text style={styles.instructionEmoji}>✅</Text>
          <Text style={styles.instructionText}>
            Once working, we'll add real camera functionality
          </Text>
        </View>
      </View>
      
      {/* Heart rate detector component */}
      {hasPermission && (
        <HeartRateDetector 
          isCapturing={isCapturing}
          onHeartRateDetected={handleHeartRateDetected}
          onProgress={(value) => {
            console.log("HeartRateScreen: Progress update:", value);
            if (isCapturing) {
              setProgress(value);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 18,
    color: '#e75480',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#221F26',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  mockIndicator: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#fff5f7',
    borderWidth: 3,
    borderColor: '#e75480',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  heartRateText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#e75480',
  },
  bpmText: {
    fontSize: 18,
    color: '#8E9196',
    marginTop: 5,
  },
  progressText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e75480',
  },
  progressLabel: {
    fontSize: 18,
    color: '#8E9196',
    marginTop: 5,
  },
  captureButton: {
    backgroundColor: '#e75480',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },
  captureButtonActive: {
    backgroundColor: '#aaa',
  },
  captureButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  instructionsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#221F26',
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  instructionEmoji: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
  },
  instructionText: {
    fontSize: 16,
    color: '#8E9196',
    flex: 1,
  },
});