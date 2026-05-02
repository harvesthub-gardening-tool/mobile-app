import { useMemo } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useHubs } from "../hooks/useHubs";

function formatDate(ts: bigint): string {
    const date = new Date(Number(ts));
    if (Number.isNaN(date.getTime())) {
        return "Date inconnue";
    }
    return date.toLocaleDateString("fr-FR");
}

export default function HubsPage() {
    const router = useRouter();
    const { hubs, loading, error, refresh } = useHubs();

    const sortedHubs = useMemo(
        () => [...hubs].sort((a, b) => Number(b.createdAt - a.createdAt)),
        [hubs],
    );

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Feather name="chevron-left" size={20} color="#2B2B2B" />
                </TouchableOpacity>
                <Text style={styles.title}>Paramètres des hubs</Text>
                <View style={styles.backButtonPlaceholder} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#1565C0" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={() => void refresh()} />
                    }
                >
                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    {sortedHubs.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Feather name="cpu" size={20} color="#999" />
                            <Text style={styles.emptyTitle}>Aucun hub associé</Text>
                            <Text style={styles.emptyText}>
                                Associez un hub pour commencer à recevoir des données.
                            </Text>
                        </View>
                    ) : (
                        sortedHubs.map((hub) => (
                            <View key={hub.id} style={styles.hubCard}>
                                <View style={styles.hubTopRow}>
                                    <Text style={styles.hubName}>{hub.hubName}</Text>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            hub.revoked
                                                ? styles.statusRevoked
                                                : hub.claimed
                                                  ? styles.statusClaimed
                                                  : styles.statusPending,
                                        ]}
                                    >
                                        <Text style={styles.statusText}>
                                            {hub.revoked
                                                ? "Révoqué"
                                                : hub.claimed
                                                  ? "Actif"
                                                  : "En attente"}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.hubMeta}>Device ID: {hub.deviceId}</Text>
                                <Text style={styles.hubMeta}>
                                    Ajouté le {formatDate(hub.createdAt)}
                                </Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F5F5F5" },
    header: {
        height: 72,
        paddingHorizontal: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    backButton: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
    },
    backButtonPlaceholder: {
        width: 34,
        height: 34,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1B1B1B",
    },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        paddingHorizontal: 18,
        paddingBottom: 24,
        gap: 12,
    },
    error: {
        color: "#D32F2F",
        fontSize: 13,
    },
    emptyCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        gap: 6,
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#2B2B2B",
    },
    emptyText: {
        fontSize: 12,
        color: "#666",
        textAlign: "center",
    },
    hubCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 14,
        gap: 6,
    },
    hubTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    hubName: {
        flex: 1,
        fontSize: 15,
        fontWeight: "700",
        color: "#2B2B2B",
    },
    statusBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    statusClaimed: {
        backgroundColor: "#E8F5E9",
    },
    statusPending: {
        backgroundColor: "#FFF8E1",
    },
    statusRevoked: {
        backgroundColor: "#FFEBEE",
    },
    statusText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#2B2B2B",
    },
    hubMeta: {
        fontSize: 12,
        color: "#666",
    },
});
