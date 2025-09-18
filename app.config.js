export default {
  expo: {
    name: "Sonarly",
    slug: "sonarlyapp2",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./src/assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./src/assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "app.sonarly.ios",
      infoPlist: {
        NSCameraUsageDescription: "Sonarly needs camera access to measure heart rate for creating personalized soundscapes",
        NSMicrophoneUsageDescription: "Sonarly needs microphone access for audio recording",
        UIBackgroundModes: ["audio"]
      }
    },
    android: {
      package: "app.sonarly.android",
      adaptiveIcon: {
        foregroundImage: "./src/assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "CAMERA",
        "RECORD_AUDIO"
      ]
    },
    web: {
      favicon: "./src/assets/favicon.png"
    },
    plugins: [
      'react-native-vision-camera',
      ['./plugins/with-ppg-frame-processor', {}]
    ]
  }
};
