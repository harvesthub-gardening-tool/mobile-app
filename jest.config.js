module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@testing-library|@connectrpc|@bufbuild|@harvesthub-gardening-tool)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/app/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "__tests__/mocks/"],
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "!app/**/_layout.tsx",
    "!app/**/index.ts",
    "!app/**/*.d.ts",
    "!app/types/**",
  ],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
};
