import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, withAlpha } from "../../theme/colors";

function SuccessRow({
    icon,
    label,
    value,
    valueColor,
}: {
    icon: React.ComponentProps<typeof Feather>["name"];
    label: string;
    value: string;
    valueColor?: string;
}) {
    return (
        <View style={styles.row}>
            <View style={styles.rowIcon}>
                <Feather name={icon} size={14} color={colors.brand.accent} />
            </View>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
        </View>
    );
}

export function SuccessStep({
    hubName,
    wifiSsid,
    pulseAnim,
    onDismiss,
}: {
    hubName: string;
    wifiSsid: string;
    pulseAnim: Animated.Value;
    onDismiss: () => void;
}) {
    return (
        <View style={styles.root}>
            <View>
                <Animated.View style={[styles.circle, { transform: [{ scale: pulseAnim }] }]}>
                    <Feather name="check" size={52} color={colors.text.onPrimary} />
                </Animated.View>
                <Text style={styles.title}>Connexion réussie !</Text>
                <Text style={styles.subtitle}>Votre hub est maintenant connecté et prêt à l'emploi.</Text>
                <View style={styles.details}>
                    <SuccessRow icon="radio" label="Hub" value={hubName} />
                    <SuccessRow icon="wifi" label="Réseau" value={wifiSsid || "—"} />
                    <SuccessRow icon="activity" label="Statut" value="Actif" valueColor={colors.state.success} />
                </View>
            </View>
            <TouchableOpacity style={styles.btn} onPress={onDismiss}>
                <Text style={styles.btnText}>Voir mon jardin</Text>
                <Feather name="home" size={18} color={colors.text.onPrimary} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, justifyContent: "space-between" },
    circle: {
        alignSelf: "center",
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: colors.brand.accent,
        justifyContent: "center", alignItems: "center",
        marginBottom: 20,
        shadowColor: colors.brand.accent, shadowOpacity: 0.45, shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    title: { fontSize: 22, fontWeight: "700", color: colors.text.primary, textAlign: "center", marginBottom: 8 },
    subtitle: { fontSize: 14, color: colors.text.muted, textAlign: "center", lineHeight: 20, marginBottom: 16 },
    details: { backgroundColor: colors.surface.low, borderRadius: 14, paddingHorizontal: 16, overflow: "hidden" },
    row: {
        flexDirection: "row", alignItems: "center", gap: 10,
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.surface.base,
    },
    rowIcon: {
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: withAlpha(colors.brand.accent, 0.12),
        justifyContent: "center", alignItems: "center",
    },
    rowLabel: { flex: 1, fontSize: 13, color: colors.text.muted, fontWeight: "600" },
    rowValue: { fontSize: 13, fontWeight: "700", color: colors.text.primary },
    btn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, backgroundColor: colors.brand.accent, borderRadius: 999, paddingVertical: 15,
    },
    btnText: { fontSize: 16, fontWeight: "700", color: colors.text.onPrimary },
});
