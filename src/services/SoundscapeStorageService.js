// src/services/SoundscapeStorageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'SONARLY_SAVED_SOUNDSCAPES';

export default class SoundscapeStorageService {
  /**
   * Save a soundscape to storage
   * @param {Object} soundscape - Soundscape to save
   * @returns {Promise<boolean>} success
   */
  static async saveSoundscape(soundscape) {
    try {
      // Generate a unique ID if not present
      if (!soundscape.id) {
        soundscape.id = Date.now().toString();
      }
      
      // Add creation date if not present
      if (!soundscape.createdAt) {
        soundscape.createdAt = new Date().toISOString();
      }
      
      // Get existing soundscapes
      const soundscapes = await this.getSavedSoundscapes();
      
      // Check if this soundscape already exists
      const existingIndex = soundscapes.findIndex(s => s.id === soundscape.id);
      
      if (existingIndex >= 0) {
        // Update existing soundscape
        soundscapes[existingIndex] = soundscape;
      } else {
        // Add new soundscape
        soundscapes.push(soundscape);
      }
      
      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(soundscapes));
      return true;
    } catch (error) {
      console.error('Error saving soundscape:', error);
      return false;
    }
  }
  
  /**
   * Delete a soundscape from storage
   * @param {string} id - Soundscape ID to delete
   * @returns {Promise<boolean>} success
   */
  static async deleteSoundscape(id) {
    try {
      // Get existing soundscapes
      const soundscapes = await this.getSavedSoundscapes();
      
      // Filter out the soundscape to delete
      const filteredSoundscapes = soundscapes.filter(s => s.id !== id);
      
      // Save filtered list back to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSoundscapes));
      return true;
    } catch (error) {
      console.error('Error deleting soundscape:', error);
      return false;
    }
  }
  
  /**
   * Get all saved soundscapes
   * @returns {Promise<Array>} Saved soundscapes array
   */
  static async getSavedSoundscapes() {
    try {
      const storedSoundscapes = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (!storedSoundscapes) {
        return [];
      }
      
      return JSON.parse(storedSoundscapes);
    } catch (error) {
      console.error('Error getting saved soundscapes:', error);
      return [];
    }
  }
  
  /**
   * Get a soundscape by ID
   * @param {string} id - Soundscape ID
   * @returns {Promise<Object|null>} Soundscape or null if not found
   */
  static async getSoundscapeById(id) {
    try {
      const soundscapes = await this.getSavedSoundscapes();
      return soundscapes.find(s => s.id === id) || null;
    } catch (error) {
      console.error('Error getting soundscape by ID:', error);
      return null;
    }
  }
}