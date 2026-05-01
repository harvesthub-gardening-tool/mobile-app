import {
    View, Text, TouchableOpacity, TextInput, ScrollView,
    ActivityIndicator, Platform, StyleSheet,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import type { WifiNetwork } from "../../types/hub-setup";

function getSignalBars(level: number): 1 | 2 | 3 | 4 {
    if (level >= -50) return 4;
    if (level >= -60) return 3;
    if (level >= -70) return 2;
    return 1;
}

function isSecured(capabilities: string): boolean {
    return capabilities.includes("WPA") || capabilities.includes("WEP");
}

function wifiIcon(bars: number): string {
    return (
        ({
            4: "wifi-strength-4",
            3: "wifi-strength-3",
            2: "wifi-strength-2",
            1: "wifi-strength-1",
        } as Record<number, string>)[bars] ?? "wifi-strength-1"
    );
}

function WifiNetworkRow({
    network,
    selected,
    onSelect,
}: {
    network: WifiNetwork;
    selected: boolean;
    onSelect: () => void;
}) {
    const bars = getSignalBars(network.level);
    const secured = isSecured(network.capabilities);
    return (
        <TouchableOpacity
            style={[styles.networkRow, selected && styles.networkRowSelected]}
            onPress={onSelect}
        >
            <MaterialCommunityIcons
                name={wifiIcon(bars) as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                size={22}
                color={selected ? "#63FFA4" : "#888"}
            />
            <Text style={[styles.networkName, selected && { color: "#1B1B1B" }]} numberOfLines={1}>
                {network.SSID}
            </Text>
            {secured && <Feather name="lock" size={14} color={selected ? "#63FFA4" : "#CCC"} />}
            {selected && <Feather name="check-circle" size={18} color="#63FFA4" />}
        </TouchableOpacity>
    );
}

export type WifiStepProps = {
    wifiNetworks: WifiNetwork[];
    isScanningWifi: boolean;
    selectedSsid: string | null;
    setSelectedSsid: (ssid: string | null) => void;
    manualSsid: string;
    setManualSsid: (v: string) => void;
    wifiPassword: string;
    setWifiPassword: (v: string) => void;
    showPassword: boolean;
    setShowPassword: (value: boolean | ((prev: boolean) => boolean)) => void;
    isConnectingWifi: boolean;
    wifiError: string | null;
    setWifiError: (v: string | null) => void;
    handleConnectWifi: () => void;
};

export function WifiStep({
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
    handleConnectWifi,
}: WifiStepProps) {
    const activeSsid = Platform.OS === "ios" ? manualSsid.trim() : selectedSsid;

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>Connexion WiFi</Text>
                <Text style={[styles.subtitle, { marginBottom: 12 }]}>
                    {Platform.OS === "android"
                        ? "Sélectionnez le réseau WiFi de votre hub."
                        : "Entrez le nom et le mot de passe du réseau WiFi."}
                </Text>

                {Platform.OS === "android" && (
                    <View style={{ flex: 1 }}>
                        {isScanningWifi ? (
                            <View style={styles.scanningWrap}>
                                <ActivityIndicator color="#63FFA4" />
                                <Text style={styles.scanningText}>Scan des réseaux…</Text>
                            </View>
                        ) : (
                            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                                {wifiNetworks.map((n) => (
                                    <WifiNetworkRow
                                        key={n.SSID}
                                        network={n}
                                        selected={selectedSsid === n.SSID}
                                        onSelect={() => {
                                            setSelectedSsid(n.SSID);
                                            setWifiPassword("");
                                            setWifiError(null);
                                        }}
                                    />
                                ))}
                                {wifiNetworks.length === 0 && (
                                    <Text style={styles.emptyWifi}>Aucun réseau détecté.</Text>
                                )}
                            </ScrollView>
                        )}
                    </View>
                )}

                {Platform.OS === "ios" && (
                    <View>
                        <Text style={styles.inputLabel}>Nom du réseau (SSID)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="ex : Freebox-ABCD"
                            placeholderTextColor="#BBB"
                            value={manualSsid}
                            onChangeText={setManualSsid}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                )}

                {activeSsid ? (
                    <View style={{ marginTop: 14 }}>
                        <Text style={styles.inputLabel}>Mot de passe</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Mot de passe WiFi"
                                placeholderTextColor="#BBB"
                                value={wifiPassword}
                                onChangeText={(t) => { setWifiPassword(t); setWifiError(null); }}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#999" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}
            </View>

            <View style={{ gap: 10 }}>
                {wifiError && (
                    <View style={styles.errorBox}>
                        <Feather name="alert-circle" size={16} color="#FF4444" />
                        <Text style={styles.errorText}>{wifiError}</Text>
                    </View>
                )}
                <TouchableOpacity
                    style={[styles.btn, (!activeSsid || isConnectingWifi) && styles.btnDisabled]}
                    onPress={handleConnectWifi}
                    disabled={!activeSsid || isConnectingWifi}
                >
                    {isConnectingWifi ? (
                        <>
                            <ActivityIndicator size="small" color="#1B1B1B" />
                            <Text style={styles.btnText}>Connexion…</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.btnText}>Se connecter</Text>
                            <Feather name="wifi" size={18} color="#1B1B1B" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 22, fontWeight: "700", color: "#1B1B1B", textAlign: "center", marginBottom: 8 },
    subtitle: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20 },
    scanningWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
    scanningText: { fontSize: 14, color: "#999" },
    networkRow: {
        flexDirection: "row", alignItems: "center", gap: 10,
        paddingVertical: 12, paddingHorizontal: 12,
        borderRadius: 12, marginBottom: 4, backgroundColor: "#F8F8F8",
    },
    networkRowSelected: { backgroundColor: "#F0FFF7", borderWidth: 1.5, borderColor: "#63FFA4" },
    networkName: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1B1B1B" },
    emptyWifi: { textAlign: "center", color: "#BBB", marginTop: 24, fontSize: 14 },
    inputLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
    input: {
        borderWidth: 1, borderColor: "#DADADA", borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: "#1B1B1B", backgroundColor: "#FAFAFA",
    },
    passwordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    eyeBtn: {
        width: 44, height: 46, borderWidth: 1, borderColor: "#DADADA",
        borderRadius: 10, justifyContent: "center", alignItems: "center",
        backgroundColor: "#FAFAFA",
    },
    btn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, backgroundColor: "#63FFA4", borderRadius: 999, paddingVertical: 15,
    },
    btnDisabled: { opacity: 0.45 },
    btnText: { fontSize: 16, fontWeight: "700", color: "#1B1B1B" },
    errorBox: {
        flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: "#FFEBEE", borderRadius: 10, padding: 12,
    },
    errorText: { flex: 1, fontSize: 13, color: "#FF4444" },
});
