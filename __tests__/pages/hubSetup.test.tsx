import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

const mockBack = jest.fn();
const mockCanGoBack = jest.fn();
const mockReplace = jest.fn();
const mockRunBluetoothFlow = jest.fn();
const mockSendWifiCredentials = jest.fn();
const mockMarkSetupRolledBack = jest.fn();
const mockStartWifiScan = jest.fn();
const mockSetWifiError = jest.fn();
const mockRevokeHubByDeviceId = jest.fn();

let capturedWifiSuccess: ((probes: Array<{ nodeId: string; name: string; version: string }>) => void) | undefined;
let capturedSetupFailure: ((error: unknown) => Promise<void>) | undefined;
let capturedBluetoothSuccess: (() => void) | undefined;
let capturedProbeScanStarted: (() => void) | undefined;

jest.useFakeTimers();

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 8, left: 0, right: 0 }),
}));

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({
    hub_name: "Hub Jardin",
    hub_uuid: "hub-uuid",
    hub_secret: "hub-secret",
  }),
  useRouter: () => ({
    back: mockBack,
    canGoBack: mockCanGoBack,
    replace: mockReplace,
  }),
}));

jest.mock("@/hooks/useBluetoothSetup", () => ({
  useBluetoothSetup: (
    _hubName: string,
    _hubUuid: string,
    _hubSecret: string,
    onSuccess: () => void,
    onProbeScanStarted: () => void,
  ) => {
    capturedBluetoothSuccess = onSuccess;
    capturedProbeScanStarted = onProbeScanStarted;
    return {
      btSteps: [],
      btError: null,
      runBluetoothFlow: mockRunBluetoothFlow,
      sendWifiCredentials: mockSendWifiCredentials,
      markSetupRolledBack: mockMarkSetupRolledBack,
    };
  },
}));

jest.mock("@/hooks/useWifiSetup", () => ({
  useWifiSetup: (
    onSuccess: (probes: Array<{ nodeId: string; name: string; version: string }>) => void,
    _sendWifiCredentials: unknown,
    onSetupFailure: (error: unknown) => Promise<void>,
  ) => {
    capturedWifiSuccess = onSuccess;
    capturedSetupFailure = onSetupFailure;
    return {
      wifiNetworks: [],
      isScanningWifi: false,
      selectedSsid: "GardenWiFi",
      setSelectedSsid: jest.fn(),
      manualSsid: "ManualWiFi",
      setManualSsid: jest.fn(),
      wifiPassword: "secret",
      setWifiPassword: jest.fn(),
      showPassword: false,
      setShowPassword: jest.fn(),
      isConnectingWifi: false,
      wifiError: null,
      setWifiError: mockSetWifiError,
      startWifiScan: mockStartWifiScan,
      handleConnectWifi: jest.fn(),
    };
  },
}));

jest.mock("@/services/authService", () => ({
  revokeHubByDeviceId: (deviceId: string) => mockRevokeHubByDeviceId(deviceId),
}));

jest.mock("@/components/hub-setup/IntroStep", () => ({
  IntroStep: ({ hubName, onNext }: { hubName: string; onNext: () => void }) => {
    const RN = require("react-native");
    return (
      <RN.TouchableOpacity onPress={onNext}>
        <RN.Text>{`intro-${hubName}`}</RN.Text>
      </RN.TouchableOpacity>
    );
  },
}));

jest.mock("@/components/hub-setup/BluetoothStep", () => ({
  BluetoothStep: ({ onRetry, onSkip }: { onRetry: () => void; onSkip: () => void }) => {
    const RN = require("react-native");
    return (
      <RN.View>
        <RN.Text>bluetooth-step</RN.Text>
        <RN.TouchableOpacity onPress={onRetry}>
          <RN.Text>retry-bluetooth</RN.Text>
        </RN.TouchableOpacity>
        <RN.TouchableOpacity onPress={onSkip}>
          <RN.Text>skip-bluetooth</RN.Text>
        </RN.TouchableOpacity>
      </RN.View>
    );
  },
}));

jest.mock("@/components/hub-setup/WifiStep", () => ({
  WifiStep: () => {
    const RN = require("react-native");
    return <RN.Text>wifi-step</RN.Text>;
  },
}));

jest.mock("@/components/hub-setup/ProbeDiscoveryStep", () => ({
  ProbeDiscoveryStep: ({
    probes,
    scanning,
    onNext,
  }: {
    probes: Array<{ nodeId: string }>;
    scanning: boolean;
    onNext: () => void;
  }) => {
    const RN = require("react-native");
    return (
      <RN.TouchableOpacity onPress={onNext}>
        <RN.Text>{`probes-${probes.length}-${scanning ? "scanning" : "ready"}`}</RN.Text>
      </RN.TouchableOpacity>
    );
  },
}));

jest.mock("@/components/hub-setup/SuccessStep", () => ({
  SuccessStep: ({ hubName, wifiSsid, onDismiss }: { hubName: string; wifiSsid: string; onDismiss: () => void }) => {
    const RN = require("react-native");
    return (
      <RN.TouchableOpacity onPress={onDismiss}>
        <RN.Text>{`success-${hubName}-${wifiSsid}`}</RN.Text>
      </RN.TouchableOpacity>
    );
  },
}));

import HubSetupScreen from "../../app/hub-setup";

function finishAnimations() {
  act(() => {
    jest.runOnlyPendingTimers();
  });
}

describe("HubSetupScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedWifiSuccess = undefined;
    capturedSetupFailure = undefined;
    capturedBluetoothSuccess = undefined;
    capturedProbeScanStarted = undefined;
    mockCanGoBack.mockReturnValue(false);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it("walks through setup steps and reaches WiFi flow", async () => {
    const { getByText } = render(<HubSetupScreen />);

    expect(getByText("intro-Hub Jardin")).toBeTruthy();

    fireEvent.press(getByText("intro-Hub Jardin"));
    finishAnimations();

    await waitFor(() => expect(mockRunBluetoothFlow).toHaveBeenCalled());
    expect(getByText("bluetooth-step")).toBeTruthy();

    act(() => {
      capturedBluetoothSuccess?.();
    });
    finishAnimations();

    await waitFor(() => expect(getByText("wifi-step")).toBeTruthy());
  });

  it("shows scanning probes and then success with discovered probes", async () => {
    const { getByText } = render(<HubSetupScreen />);

    act(() => {
      capturedProbeScanStarted?.();
    });
    finishAnimations();

    await waitFor(() => expect(getByText("probes-0-scanning")).toBeTruthy());

    act(() => {
      capturedWifiSuccess?.([{ nodeId: "node-1", name: "Sonde 1", version: "1.0" }]);
    });
    await waitFor(() => expect(getByText("probes-1-ready")).toBeTruthy());

    fireEvent.press(getByText("probes-1-ready"));
    finishAnimations();

    await waitFor(() => expect(getByText("success-Hub Jardin-ManualWiFi")).toBeTruthy());
  });

  it("dismisses to history when possible and otherwise returns to dashboard", () => {
    const { UNSAFE_getAllByProps, getByText, rerender } = render(<HubSetupScreen />);

    mockCanGoBack.mockReturnValue(true);
    fireEvent.press(UNSAFE_getAllByProps({ accessible: true })[0]);
    finishAnimations();
    expect(mockBack).toHaveBeenCalled();

    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(false);
    rerender(<HubSetupScreen />);

    fireEvent.press(getByText("intro-Hub Jardin"));
    finishAnimations();
    fireEvent.press(getByText("skip-bluetooth"));
    finishAnimations();

    fireEvent.press(UNSAFE_getAllByProps({ accessible: true })[0]);
    finishAnimations();
    expect(mockReplace).toHaveBeenCalledWith("/pages/dashboard");
  });

  it("rolls back hub association after setup failure", async () => {
    render(<HubSetupScreen />);

    await act(async () => {
      await capturedSetupFailure?.(new Error("WiFi failed"));
    });

    expect(mockRevokeHubByDeviceId).toHaveBeenCalledWith("hub-uuid");
    expect(mockSetWifiError).toHaveBeenCalledWith("WiFi failed");

    act(() => {
      jest.advanceTimersByTime(700);
    });
    finishAnimations();

    expect(mockMarkSetupRolledBack).toHaveBeenCalledWith(
      "WiFi failed L'association a été réinitialisée, recommencez l'installation.",
    );
  });

  it("surfaces rollback failure when hub revoke fails", async () => {
    mockRevokeHubByDeviceId.mockRejectedValueOnce(new Error("offline"));
    render(<HubSetupScreen />);

    await expect(capturedSetupFailure?.(new Error("WiFi failed"))).rejects.toThrow(
      "La configuration du hub a échoué et l'association n'a pas pu être réinitialisée.",
    );
  });
});
