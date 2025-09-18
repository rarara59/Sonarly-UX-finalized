// Add these debug statements to your existing PPGFrameProcessor.m

@implementation PPGFrameProcessor

- (id)callback:(Frame *)frame withArguments:(NSDictionary *)arguments {
    // ADD THIS DEBUG LOG FIRST
    NSLog(@"🔴 PPG Frame processor called! Frame: %@", frame);
    
    // Basic PPG frame processing stub
    CVImageBufferRef imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    if (!imageBuffer) {
        NSLog(@"❌ No image buffer found");
        return @{@"error": @"No image buffer"};
    }
    
    NSLog(@"✅ Image buffer exists");
    
    // Lock the base address of the pixel buffer
    CVPixelBufferLockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);
    
    size_t width = CVPixelBufferGetWidth(imageBuffer);
    size_t height = CVPixelBufferGetHeight(imageBuffer);
    
    NSLog(@"📏 Frame dimensions: %zu x %zu", width, height);
    
    // For now, just return frame dimensions as a test
    NSDictionary *result = @{
        @"width": @(width),
        @"height": @(height),
        @"timestamp": @(frame.timestamp),
        @"debug": @"Frame processed successfully"
    };
    
    CVPixelBufferUnlockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);
    
    NSLog(@"📤 Returning result: %@", result);
    return result;
}

+ (void)load {
    NSLog(@"🚀 PPGFrameProcessor loading and registering...");
    
    // Register the frame processor plugin
    [FrameProcessorPluginRegistry addFrameProcessorPlugin:@"detectPPG"
                                          withInitializer:^FrameProcessorPlugin*(NSDictionary* options) {
        NSLog(@"✅ PPG Frame processor initialized");
        return [[PPGFrameProcessor alloc] init];
    }];
    
    NSLog(@"✅ PPG Frame processor registered as 'detectPPG'");
}

@end