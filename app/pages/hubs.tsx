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
import { colors, withAlpha } from "../theme";

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
                    <Feather name="chevron-left" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
                <Text style={styles.title}>Paramètres des hubs</Text>
                <View style={styles.backButtonPlaceholder} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.brand.secondary} />
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
                            <Feather name="cpu" size={20} color={colors.text.muted} />
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
    safe: { flex: 1, backgroundColor: colors.surface.base },
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
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface.lowest,
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.2),
    },
    backButtonPlaceholder: {
        width: 34,
        height: 34,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.text.primary,
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
        color: colors.state.danger,
        fontSize: 13,
    },
    emptyCard: {
        backgroundColor: colors.surface.lowest,
        borderRadius: 24,
        padding: 16,
        alignItems: "center",
        gap: 6,
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.text.secondary,
    },
    emptyText: {
        fontSize: 12,
        color: colors.text.secondary,
        textAlign: "center",
    },
    hubCard: {
        backgroundColor: colors.surface.lowest,
        borderRadius: 24,
        padding: 14,
        gap: 6,
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.18),
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
        color: colors.text.secondary,
    },
    statusBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    statusClaimed: {
        backgroundColor: colors.state.successSoft,
    },
    statusPending: {
        backgroundColor: colors.state.warningSoft,
    },
    statusRevoked: {
        backgroundColor: colors.state.dangerSoft,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "700",
        color: colors.text.secondary,
    },
    hubMeta: {
        fontSize: 12,
        color: colors.text.secondary,
    },
});
