const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { shouldUseKeepAwakeShim } = require("./metro.keepAwakeShim");

const config = getDefaultConfig(__dirname);
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (shouldUseKeepAwakeShim(moduleName, platform)) {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "src/shims/expoKeepAwake.ts"),
    };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
module.exports.shouldUseKeepAwakeShim = shouldUseKeepAwakeShim;
