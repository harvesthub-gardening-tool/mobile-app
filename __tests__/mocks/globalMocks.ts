// AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

// expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// react-native-reanimated
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock"),
);

// react-native-gesture-handler
jest.mock("react-native-gesture-handler", () => ({
  Gesture: { Pan: jest.fn(() => ({ enabled: jest.fn().mockReturnThis(), onBegin: jest.fn().mockReturnThis(), onChange: jest.fn().mockReturnThis(), onFinalize: jest.fn().mockReturnThis() })) },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
}));

// expo-router
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  Link: "Link",
  router: { push: jest.fn(), replace: jest.fn() },
}));

// AuthContext
jest.mock("../app/context/AuthContext", () => ({
  useAuth: () => ({ userId: "user_1", token: "tok", logout: jest.fn() }),
}));

// services
jest.mock("../app/services/authService", () => ({
  login: jest.fn(),
  register: jest.fn(),
  listHubs: jest.fn().mockResolvedValue([]),
}));

jest.mock("../app/services/gardenService", () => ({
  getSummary: jest.fn().mockResolvedValue([]),
  listProbesForHubName: jest.fn().mockResolvedValue([]),
  insertSensorData: jest.fn().mockResolvedValue({}),
}));
