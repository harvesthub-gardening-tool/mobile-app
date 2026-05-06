import { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { PlacedPlant, PlacedSonde } from "../../types/garden";
import type { HubInfo } from "@harvesthub-gardening-tool/protos-typescript/auth/v2/auth_pb";
import { listHubs } from "../../services/authService";
import { listProbesForHubName, type ProbeSnapshot } from "../../services/gardenService";
import { colors, withAlpha } from "../../theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type SondeListModalProps = {
    visible: boolean;
    plants: PlacedPlant[];
    sondes: PlacedSonde[];
    onClose: () => void;
    onSelectProbe: (probe: { nodeId: string; hubId: string; hubName: string }) => void;
};

export function SondeListModal({
    visible,
    plants,
    sondes,
    onClose,
    onSelectProbe,
}: SondeListModalProps) {
    const [hubs, setHubs] = useState<HubInfo[]>([]);
    const [selectedHubId, setSelectedHubId] = useState<string | null>(null);
    const [availableProbes, setAvailableProbes] = useState<ProbeSnapshot[]>([]);
    const [loadingProbes, setLoadingProbes] = useState(false);
    const [probeError, setProbeError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) {
            return;
        }

        const loadHubs = async () => {
            setProbeError(null);
            try {
                const data = await listHubs();
                const availableHubs = data.filter((hub) => hub.id.length > 0 && hub.hubName.length > 0);
                setHubs(availableHubs);
                if (availableHubs.length > 0) {
                    setSelectedHubId(availableHubs[0].id);
                }
            } catch (err: unknown) {
                setProbeError(
                    err instanceof Error
                        ? err.message
                        : "Impossible de charger les hubs.",
                );
                setHubs([]);
                setSelectedHubId(null);
            }
        };

        void loadHubs();
    }, [visible]);

    useEffect(() => {
        const selectedHub = hubs.find((hub) => hub.id === selectedHubId);
        if (!visible || !selectedHub) {
            return;
        }
        void loadProbes(selectedHub.hubName);
    }, [visible, selectedHubId, hubs]);

    const selectedHub = hubs.find((hub) => hub.id === selectedHubId) ?? null;

    const loadProbes = async (hubName: string) => {
        setLoadingProbes(true);
        setProbeError(null);
        try {
            const probes = await listProbesForHubName(hubName);
            const uniqueByNode = new Map<string, ProbeSnapshot>();
            for (const probe of probes) {
                uniqueByNode.set(probe.nodeId, probe);
            }
            setAvailableProbes(Array.from(uniqueByNode.values()));
        } catch (err: unknown) {
            setProbeError(
                err instanceof Error
                    ? err.message
                    : "Impossible de charger les sondes disponibles.",
            );
            setAvailableProbes([]);
        } finally {
            setLoadingProbes(false);
        }
    };

    const handleSelectProbe = (nodeId: string) => {
        const existing = sondes.find((s) => s.nodeId === nodeId);
        if (existing) {
            return;
        }
        if (!selectedHub) {
            return;
        }
        onSelectProbe({ nodeId, hubId: selectedHub.id, hubName: selectedHub.hubName });
    };

    const sondeNodeIdBySondeId = new Map<string, string>(
        sondes.map((sonde) => [sonde.id, sonde.nodeId]),
    );

    const displayedProbeNodeIds = new Set(
        plants
            .map((plant) => {
                if (!plant.sondeId) {
                    return null;
                }
                const nodeIdFromSonde = sondeNodeIdBySondeId.get(plant.sondeId);
                if (nodeIdFromSonde) {
                    return nodeIdFromSonde;
                }
                const fallbackByNode = sondes.find((s) => s.nodeId === plant.sondeId);
                return fallbackByNode?.nodeId ?? null;
            })
            .filter((nodeId): nodeId is string => typeof nodeId === "string" && nodeId.length > 0),
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                style={{ flex: 1, justifyContent: "flex-end" }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Mes sondes</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={24} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        style={{ maxHeight: SCREEN_HEIGHT * 0.6 }}
                    >
                        <View style={styles.section}>
                            <View style={styles.probeHeaderRow}>
                                <Text style={styles.sectionTitle}>Sondes détectées</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (selectedHub) {
                                            void loadProbes(selectedHub.hubName);
                                        }
                                    }}
                                    disabled={!selectedHub}
                                >
                                    <Feather name="refresh-cw" size={16} color={colors.brand.secondary} />
                                </TouchableOpacity>
                            </View>

                            {hubs.length > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hubTabs}>
                                    {hubs.map((hub) => (
                                        <TouchableOpacity
                                            key={hub.id}
                                            style={[
                                                styles.hubTab,
                                                selectedHubId === hub.id && styles.hubTabActive,
                                            ]}
                                            onPress={() => setSelectedHubId(hub.id)}
                                        >
                                            <Text
                                                style={[
                                                    styles.hubTabText,
                                                    selectedHubId === hub.id && styles.hubTabTextActive,
                                                ]}
                                            >
                                                {hub.hubName}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            ) : null}

                            {loadingProbes ? (
                                <Text style={styles.probeHint}>Chargement des sondes...</Text>
                            ) : probeError ? (
                                <Text style={styles.probeError}>{probeError}</Text>
                            ) : availableProbes.length === 0 ? (
                                <Text style={styles.probeHint}>
                                    Aucune sonde trouvée. Lancez un rafraîchissement.
                                </Text>
                            ) : (
                                availableProbes.map((probe) => {
                                    const alreadyLinked = displayedProbeNodeIds.has(probe.nodeId);
                                    return (
                                        <TouchableOpacity
                                            key={probe.nodeId}
                                            style={styles.probeItem}
                                            onPress={() => handleSelectProbe(probe.nodeId)}
                                            disabled={alreadyLinked}
                                        >
                                            <View style={styles.probeItemLeft}>
                                                <Feather name="radio" size={16} color={colors.brand.secondary} />
                                                <View>
                                                    <Text style={styles.probeName}>Sonde disponible</Text>
                                                    <Text style={styles.probeMeta}>Hub: {selectedHub?.hubName ?? "-"}</Text>
                                                </View>
                                            </View>
                                            <Text
                                                style={[
                                                    styles.probeAction,
                                                    alreadyLinked && styles.probeActionDisabled,
                                                ]}
                                            >
                                                {alreadyLinked ? "Déjà ajoutée" : "Ajouter"}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modal: {
        backgroundColor: colors.surface.lowest,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.text.primary,
    },
    section: {
        marginBottom: 16,
    },
    probeHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    hubTabs: {
        marginBottom: 8,
    },
    hubTab: {
        borderRadius: 999,
        backgroundColor: colors.surface.low,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 8,
    },
    hubTabActive: {
        backgroundColor: colors.brand.secondary,
    },
    hubTabText: {
        fontSize: 12,
        color: colors.brand.secondary,
        fontWeight: "600",
    },
    hubTabTextActive: {
        color: colors.text.onPrimary,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: colors.text.muted,
        textTransform: "uppercase",
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    probeHint: {
        fontSize: 12,
        color: colors.text.muted,
    },
    probeError: {
        fontSize: 12,
        color: colors.state.danger,
    },
    probeItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: withAlpha(colors.border.subtle, 0.2),
    },
    probeItemLeft: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    probeName: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.text.primary,
    },
    probeMeta: {
        fontSize: 11,
        color: colors.text.secondary,
    },
    probeAction: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.brand.secondary,
    },
    probeActionDisabled: {
        color: colors.text.muted,
    },
});
