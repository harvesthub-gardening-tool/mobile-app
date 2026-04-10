import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Chat() {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chat</Text>
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
    safe: { flex: 1, backgroundColor: "#F5F5F5" },
    header: {
        height: 180,
        backgroundColor: "#63FFA4",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: { fontSize: 26, fontWeight: "700" },
    cardWrapper: { flex: 1, marginTop: -40, paddingHorizontal: 20 },
    card: { backgroundColor: "#FFF", borderRadius: 24, padding: 20 },
});
