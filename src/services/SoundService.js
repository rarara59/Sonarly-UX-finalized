// src/services/SoundService.js
import { Audio } from 'expo-av';

export default class SoundService {
  static async initAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log("Audio initialized successfully");
    } catch (error) {
      console.error("Error initializing audio:", error);
    }
  }
  
  static async createHeartbeatSound(bpm, volume = 0.5) {
    // Create a dummy sound object that simulates playback
    // This will allow the app to function even if sound files can't be loaded
    const dummySound = {
      sound: {
        setVolumeAsync: async () => {},
        setIsLoopingAsync: async () => {},
        playAsync: async () => {},
        stopAsync: async () => {},
        unloadAsync: async () => {},
      },
      play: async () => true,
      stop: async () => true,
      setVolume: async () => true
    };
    
    try {
      const soundObject = new Audio.Sound();
      
      // Try loading the sound file - but use try/catch to handle errors
      try {
        // Use a simpler approach that's less likely to fail
        await soundObject.loadAsync(require('../assets/sounds/heartbeat.mp3'));
        await soundObject.setVolumeAsync(volume);
        
        return {
          sound: soundObject,
          play: async (shouldLoop = false) => {
            try {
              if (shouldLoop) {
                await soundObject.setIsLoopingAsync(true);
              }
              await soundObject.playAsync();
              return true;
            } catch (error) {
              console.error('Error playing heartbeat sound:', error);
              return false;
            }
          },
          stop: async () => {
            try {
              // Check if the sound is loaded before stopping it
              if (soundObject && soundObject._loaded) {
                await soundObject.stopAsync();
              }
              return true;
            } catch (error) {
              console.error('Error stopping heartbeat sound:', error);
              return false;
            }
          },
          setVolume: async (newVolume) => {
            try {
              await soundObject.setVolumeAsync(newVolume);
              return true;
            } catch (error) {
              console.error('Error setting heartbeat volume:', error);
              return false;
            }
          }
        };
      } catch (loadError) {
        console.error('Could not load heartbeat sound:', loadError);
        // Return the dummy sound to avoid crashing the app
        return dummySound;
      }
    } catch (error) {
      console.error('Error creating heartbeat sound:', error);
      return dummySound;
    }
  }
  
  static async createNoiseSound(type, volume = 0.5) {
    // Create a dummy sound object that simulates playback
    const dummySound = {
      sound: {
        setVolumeAsync: async () => {},
        setIsLoopingAsync: async () => {},
        playAsync: async () => {},
        stopAsync: async () => {},
        unloadAsync: async () => {},
      },
      play: async () => true,
      stop: async () => true,
      setVolume: async () => true
    };
    
    try {
      const soundObject = new Audio.Sound();
      
      // Try to load the appropriate sound file
      try {
        // Using a simpler approach for loading sounds
        let soundFile;
        
        // Map noise type to the correct sound file
        switch (type) {
          case 'white':
            soundFile = require('../assets/sounds/white-noise.mp3');
            break;
          case 'pink':
            // If pink noise isn't available, use white noise as fallback
            try {
              soundFile = require('../assets/sounds/pink-noise.mp3');
            } catch {
              soundFile = require('../assets/sounds/white-noise.mp3');
            }
            break;
          case 'brown':
            soundFile = require('../assets/sounds/brown-noise.mp3');
            break;
          case 'rain':
            soundFile = require('../assets/sounds/rain.mp3');
            break;
          default:
            soundFile = require('../assets/sounds/white-noise.mp3');
        }
        
        await soundObject.loadAsync(soundFile);
        await soundObject.setVolumeAsync(volume);
        
        return {
          sound: soundObject,
          play: async (shouldLoop = true) => {
            try {
              if (shouldLoop) {
                await soundObject.setIsLoopingAsync(true);
              }
              await soundObject.playAsync();
              return true;
            } catch (error) {
              console.error('Error playing noise sound:', error);
              return false;
            }
          },
          stop: async () => {
            try {
              // Check if the sound is loaded before stopping it
              if (soundObject && soundObject._loaded) {
                await soundObject.stopAsync();
              }
              return true;
            } catch (error) {
              console.error('Error stopping noise sound:', error);
              return false;
            }
          },
          setVolume: async (newVolume) => {
            try {
              await soundObject.setVolumeAsync(newVolume);
              return true;
            } catch (error) {
              console.error('Error setting noise volume:', error);
              return false;
            }
          }
        };
      } catch (loadError) {
        console.error(`Could not load ${type} noise sound:`, loadError);
        // Return the dummy sound object to prevent app crashes
        return dummySound;
      }
    } catch (error) {
      console.error('Error creating noise sound:', error);
      return dummySound;
    }
  }
  
  static async unloadSound(soundObject) {
    if (!soundObject) return;
    
    try {
      await soundObject.unloadAsync();
    } catch (error) {
      console.error('Error unloading sound:', error);
    }
  }
}