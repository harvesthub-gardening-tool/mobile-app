import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, withAlpha } from "../../theme/colors";

export function IntroStep({ hubName, onNext }: { hubName: string; onNext: () => void }) {
    return (
        <View style={styles.root}>
            <View>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="access-point" size={48} color={colors.brand.accent} />
                </View>
                <Text style={styles.title}>Connectons votre hub</Text>
                <Text style={styles.subtitle}>
                    Votre hub HarvestHub a bien été détecté. Suivez les étapes pour finaliser la connexion.
                </Text>
                <View style={styles.hubTag}>
                    <Feather name="radio" size={16} color={colors.brand.info} />
                    <Text style={styles.hubTagText}>{hubName}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.btn} onPress={onNext}>
                <Text style={styles.btnText}>Suivant</Text>
                <Feather name="arrow-right" size={18} color={colors.text.onPrimary} />
            </TouchableOpacity>
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
    hubTag: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, backgroundColor: colors.state.infoSoft, borderRadius: 12,
        paddingVertical: 10, paddingHorizontal: 16,
    },
    hubTagText: { fontSize: 14, fontWeight: "700", color: colors.brand.info },
    btn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, backgroundColor: colors.brand.accent, borderRadius: 999, paddingVertical: 15,
    },
    btnText: { fontSize: 16, fontWeight: "700", color: colors.text.onPrimary },
});
