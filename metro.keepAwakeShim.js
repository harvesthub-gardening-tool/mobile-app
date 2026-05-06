function shouldUseKeepAwakeShim(moduleName, platform) {
  return (
    moduleName === "expo-keep-awake" &&
    platform === "android" &&
    process.env.NODE_ENV !== "production"
  );
}

module.exports = { shouldUseKeepAwakeShim };
