import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { VisionCameraProxy } from 'react-native-vision-camera';

export default function TestPPGPlugin() {
  const [testResults, setTestResults] = useState([]);

  const addResult = (message, status = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, status, timestamp }]);
    console.log(`[${status.toUpperCase()}] ${message}`);
  };

  const runTests = () => {
    setTestResults([]);
    addResult('Starting PPG plugin tests...', 'info');

    try {
      // Test 1: Check if VisionCameraProxy exists
      if (!VisionCameraProxy) {
        addResult('❌ VisionCameraProxy not available', 'error');
        return;
      }
      addResult('✅ VisionCameraProxy available', 'success');

      // Test 2: Check if getFrameProcessorPlugin function exists (or fallback global)
      const hasGet = typeof VisionCameraProxy.getFrameProcessorPlugin === 'function';
      addResult(`getFrameProcessorPlugin: ${hasGet ? '✅ available' : '❌ missing'}`, hasGet ? 'success' : 'warning');

      // Test 3: Try to get our specific plugin
      let detectPPG = null;
      try {
        if (hasGet) detectPPG = VisionCameraProxy.getFrameProcessorPlugin('detectPPG');
      } catch {}
      if (!detectPPG && global.FrameProcessorPlugins && typeof global.FrameProcessorPlugins.detectPPG === 'function') {
        detectPPG = global.FrameProcessorPlugins.detectPPG;
        addResult('ℹ️ Using fallback global.FrameProcessorPlugins.detectPPG', 'warning');
      }
      addResult(detectPPG ? '✅ detectPPG plugin found!' : '❌ detectPPG plugin not found', detectPPG ? 'success' : 'error');
      if (detectPPG) addResult(`Plugin type: ${typeof detectPPG}`, 'info');

      // Test 5: Check VisionCamera version compatibility
      const hasFrameProcessorSupport = hasGet || (global.FrameProcessorPlugins && typeof global.FrameProcessorPlugins === 'object');
      addResult(`Frame processor support: ${hasFrameProcessorSupport ? '✅' : '❌'}`, hasFrameProcessorSupport ? 'success' : 'error');

    } catch (error) {
      addResult(`❌ Test failed: ${error.message}`, 'error');
      addResult(`Error stack: ${error.stack}`, 'error');
    }
  };

  useEffect(() => {
    // Run tests automatically on mount
    runTests();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      default: return '#2196F3';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PPG Plugin Registration Test</Text>
      
      <Button title="Run Tests Again" onPress={runTests} />
      
      <View style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <View key={index} style={styles.resultRow}>
            <Text style={styles.timestamp}>{result.timestamp}</Text>
            <Text style={[styles.message, { color: getStatusColor(result.status) }]}>
              {result.message}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultsContainer: {
    marginTop: 20,
    flex: 1,
  },
  resultRow: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingVertical: 2,
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    width: 80,
    marginRight: 10,
  },
  message: {
    fontSize: 12,
    flex: 1,
    fontFamily: 'monospace',
  },
});
