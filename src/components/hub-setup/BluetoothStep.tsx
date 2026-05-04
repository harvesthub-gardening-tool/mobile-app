import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import type { SubStep, SubStepStatus } from "../../types/hub-setup";
import { colors, withAlpha } from "../../theme/colors";

const STATUS_MAP: Record<SubStepStatus, { icon: React.ComponentProps<typeof Feather>["name"]; color: string; bg: string }> = {
    done:    { icon: "check",  color: colors.state.success, bg: colors.state.successSoft },
    error:   { icon: "x",     color: colors.state.danger,  bg: colors.state.dangerSoft },
    loading: { icon: "circle", color: colors.brand.info,   bg: colors.state.infoSoft },
    pending: { icon: "circle", color: colors.text.subtle,  bg: colors.surface.low },
};

function BtSubStepRow({ substep }: { substep: SubStep }) {
    const { icon, color, bg } = STATUS_MAP[substep.status];
    return (
        <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: bg }]}>
                <Feather name={icon} size={14} color={color} />
            </View>
            <Text style={[styles.rowLabel, { color }]}>{substep.label}</Text>
            {substep.status === "loading" && <ActivityIndicator size="small" color={colors.brand.info} />}
        </View>
    );
}

export function BluetoothStep({
    btSteps,
    btError,
    onRetry,
    onSkip,
}: {
    btSteps: SubStep[];
    btError: string | null;
    onRetry: () => void;
    onSkip: () => void;
}) {
    return (
        <View style={styles.root}>
            <View>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="bluetooth-connect" size={48} color={colors.brand.accent} />
                </View>
                <Text style={styles.title}>Connexion en cours…</Text>
                <Text style={styles.subtitle}>Restez à proximité de votre hub.</Text>
                <View style={styles.list}>
                    {btSteps.map((s) => <BtSubStepRow key={s.key} substep={s} />)}
                </View>
                {btError && (
                    <View style={[styles.errorBox, { marginTop: 16 }]}>
                        <Feather name="alert-circle" size={16} color={colors.state.danger} />
                        <Text style={styles.errorText}>{btError}</Text>
                    </View>
                )}
            </View>
            <View style={{ gap: 10 }}>
                {btError && (
                    <TouchableOpacity style={styles.btn} onPress={onRetry}>
                        <Text style={styles.btnText}>Réessayer</Text>
                        <Feather name="refresh-cw" size={18} color={colors.text.onPrimary} />
                    </TouchableOpacity>
                )}
                {__DEV__ && (
                    <TouchableOpacity style={styles.devBtn} onPress={onSkip}>
                        <Feather name="skip-forward" size={14} color={colors.text.subtle} />
                        <Text style={styles.devBtnText}>Passer (dev)</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, justifyContent: "space-between" },
    iconCircle: {
        alignSelf: "center",
        width: 84, height: 84, borderRadius: 42,
        backgroundColor: withAlpha(colors.brand.accent, 0.12),
        justifyContent: "center", alignItems: "center",
        marginBottom: 14,
    },
    title: { fontSize: 22, fontWeight: "700", color: colors.text.primary, textAlign: "center", marginBottom: 8 },
    subtitle: { fontSize: 14, color: colors.text.muted, textAlign: "center", lineHeight: 20, marginBottom: 16 },
    list: { gap: 4, marginTop: 8 },
    row: {
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.surface.low,
    },
    rowIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
    rowLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
    btn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, backgroundColor: colors.brand.accent, borderRadius: 999, paddingVertical: 15,
    },
    btnText: { fontSize: 16, fontWeight: "700", color: colors.text.onPrimary },
    devBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 6, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.border.subtle,
    },
    devBtnText: { fontSize: 13, color: colors.text.subtle },
    errorBox: {
        flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: colors.state.dangerSoft, borderRadius: 10, padding: 12,
    },
    errorText: { flex: 1, fontSize: 13, color: colors.state.danger },
});
