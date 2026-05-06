const { shouldUseKeepAwakeShim } = require("../../metro.keepAwakeShim.js");

describe("metro config", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("shims expo-keep-awake only for Android non-production bundles", () => {
    process.env.NODE_ENV = "development";

    expect(shouldUseKeepAwakeShim("expo-keep-awake", "android")).toBe(true);
    expect(shouldUseKeepAwakeShim("expo-keep-awake", "ios")).toBe(false);
    expect(shouldUseKeepAwakeShim("expo-keep-awake", "web")).toBe(false);
    expect(shouldUseKeepAwakeShim("react", "android")).toBe(false);
  });

  it("keeps real expo-keep-awake resolution in production", () => {
    process.env.NODE_ENV = "production";

    expect(shouldUseKeepAwakeShim("expo-keep-awake", "android")).toBe(false);
  });
});
