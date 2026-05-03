import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme";

export default function Alerts() {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Alert</Text>
            </View>

            <View style={styles.cardWrapper}>
                <View style={styles.card}>
                    <Text>Page en cours de dev</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface.base },
    header: {
        height: 180,
        backgroundColor: colors.brand.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: { fontSize: 26, fontWeight: "700", color: colors.text.onPrimary },
    cardWrapper: { flex: 1, marginTop: -40, paddingHorizontal: 20 },
    card: {
        backgroundColor: colors.surface.lowest,
        borderRadius: 24,
        padding: 20,
    },
});
