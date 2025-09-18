Execute the complete build sequence and verification:

1. Clean build: rm -rf ios/Pods ios/Podfile.lock
2. Rebuild: npx expo prebuild --clean --platform ios
3. Install pods: cd ios && pod install && cd ..
4. Deploy: npx react-native run-ios --device "iPhone (2)"
5. Test: Place finger over camera lens with torch on
6. Verify console shows: "PPG meanLuma=X.XX" and luma changes 50+ points with finger on/off
7. Confirm no "frame: undefined" logs (those were red herrings)

Success criteria: Native logs + JS receives {ok: true, luma: changing_numbers}