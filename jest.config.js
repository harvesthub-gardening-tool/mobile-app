module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@testing-library|@connectrpc|@bufbuild|@harvesthub-gardening-tool)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@bufbuild/protobuf/codegenv2$": "<rootDir>/node_modules/@bufbuild/protobuf/dist/cjs/codegenv2/index.js",
    "^@bufbuild/protobuf/(wkt|reflect|wire|codegenv1)$": "<rootDir>/node_modules/@bufbuild/protobuf/dist/cjs/$1/index.js",
    "^../../app/(components|constants|context|hooks|services|theme|types|utils)/(.*)$": "<rootDir>/src/$1/$2",
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
