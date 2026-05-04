import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import type { SetupProbe } from "../../types/hub-setup";
import { colors, withAlpha } from "../../theme/colors";

type ProbeDiscoveryStepProps = {
    probes: SetupProbe[];
    scanning: boolean;
    onNext: () => void;
};

export function ProbeDiscoveryStep({
    probes,
    scanning,
    onNext,
}: ProbeDiscoveryStepProps) {
    return (
        <View style={styles.root}>
            <View>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="sprout" size={46} color={colors.brand.accent} />
                </View>
                <Text style={styles.title}>Recherche des sondes…</Text>
                <Text style={styles.subtitle}>
                    Le hub scanne les sondes en mode installation et les rattache à votre jardin.
                </Text>

                <View style={styles.panel}>
                    {scanning ? (
                        <View style={styles.scanningRow}>
                            <ActivityIndicator color={colors.brand.accent} />
                            <Text style={styles.hint}>Scan Bluetooth en cours…</Text>
                        </View>
                    ) : probes.length === 0 ? (
                        <View style={styles.emptyRow}>
                            <Feather name="info" size={16} color={colors.text.muted} />
                            <Text style={styles.hint}>Aucune sonde en mode installation détectée.</Text>
                        </View>
                    ) : (
                        probes.map((probe) => (
                            <View key={probe.nodeId} style={styles.probeRow}>
                                <View style={styles.probeIcon}>
                                    <Feather name="radio" size={14} color={colors.brand.accent} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.probeName}>{probe.name}</Text>
                                    <Text style={styles.probeMeta} numberOfLines={1}>
                                        {probe.nodeId} · v{probe.version}
                                    </Text>
                                </View>
                                <Feather name="check-circle" size={18} color={colors.state.success} />
                            </View>
                        ))
                    )}
                </View>
            </View>

            <TouchableOpacity style={[styles.btn, scanning && styles.btnDisabled]} onPress={onNext} disabled={scanning}>
                <Text style={styles.btnText}>{probes.length > 0 ? "Continuer" : "Terminer sans sonde"}</Text>
                <Feather name="arrow-right" size={18} color={colors.text.onPrimary} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, justifyContent: "space-between" },
    iconCircle: {
        alignSelf: "center",
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: withAlpha(colors.brand.accent, 0.12),
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },
    title: { fontSize: 22, fontWeight: "700", color: colors.text.primary, textAlign: "center", marginBottom: 8 },
    subtitle: { fontSize: 14, color: colors.text.muted, textAlign: "center", lineHeight: 20, marginBottom: 16 },
    panel: { backgroundColor: colors.surface.low, borderRadius: 14, padding: 12, gap: 8 },
    scanningRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
    emptyRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
    hint: { flex: 1, fontSize: 13, color: colors.text.muted, lineHeight: 18 },
    probeRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
    probeIcon: {
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: withAlpha(colors.brand.accent, 0.12),
        justifyContent: "center",
        alignItems: "center",
    },
    probeName: { fontSize: 14, fontWeight: "700", color: colors.text.primary },
    probeMeta: { marginTop: 2, fontSize: 12, color: colors.text.muted },
    btn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: colors.brand.accent,
        borderRadius: 999,
        paddingVertical: 15,
    },
    btnDisabled: { opacity: 0.45 },
    btnText: { fontSize: 16, fontWeight: "700", color: colors.text.onPrimary },
});
