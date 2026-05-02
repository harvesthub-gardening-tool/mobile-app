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
import type { PlacedSonde } from "../../types/garden";
import { listHubs } from "../../services/authService";
import { listProbesForHubName, type ProbeSnapshot } from "../../services/gardenService";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type SondeListModalProps = {
    visible: boolean;
    sondes: PlacedSonde[];
    onClose: () => void;
    onSelectProbe: (probe: { nodeId: string; hubName: string }) => void;
};

export function SondeListModal({
    visible,
    sondes,
    onClose,
    onSelectProbe,
}: SondeListModalProps) {
    const [hubs, setHubs] = useState<string[]>([]);
    const [selectedHubName, setSelectedHubName] = useState<string | null>(null);
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
                const names = data
                    .map((hub) => hub.hubName)
                    .filter((name) => name.length > 0);
                setHubs(names);
                if (names.length > 0) {
                    setSelectedHubName(names[0]);
                }
            } catch (err: unknown) {
                setProbeError(
                    err instanceof Error
                        ? err.message
                        : "Impossible de charger les hubs.",
                );
                setHubs([]);
                setSelectedHubName(null);
            }
        };

        void loadHubs();
    }, [visible]);

    useEffect(() => {
        if (!visible || !selectedHubName) {
            return;
        }
        void loadProbes(selectedHubName);
    }, [visible, selectedHubName]);

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
        onSelectProbe({ nodeId, hubName: selectedHubName ?? "Hub" });
    };

    const linkedNodeIds = new Set(
        sondes
            .map((s) => s.nodeId)
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
                            <Feather name="x" size={24} color="#2B2B2B" />
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
                                        if (selectedHubName) {
                                            void loadProbes(selectedHubName);
                                        }
                                    }}
                                    disabled={!selectedHubName}
                                >
                                    <Feather name="refresh-cw" size={16} color="#1565C0" />
                                </TouchableOpacity>
                            </View>

                            {hubs.length > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hubTabs}>
                                    {hubs.map((hubName) => (
                                        <TouchableOpacity
                                            key={hubName}
                                            style={[
                                                styles.hubTab,
                                                selectedHubName === hubName && styles.hubTabActive,
                                            ]}
                                            onPress={() => setSelectedHubName(hubName)}
                                        >
                                            <Text
                                                style={[
                                                    styles.hubTabText,
                                                    selectedHubName === hubName && styles.hubTabTextActive,
                                                ]}
                                            >
                                                {hubName}
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
                                    const alreadyLinked = linkedNodeIds.has(probe.nodeId);
                                    return (
                                        <TouchableOpacity
                                            key={probe.nodeId}
                                            style={styles.probeItem}
                                            onPress={() => handleSelectProbe(probe.nodeId)}
                                            disabled={alreadyLinked}
                                        >
                                            <View style={styles.probeItemLeft}>
                                                <Feather name="radio" size={16} color="#1565C0" />
                                                <View>
                                                    <Text style={styles.probeName}>Sonde disponible</Text>
                                                    <Text style={styles.probeMeta}>Hub: {selectedHubName ?? "-"}</Text>
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
        backgroundColor: "#FFF",
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
        color: "#1B1B1B",
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
        backgroundColor: "#EEF2F7",
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 8,
    },
    hubTabActive: {
        backgroundColor: "#1565C0",
    },
    hubTabText: {
        fontSize: 12,
        color: "#1565C0",
        fontWeight: "600",
    },
    hubTabTextActive: {
        color: "#FFF",
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#999",
        textTransform: "uppercase",
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    probeHint: {
        fontSize: 12,
        color: "#999",
    },
    probeError: {
        fontSize: 12,
        color: "#D32F2F",
    },
    probeItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    probeItemLeft: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    probeName: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1B1B1B",
    },
    probeMeta: {
        fontSize: 11,
        color: "#777",
    },
    probeAction: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1565C0",
    },
    probeActionDisabled: {
        color: "#999",
    },
});
