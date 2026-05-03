import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import type { SubStep, SubStepStatus } from "../../types/hub-setup";

const STATUS_MAP: Record<SubStepStatus, { icon: React.ComponentProps<typeof Feather>["name"]; color: string; bg: string }> = {
    done:    { icon: "check",  color: "#2E7D32", bg: "#E8F5E9" },
    error:   { icon: "x",     color: "#FF4444", bg: "#FFEBEE" },
    loading: { icon: "circle", color: "#1565C0", bg: "#E3F2FD" },
    pending: { icon: "circle", color: "#CCC",    bg: "#F5F5F5" },
};

function BtSubStepRow({ substep }: { substep: SubStep }) {
    const { icon, color, bg } = STATUS_MAP[substep.status];
    return (
        <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: bg }]}>
                <Feather name={icon} size={14} color={color} />
            </View>
            <Text style={[styles.rowLabel, { color }]}>{substep.label}</Text>
            {substep.status === "loading" && <ActivityIndicator size="small" color="#1565C0" />}
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
                    <MaterialCommunityIcons name="bluetooth-connect" size={48} color="#63FFA4" />
                </View>
                <Text style={styles.title}>Connexion en cours…</Text>
                <Text style={styles.subtitle}>Restez à proximité de votre hub.</Text>
                <View style={styles.list}>
                    {btSteps.map((s) => <BtSubStepRow key={s.key} substep={s} />)}
                </View>
                {btError && (
                    <View style={[styles.errorBox, { marginTop: 16 }]}>
                        <Feather name="alert-circle" size={16} color="#FF4444" />
                        <Text style={styles.errorText}>{btError}</Text>
                    </View>
                )}
            </View>
            <View style={{ gap: 10 }}>
                {btError && (
                    <TouchableOpacity style={styles.btn} onPress={onRetry}>
                        <Text style={styles.btnText}>Réessayer</Text>
                        <Feather name="refresh-cw" size={18} color="#1B1B1B" />
                    </TouchableOpacity>
                )}
                {__DEV__ && (
                    <TouchableOpacity style={styles.devBtn} onPress={onSkip}>
                        <Feather name="skip-forward" size={14} color="#999" />
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
        backgroundColor: "#F0FFF7",
        justifyContent: "center", alignItems: "center",
        marginBottom: 14,
    },
    title: { fontSize: 22, fontWeight: "700", color: "#1B1B1B", textAlign: "center", marginBottom: 8 },
    subtitle: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20, marginBottom: 16 },
    list: { gap: 4, marginTop: 8 },
    row: {
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F5F5",
    },
    rowIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
    rowLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
    btn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, backgroundColor: "#63FFA4", borderRadius: 999, paddingVertical: 15,
    },
    btnText: { fontSize: 16, fontWeight: "700", color: "#1B1B1B" },
    devBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 6, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: "#E0E0E0",
    },
    devBtnText: { fontSize: 13, color: "#999" },
    errorBox: {
        flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: "#FFEBEE", borderRadius: 10, padding: 12,
    },
    errorText: { flex: 1, fontSize: 13, color: "#FF4444" },
});
