import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

export function IntroStep({ hubName, onNext }: { hubName: string; onNext: () => void }) {
    return (
        <View style={styles.root}>
            <View>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="access-point" size={48} color="#63FFA4" />
                </View>
                <Text style={styles.title}>Connectons votre hub</Text>
                <Text style={styles.subtitle}>
                    Votre hub HarvestHub a bien été détecté. Suivez les étapes pour finaliser la connexion.
                </Text>
                <View style={styles.hubTag}>
                    <Feather name="radio" size={16} color="#1565C0" />
                    <Text style={styles.hubTagText}>{hubName}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.btn} onPress={onNext}>
                <Text style={styles.btnText}>Suivant</Text>
                <Feather name="arrow-right" size={18} color="#1B1B1B" />
            </TouchableOpacity>
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
    hubTag: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, backgroundColor: "#E3F2FD", borderRadius: 12,
        paddingVertical: 10, paddingHorizontal: 16,
    },
    hubTagText: { fontSize: 14, fontWeight: "700", color: "#1565C0" },
    btn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, backgroundColor: "#63FFA4", borderRadius: 999, paddingVertical: 15,
    },
    btnText: { fontSize: 16, fontWeight: "700", color: "#1B1B1B" },
});
