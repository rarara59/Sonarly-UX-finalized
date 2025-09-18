#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import "PPGFrameProcessor.h"

// Log when this file is loaded
__attribute__((constructor))
static void logRegistration() {
    NSLog(@"🚀 PPGFrameProcessor loading and registering...");
}

// Register the PPG frame processor plugin
VISION_EXPORT_FRAME_PROCESSOR(PPGFrameProcessor, detectPPG)

// Additional logging after registration
__attribute__((constructor))
static void logRegistrationComplete() {
    NSLog(@"✅ PPG Frame processor registered as 'detectPPG'");
}