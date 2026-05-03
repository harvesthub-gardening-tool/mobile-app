import { useState, useRef, useEffect, type MutableRefObject } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import { BleError, BleManager, Device, Subscription } from "react-native-ble-plx";
import { Buffer } from "buffer";
import {
    WifiCredentialsRejectedError,
    type SubStep,
    type SubStepStatus,
    type WifiCredentialsProvisioner,
} from "../types/hub-setup";
import { associateHub, revokeHubByDeviceId } from "../services/authService";

const PROV_SERVICE_UUID = "0000ab00-0000-1000-8000-00805f9b34fb";
const CHAR_SSID_UUID = "0000ab01-0000-1000-8000-00805f9b34fb";
const CHAR_PASSWORD_UUID = "0000ab02-0000-1000-8000-00805f9b34fb";
const CHAR_STATUS_UUID = "0000ab03-0000-1000-8000-00805f9b34fb";

const STATUS_WAITING = 0x00;
const STATUS_WIFI_OK = 0x01;
const STATUS_WIFI_NOK = 0x02;
const STATUS_CLAIM_OK = 0x03;
const STATUS_CLAIM_NOK = 0x04;
const PROVISIONING_TIMEOUT_MS = 45000;

function toBase64(value: string): string {
    return Buffer.from(value, "utf8").toString("base64");
}

function parseStatus(valueBase64: string | null): number | null {
    if (!valueBase64) return null;
    const raw = Buffer.from(valueBase64, "base64");
    if (raw.length === 0) return null;
    return raw[0] ?? null;
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
            if (
                device
                && (
                    device.name === "HarvestHub-Dev"
                    || device.localName === "HarvestHub-Dev"
                )
            ) {
                clearTimeout(timeout);
                manager.stopDeviceScan();
                resolve(device.id);
            }
        });
    });
}

async function connectToHub(manager: BleManager, deviceId: string): Promise<Device> {
    const device = await manager.connectToDevice(deviceId);
    const discovered = await device.discoverAllServicesAndCharacteristics();
    await validateProvisioningGatt(discovered);
    return discovered;
}

async function validateProvisioningGatt(device: Device): Promise<void> {
    const services = await device.services();
    const hasProvisioningService = services
        .some((service) => service.uuid.toLowerCase() === PROV_SERVICE_UUID);

    if (!hasProvisioningService) {
        throw new Error("Le hub détecté ne supporte pas le provisioning WiFi attendu.");
    }

    const characteristics = await device.characteristicsForService(PROV_SERVICE_UUID);
    const characteristicUuids = new Set(characteristics.map((c) => c.uuid.toLowerCase()));
    const required = [CHAR_SSID_UUID, CHAR_PASSWORD_UUID, CHAR_STATUS_UUID];
    const missing = required.filter((uuid) => !characteristicUuids.has(uuid));

    if (missing.length > 0) {
        throw new Error("Service provisioning incomplet sur le hub détecté.");
    }
}

async function ensureConnectedDevice(
    manager: BleManager,
    deviceRef: MutableRefObject<Device | null>,
    deviceIdRef: MutableRefObject<string | null>,
    hubName: string,
): Promise<Device> {
    const knownDeviceId = deviceRef.current?.id ?? deviceIdRef.current;
    if (!knownDeviceId) {
        throw new Error("Aucun hub Bluetooth connecté. Veuillez relancer l'étape Bluetooth.");
    }

    const connected = await manager.isDeviceConnected(knownDeviceId);
    if (connected) {
        const device = deviceRef.current ?? (await manager.devices([knownDeviceId]))[0] ?? null;
        if (!device) {
            throw new Error("Impossible de récupérer l'appareil Bluetooth connecté.");
        }
        const discovered = await device.discoverAllServicesAndCharacteristics();
        await validateProvisioningGatt(discovered);
        deviceRef.current = discovered;
        deviceIdRef.current = discovered.id;
        return discovered;
    }

    try {
        const reconnected = await manager.connectToDevice(knownDeviceId);
        const discovered = await reconnected.discoverAllServicesAndCharacteristics();
        await validateProvisioningGatt(discovered);
        deviceRef.current = discovered;
        deviceIdRef.current = discovered.id;
        return discovered;
    } catch {
        const rescannedDeviceId = await scanForHub(manager, hubName);
        const rescannedDevice = await connectToHub(manager, rescannedDeviceId);
        deviceRef.current = rescannedDevice;
        deviceIdRef.current = rescannedDevice.id;
        return rescannedDevice;
    }
}

async function waitForProvisioningStatus(
    device: Device,
    monitorRef: MutableRefObject<Subscription | null>,
    timeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
): Promise<void> {
    return new Promise((resolve, reject) => {
        let completed = false;

        const finish = (error?: Error) => {
            if (completed) return;
            completed = true;

            if (monitorRef.current) {
                monitorRef.current.remove();
                monitorRef.current = null;
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            if (error) {
                reject(error);
                return;
            }
            resolve();
        };

        timeoutRef.current = setTimeout(() => {
            finish(new Error("Le hub n'a pas confirmé le WiFi à temps. Réessayez."));
        }, PROVISIONING_TIMEOUT_MS);

        monitorRef.current = device.monitorCharacteristicForService(
            PROV_SERVICE_UUID,
            CHAR_STATUS_UUID,
            (bleError: BleError | null, characteristic) => {
                if (bleError) {
                    finish(new Error(bleError.message));
                    return;
                }

                const status = parseStatus(characteristic?.value ?? null);
                if (status === STATUS_WIFI_NOK) {
                    finish(new WifiCredentialsRejectedError());
                    return;
                }

                if (status === STATUS_CLAIM_OK) {
                    finish();
                    return;
                }

                if (status === STATUS_CLAIM_NOK) {
                    finish(new Error("Le hub n'a pas pu activer son accès serveur. Nouvelle tentative en cours."));
                    return;
                }

                if (status === STATUS_WAITING || status === STATUS_WIFI_OK) {
                    return;
                }

                if (status !== null) {
                    finish(new Error(`Statut de provisioning inconnu reçu (${status}).`));
                }
            },
        );

        void device
            .readCharacteristicForService(PROV_SERVICE_UUID, CHAR_STATUS_UUID)
            .then(() => {
                // Read best-effort seulement. On attend les notifications pour la décision finale
                // afin d'éviter de consommer un statut potentiellement ancien.
            })
            .catch(() => {
                // Certains périphériques n'autorisent pas toujours un read immédiat.
                // On continue à attendre la notification status.
            });
    });
}

function makeBtSteps(hubName: string): SubStep[] {
    return [
        { key: "api",        label: "Connexion au hub",        status: "pending" },
        { key: "permission", label: "Autorisation Bluetooth",  status: "pending" },
        { key: "scan",       label: "Recherche de l'appareil", status: "pending" },
        { key: "connect",    label: `Connexion à ${hubName}`,  status: "pending" },
    ];
}

export function useBluetoothSetup(
    hubName: string,
    hubUuid: string,
    hubSecret: string,
    onSuccess: () => void,
) {
    const bleManager = useRef(new BleManager()).current;
    const [btSteps, setBtSteps] = useState<SubStep[]>(() => makeBtSteps(hubName));
    const [btError, setBtError] = useState<string | null>(null);
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const provisionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const statusMonitorRef = useRef<Subscription | null>(null);
    const connectedDeviceRef = useRef<Device | null>(null);
    const connectedDeviceIdRef = useRef<string | null>(null);

    useEffect(() => () => {
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        if (provisionTimeoutRef.current) clearTimeout(provisionTimeoutRef.current);
        if (statusMonitorRef.current) {
            statusMonitorRef.current.remove();
            statusMonitorRef.current = null;
        }
        void bleManager.destroy();
    }, [bleManager]);

    const updateBt = (key: string, status: SubStepStatus) =>
        setBtSteps((prev) => prev.map((s) => (s.key === key ? { ...s, status } : s)));

    const runBluetoothFlow = async () => {
        setBtError(null);
        setBtSteps(makeBtSteps(hubName));
        let currentKey = "";
        let associationCreated = false;
        try {
            currentKey = "api";
            updateBt("api", "loading");
            await associateHub(hubUuid, hubSecret, hubName);
            associationCreated = true;
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
            const connectedDevice = await connectToHub(bleManager, deviceId);
            connectedDeviceRef.current = connectedDevice;
            connectedDeviceIdRef.current = connectedDevice.id;
            updateBt("connect", "done");

            successTimerRef.current = setTimeout(onSuccess, 700);
        } catch (e: unknown) {
            if (associationCreated) {
                try {
                    await revokeHubByDeviceId(hubUuid);
                } catch {
                    setBtError(
                        "La configuration Bluetooth a échoué et l'association du hub n'a pas pu être réinitialisée.",
                    );
                    return;
                }
            }
            if (currentKey) updateBt(currentKey, "error");
            setBtError((e as Error)?.message ?? "Une erreur est survenue.");
        }
    };

    const sendWifiCredentials: WifiCredentialsProvisioner = async (ssid, password) => {
        const trimmedSsid = ssid.trim();
        if (!trimmedSsid) {
            throw new Error("SSID invalide.");
        }

        if (statusMonitorRef.current) {
            statusMonitorRef.current.remove();
            statusMonitorRef.current = null;
        }
        if (provisionTimeoutRef.current) {
            clearTimeout(provisionTimeoutRef.current);
            provisionTimeoutRef.current = null;
        }

        const device = await ensureConnectedDevice(
            bleManager,
            connectedDeviceRef,
            connectedDeviceIdRef,
            hubName,
        );

        await device.writeCharacteristicWithResponseForService(
            PROV_SERVICE_UUID,
            CHAR_SSID_UUID,
            toBase64(trimmedSsid),
        );
        await device.writeCharacteristicWithResponseForService(
            PROV_SERVICE_UUID,
            CHAR_PASSWORD_UUID,
            toBase64(password),
        );

        await waitForProvisioningStatus(device, statusMonitorRef, provisionTimeoutRef);
    };

    const markSetupRolledBack = (message: string) => {
        setBtError(message);
        setBtSteps(makeBtSteps(hubName));
    };

    return { btSteps, btError, runBluetoothFlow, sendWifiCredentials, markSetupRolledBack };
}
