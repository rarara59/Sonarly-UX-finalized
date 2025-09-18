// Expo config plugin to add the PPG VisionCamera frame processor to iOS target
const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Path used inside the Xcode project (relative to ios project root)
const IOS_PLUGIN_RELATIVE_PATH = 'PPG/PPGFrameProcessorPlugin.m';

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Writes the Objective-C plugin source into the iOS folder during prebuild
function withPPGSource(modConfig) {
  return withDangerousMod(modConfig, [
    'ios',
    (config) => {
      const iosDir = path.join(config.modRequest.projectRoot, 'ios');
      const destDir = path.join(iosDir, 'PPG');
      const destPath = path.join(iosDir, 'PPG', 'PPGFrameProcessorPlugin.m');

      ensureDirSync(destDir);

      // Source lives alongside the plugin file in this repo
      const srcPath = path.join(
        config.modRequest.projectRoot,
        'plugins',
        'ppg',
        'ios',
        'PPGFrameProcessorPlugin.m'
      );

      if (!fs.existsSync(srcPath)) {
        throw new Error(
          `PPGFrameProcessorPlugin source not found at ${srcPath}. Did you move or rename it?`
        );
      }

      const contents = fs.readFileSync(srcPath, 'utf8');
      fs.writeFileSync(destPath, contents);

      return config;
    },
  ]);
}

// Adds the Objective-C file to the Xcode project build phase
function withPPGXcode(modConfig) {
  return withXcodeProject(modConfig, (config) => {
    const project = config.modResults;
    const group = 'PPG';

    // Ensure group exists in Xcode
    const groupKey = project.findPBXGroupKey({ name: group }) || project.pbxCreateGroup(group, 'PPG');

    const filePathInProject = IOS_PLUGIN_RELATIVE_PATH;

    // Robust existence check across xcode versions
    const hasFile = (proj, p) => {
      if (typeof proj.hasFile === 'function' && proj.hasFile(p)) return true;
      const fileRefSection = proj.pbxFileReferenceSection();
      return Object.values(fileRefSection || {}).some((entry) => {
        return entry && typeof entry === 'object' && entry.path && String(entry.path).replace(/\"/g, '') === p;
      });
    };

    if (!hasFile(project, filePathInProject)) {
      const file = project.addSourceFile(
        filePathInProject,
        { target: project.getFirstTarget().uuid },
        groupKey
      );
      if (!file) {
        throw new Error(`Failed to add ${filePathInProject} to Xcode project`);
      }
    }

    return config;
  });
}

// Ensure VisionCamera pod is explicitly added with FrameProcessors subspec
function withVisionCameraPod(modConfig) {
  return withDangerousMod(modConfig, [
    'ios',
    (config) => {
      const fs = require('fs');
      const path = require('path');

      const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (!contents.includes("react-native-vision-camera")) {
        const marker = 'config = use_native_modules!';
        const insertion = `${marker}\n\n  # Added by with-ppg-frame-processor (ensure VisionCamera + FrameProcessors)\n  pod 'VisionCamera', :path => '../node_modules/react-native-vision-camera', :subspecs => ['FrameProcessors']`;
        if (contents.includes(marker)) {
          contents = contents.replace(marker, insertion);
          fs.writeFileSync(podfilePath, contents);
        }
      }

      return config;
    },
  ]);
}

const withPPGFrameProcessor = (config) => {
  config = withPPGSource(config);
  config = withPPGXcode(config);
  config = withVisionCameraPod(config);
  config = withIOSDeploymentTarget(config);
  return config;
};

module.exports = withPPGFrameProcessor;

// Ensure ios.deploymentTarget is set to 15.1 in Podfile.properties.json after prebuild
function withIOSDeploymentTarget(modConfig) {
  return withDangerousMod(modConfig, [
    'ios',
    (config) => {
      const fs = require('fs');
      const path = require('path');
      const file = path.join(config.modRequest.projectRoot, 'ios', 'Podfile.properties.json');
      let json = {};
      try {
        if (fs.existsSync(file)) {
          json = JSON.parse(fs.readFileSync(file, 'utf8')) || {};
        }
      } catch {}
      if (json['ios.deploymentTarget'] !== '15.1') {
        json['ios.deploymentTarget'] = '15.1';
        fs.writeFileSync(file, JSON.stringify(json, null, 2));
      }
      return config;
    },
  ]);
}
