import { useState, useRef, useEffect } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import { BleManager } from "react-native-ble-plx";
import type { SubStep, SubStepStatus } from "../types/hub-setup";

async function requestHubApi(_hubName: string): Promise<void> {
    // TODO : remplacer par la vraie requête HTTP vers le hub
    await new Promise((r) => setTimeout(r, 1000));
}

async function requestBluetoothPermissions(): Promise<void> {
    if (Platform.OS !== "android") return;
    const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    const denied = Object.values(results).some(
        (r) => r !== PermissionsAndroid.RESULTS.GRANTED,
    );
    if (denied) throw new Error("Permissions Bluetooth refusées.");
}

function scanForHub(manager: BleManager, hubName: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            manager.stopDeviceScan();
            reject(new Error("Hub introuvable. Vérifiez qu'il est allumé et à proximité."));
        }, 15000);

        manager.startDeviceScan(null, { allowDuplicates: false }, (err, device) => {
            if (err) {
                clearTimeout(timeout);
                manager.stopDeviceScan();
                reject(err);
                return;
            }
            if (device?.name === hubName || device?.localName === hubName) {
                clearTimeout(timeout);
                manager.stopDeviceScan();
                resolve(device.id);
            }
        });
    });
}

async function connectToHub(manager: BleManager, deviceId: string): Promise<void> {
    const device = await manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();
}

function makeBtSteps(hubName: string): SubStep[] {
    return [
        { key: "api",        label: "Connexion au hub",        status: "pending" },
        { key: "permission", label: "Autorisation Bluetooth",  status: "pending" },
        { key: "scan",       label: "Recherche de l'appareil", status: "pending" },
        { key: "connect",    label: `Connexion à ${hubName}`,  status: "pending" },
    ];
}

export function useBluetoothSetup(hubName: string, onSuccess: () => void) {
    const bleManager = useRef(new BleManager()).current;
    const [btSteps, setBtSteps] = useState<SubStep[]>(() => makeBtSteps(hubName));
    const [btError, setBtError] = useState<string | null>(null);
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        void bleManager.destroy();
    }, []);

    const updateBt = (key: string, status: SubStepStatus) =>
        setBtSteps((prev) => prev.map((s) => (s.key === key ? { ...s, status } : s)));

    const runBluetoothFlow = async () => {
        setBtError(null);
        setBtSteps(makeBtSteps(hubName));
        let currentKey = "";
        try {
            currentKey = "api";
            updateBt("api", "loading");
            await requestHubApi(hubName);
            updateBt("api", "done");

            currentKey = "permission";
            updateBt("permission", "loading");
            await requestBluetoothPermissions();
            updateBt("permission", "done");

            currentKey = "scan";
            updateBt("scan", "loading");
            const deviceId = await scanForHub(bleManager, hubName);
            updateBt("scan", "done");

            currentKey = "connect";
            updateBt("connect", "loading");
            await connectToHub(bleManager, deviceId);
            updateBt("connect", "done");

            successTimerRef.current = setTimeout(onSuccess, 700);
        } catch (e: unknown) {
            if (currentKey) updateBt(currentKey, "error");
            setBtError((e as Error)?.message ?? "Une erreur est survenue.");
        }
    };

    return { btSteps, btError, runBluetoothFlow };
}
