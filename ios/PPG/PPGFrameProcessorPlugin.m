// ios/PPG/PPGFrameProcessorPlugin.m
#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/Frame.h>
#import <CoreVideo/CoreVideo.h>
#import <CoreMedia/CoreMedia.h>
#import <QuartzCore/QuartzCore.h>
#import <os/log.h>

@interface PPGFrameProcessorPlugin : FrameProcessorPlugin
@end

@implementation PPGFrameProcessorPlugin

- (instancetype)initWithProxy:(VisionCameraProxyHolder *)proxy
                  withOptions:(NSDictionary * _Nullable)options {
  self = [super initWithProxy:proxy withOptions:options];
  return self;
}

// Return an NSDictionary with simple scalar data computed from the frame.
// Do not attempt to return the frame itself.
- (id)callback:(Frame *)frame withArguments:(NSDictionary *)arguments {
  CMSampleBufferRef sampleBuffer = frame.buffer;
  if (sampleBuffer == NULL) {
    return @{ @"ok": @NO, @"reason": @"NO_BUFFER" };
  }

  CVImageBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
  if (pixelBuffer == NULL) {
    return @{ @"ok": @NO, @"reason": @"NO_PIXEL_BUFFER" };
  }

  CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
  // Plane 0 = luma (Y) for kCVPixelFormatType_420YpCbCr8BiPlanarFullRange (default on iOS)
  const size_t width  = CVPixelBufferGetWidthOfPlane(pixelBuffer, 0);
  const size_t height = CVPixelBufferGetHeightOfPlane(pixelBuffer, 0);
  const size_t stride = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 0);
  uint8_t *base = (uint8_t *)CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 0);

  if (base == NULL || width == 0 || height == 0) {
    CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
    return @{ @"ok": @NO, @"reason": @"INVALID_BASE" };
  }

  // Downsampled mean for speed: skip every N pixels. N=4 gives ~16x fewer reads.
  const size_t step = 4;
  double sum = 0.0;
  size_t count = 0;
  for (size_t y = 0; y < height; y += step) {
    uint8_t *row = base + y * stride;
    for (size_t x = 0; x < width; x += step) {
      sum += row[x];
      count++;
    }
  }
  CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

  const double meanLuma = count ? (sum / (double)count) : 0.0;

  // Optional native log for verification during bring-up.
  os_log(OS_LOG_DEFAULT, "PPG meanLuma=%{public}.2f", meanLuma);

  // Return only JSON-serializable data.
  return @{
    @"ok": @YES,
    @"luma": @(meanLuma),
    // Pass back timestamp to correlate on JS side.
    @"ts": @((long long)(CACurrentMediaTime() * 1000.0))
  };
}

// Expose the plugin to JS as "detectPPG"
VISION_EXPORT_FRAME_PROCESSOR(PPGFrameProcessorPlugin, detectPPG)

@end

