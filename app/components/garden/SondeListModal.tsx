import { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Modal,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { MAX_SONDES } from "../../constants/garden";
import type { PlacedSonde, PlacedPlant } from "../../types/garden";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type SondeListModalProps = {
    visible: boolean;
    sondes: PlacedSonde[];
    plants: PlacedPlant[];
    onClose: () => void;
    onAddSonde: () => void;
    onRemoveSonde: (id: string) => void;
    onUpdateSonde: (id: string, updates: Partial<Pick<PlacedSonde, "nodeId">>) => void;
};

export function SondeListModal({
    visible,
    sondes,
    plants,
    onClose,
    onAddSonde,
    onRemoveSonde,
    onUpdateSonde,
}: SondeListModalProps) {
    const [editingNodeId, setEditingNodeId] = useState<Record<string, string>>({});

    const handleNodeIdChange = (sondeId: string, value: string) => {
        setEditingNodeId((prev) => ({ ...prev, [sondeId]: value }));
    };

    const handleNodeIdSave = (sondeId: string) => {
        const value = editingNodeId[sondeId]?.trim();
        if (value !== undefined) onUpdateSonde(sondeId, { nodeId: value || undefined });
    };

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
                        {sondes.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Ajoutées</Text>
                                {sondes.map((s) => {
                                    const nodeVal = editingNodeId[s.id] ?? s.nodeId ?? "";
                                    const linkedCount = plants.filter((p) => p.sondeId === s.id).length;
                                    return (
                                        <View key={s.id} style={styles.listItem}>
                                            <View style={styles.listIcon}>
                                                <Feather name="radio" size={22} color="#1565C0" />
                                            </View>
                                            <View style={styles.listContent}>
                                                <Text style={styles.listName}>{s.name}</Text>
                                                <Text style={styles.listSub}>
                                                    {linkedCount} plante{linkedCount !== 1 ? "s" : ""} liée{linkedCount !== 1 ? "s" : ""}
                                                </Text>
                                                <View style={styles.nodeRow}>
                                                    <TextInput
                                                        style={styles.nodeInput}
                                                        placeholder="Node ID (ex: node-abc123)"
                                                        placeholderTextColor="#CCC"
                                                        value={nodeVal}
                                                        onChangeText={(v) => handleNodeIdChange(s.id, v)}
                                                        onBlur={() => handleNodeIdSave(s.id)}
                                                        autoCapitalize="none"
                                                        returnKeyType="done"
                                                        onSubmitEditing={() => handleNodeIdSave(s.id)}
                                                    />
                                                    {nodeVal.length > 0 && (
                                                        <View style={styles.nodeLinked}>
                                                            <Feather name="check-circle" size={14} color="#2E7D32" />
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                            <TouchableOpacity onPress={() => onRemoveSonde(s.id)}>
                                                <Feather name="trash-2" size={18} color="#FF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {sondes.length < MAX_SONDES ? (
                            <TouchableOpacity style={styles.addBtn} onPress={onAddSonde}>
                                <Feather name="plus-circle" size={20} color="#1565C0" />
                                <Text style={styles.addBtnText}>Ajouter une sonde</Text>
                                <Text style={styles.addBtnSub}>{sondes.length}/{MAX_SONDES}</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.limitText}>
                                Maximum atteint ({MAX_SONDES} sondes)
                            </Text>
                        )}
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
    sectionTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#999",
        textTransform: "uppercase",
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    listItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    listIcon: {
        width: 44,
        height: 44,
        backgroundColor: "#E3F2FD",
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        flex: 1,
    },
    listName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1B1B1B",
    },
    listSub: {
        fontSize: 11,
        color: "#999",
        marginTop: 2,
    },
    nodeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 6,
    },
    nodeInput: {
        flex: 1,
        height: 32,
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 8,
        paddingHorizontal: 10,
        fontSize: 12,
        color: "#1B1B1B",
        backgroundColor: "#FAFAFA",
    },
    nodeLinked: {
        padding: 4,
    },
    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
    },
    addBtnText: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        color: "#1565C0",
    },
    addBtnSub: {
        fontSize: 12,
        color: "#999",
    },
    limitText: {
        fontSize: 13,
        color: "#999",
        textAlign: "center",
        paddingVertical: 16,
    },
});
