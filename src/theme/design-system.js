// Improved Sonarly Design System – Clinical, Rhythmic, and Aesthetic
import { Platform } from 'react-native';

console.log('🔍 Design system loading...');

// Define all constants separately first
const COLORS = {
  void: '#0A0E1A',        // Dark Navy
  graphite: '#1B2735',    // Steel Blue
  surface: '#243447',     // Slightly lighter surface for contrast
  border: '#2A3F5F',      // Muted divider tone
  text: '#5CAEFF',        // HEADERS: Light blue for main headers (HEART_RATE_MONITOR, etc.)
  muted: '#FFFFFF',       // SUBHEADERS: White for subheaders (cardiac_rhythm_generator, etc.)
  dimmed: '#FFFFFF',      // SUBHEADERS: White for better readability
  biometricBlue: '#5CAEFF',
  pulseRed: '#FF5C5C',
  signalOrange: '#FBA94C',
  softWhite: '#FFFFFF',   // CHANGED: Make sure this is pure white
  white: '#FFFFFF',
  black: '#0A0E1A',
  success: '#5CAEFF',
  warning: '#FBA94C',
  error: '#FF5C5C',
  info: '#5CAEFF',
  // UI component states
  hover: '#243447',
  active: '#1B2735',
  // Button colors - FIXED for white text
  stopCaptureButton: '#FF5C5C',
  stopCaptureText: '#FFFFFF',      // WHITE text for stop capture button
  generateButton: '#5CAEFF',
  generateButtonText: '#FFFFFF',
  separator: '#FFFFFF',            // WHITE separators
  breathingRoom: '#FFFFFF',
  contrast: '#FFFFFF',
  
  // Navigation fix - FIXED to use blue instead of green
  studioGreen: '#5CAEFF',        // Use biometric blue instead of green
  homeButton: '#5CAEFF',         // Blue home button
  navActive: '#5CAEFF',          // Blue active nav
  navInactive: '#6B8CAA',        // Muted inactive nav
  
  // Legacy compatibility - ALL CHANGED TO WHITE/BLUE for better contrast
  biometricCopper: '#5CAEFF',    // Blue
  waveformAmber: '#FBA94C',      // Orange
  crtGreen: '#5CAEFF',           // Blue (NO MORE GREEN)
  offGold: '#FBA94C',            // Orange
  signalWhite: '#FFFFFF',        // White
  inactiveGrey: '#FFFFFF',       // WHITE (was too dark)
  copperDim: '#FFFFFF',          // WHITE (was too dark)
  textSecondary: '#FFFFFF',      // WHITE for subheaders
  studioBlack: '#0A0E1A',        // Dark navy
  warmGrey: '#FFFFFF',           // WHITE (was too dark)
  dataGrid: '#2A3F5F',          // Keep for grid lines
  highlight: '#FFFFFF',          // White
  
  // ADDITIONAL MAPPINGS for missed elements
  moduleTitle: '#5CAEFF',        // Light blue for module titles
  moduleSubtitle: '#FFFFFF',     // White for subtitles
  logoText: '#FFFFFF',           // WHITE for Sonarly logo
  dividerLine: '#2A3F5F',        // For the --- lines
  centerText: '#FFFFFF',         // For centered text elements
};

const TYPOGRAPHY = {
  fonts: {
    mono: Platform.select({ 
      ios: 'Menlo', 
      android: 'monospace', 
      default: 'monospace' 
    }),
    technical: Platform.select({ 
      ios: 'Monaco', 
      android: 'monospace', 
      default: 'monospace' 
    }),
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  sizes: {
    title: 24,        // Titles
    label: 14,        // Labels (uppercase)
    value: 16,        // Biometric values
    metadata: 12,     // Runtime, signal info
    bpm: 48,          // Main BPM display
    parameter: 36,
    clinical: 28,
    micro: 8,
    tiny: 9,
    small: 10,
    body: 11,
    medium: 12,
    large: 14,
    display1: 16,
    display2: 20,
    display3: 24,
    display4: 32,
  },
  spacing: {
    tight: -0.5,
    normal: 0,
    loose: 0.5,
  },
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  module: 16,
  moduleGap: 16,
  knobSize: 50,
  sequencerStep: 20,
  xxl: 24,
  xxxl: 32,
};

const EFFECTS = {
  glow: {
    small: '0 0 4px rgba(92, 174, 255, 0.3)',
    medium: '0 0 8px rgba(92, 174, 255, 0.4)',
    large: '0 0 12px rgba(92, 174, 255, 0.5)',
    pulse: '0 0 20px rgba(92, 174, 255, 0.6)',
  },
  shadows: {
    module: '0 4px 12px rgba(0, 0, 0, 0.4)',
    inner: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
    clinical: '0 2px 8px rgba(92, 174, 255, 0.2)',
  },
  breathing: {
    separator: '#F5F5F5',
    highlight: '#FFFFFF',
    contrast: '#FFFFFF',
  },
};

// Export constants directly
export const colors = COLORS;
export const typography = TYPOGRAPHY;
export const spacing = SPACING;
export const effects = EFFECTS;

// Simple function that doesn't reference exports
export const createModuleStyle = (variant = 'default') => ({
  backgroundColor: '#1B2735',
  borderWidth: 1,
  borderColor: '#2A3F5F',
  borderRadius: 8,
  padding: 16,
  marginBottom: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 3,
});

// Simple default export
export default {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  effects: EFFECTS,
  createModuleStyle,
};

console.log('✅ Sonarly design system loaded – clinical style activated');