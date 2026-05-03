import {
    View, Text, TouchableOpacity, TextInput, ScrollView,
    ActivityIndicator, Platform, StyleSheet,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import type { WifiNetwork } from "../../types/hub-setup";
import { colors, withAlpha } from "../../theme/colors";

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
                color={selected ? colors.brand.accent : colors.text.subtle}
            />
            <Text style={[styles.networkName, selected && { color: colors.text.primary }]} numberOfLines={1}>
                {network.SSID}
            </Text>
            {secured && <Feather name="lock" size={14} color={selected ? colors.brand.accent : colors.text.subtle} />}
            {selected && <Feather name="check-circle" size={18} color={colors.brand.accent} />}
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
                                <ActivityIndicator color={colors.brand.accent} />
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
                            placeholderTextColor={colors.text.subtle}
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
                                placeholderTextColor={colors.text.subtle}
                                value={wifiPassword}
                                onChangeText={(t) => { setWifiPassword(t); setWifiError(null); }}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.text.subtle} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}
            </View>

            <View style={{ gap: 10 }}>
                {wifiError && (
                    <View style={styles.errorBox}>
                        <Feather name="alert-circle" size={16} color={colors.state.danger} />
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
                            <ActivityIndicator size="small" color={colors.text.onPrimary} />
                            <Text style={styles.btnText}>Connexion…</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.btnText}>Se connecter</Text>
                            <Feather name="wifi" size={18} color={colors.text.onPrimary} />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 22, fontWeight: "700", color: colors.text.primary, textAlign: "center", marginBottom: 8 },
    subtitle: { fontSize: 14, color: colors.text.muted, textAlign: "center", lineHeight: 20 },
    scanningWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
    scanningText: { fontSize: 14, color: colors.text.subtle },
    networkRow: {
        flexDirection: "row", alignItems: "center", gap: 10,
        paddingVertical: 12, paddingHorizontal: 12,
        borderRadius: 12, marginBottom: 4, backgroundColor: colors.surface.low,
    },
    networkRowSelected: { backgroundColor: withAlpha(colors.brand.accent, 0.12), borderWidth: 1.5, borderColor: colors.brand.accent },
    networkName: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.text.primary },
    emptyWifi: { textAlign: "center", color: colors.text.subtle, marginTop: 24, fontSize: 14 },
    inputLabel: { fontSize: 13, fontWeight: "600", color: colors.text.muted, marginBottom: 6 },
    input: {
        borderWidth: 1, borderColor: colors.border.subtle, borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: colors.text.primary, backgroundColor: colors.surface.lowest,
    },
    passwordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    eyeBtn: {
        width: 44, height: 46, borderWidth: 1, borderColor: colors.border.subtle,
        borderRadius: 10, justifyContent: "center", alignItems: "center",
        backgroundColor: colors.surface.lowest,
    },
    btn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, backgroundColor: colors.brand.accent, borderRadius: 999, paddingVertical: 15,
    },
    btnDisabled: { opacity: 0.45 },
    btnText: { fontSize: 16, fontWeight: "700", color: colors.text.onPrimary },
    errorBox: {
        flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: colors.state.dangerSoft, borderRadius: 10, padding: 12,
    },
    errorText: { flex: 1, fontSize: 13, color: colors.state.danger },
});
