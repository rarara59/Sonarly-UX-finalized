rafaltracz@unknowne24489a13a46 SonarlyApp2 % npx expo run:ios
› Planning build
› Executing react-native Pods/hermes-engine » [CP-User] [Hermes] Replace Hermes for the right configuration, if needed
    Run script build phase '[CP-User] [RN]Check rncore' will be run during every build because it does not specify any outputs. To address this issue, either add output dependencies to the script phase, or configure it to run in every build by unchecking "Based on dependency analysis" in the script phase. (in target 'React-Fabric' from project 'Pods')
    Run script build phase '[CP-User] Generate app.config for prebuilt Constants.manifest' will be run during every build because it does not specify any outputs. To address this issue, either add output dependencies to the script phase, or configure it to run in every build by unchecking "Based on dependency analysis" in the script phase. (in target 'EXConstants' from project 'Pods')
    Run script build phase '[CP-User] [Hermes] Replace Hermes for the right configuration, if needed' will be run during every build because it does not specify any outputs. To address this issue, either add output dependencies to the script phase, or configure it to run in every build by unchecking "Based on dependency analysis" in the script phase. (in target 'hermes-engine' from project 'Pods')

› 0 error(s), and 3 warning(s)

CommandError: Failed to build iOS project. "xcodebuild" exited with error code 65.
To view more error logs, try building the app with Xcode directly, by opening /Users/rafaltracz/SonarlyApp2/ios/Sonarly.xcworkspace.

Command line invocation:
    /Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild -workspace /Users/rafaltracz/SonarlyApp2/ios/Sonarly.xcworkspace -configuration Debug -scheme Sonarly -destination id=32520574-6A03-4B3D-9A3F-B3DE1388635D

ComputePackagePrebuildTargetDependencyGraph

Prepare packages

CreateBuildRequest

SendProjectDescription

CreateBuildOperation

ComputeTargetDependencyGraph
note: Building targets in dependency order
note: Target dependency graph (99 targets)
    Target 'Sonarly' in project 'Sonarly'
        ➜ Implicit dependency on target 'Pods-Sonarly' in project 'Pods' via file 'libPods-Sonarly.a' in build phase 'Link Binary'
        ➜ Implicit dependency on target 'DoubleConversion' in project 'Pods' via options '-lDoubleConversion' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'EXAV' in project 'Pods' via options '-lEXAV' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'EXConstants' in project 'Pods' via options '-lEXConstants' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'EXImageLoader' in project 'Pods' via options '-lEXImageLoader' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'EXJSONUtils' in project 'Pods' via options '-lEXJSONUtils' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'EXManifests' in project 'Pods' via options '-lEXManifests' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'EXUpdatesInterface' in project 'Pods' via options '-lEXUpdatesInterface' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'Expo' in project 'Pods' via options '-lExpo' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'ExpoAsset' in project 'Pods' via options '-lExpoAsset' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'ExpoFileSystem' in project 'Pods' via options '-lExpoFileSystem' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'ExpoFont' in project 'Pods' via options '-lExpoFont' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'ExpoHaptics' in project 'Pods' via options '-lExpoHaptics' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'ExpoImageManipulator' in project 'Pods' via options '-lExpoImageManipulator' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'ExpoKeepAwake' in project 'Pods' via options '-lExpoKeepAwake' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'ExpoModulesCore' in project 'Pods' via options '-lExpoModulesCore' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'RCT-Folly' in project 'Pods' via options '-lRCT-Folly' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'RCTDeprecation' in project 'Pods' via options '-lRCTDeprecation' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'RCTTypeSafety' in project 'Pods' via options '-lRCTTypeSafety' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'RNCAsyncStorage' in project 'Pods' via options '-lRNCAsyncStorage' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'RNGestureHandler' in project 'Pods' via options '-lRNGestureHandler' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'RNPermissions' in project 'Pods' via options '-lRNPermissions' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'RNReanimated' in project 'Pods' via options '-lRNReanimated' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'RNSVG' in project 'Pods' via options '-lRNSVG' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'RNScreens' in project 'Pods' via options '-lRNScreens' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'RNVectorIcons' in project 'Pods' via options '-lRNVectorIcons' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-Codegen' in project 'Pods' via options '-lReact-Codegen' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-Core' in project 'Pods' via options '-lReact-Core' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-CoreModules' in project 'Pods' via options '-lReact-CoreModules' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-Fabric' in project 'Pods' via options '-lReact-Fabric' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-FabricImage' in project 'Pods' via options '-lReact-FabricImage' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-ImageManager' in project 'Pods' via options '-lReact-ImageManager' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-Mapbuffer' in project 'Pods' via options '-lReact-Mapbuffer' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-NativeModulesApple' in project 'Pods' via options '-lReact-NativeModulesApple' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-RCTAnimation' in project 'Pods' via options '-lReact-RCTAnimation' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-RCTAppDelegate' in project 'Pods' via options '-lReact-RCTAppDelegate' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-RCTBlob' in project 'Pods' via options '-lReact-RCTBlob' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-RCTFabric' in project 'Pods' via options '-lReact-RCTFabric' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-RCTImage' in project 'Pods' via options '-lReact-RCTImage' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-RCTLinking' in project 'Pods' via options '-lReact-RCTLinking' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-RCTNetwork' in project 'Pods' via options '-lReact-RCTNetwork' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-RCTSettings' in project 'Pods' via options '-lReact-RCTSettings' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-RCTText' in project 'Pods' via options '-lReact-RCTText' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-RCTVibration' in project 'Pods' via options '-lReact-RCTVibration' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-RuntimeApple' in project 'Pods' via options '-lReact-RuntimeApple' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-RuntimeCore' in project 'Pods' via options '-lReact-RuntimeCore' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-RuntimeHermes' in project 'Pods' via options '-lReact-RuntimeHermes' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-cxxreact' in project 'Pods' via options '-lReact-cxxreact' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-debug' in project 'Pods' via options '-lReact-debug' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-featureflags' in project 'Pods' via options '-lReact-featureflags' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-graphics' in project 'Pods' via options '-lReact-graphics' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-hermes' in project 'Pods' via options '-lReact-hermes' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-jserrorhandler' in project 'Pods' via options '-lReact-jserrorhandler' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-jsi' in project 'Pods' via options '-lReact-jsi' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-jsiexecutor' in project 'Pods' via options '-lReact-jsiexecutor' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-jsinspector' in project 'Pods' via options '-lReact-jsinspector' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-logger' in project 'Pods' via options '-lReact-logger' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-nativeconfig' in project 'Pods' via options '-lReact-nativeconfig' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-perflogger' in project 'Pods' via options '-lReact-perflogger' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-rendererdebug' in project 'Pods' via options '-lReact-rendererdebug' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-runtimescheduler' in project 'Pods' via options '-lReact-runtimescheduler' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'React-utils' in project 'Pods' via options '-lReact-utils' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'ReactCommon' in project 'Pods' via options '-lReactCommon' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'SDWebImage' in project 'Pods' via options '-lSDWebImage' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'SDWebImageWebPCoder' in project 'Pods' via options '-lSDWebImageWebPCoder' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'SocketRocket' in project 'Pods' via options '-lSocketRocket' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'VisionCamera' in project 'Pods' via options '-lVisionCamera' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'Yoga' in project 'Pods' via options '-lYoga' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'expo-dev-launcher' in project 'Pods' via options '-lexpo-dev-launcher' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'expo-dev-menu' in project 'Pods' via options '-lexpo-dev-menu' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'expo-dev-menu-interface' in project 'Pods' via options '-lexpo-dev-menu-interface' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'fmt' in project 'Pods' via options '-lfmt' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'glog' in project 'Pods' via options '-lglog' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'libwebp' in project 'Pods' via options '-llibwebp' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'react-native-safe-area-context' in project 'Pods' via options '-lreact-native-safe-area-context' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'react-native-slider' in project 'Pods' via options '-lreact-native-slider' in build setting 'OTHER_LDFLAGS'
        ➜ Implicit dependency on target 'react-native-worklets-core' in project 'Pods' via options '-lreact-native-worklets-core' in build setting 'OTHER_LDFLAGS'
    Target 'Pods-Sonarly' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'EXAV' in project 'Pods'
        ➜ Explicit dependency on target 'EXConstants' in project 'Pods'
        ➜ Explicit dependency on target 'EXImageLoader' in project 'Pods'
        ➜ Explicit dependency on target 'EXJSONUtils' in project 'Pods'
        ➜ Explicit dependency on target 'EXManifests' in project 'Pods'
        ➜ Explicit dependency on target 'EXUpdatesInterface' in project 'Pods'
        ➜ Explicit dependency on target 'Expo' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoAsset' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoFileSystem' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoFont' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoHaptics' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoImageManipulator' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoKeepAwake' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoModulesCore' in project 'Pods'
        ➜ Explicit dependency on target 'FBLazyVector' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTDeprecation' in project 'Pods'
        ➜ Explicit dependency on target 'RCTRequired' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'RNCAsyncStorage' in project 'Pods'
        ➜ Explicit dependency on target 'RNGestureHandler' in project 'Pods'
        ➜ Explicit dependency on target 'RNPermissions' in project 'Pods'
        ➜ Explicit dependency on target 'RNReanimated' in project 'Pods'
        ➜ Explicit dependency on target 'RNSVG' in project 'Pods'
        ➜ Explicit dependency on target 'RNScreens' in project 'Pods'
        ➜ Explicit dependency on target 'RNVectorIcons' in project 'Pods'
        ➜ Explicit dependency on target 'React' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-CoreModules' in project 'Pods'
        ➜ Explicit dependency on target 'React-Fabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-FabricImage' in project 'Pods'
        ➜ Explicit dependency on target 'React-ImageManager' in project 'Pods'
        ➜ Explicit dependency on target 'React-Mapbuffer' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTActionSheet' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTAnimation' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTAppDelegate' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTBlob' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTFabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTImage' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTLinking' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTNetwork' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTSettings' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTText' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTVibration' in project 'Pods'
        ➜ Explicit dependency on target 'React-RuntimeApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RuntimeCore' in project 'Pods'
        ➜ Explicit dependency on target 'React-RuntimeHermes' in project 'Pods'
        ➜ Explicit dependency on target 'React-callinvoker' in project 'Pods'
        ➜ Explicit dependency on target 'React-cxxreact' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'React-hermes' in project 'Pods'
        ➜ Explicit dependency on target 'React-jserrorhandler' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsiexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsitracing' in project 'Pods'
        ➜ Explicit dependency on target 'React-logger' in project 'Pods'
        ➜ Explicit dependency on target 'React-nativeconfig' in project 'Pods'
        ➜ Explicit dependency on target 'React-perflogger' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-rncore' in project 'Pods'
        ➜ Explicit dependency on target 'React-runtimeexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'React-runtimescheduler' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'SDWebImage' in project 'Pods'
        ➜ Explicit dependency on target 'SDWebImageWebPCoder' in project 'Pods'
        ➜ Explicit dependency on target 'SocketRocket' in project 'Pods'
        ➜ Explicit dependency on target 'VisionCamera' in project 'Pods'
        ➜ Explicit dependency on target 'Yoga' in project 'Pods'
        ➜ Explicit dependency on target 'boost' in project 'Pods'
        ➜ Explicit dependency on target 'expo-dev-client' in project 'Pods'
        ➜ Explicit dependency on target 'expo-dev-launcher' in project 'Pods'
        ➜ Explicit dependency on target 'expo-dev-menu' in project 'Pods'
        ➜ Explicit dependency on target 'expo-dev-menu-interface' in project 'Pods'
        ➜ Explicit dependency on target 'fmt' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
        ➜ Explicit dependency on target 'libwebp' in project 'Pods'
        ➜ Explicit dependency on target 'react-native-safe-area-context' in project 'Pods'
        ➜ Explicit dependency on target 'react-native-slider' in project 'Pods'
        ➜ Explicit dependency on target 'react-native-worklets-core' in project 'Pods'
    Target 'react-native-slider' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTRequired' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-Fabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-ImageManager' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTFabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'Yoga' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'react-native-safe-area-context' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
    Target 'expo-dev-client' in project 'Pods'
        ➜ Explicit dependency on target 'EXManifests' in project 'Pods'
        ➜ Explicit dependency on target 'expo-dev-launcher' in project 'Pods'
        ➜ Explicit dependency on target 'expo-dev-menu' in project 'Pods'
        ➜ Explicit dependency on target 'expo-dev-menu-interface' in project 'Pods'
        ➜ Explicit dependency on target 'EXUpdatesInterface' in project 'Pods'
    Target 'expo-dev-launcher' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'EXManifests' in project 'Pods'
        ➜ Explicit dependency on target 'EXUpdatesInterface' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoModulesCore' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTRequired' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-Fabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-ImageManager' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTAppDelegate' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTFabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'Yoga' in project 'Pods'
        ➜ Explicit dependency on target 'expo-dev-launcher-EXDevLauncher' in project 'Pods'
        ➜ Explicit dependency on target 'expo-dev-menu' in project 'Pods'
        ➜ Explicit dependency on target 'expo-dev-menu-interface' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'expo-dev-menu' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'EXManifests' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoModulesCore' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTRequired' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-Fabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-ImageManager' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTFabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'Yoga' in project 'Pods'
        ➜ Explicit dependency on target 'expo-dev-menu-EXDevMenu' in project 'Pods'
        ➜ Explicit dependency on target 'expo-dev-menu-interface' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'expo-dev-menu-interface' in project 'Pods' (no dependencies)
    Target 'expo-dev-menu-EXDevMenu' in project 'Pods' (no dependencies)
    Target 'expo-dev-launcher-EXDevLauncher' in project 'Pods' (no dependencies)
    Target 'VisionCamera' in project 'Pods'
        ➜ Explicit dependency on target 'React' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-callinvoker' in project 'Pods'
        ➜ Explicit dependency on target 'react-native-worklets-core' in project 'Pods'
    Target 'react-native-worklets-core' in project 'Pods'
        ➜ Explicit dependency on target 'React' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-callinvoker' in project 'Pods'
    Target 'React-rncore' in project 'Pods' (no dependencies)
    Target 'React' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTActionSheet' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTAnimation' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTBlob' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTImage' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTLinking' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTNetwork' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTSettings' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTText' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTVibration' in project 'Pods'
    Target 'React-RCTVibration' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
    Target 'React-RCTSettings' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
    Target 'React-RCTLinking' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
    Target 'React-RCTAnimation' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
    Target 'React-RCTActionSheet' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
    Target 'RNVectorIcons' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTRequired' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-Fabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-ImageManager' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTFabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'Yoga' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'RNScreens' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTRequired' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-Fabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-ImageManager' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTFabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTImage' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'Yoga' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'RNSVG' in project 'Pods'
        ➜ Explicit dependency on target 'RNSVG-RNSVGFilters' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
    Target 'RNSVG-RNSVGFilters' in project 'Pods' (no dependencies)
    Target 'RNReanimated' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTRequired' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-Fabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-ImageManager' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTFabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'Yoga' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'RNPermissions' in project 'Pods'
        ➜ Explicit dependency on target 'RNPermissions-RNPermissionsPrivacyInfo' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
    Target 'RNPermissions-RNPermissionsPrivacyInfo' in project 'Pods' (no dependencies)
    Target 'RNGestureHandler' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTRequired' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-Fabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-ImageManager' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTFabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'Yoga' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'RNCAsyncStorage' in project 'Pods'
        ➜ Explicit dependency on target 'RNCAsyncStorage-RNCAsyncStorage_resources' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
    Target 'RNCAsyncStorage-RNCAsyncStorage_resources' in project 'Pods' (no dependencies)
    Target 'ExpoKeepAwake' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoModulesCore' in project 'Pods'
    Target 'ExpoImageManipulator' in project 'Pods'
        ➜ Explicit dependency on target 'EXImageLoader' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoModulesCore' in project 'Pods'
        ➜ Explicit dependency on target 'SDWebImageWebPCoder' in project 'Pods'
    Target 'SDWebImageWebPCoder' in project 'Pods'
        ➜ Explicit dependency on target 'SDWebImage' in project 'Pods'
        ➜ Explicit dependency on target 'libwebp' in project 'Pods'
    Target 'libwebp' in project 'Pods' (no dependencies)
    Target 'SDWebImage' in project 'Pods'
        ➜ Explicit dependency on target 'SDWebImage-SDWebImage' in project 'Pods'
    Target 'SDWebImage-SDWebImage' in project 'Pods' (no dependencies)
    Target 'ExpoHaptics' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoModulesCore' in project 'Pods'
    Target 'ExpoFont' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoModulesCore' in project 'Pods'
    Target 'ExpoFileSystem' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoFileSystem-ExpoFileSystem_privacy' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoModulesCore' in project 'Pods'
    Target 'ExpoFileSystem-ExpoFileSystem_privacy' in project 'Pods' (no dependencies)
    Target 'ExpoAsset' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoModulesCore' in project 'Pods'
    Target 'Expo' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoModulesCore' in project 'Pods'
    Target 'EXUpdatesInterface' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoModulesCore' in project 'Pods'
    Target 'EXManifests' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoModulesCore' in project 'Pods'
    Target 'EXJSONUtils' in project 'Pods' (no dependencies)
    Target 'EXImageLoader' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoModulesCore' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
    Target 'EXConstants' in project 'Pods'
        ➜ Explicit dependency on target 'EXConstants-EXConstants' in project 'Pods'
        ➜ Explicit dependency on target 'EXConstants-ExpoConstants_privacy' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoModulesCore' in project 'Pods'
    Target 'EXConstants-ExpoConstants_privacy' in project 'Pods' (no dependencies)
    Target 'EXConstants-EXConstants' in project 'Pods' (no dependencies)
    Target 'EXAV' in project 'Pods'
        ➜ Explicit dependency on target 'ExpoModulesCore' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
    Target 'ExpoModulesCore' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTRequired' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-Fabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-ImageManager' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTAppDelegate' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTFabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'Yoga' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-RCTAppDelegate' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTRequired' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-CoreModules' in project 'Pods'
        ➜ Explicit dependency on target 'React-Fabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTFabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTImage' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTNetwork' in project 'Pods'
        ➜ Explicit dependency on target 'React-RuntimeApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RuntimeCore' in project 'Pods'
        ➜ Explicit dependency on target 'React-RuntimeHermes' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'React-hermes' in project 'Pods'
        ➜ Explicit dependency on target 'React-nativeconfig' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-runtimescheduler' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
    Target 'React-RuntimeApple' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-CoreModules' in project 'Pods'
        ➜ Explicit dependency on target 'React-Mapbuffer' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTFabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-RuntimeCore' in project 'Pods'
        ➜ Explicit dependency on target 'React-RuntimeHermes' in project 'Pods'
        ➜ Explicit dependency on target 'React-callinvoker' in project 'Pods'
        ➜ Explicit dependency on target 'React-cxxreact' in project 'Pods'
        ➜ Explicit dependency on target 'React-jserrorhandler' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsiexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'React-runtimeexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-RuntimeHermes' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-RuntimeCore' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-hermes' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsitracing' in project 'Pods'
        ➜ Explicit dependency on target 'React-nativeconfig' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-jsitracing' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
    Target 'React-RuntimeCore' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-cxxreact' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-jserrorhandler' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsiexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'React-runtimeexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'React-runtimescheduler' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-jserrorhandler' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-Mapbuffer' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
    Target 'React-Mapbuffer' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
    Target 'React-RCTFabric' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-Fabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-FabricImage' in project 'Pods'
        ➜ Explicit dependency on target 'React-ImageManager' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTImage' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTText' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'React-nativeconfig' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-runtimescheduler' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'Yoga' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-nativeconfig' in project 'Pods' (no dependencies)
    Target 'React-RCTText' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'Yoga' in project 'Pods'
    Target 'React-CoreModules' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTBlob' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTImage' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'SocketRocket' in project 'Pods'
        ➜ Explicit dependency on target 'fmt' in project 'Pods'
    Target 'React-RCTImage' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTNetwork' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
    Target 'React-RCTBlob' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-RCTNetwork' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'fmt' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-RCTNetwork' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
    Target 'React-Codegen' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTRequired' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-Fabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-FabricImage' in project 'Pods'
        ➜ Explicit dependency on target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsiexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-NativeModulesApple' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-callinvoker' in project 'Pods'
        ➜ Explicit dependency on target 'React-cxxreact' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'React-runtimeexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-FabricImage' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTRequired' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Fabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-ImageManager' in project 'Pods'
        ➜ Explicit dependency on target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsiexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'React-logger' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'Yoga' in project 'Pods'
        ➜ Explicit dependency on target 'fmt' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-ImageManager' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-Fabric' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
    Target 'React-Fabric' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTRequired' in project 'Pods'
        ➜ Explicit dependency on target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-cxxreact' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsiexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'React-logger' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-runtimescheduler' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'Yoga' in project 'Pods'
        ➜ Explicit dependency on target 'fmt' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'ReactCommon' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-callinvoker' in project 'Pods'
        ➜ Explicit dependency on target 'React-cxxreact' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-logger' in project 'Pods'
        ➜ Explicit dependency on target 'React-perflogger' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'fmt' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-graphics' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'fmt' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
    Target 'RCTTypeSafety' in project 'Pods'
        ➜ Explicit dependency on target 'FBLazyVector' in project 'Pods'
        ➜ Explicit dependency on target 'RCTRequired' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core' in project 'Pods'
    Target 'React-Core' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'RCTDeprecation' in project 'Pods'
        ➜ Explicit dependency on target 'React-Core-RCTI18nStrings' in project 'Pods'
        ➜ Explicit dependency on target 'React-cxxreact' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-hermes' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsiexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'React-perflogger' in project 'Pods'
        ➜ Explicit dependency on target 'React-runtimescheduler' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'SocketRocket' in project 'Pods'
        ➜ Explicit dependency on target 'Yoga' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'Yoga' in project 'Pods' (no dependencies)
    Target 'SocketRocket' in project 'Pods' (no dependencies)
    Target 'React-runtimescheduler' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-callinvoker' in project 'Pods'
        ➜ Explicit dependency on target 'React-cxxreact' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'React-runtimeexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-utils' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-rendererdebug' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'fmt' in project 'Pods'
    Target 'React-hermes' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-cxxreact' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsiexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'React-perflogger' in project 'Pods'
        ➜ Explicit dependency on target 'React-runtimeexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'fmt' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-jsiexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-cxxreact' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'React-perflogger' in project 'Pods'
        ➜ Explicit dependency on target 'fmt' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-cxxreact' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-callinvoker' in project 'Pods'
        ➜ Explicit dependency on target 'React-debug' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'React-logger' in project 'Pods'
        ➜ Explicit dependency on target 'React-perflogger' in project 'Pods'
        ➜ Explicit dependency on target 'React-runtimeexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'boost' in project 'Pods'
        ➜ Explicit dependency on target 'fmt' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-perflogger' in project 'Pods' (no dependencies)
    Target 'React-logger' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
    Target 'React-jsinspector' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'React-featureflags' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'React-runtimeexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'React-runtimeexecutor' in project 'Pods'
        ➜ Explicit dependency on target 'React-jsi' in project 'Pods'
    Target 'React-featureflags' in project 'Pods' (no dependencies)
    Target 'React-jsi' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'boost' in project 'Pods'
        ➜ Explicit dependency on target 'fmt' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
        ➜ Explicit dependency on target 'hermes-engine' in project 'Pods'
    Target 'hermes-engine' in project 'Pods' (no dependencies)
    Target 'React-debug' in project 'Pods' (no dependencies)
    Target 'React-callinvoker' in project 'Pods' (no dependencies)
    Target 'React-Core-RCTI18nStrings' in project 'Pods' (no dependencies)
    Target 'RCTDeprecation' in project 'Pods' (no dependencies)
    Target 'FBLazyVector' in project 'Pods' (no dependencies)
    Target 'RCTRequired' in project 'Pods' (no dependencies)
    Target 'RCT-Folly' in project 'Pods'
        ➜ Explicit dependency on target 'DoubleConversion' in project 'Pods'
        ➜ Explicit dependency on target 'boost' in project 'Pods'
        ➜ Explicit dependency on target 'fmt' in project 'Pods'
        ➜ Explicit dependency on target 'glog' in project 'Pods'
    Target 'glog' in project 'Pods' (no dependencies)
    Target 'fmt' in project 'Pods' (no dependencies)
    Target 'boost' in project 'Pods' (no dependencies)
    Target 'DoubleConversion' in project 'Pods' (no dependencies)

GatherProvisioningInputs

CreateBuildDescription

ExecuteExternalTool /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang -v -E -dM -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator18.5.sdk -x c++ -c /dev/null

ExecuteExternalTool /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang -v -E -dM -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator18.5.sdk -x objective-c -c /dev/null

ExecuteExternalTool /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang -v -E -dM -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator18.5.sdk -x objective-c++ -c /dev/null

ExecuteExternalTool /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang -v -E -dM -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator18.5.sdk -x c -c /dev/null

ExecuteExternalTool /Applications/Xcode.app/Contents/Developer/usr/bin/ibtool --version --output-format xml1

ExecuteExternalTool /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang -v -E -dM -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator18.5.sdk -x c -c /dev/null

ExecuteExternalTool /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/swiftc --version

ExecuteExternalTool /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/libtool -V

ExecuteExternalTool /Applications/Xcode.app/Contents/Developer/usr/bin/actool --print-asset-tag-combinations --output-format xml1 /Users/rafaltracz/SonarlyApp2/ios/Sonarly/Images.xcassets

ExecuteExternalTool /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang -v -E -dM -arch arm64 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator18.5.sdk -x assembler-with-cpp -c /dev/null

ExecuteExternalTool /Applications/Xcode.app/Contents/Developer/usr/bin/actool --version --output-format xml1

ExecuteExternalTool /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/ld -version_details

Build description signature: ce8ca45e513f6b678ae437a47e286722
Build description path: /Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/XCBuildData/ce8ca45e513f6b678ae437a47e286722.xcbuilddata
ClangStatCache /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang-stat-cache /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator18.5.sdk /Users/rafaltracz/Library/Developer/Xcode/DerivedData/SDKStatCaches.noindex/iphonesimulator18.5-22F76-d5fc8ad4295d2ef488fb7d0f804ce0c4.sdkstatcache
    cd /Users/rafaltracz/SonarlyApp2/ios
    /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang-stat-cache /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator18.5.sdk -o /Users/rafaltracz/Library/Developer/Xcode/DerivedData/SDKStatCaches.noindex/iphonesimulator18.5-22F76-d5fc8ad4295d2ef488fb7d0f804ce0c4.sdkstatcache
Base directory status changed. Regenerating...

PhaseScriptExecution [CP-User]\ [Hermes]\ Replace\ Hermes\ for\ the\ right\ configuration,\ if\ needed /Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Script-46EB2E00021F60.sh (in target 'hermes-engine' from project 'Pods')
    cd /Users/rafaltracz/SonarlyApp2/ios/Pods
    export ACTION\=build
    export AD_HOC_CODE_SIGNING_ALLOWED\=YES
    export ALLOW_BUILD_REQUEST_OVERRIDES\=NO
    export ALLOW_TARGET_PLATFORM_SPECIALIZATION\=NO
    export ALTERNATE_GROUP\=staff
    export ALTERNATE_MODE\=u+w,go-w,a+rX
    export ALTERNATE_OWNER\=rafaltracz
    export ALTERNATIVE_DISTRIBUTION_WEB\=NO
    export ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES\=NO
    export ALWAYS_SEARCH_USER_PATHS\=NO
    export ALWAYS_USE_SEPARATE_HEADERMAPS\=NO
    export APPLICATION_EXTENSION_API_ONLY\=NO
    export APPLY_RULES_IN_COPY_FILES\=NO
    export APPLY_RULES_IN_COPY_HEADERS\=NO
    export APP_SHORTCUTS_ENABLE_FLEXIBLE_MATCHING\=YES
    export ARCHS\=arm64
    export ARCHS_STANDARD\=arm64\ x86_64
    export ARCHS_STANDARD_32_64_BIT\=arm64\ x86_64
    export ARCHS_STANDARD_64_BIT\=arm64\ x86_64
    export ARCHS_STANDARD_INCLUDING_64_BIT\=arm64\ x86_64
    export ARCHS_UNIVERSAL_IPHONE_OS\=arm64\ x86_64
    export ASSETCATALOG_COMPILER_APPICON_NAME\=AppIcon
    export ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME\=AccentColor
    export ASSETCATALOG_FILTER_FOR_DEVICE_MODEL\=iPhone17,1
    export ASSETCATALOG_FILTER_FOR_DEVICE_OS_VERSION\=18.4
    export ASSETCATALOG_FILTER_FOR_THINNING_DEVICE_CONFIGURATION\=iPhone17,1
    export AUTOMATICALLY_MERGE_DEPENDENCIES\=NO
    export AVAILABLE_PLATFORMS\=android\ appletvos\ appletvsimulator\ driverkit\ iphoneos\ iphonesimulator\ macosx\ qnx\ watchos\ watchsimulator\ xros\ xrsimulator
    export BITCODE_GENERATION_MODE\=marker
    export BUILD_ACTIVE_RESOURCES_ONLY\=YES
    export BUILD_COMPONENTS\=headers\ build
    export BUILD_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Products
    export BUILD_LIBRARY_FOR_DISTRIBUTION\=NO
    export BUILD_ROOT\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Products
    export BUILD_STYLE\=
    export BUILD_VARIANTS\=normal
    export BUILT_PRODUCTS_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Products/Debug-iphonesimulator/hermes-engine
    export BUNDLE_CONTENTS_FOLDER_PATH_deep\=Contents/
    export BUNDLE_EXECUTABLE_FOLDER_NAME_deep\=MacOS
    export BUNDLE_EXTENSIONS_FOLDER_PATH\=Extensions
    export BUNDLE_FORMAT\=shallow
    export BUNDLE_FRAMEWORKS_FOLDER_PATH\=Frameworks
    export BUNDLE_PLUGINS_FOLDER_PATH\=PlugIns
    export BUNDLE_PRIVATE_HEADERS_FOLDER_PATH\=PrivateHeaders
    export BUNDLE_PUBLIC_HEADERS_FOLDER_PATH\=Headers
    export CACHE_ROOT\=/var/folders/cf/zpqk8yc563jg56__m9fqg6pw0000gn/C/com.apple.DeveloperTools/16.4-16F6/Xcode
    export CCHROOT\=/var/folders/cf/zpqk8yc563jg56__m9fqg6pw0000gn/C/com.apple.DeveloperTools/16.4-16F6/Xcode
    export CHMOD\=/bin/chmod
    export CHOWN\=/usr/sbin/chown
    export CLANG_ANALYZER_LOCALIZABILITY_NONLOCALIZED\=YES
    export CLANG_ANALYZER_NONNULL\=YES
    export CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION\=YES_AGGRESSIVE
    export CLANG_CACHE_FINE_GRAINED_OUTPUTS\=YES
    export CLANG_CXX_LANGUAGE_STANDARD\=c++20
    export CLANG_CXX_LIBRARY\=compiler-default
    export CLANG_ENABLE_EXPLICIT_MODULES\=YES
    export CLANG_ENABLE_MODULES\=YES
    export CLANG_ENABLE_OBJC_ARC\=YES
    export CLANG_ENABLE_OBJC_WEAK\=NO
    export CLANG_MODULES_BUILD_SESSION_FILE\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/ModuleCache.noindex/Session.modulevalidation
    export CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING\=YES
    export CLANG_WARN_BOOL_CONVERSION\=YES
    export CLANG_WARN_COMMA\=YES
    export CLANG_WARN_CONSTANT_CONVERSION\=YES
    export CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS\=YES
    export CLANG_WARN_DIRECT_OBJC_ISA_USAGE\=YES_ERROR
    export CLANG_WARN_DOCUMENTATION_COMMENTS\=YES
    export CLANG_WARN_EMPTY_BODY\=YES
    export CLANG_WARN_ENUM_CONVERSION\=YES
    export CLANG_WARN_INFINITE_RECURSION\=YES
    export CLANG_WARN_INT_CONVERSION\=YES
    export CLANG_WARN_NON_LITERAL_NULL_CONVERSION\=YES
    export CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF\=YES
    export CLANG_WARN_OBJC_LITERAL_CONVERSION\=YES
    export CLANG_WARN_OBJC_ROOT_CLASS\=YES_ERROR
    export CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER\=NO
    export CLANG_WARN_RANGE_LOOP_ANALYSIS\=YES
    export CLANG_WARN_STRICT_PROTOTYPES\=YES
    export CLANG_WARN_SUSPICIOUS_MOVE\=YES
    export CLANG_WARN_UNGUARDED_AVAILABILITY\=YES_AGGRESSIVE
    export CLANG_WARN_UNREACHABLE_CODE\=YES
    export CLANG_WARN__DUPLICATE_METHOD_MATCH\=YES
    export CLASS_FILE_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/JavaClasses
    export CLEAN_PRECOMPS\=YES
    export CLONE_HEADERS\=NO
    export CODESIGNING_FOLDER_PATH\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Products/Debug-iphonesimulator/hermes-engine/
    export CODE_SIGNING_ALLOWED\=NO
    export CODE_SIGNING_REQUIRED\=YES
    export CODE_SIGN_CONTEXT_CLASS\=XCiPhoneSimulatorCodeSignContext
    export CODE_SIGN_IDENTITY\=-
    export CODE_SIGN_INJECT_BASE_ENTITLEMENTS\=YES
    export COLOR_DIAGNOSTICS\=NO
    export COMBINE_HIDPI_IMAGES\=NO
    export COMPILATION_CACHE_CAS_PATH\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/CompilationCache.noindex
    export COMPILATION_CACHE_KEEP_CAS_DIRECTORY\=YES
    export COMPILER_INDEX_STORE_ENABLE\=Default
    export COMPOSITE_SDK_DIRS\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/CompositeSDKs
    export COMPRESS_PNG_FILES\=YES
    export CONFIGURATION\=Debug
    export CONFIGURATION_BUILD_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Products/Debug-iphonesimulator/hermes-engine
    export CONFIGURATION_TEMP_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator
    export COPYING_PRESERVES_HFS_DATA\=NO
    export COPY_HEADERS_RUN_UNIFDEF\=NO
    export COPY_PHASE_STRIP\=NO
    export CORRESPONDING_DEVICE_PLATFORM_DIR\=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform
    export CORRESPONDING_DEVICE_PLATFORM_NAME\=iphoneos
    export CORRESPONDING_DEVICE_SDK_DIR\=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS18.5.sdk
    export CORRESPONDING_DEVICE_SDK_NAME\=iphoneos18.5
    export CP\=/bin/cp
    export CREATE_INFOPLIST_SECTION_IN_BINARY\=NO
    export CURRENT_ARCH\=undefined_arch
    export CURRENT_VARIANT\=normal
    export DEAD_CODE_STRIPPING\=YES
    export DEBUGGING_SYMBOLS\=YES
    export DEBUG_INFORMATION_FORMAT\=dwarf
    export DEBUG_INFORMATION_VERSION\=compiler-default
    export DEFAULT_COMPILER\=com.apple.compilers.llvm.clang.1_0
    export DEFAULT_DEXT_INSTALL_PATH\=/System/Library/DriverExtensions
    export DEFAULT_KEXT_INSTALL_PATH\=/System/Library/Extensions
    export DEFINES_MODULE\=NO
    export DEPLOYMENT_LOCATION\=NO
    export DEPLOYMENT_POSTPROCESSING\=NO
    export DEPLOYMENT_TARGET_SETTING_NAME\=IPHONEOS_DEPLOYMENT_TARGET
    export DEPLOYMENT_TARGET_SUGGESTED_VALUES\=12.0\ 12.1\ 12.2\ 12.3\ 12.4\ 13.0\ 13.1\ 13.2\ 13.3\ 13.4\ 13.5\ 13.6\ 14.0\ 14.1\ 14.2\ 14.3\ 14.4\ 14.5\ 14.6\ 14.7\ 15.0\ 15.1\ 15.2\ 15.3\ 15.4\ 15.5\ 15.6\ 16.0\ 16.1\ 16.2\ 16.3\ 16.4\ 16.5\ 16.6\ 17.0\ 17.1\ 17.2\ 17.3\ 17.4\ 17.5\ 17.6\ 18.0\ 18.1\ 18.2\ 18.3\ 18.4\ 18.5
    export DERIVED_FILES_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/DerivedSources
    export DERIVED_FILE_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/DerivedSources
    export DERIVED_SOURCES_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/DerivedSources
    export DEVELOPER_APPLICATIONS_DIR\=/Applications/Xcode.app/Contents/Developer/Applications
    export DEVELOPER_BIN_DIR\=/Applications/Xcode.app/Contents/Developer/usr/bin
    export DEVELOPER_DIR\=/Applications/Xcode.app/Contents/Developer
    export DEVELOPER_FRAMEWORKS_DIR\=/Applications/Xcode.app/Contents/Developer/Library/Frameworks
    export DEVELOPER_FRAMEWORKS_DIR_QUOTED\=/Applications/Xcode.app/Contents/Developer/Library/Frameworks
    export DEVELOPER_LIBRARY_DIR\=/Applications/Xcode.app/Contents/Developer/Library
    export DEVELOPER_SDK_DIR\=/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs
    export DEVELOPER_TOOLS_DIR\=/Applications/Xcode.app/Contents/Developer/Tools
    export DEVELOPER_USR_DIR\=/Applications/Xcode.app/Contents/Developer/usr
    export DEVELOPMENT_LANGUAGE\=en
    export DIAGNOSE_MISSING_TARGET_DEPENDENCIES\=YES
    export DIFF\=/usr/bin/diff
    export DONT_GENERATE_INFOPLIST_FILE\=NO
    export DSTROOT\=/tmp/Pods.dst
    export DT_TOOLCHAIN_DIR\=/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain
    export DWARF_DSYM_FILE_NAME\=.dSYM
    export DWARF_DSYM_FILE_SHOULD_ACCOMPANY_PRODUCT\=NO
    export DWARF_DSYM_FOLDER_PATH\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Products/Debug-iphonesimulator/hermes-engine
    export DYNAMIC_LIBRARY_EXTENSION\=dylib
    export EAGER_COMPILATION_ALLOW_SCRIPTS\=NO
    export EAGER_LINKING\=NO
    export EFFECTIVE_PLATFORM_NAME\=-iphonesimulator
    export EMBEDDED_CONTENT_CONTAINS_SWIFT\=NO
    export EMBED_ASSET_PACKS_IN_PRODUCT_BUNDLE\=NO
    export ENABLE_APP_SANDBOX\=NO
    export ENABLE_BITCODE\=NO
    export ENABLE_CODE_COVERAGE\=YES
    export ENABLE_DEFAULT_HEADER_SEARCH_PATHS\=YES
    export ENABLE_DEFAULT_SEARCH_PATHS\=YES
    export ENABLE_HARDENED_RUNTIME\=NO
    export ENABLE_HEADER_DEPENDENCIES\=YES
    export ENABLE_INCOMING_NETWORK_CONNECTIONS\=NO
    export ENABLE_ON_DEMAND_RESOURCES\=NO
    export ENABLE_OUTGOING_NETWORK_CONNECTIONS\=NO
    export ENABLE_PREVIEWS\=NO
    export ENABLE_RESOURCE_ACCESS_AUDIO_INPUT\=NO
    export ENABLE_RESOURCE_ACCESS_BLUETOOTH\=NO
    export ENABLE_RESOURCE_ACCESS_CALENDARS\=NO
    export ENABLE_RESOURCE_ACCESS_CAMERA\=NO
    export ENABLE_RESOURCE_ACCESS_CONTACTS\=NO
    export ENABLE_RESOURCE_ACCESS_LOCATION\=NO
    export ENABLE_RESOURCE_ACCESS_PRINTING\=NO
    export ENABLE_RESOURCE_ACCESS_USB\=NO
    export ENABLE_SDK_IMPORTS\=NO
    export ENABLE_STRICT_OBJC_MSGSEND\=YES
    export ENABLE_TESTABILITY\=YES
    export ENABLE_TESTING_SEARCH_PATHS\=NO
    export ENABLE_USER_SCRIPT_SANDBOXING\=NO
    export ENABLE_XOJIT_PREVIEWS\=YES
    export ENFORCE_VALID_ARCHS\=YES
    export ENTITLEMENTS_DESTINATION\=__entitlements
    export ENTITLEMENTS_REQUIRED\=YES
    export EXCLUDED_INSTALLSRC_SUBDIRECTORY_PATTERNS\=.DS_Store\ .svn\ .git\ .hg\ CVS
    export EXCLUDED_RECURSIVE_SEARCH_PATH_SUBDIRECTORIES\=\*.nib\ \*.lproj\ \*.framework\ \*.gch\ \*.xcode\*\ \*.xcassets\ \(\*\)\ .DS_Store\ CVS\ .svn\ .git\ .hg\ \*.pbproj\ \*.pbxproj
    export FILE_LIST\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Objects/LinkFileList
    export FIXED_FILES_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/FixedFiles
    export FRAMEWORK_SEARCH_PATHS\=\ \"/Users/rafaltracz/SonarlyApp2/ios/Pods/hermes-engine/destroot/Library/Frameworks/universal\"\ \"/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Products/Debug-iphonesimulator/XCFrameworkIntermediates/hermes-engine/Pre-built\"
    export FRAMEWORK_VERSION\=A
    export FUSE_BUILD_PHASES\=YES
    export FUSE_BUILD_SCRIPT_PHASES\=NO
    export GCC3_VERSION\=3.3
    export GCC_C_LANGUAGE_STANDARD\=gnu11
    export GCC_DYNAMIC_NO_PIC\=NO
    export GCC_NO_COMMON_BLOCKS\=YES
    export GCC_OBJC_LEGACY_DISPATCH\=YES
    export GCC_OPTIMIZATION_LEVEL\=0
    export GCC_PFE_FILE_C_DIALECTS\=c\ objective-c\ c++\ objective-c++
    export GCC_PREPROCESSOR_DEFINITIONS\=POD_CONFIGURATION_DEBUG\=1\ DEBUG\=1\ \ COCOAPODS\=1\ HERMES_ENABLE_DEBUGGER\=1
    export GCC_TREAT_WARNINGS_AS_ERRORS\=NO
    export GCC_VERSION\=com.apple.compilers.llvm.clang.1_0
    export GCC_VERSION_IDENTIFIER\=com_apple_compilers_llvm_clang_1_0
    export GCC_WARN_64_TO_32_BIT_CONVERSION\=YES
    export GCC_WARN_ABOUT_RETURN_TYPE\=YES_ERROR
    export GCC_WARN_UNDECLARED_SELECTOR\=YES
    export GCC_WARN_UNINITIALIZED_AUTOS\=YES_AGGRESSIVE
    export GCC_WARN_UNUSED_FUNCTION\=YES
    export GCC_WARN_UNUSED_VARIABLE\=YES
    export GENERATED_MODULEMAP_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/GeneratedModuleMaps-iphonesimulator
    export GENERATE_INFOPLIST_FILE\=NO
    export GENERATE_INTERMEDIATE_TEXT_BASED_STUBS\=YES
    export GENERATE_MASTER_OBJECT_FILE\=NO
    export GENERATE_PKGINFO_FILE\=NO
    export GENERATE_PROFILING_CODE\=NO
    export GENERATE_TEXT_BASED_STUBS\=NO
    export GID\=20
    export GROUP\=staff
    export HEADERMAP_INCLUDES_FLAT_ENTRIES_FOR_TARGET_BEING_BUILT\=YES
    export HEADERMAP_INCLUDES_FRAMEWORK_ENTRIES_FOR_ALL_PRODUCT_TYPES\=YES
    export HEADERMAP_INCLUDES_FRAMEWORK_ENTRIES_FOR_TARGETS_NOT_BEING_BUILT\=YES
    export HEADERMAP_INCLUDES_NONPUBLIC_NONPRIVATE_HEADERS\=YES
    export HEADERMAP_INCLUDES_PROJECT_HEADERS\=YES
    export HEADERMAP_USES_FRAMEWORK_PREFIX_ENTRIES\=YES
    export HEADERMAP_USES_VFS\=NO
    export HEADER_SEARCH_PATHS\=\ \"/Users/rafaltracz/SonarlyApp2/ios/Pods/Headers/Private\"\ \"/Users/rafaltracz/SonarlyApp2/ios/Pods/Headers/Private/hermes-engine\"\ \"/Users/rafaltracz/SonarlyApp2/ios/Pods/Headers/Public\"\ \"/Users/rafaltracz/SonarlyApp2/ios/Pods/Headers/Public/hermes-engine\"
    export HIDE_BITCODE_SYMBOLS\=YES
    export HOME\=/Users/rafaltracz
    export HOST_ARCH\=arm64
    export HOST_PLATFORM\=macosx
    export ICONV\=/usr/bin/iconv
    export IMPLICIT_DEPENDENCY_DOMAIN\=default
    export INFOPLIST_ENABLE_CFBUNDLEICONS_MERGE\=YES
    export INFOPLIST_EXPAND_BUILD_SETTINGS\=YES
    export INFOPLIST_OUTPUT_FORMAT\=binary
    export INFOPLIST_PREPROCESS\=NO
    export INLINE_PRIVATE_FRAMEWORKS\=NO
    export INSTALLAPI_IGNORE_SKIP_INSTALL\=YES
    export INSTALLHDRS_COPY_PHASE\=NO
    export INSTALLHDRS_SCRIPT_PHASE\=NO
    export INSTALL_DIR\=/tmp/Pods.dst
    export INSTALL_GROUP\=staff
    export INSTALL_MODE_FLAG\=u+w,go-w,a+rX
    export INSTALL_OWNER\=rafaltracz
    export INSTALL_ROOT\=/tmp/Pods.dst
    export IPHONEOS_DEPLOYMENT_TARGET\=13.4
    export IS_UNOPTIMIZED_BUILD\=YES
    export JAVAC_DEFAULT_FLAGS\=-J-Xms64m\ -J-XX:NewSize\=4M\ -J-Dfile.encoding\=UTF8
    export JAVA_APP_STUB\=/System/Library/Frameworks/JavaVM.framework/Resources/MacOS/JavaApplicationStub
    export JAVA_ARCHIVE_CLASSES\=YES
    export JAVA_ARCHIVE_TYPE\=JAR
    export JAVA_COMPILER\=/usr/bin/javac
    export JAVA_FRAMEWORK_RESOURCES_DIRS\=Resources
    export JAVA_JAR_FLAGS\=cv
    export JAVA_SOURCE_SUBDIR\=.
    export JAVA_USE_DEPENDENCIES\=YES
    export JAVA_ZIP_FLAGS\=-urg
    export JIKES_DEFAULT_FLAGS\=+E\ +OLDCSO
    export KEEP_PRIVATE_EXTERNS\=NO
    export LD_DEPENDENCY_INFO_FILE\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Objects-normal/undefined_arch/hermes-engine_dependency_info.dat
    export LD_EXPORT_SYMBOLS\=YES
    export LD_GENERATE_MAP_FILE\=NO
    export LD_MAP_FILE_PATH\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/hermes-engine-LinkMap-normal-undefined_arch.txt
    export LD_NO_PIE\=NO
    export LD_QUOTE_LINKER_ARGUMENTS_FOR_COMPILER_DRIVER\=YES
    export LD_RUNPATH_SEARCH_PATHS\=\ @executable_path/Frameworks
    export LD_SHARED_CACHE_ELIGIBLE\=Automatic
    export LD_WARN_DUPLICATE_LIBRARIES\=NO
    export LD_WARN_UNUSED_DYLIBS\=NO
    export LEGACY_DEVELOPER_DIR\=/Applications/Xcode.app/Contents/PlugIns/Xcode3Core.ideplugin/Contents/SharedSupport/Developer
    export LEX\=lex
    export LIBRARY_DEXT_INSTALL_PATH\=/Library/DriverExtensions
    export LIBRARY_FLAG_NOSPACE\=YES
    export LIBRARY_KEXT_INSTALL_PATH\=/Library/Extensions
    export LINKER_DISPLAYS_MANGLED_NAMES\=NO
    export LINK_FILE_LIST_normal_arm64\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Objects-normal/arm64/hermes-engine.LinkFileList
    export LINK_OBJC_RUNTIME\=YES
    export LINK_WITH_STANDARD_LIBRARIES\=YES
    export LLVM_TARGET_TRIPLE_OS_VERSION\=ios13.4
    export LLVM_TARGET_TRIPLE_SUFFIX\=-simulator
    export LLVM_TARGET_TRIPLE_VENDOR\=apple
    export LM_AUX_CONST_METADATA_LIST_PATH_normal_arm64\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Objects-normal/arm64/hermes-engine.SwiftConstValuesFileList
    export LOCALIZATION_EXPORT_SUPPORTED\=YES
    export LOCALIZATION_PREFERS_STRING_CATALOGS\=NO
    export LOCALIZED_STRING_MACRO_NAMES\=NSLocalizedString\ CFCopyLocalizedString
    export LOCALIZED_STRING_SWIFTUI_SUPPORT\=YES
    export LOCAL_ADMIN_APPS_DIR\=/Applications/Utilities
    export LOCAL_APPS_DIR\=/Applications
    export LOCAL_DEVELOPER_DIR\=/Library/Developer
    export LOCAL_LIBRARY_DIR\=/Library
    export LOCROOT\=/Users/rafaltracz/SonarlyApp2/ios/Pods
    export LOCSYMROOT\=/Users/rafaltracz/SonarlyApp2/ios/Pods
    export MAC_OS_X_PRODUCT_BUILD_VERSION\=24F74
    export MAC_OS_X_VERSION_ACTUAL\=150500
    export MAC_OS_X_VERSION_MAJOR\=150000
    export MAC_OS_X_VERSION_MINOR\=150500
    export MAKE_MERGEABLE\=NO
    export MERGEABLE_LIBRARY\=NO
    export MERGED_BINARY_TYPE\=none
    export MERGE_LINKED_LIBRARIES\=NO
    export METAL_LIBRARY_FILE_BASE\=default
    export METAL_LIBRARY_OUTPUT_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Products/Debug-iphonesimulator/hermes-engine/
    export MODULE_CACHE_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/ModuleCache.noindex
    export MTL_ENABLE_DEBUG_INFO\=INCLUDE_SOURCE
    export MTL_FAST_MATH\=YES
    export NATIVE_ARCH\=arm64
    export NATIVE_ARCH_32_BIT\=arm
    export NATIVE_ARCH_64_BIT\=arm64
    export NATIVE_ARCH_ACTUAL\=arm64
    export NO_COMMON\=YES
    export OBJC_ABI_VERSION\=2
    export OBJECT_FILE_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Objects
    export OBJECT_FILE_DIR_normal\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Objects-normal
    export OBJROOT\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex
    export ONLY_ACTIVE_ARCH\=YES
    export OS\=MACOS
    export OSAC\=/usr/bin/osacompile
    export OTHER_LDFLAGS\=\ \ 
    export PASCAL_STRINGS\=YES
    export PATH\=/Applications/Xcode.app/Contents/SharedFrameworks/SwiftBuild.framework/Versions/A/PlugIns/SWBBuildService.bundle/Contents/PlugIns/SWBUniversalPlatformPlugin.bundle/Contents/Frameworks/SWBUniversalPlatform.framework/Resources:/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin:/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/local/bin:/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/libexec:/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/usr/bin:/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/usr/local/bin:/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/usr/bin:/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/usr/local/bin:/Applications/Xcode.app/Contents/Developer/usr/bin:/Applications/Xcode.app/Contents/Developer/usr/local/bin:/Users/rafaltracz/SonarlyApp2/node_modules/.bin:/Users/rafaltracz/node_modules/.bin:/Users/node_modules/.bin:/node_modules/.bin:/Users/rafaltracz/.nvm/versions/node/v20.19.3/lib/node_modules/npm/node_modules/@npmcli/run-script/lib/node-gyp-bin:/Users/rafaltracz/.nvm/versions/node/v20.19.3/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/Users/rafaltracz/anaconda3/bin:/Library/Frameworks/Python.framework/Versions/3.11/bin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin:/opt/X11/bin:/Library/Apple/usr/bin
    export PATH_PREFIXES_EXCLUDED_FROM_HEADER_DEPENDENCIES\=/usr/include\ /usr/local/include\ /System/Library/Frameworks\ /System/Library/PrivateFrameworks\ /Applications/Xcode.app/Contents/Developer/Headers\ /Applications/Xcode.app/Contents/Developer/SDKs\ /Applications/Xcode.app/Contents/Developer/Platforms
    export PER_ARCH_MODULE_FILE_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Objects-normal/undefined_arch
    export PER_ARCH_OBJECT_FILE_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Objects-normal/undefined_arch
    export PER_VARIANT_OBJECT_FILE_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Objects-normal
    export PKGINFO_FILE_PATH\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/PkgInfo
    export PLATFORM_DEVELOPER_APPLICATIONS_DIR\=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/Applications
    export PLATFORM_DEVELOPER_BIN_DIR\=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/usr/bin
    export PLATFORM_DEVELOPER_LIBRARY_DIR\=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/Library
    export PLATFORM_DEVELOPER_SDK_DIR\=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs
    export PLATFORM_DEVELOPER_TOOLS_DIR\=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/Tools
    export PLATFORM_DEVELOPER_USR_DIR\=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/usr
    export PLATFORM_DIR\=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform
    export PLATFORM_DISPLAY_NAME\=iOS\ Simulator
    export PLATFORM_FAMILY_NAME\=iOS
    export PLATFORM_NAME\=iphonesimulator
    export PLATFORM_PREFERRED_ARCH\=x86_64
    export PLATFORM_PRODUCT_BUILD_VERSION\=22F76
    export PLATFORM_REQUIRES_SWIFT_AUTOLINK_EXTRACT\=NO
    export PLATFORM_REQUIRES_SWIFT_MODULEWRAP\=NO
    export PLIST_FILE_OUTPUT_FORMAT\=binary
    export PODS_BUILD_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Products
    export PODS_CONFIGURATION_BUILD_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Products/Debug-iphonesimulator
    export PODS_DEVELOPMENT_LANGUAGE\=en
    export PODS_ROOT\=/Users/rafaltracz/SonarlyApp2/ios/Pods
    export PODS_TARGET_SRCROOT\=/Users/rafaltracz/SonarlyApp2/ios/Pods/hermes-engine
    export PODS_XCFRAMEWORKS_BUILD_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Products/Debug-iphonesimulator/XCFrameworkIntermediates
    export PRECOMPS_INCLUDE_HEADERS_FROM_BUILT_PRODUCTS_DIR\=YES
    export PRECOMP_DESTINATION_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/PrefixHeaders
    export PROCESSED_INFOPLIST_PATH\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Objects-normal/undefined_arch/Processed-Info.plist
    export PRODUCT_BUNDLE_IDENTIFIER\=org.cocoapods.hermes-engine
    export PRODUCT_MODULE_NAME\=hermes_engine
    export PRODUCT_NAME\=hermes-engine
    export PRODUCT_SETTINGS_PATH\=
    export PROFILING_CODE\=NO
    export PROJECT\=Pods
    export PROJECT_DERIVED_FILE_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/DerivedSources
    export PROJECT_DIR\=/Users/rafaltracz/SonarlyApp2/ios/Pods
    export PROJECT_FILE_PATH\=/Users/rafaltracz/SonarlyApp2/ios/Pods/Pods.xcodeproj
    export PROJECT_GUID\=8699adb1dd336b26511df848a716bd42
    export PROJECT_NAME\=Pods
    export PROJECT_TEMP_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build
    export PROJECT_TEMP_ROOT\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex
    export REACT_NATIVE_PATH\=/Users/rafaltracz/SonarlyApp2/ios/Pods/../../node_modules/react-native
    export RECOMMENDED_IPHONEOS_DEPLOYMENT_TARGET\=15.0
    export RECURSIVE_SEARCH_PATHS_FOLLOW_SYMLINKS\=YES
    export REMOVE_CVS_FROM_RESOURCES\=YES
    export REMOVE_GIT_FROM_RESOURCES\=YES
    export REMOVE_HEADERS_FROM_EMBEDDED_BUNDLES\=YES
    export REMOVE_HG_FROM_RESOURCES\=YES
    export REMOVE_STATIC_EXECUTABLES_FROM_EMBEDDED_BUNDLES\=YES
    export REMOVE_SVN_FROM_RESOURCES\=YES
    export RESCHEDULE_INDEPENDENT_HEADERS_PHASES\=YES
    export REZ_COLLECTOR_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/ResourceManagerResources
    export REZ_OBJECTS_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/ResourceManagerResources/Objects
    export SCAN_ALL_SOURCE_FILES_FOR_INCLUDES\=NO
    export SCRIPT_INPUT_FILE_COUNT\=0
    export SCRIPT_INPUT_FILE_LIST_COUNT\=0
    export SCRIPT_OUTPUT_FILE_COUNT\=0
    export SCRIPT_OUTPUT_FILE_LIST_COUNT\=0
    export SDKROOT\=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator18.5.sdk
    export SDK_DIR\=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator18.5.sdk
    export SDK_DIR_iphonesimulator\=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator18.5.sdk
    export SDK_DIR_iphonesimulator18_5\=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator18.5.sdk
    export SDK_NAME\=iphonesimulator18.5
    export SDK_NAMES\=iphonesimulator18.5
    export SDK_PRODUCT_BUILD_VERSION\=22F76
    export SDK_STAT_CACHE_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData
    export SDK_STAT_CACHE_ENABLE\=YES
    export SDK_STAT_CACHE_PATH\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/SDKStatCaches.noindex/iphonesimulator18.5-22F76-d5fc8ad4295d2ef488fb7d0f804ce0c4.sdkstatcache
    export SDK_VERSION\=18.5
    export SDK_VERSION_ACTUAL\=180500
    export SDK_VERSION_MAJOR\=180000
    export SDK_VERSION_MINOR\=180500
    export SED\=/usr/bin/sed
    export SEPARATE_STRIP\=NO
    export SEPARATE_SYMBOL_EDIT\=NO
    export SET_DIR_MODE_OWNER_GROUP\=YES
    export SET_FILE_MODE_OWNER_GROUP\=NO
    export SHALLOW_BUNDLE\=NO
    export SHARED_DERIVED_FILE_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Products/Debug-iphonesimulator/hermes-engine/DerivedSources
    export SHARED_PRECOMPS_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/PrecompiledHeaders
    export SKIP_INSTALL\=YES
    export SOURCE_ROOT\=/Users/rafaltracz/SonarlyApp2/ios/Pods
    export SRCROOT\=/Users/rafaltracz/SonarlyApp2/ios/Pods
    export STRINGSDATA_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Objects-normal/undefined_arch
    export STRINGSDATA_ROOT\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build
    export STRINGS_FILE_INFOPLIST_RENAME\=YES
    export STRINGS_FILE_OUTPUT_ENCODING\=binary
    export STRIP_BITCODE_FROM_COPIED_FILES\=NO
    export STRIP_INSTALLED_PRODUCT\=NO
    export STRIP_STYLE\=all
    export STRIP_SWIFT_SYMBOLS\=YES
    export SUPPORTED_DEVICE_FAMILIES\=1,2
    export SUPPORTED_PLATFORMS\=iphoneos\ iphonesimulator
    export SUPPORTS_TEXT_BASED_API\=NO
    export SUPPRESS_WARNINGS\=NO
    export SWIFT_ACTIVE_COMPILATION_CONDITIONS\=DEBUG
    export SWIFT_EMIT_LOC_STRINGS\=NO
    export SWIFT_OPTIMIZATION_LEVEL\=-Onone
    export SWIFT_PLATFORM_TARGET_PREFIX\=ios
    export SWIFT_RESPONSE_FILE_PATH_normal_arm64\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Objects-normal/arm64/hermes-engine.SwiftFileList
    export SWIFT_VERSION\=5.0
    export SYMROOT\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Products
    export SYSTEM_ADMIN_APPS_DIR\=/Applications/Utilities
    export SYSTEM_APPS_DIR\=/Applications
    export SYSTEM_CORE_SERVICES_DIR\=/System/Library/CoreServices
    export SYSTEM_DEMOS_DIR\=/Applications/Extras
    export SYSTEM_DEVELOPER_APPS_DIR\=/Applications/Xcode.app/Contents/Developer/Applications
    export SYSTEM_DEVELOPER_BIN_DIR\=/Applications/Xcode.app/Contents/Developer/usr/bin
    export SYSTEM_DEVELOPER_DEMOS_DIR\=/Applications/Xcode.app/Contents/Developer/Applications/Utilities/Built\ Examples
    export SYSTEM_DEVELOPER_DIR\=/Applications/Xcode.app/Contents/Developer
    export SYSTEM_DEVELOPER_DOC_DIR\=/Applications/Xcode.app/Contents/Developer/ADC\ Reference\ Library
    export SYSTEM_DEVELOPER_GRAPHICS_TOOLS_DIR\=/Applications/Xcode.app/Contents/Developer/Applications/Graphics\ Tools
    export SYSTEM_DEVELOPER_JAVA_TOOLS_DIR\=/Applications/Xcode.app/Contents/Developer/Applications/Java\ Tools
    export SYSTEM_DEVELOPER_PERFORMANCE_TOOLS_DIR\=/Applications/Xcode.app/Contents/Developer/Applications/Performance\ Tools
    export SYSTEM_DEVELOPER_RELEASENOTES_DIR\=/Applications/Xcode.app/Contents/Developer/ADC\ Reference\ Library/releasenotes
    export SYSTEM_DEVELOPER_TOOLS\=/Applications/Xcode.app/Contents/Developer/Tools
    export SYSTEM_DEVELOPER_TOOLS_DOC_DIR\=/Applications/Xcode.app/Contents/Developer/ADC\ Reference\ Library/documentation/DeveloperTools
    export SYSTEM_DEVELOPER_TOOLS_RELEASENOTES_DIR\=/Applications/Xcode.app/Contents/Developer/ADC\ Reference\ Library/releasenotes/DeveloperTools
    export SYSTEM_DEVELOPER_USR_DIR\=/Applications/Xcode.app/Contents/Developer/usr
    export SYSTEM_DEVELOPER_UTILITIES_DIR\=/Applications/Xcode.app/Contents/Developer/Applications/Utilities
    export SYSTEM_DEXT_INSTALL_PATH\=/System/Library/DriverExtensions
    export SYSTEM_DOCUMENTATION_DIR\=/Library/Documentation
    export SYSTEM_KEXT_INSTALL_PATH\=/System/Library/Extensions
    export SYSTEM_LIBRARY_DIR\=/System/Library
    export TAPI_DEMANGLE\=YES
    export TAPI_ENABLE_PROJECT_HEADERS\=NO
    export TAPI_LANGUAGE\=objective-c
    export TAPI_LANGUAGE_STANDARD\=compiler-default
    export TAPI_USE_SRCROOT\=YES
    export TAPI_VERIFY_MODE\=Pedantic
    export TARGETED_DEVICE_FAMILY\=1,2
    export TARGETNAME\=hermes-engine
    export TARGET_BUILD_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Products/Debug-iphonesimulator/hermes-engine
    export TARGET_DEVICE_IDENTIFIER\=32520574-6A03-4B3D-9A3F-B3DE1388635D
    export TARGET_DEVICE_MODEL\=iPhone17,1
    export TARGET_DEVICE_OS_VERSION\=18.4
    export TARGET_DEVICE_PLATFORM_NAME\=iphonesimulator
    export TARGET_NAME\=hermes-engine
    export TARGET_TEMP_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build
    export TEMP_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build
    export TEMP_FILES_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build
    export TEMP_FILE_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build
    export TEMP_ROOT\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex
    export TEMP_SANDBOX_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/TemporaryTaskSandboxes
    export TEST_FRAMEWORK_SEARCH_PATHS\=\ /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/Library/Frameworks\ /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator18.5.sdk/Developer/Library/Frameworks
    export TEST_LIBRARY_SEARCH_PATHS\=\ /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/usr/lib
    export TOOLCHAINS\=com.apple.dt.toolchain.XcodeDefault
    export TOOLCHAIN_DIR\=/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain
    export TREAT_MISSING_BASELINES_AS_TEST_FAILURES\=NO
    export TREAT_MISSING_SCRIPT_PHASE_OUTPUTS_AS_ERRORS\=NO
    export UID\=501
    export UNINSTALLED_PRODUCTS_DIR\=/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/UninstalledProducts
    export UNSTRIPPED_PRODUCT\=NO
    export USER\=rafaltracz
    export USER_APPS_DIR\=/Users/rafaltracz/Applications
    export USER_LIBRARY_DIR\=/Users/rafaltracz/Library
    export USE_DYNAMIC_NO_PIC\=YES
    export USE_HEADERMAP\=YES
    export USE_HEADER_SYMLINKS\=NO
    export USE_HERMES\=true
    export USE_RECURSIVE_SCRIPT_INPUTS_IN_SCRIPT_PHASES\=YES
    export VALIDATE_DEVELOPMENT_ASSET_PATHS\=YES_ERROR
    export VALIDATE_PRODUCT\=NO
    export VALID_ARCHS\=arm64\ arm64e\ x86_64
    export VERBOSE_PBXCP\=NO
    export VERSION_INFO_BUILDER\=rafaltracz
    export VERSION_INFO_FILE\=hermes-engine_vers.c
    export VERSION_INFO_STRING\=\"@\(\#\)PROGRAM:hermes-engine\ \ PROJECT:Pods-\"
    export WORKSPACE_DIR\=/Users/rafaltracz/SonarlyApp2/ios
    export WRAP_ASSET_PACKS_IN_SEPARATE_DIRECTORIES\=NO
    export XCODE_APP_SUPPORT_DIR\=/Applications/Xcode.app/Contents/Developer/Library/Xcode
    export XCODE_PRODUCT_BUILD_VERSION\=16F6
    export XCODE_VERSION_ACTUAL\=1640
    export XCODE_VERSION_MAJOR\=1600
    export XCODE_VERSION_MINOR\=1640
    export XPCSERVICES_FOLDER_PATH\=/XPCServices
    export YACC\=yacc
    export _DISCOVER_COMMAND_LINE_LINKER_INPUTS\=YES
    export _DISCOVER_COMMAND_LINE_LINKER_INPUTS_INCLUDE_WL\=YES
    export __DIAGNOSE_DEPRECATED_ARCHS\=YES
    export arch\=undefined_arch
    export variant\=normal
    /bin/sh -c /Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Script-46EB2E00021F60.sh
Node found at: /opt/homebrew/Cellar/node/23.7.0/bin/node
/Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Script-46EB2E00021F60.sh: line 9: /opt/homebrew/Cellar/node/23.7.0/bin/node: No such file or directory
Command PhaseScriptExecution failed with a nonzero exit code

/Users/rafaltracz/SonarlyApp2/ios/Pods/Pods.xcodeproj: warning: The iOS Simulator deployment target 'IPHONEOS_DEPLOYMENT_TARGET' is set to 9.0, but the range of supported deployment target versions is 12.0 to 18.5.99. (in target 'RNCAsyncStorage-RNCAsyncStorage_resources' from project 'Pods')
warning: Run script build phase '[CP-User] [RN]Check rncore' will be run during every build because it does not specify any outputs. To address this issue, either add output dependencies to the script phase, or configure it to run in every build by unchecking "Based on dependency analysis" in the script phase. (in target 'React-Fabric' from project 'Pods')
note: Run script build phase '[Expo] Configure project' will be run during every build because the option to run the script phase "Based on dependency analysis" is unchecked. (in target 'Sonarly' from project 'Sonarly')
note: Run script build phase 'Bundle React Native code and images' will be run during every build because the option to run the script phase "Based on dependency analysis" is unchecked. (in target 'Sonarly' from project 'Sonarly')
/Users/rafaltracz/SonarlyApp2/ios/Pods/Pods.xcodeproj: warning: The iOS Simulator deployment target 'IPHONEOS_DEPLOYMENT_TARGET' is set to 9.0, but the range of supported deployment target versions is 12.0 to 18.5.99. (in target 'SDWebImage-SDWebImage' from project 'Pods')
warning: Run script build phase '[CP-User] Generate app.config for prebuilt Constants.manifest' will be run during every build because it does not specify any outputs. To address this issue, either add output dependencies to the script phase, or configure it to run in every build by unchecking "Based on dependency analysis" in the script phase. (in target 'EXConstants' from project 'Pods')
warning: Run script build phase '[CP-User] [Hermes] Replace Hermes for the right configuration, if needed' will be run during every build because it does not specify any outputs. To address this issue, either add output dependencies to the script phase, or configure it to run in every build by unchecking "Based on dependency analysis" in the script phase. (in target 'hermes-engine' from project 'Pods')


--- xcodebuild: WARNING: Using the first of multiple matching destinations:
{ platform:iOS Simulator, arch:arm64, id:32520574-6A03-4B3D-9A3F-B3DE1388635D, OS:18.4, name:iPhone 16 Pro }
{ platform:iOS Simulator, arch:x86_64, id:32520574-6A03-4B3D-9A3F-B3DE1388635D, OS:18.4, name:iPhone 16 Pro }
** BUILD FAILED **


The following build commands failed:
	PhaseScriptExecution [CP-User]\ [Hermes]\ Replace\ Hermes\ for\ the\ right\ configuration,\ if\ needed /Users/rafaltracz/Library/Developer/Xcode/DerivedData/Sonarly-afxferxohtijqxctfngzyxauleol/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/hermes-engine.build/Script-46EB2E00021F60.sh (in target 'hermes-engine' from project 'Pods')
	Building workspace Sonarly with scheme Sonarly and configuration Debug
(2 failures)
Build logs written to /Users/rafaltracz/SonarlyApp2/.expo/xcodebuild.log
