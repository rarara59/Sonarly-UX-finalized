Apply the camera permission debug logging fix to BiometricCaptureScreen.js:

1. Add debug logging to the requestCameraPermission function
2. Add Camera import from react-native-vision-camera  
3. Log permission results and device capabilities
4. Test the changes by running the app

Use these specific commands:

# Add Camera import
sed -i '' '/import { request, PERMISSIONS, RESULTS, check } from '\''react-native-permissions'\'';/a\
import { Camera } from '\''react-native-vision-camera'\'';' src/screens/BiometricCaptureScreen.js

# Add debug logging before permission request
sed -i '' '/const result = await request(permission);/i\
    console.log("🎥 Requesting permission for:", permission);\
    console.log("🎥 Platform:", Platform.OS);' src/screens/BiometricCaptureScreen.js

# Add debug logging after permission request  
sed -i '' '/const result = await request(permission);/a\
    console.log("🎥 Permission result:", result);\
    console.log("🎥 Available results:", Object.keys(RESULTS));' src/screens/BiometricCaptureScreen.js