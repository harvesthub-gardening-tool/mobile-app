import { useState } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import WifiManager from "react-native-wifi-reborn";
import type {
    SetupFailureHandler,
    WifiCredentialsProvisioner,
    WifiNetwork,
} from "../types/hub-setup";
import { WifiCredentialsRejectedError } from "../types/hub-setup";

async function requestWifiScanPermission(): Promise<void> {
    if (Platform.OS !== "android") return;
    const already = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (already) return;
    const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error("Permission de localisation refusée (requise pour scanner le WiFi).");
    }
}

export function useWifiSetup(
    onSuccess: () => void,
    sendWifiCredentials: WifiCredentialsProvisioner,
    onSetupFailure: SetupFailureHandler,
) {
    const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([]);
    const [isScanningWifi, setIsScanningWifi] = useState(false);
    const [selectedSsid, setSelectedSsid] = useState<string | null>(null);
    const [manualSsid, setManualSsid] = useState("");
    const [wifiPassword, setWifiPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isConnectingWifi, setIsConnectingWifi] = useState(false);
    const [wifiError, setWifiError] = useState<string | null>(null);

    const startWifiScan = async () => {
        setIsScanningWifi(true);
        setWifiError(null);
        try {
            await requestWifiScanPermission();
            const networks = await WifiManager.loadWifiList();
            setWifiNetworks(
                (networks as WifiNetwork[])
                    .filter((n) => n.SSID?.length > 0)
                    .sort((a, b) => b.level - a.level),
            );
        } catch (e: unknown) {
            setWifiError((e as Error)?.message ?? "Impossible de scanner les réseaux WiFi.");
        } finally {
            setIsScanningWifi(false);
        }
    };

    const handleConnectWifi = async () => {
        const ssid = Platform.OS === "ios" ? manualSsid.trim() : selectedSsid;
        if (!ssid) return;
        if (!wifiPassword.trim()) {
            setWifiError("Veuillez entrer le mot de passe du réseau.");
            return;
        }
        setWifiError(null);
        setIsConnectingWifi(true);
        try {
            await sendWifiCredentials(ssid, wifiPassword);
            onSuccess();
        } catch (e: unknown) {
            if (e instanceof WifiCredentialsRejectedError) {
                setWifiError(e.message);
                return;
            }

            await onSetupFailure(e);
            setWifiPassword("");
            setSelectedSsid(null);
            setWifiError(
                (e as Error)?.message
                    ?? "La configuration du hub a échoué. L'association a été réinitialisée.",
            );
        } finally {
            setIsConnectingWifi(false);
        }
    };

    return {
        wifiNetworks,
        isScanningWifi,
        selectedSsid,
        setSelectedSsid,
        manualSsid,
        setManualSsid,
        wifiPassword,
        setWifiPassword,
        showPassword,
        setShowPassword,
        isConnectingWifi,
        wifiError,
        setWifiError,
        startWifiScan,
        handleConnectWifi,
    };
}
