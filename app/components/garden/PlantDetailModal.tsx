import { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Modal,
    StyleSheet,
    Dimensions,
    FlatList,
    ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { PlacedPlant, PlacedSonde, PlantType } from "../../types/garden";
import { DEFAULT_CELL, MIN_CARD_SIZE, PLANT_CATALOG } from "../../constants/garden";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type PlantDetailModalProps = {
    plant: PlacedPlant | null;
    sondes: PlacedSonde[];
    onClose: () => void;
    onSave: (id: string, plantType: PlantType, width: number, height: number, quantity: number) => void;
    onDelete: (id: string) => void;
    onLinkSonde: (plantId: string, sondeId: string | null) => void;
};

function getCategoryLabel(category: string): string {
    if (category === "fruit") return "Fruit";
    if (category === "legume") return "Légume";
    return "Herbe aromatique";
}

export function PlantDetailModal({
    plant,
    sondes,
    onClose,
    onSave,
    onDelete,
    onLinkSonde,
}: PlantDetailModalProps) {
    const [editing, setEditing] = useState(false);
    const [selectedPlantType, setSelectedPlantType] = useState<PlantType | null>(null);
    const [search, setSearch] = useState("");
    const [editQuantity, setEditQuantity] = useState("");
    const [editWidth, setEditWidth] = useState("");
    const [editHeight, setEditHeight] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (plant) {
            setSelectedPlantType(plant.plantType);
            setEditQuantity(String(plant.quantity));
            setEditWidth(String(Math.round(plant.width)));
            setEditHeight(String(Math.round(plant.height)));
            setError("");
            setSearch("");
            setEditing(false);
        }
    }, [plant?.id]);

    if (!plant) return null;

    const currentType = selectedPlantType ?? plant.plantType;

    const filteredCatalog = search.trim()
        ? PLANT_CATALOG.filter((p) =>
              p.name.toLowerCase().includes(search.trim().toLowerCase())
          )
        : PLANT_CATALOG;

    const handleSave = () => {
        const q = parseInt(editQuantity) || 1;
        const w = parseInt(editWidth) || DEFAULT_CELL;
        const h = parseInt(editHeight) || DEFAULT_CELL;
        if (q < 1) { setError("Minimum 1 par carré !"); return; }
        if (q > 20) { setError("Maximum 20 par carré !"); return; }
        onSave(
            plant.id,
            currentType,
            Math.max(MIN_CARD_SIZE, Math.min(w, 400)),
            Math.max(MIN_CARD_SIZE, Math.min(h, 400)),
            q,
        );
        onClose();
    };

    return (
        <Modal visible animationType="fade" transparent>
            {/* Tap outside → ferme */}
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                {/* onStartShouldSetResponder stoppe la propagation vers l'overlay */}
                <View style={styles.modal} onStartShouldSetResponder={() => true}>

                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.emoji}>{currentType.emoji}</Text>
                        <Text style={styles.name}>{currentType.name}</Text>
                        <Text style={styles.category}>
                            {getCategoryLabel(currentType.category)}
                        </Text>
                    </View>

                    {editing ? (
                        /* ── MODE ÉDITION ── */
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            style={styles.editScroll}
                            contentContainerStyle={{ paddingBottom: 260 }}
                        >
                            {/* Recherche de plante */}
                            <Text style={styles.sectionLabel}>Changer la plante</Text>
                            <View style={styles.searchBar}>
                                <Feather name="search" size={14} color="#999" />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Rechercher une plante..."
                                    placeholderTextColor="#BBB"
                                    value={search}
                                    onChangeText={setSearch}
                                />
                                {search.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearch("")}>
                                        <Feather name="x" size={14} color="#999" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <FlatList
                                data={filteredCatalog}
                                keyExtractor={(item) => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.plantList}
                                keyboardShouldPersistTaps="handled"
                                ListEmptyComponent={
                                    <Text style={styles.noResult}>Aucun résultat</Text>
                                }
                                renderItem={({ item }) => {
                                    const isSelected = currentType.id === item.id;
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.plantItem,
                                                isSelected && styles.plantItemSelected,
                                            ]}
                                            onPress={() => setSelectedPlantType(item)}
                                        >
                                            <Text style={styles.plantEmoji}>{item.emoji}</Text>
                                            <Text
                                                style={[
                                                    styles.plantName,
                                                    isSelected && styles.plantNameSelected,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {item.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                }}
                            />

                            {/* Champs */}
                            <View style={styles.editRow}>
                                <View style={styles.editField}>
                                    <Text style={styles.fieldLabel}>Quantité (max 20)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editQuantity}
                                        onChangeText={(v) => { setEditQuantity(v); setError(""); }}
                                        keyboardType="numeric"
                                        placeholder="1"
                                    />
                                </View>
                            </View>
                            <View style={styles.editRow}>
                                <View style={styles.editField}>
                                    <Text style={styles.fieldLabel}>Largeur (px)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editWidth}
                                        onChangeText={setEditWidth}
                                        keyboardType="numeric"
                                        placeholder="140"
                                    />
                                </View>
                                <View style={styles.editField}>
                                    <Text style={styles.fieldLabel}>Hauteur (px)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editHeight}
                                        onChangeText={setEditHeight}
                                        keyboardType="numeric"
                                        placeholder="140"
                                    />
                                </View>
                            </View>

                            {error ? <Text style={styles.error}>{error}</Text> : null}

                            <View style={styles.btns}>
                                <TouchableOpacity
                                    style={styles.btnCancel}
                                    onPress={() => {
                                        setSelectedPlantType(plant.plantType);
                                        setSearch("");
                                        setEditing(false);
                                    }}
                                >
                                    <Text style={styles.btnCancelText}>Annuler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
                                    <Feather name="check" size={15} color="#FFF" />
                                    <Text style={styles.btnSaveText}>Enregistrer</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    ) : (
                        /* ── MODE DÉTAIL ── */
                        <>
                            <View style={styles.row}>
                                <Text style={styles.label}>Quantité</Text>
                                <Text style={styles.value}>{plant.quantity}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Ensoleillement</Text>
                                <Text style={[styles.value, { color: "#bbb" }]}>Pas de données</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Sonde</Text>
                                {(() => {
                                    const linked = sondes.find((s) => s.id === plant.sondeId);
                                    return linked ? (
                                        <View style={[styles.sondeLinkBtn, styles.sondeLinkBtnActive]}>
                                            <Feather name="check-circle" size={10} color="#FFF" />
                                            <Text style={[styles.sondeLinkText, styles.sondeLinkTextActive]}>{linked.name}</Text>
                                        </View>
                                    ) : (
                                        <Text style={[styles.value, { color: "#bbb" }]}>Aucune sonde</Text>
                                    );
                                })()}
                            </View>

                            <View style={styles.btns}>
                                <TouchableOpacity
                                    style={styles.btnEdit}
                                    onPress={() => setEditing(true)}
                                >
                                    <Feather name="edit-2" size={15} color="#2196F3" />
                                    <Text style={styles.btnEditText}>Modifier</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.btnDelete}
                                    onPress={() => onDelete(plant.id)}
                                >
                                    <Feather name="trash-2" size={15} color="#FF4444" />
                                    <Text style={styles.btnDeleteText}>Supprimer</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    modal: {
        backgroundColor: "#FFF",
        borderRadius: 24,
        width: SCREEN_WIDTH - 40,
        padding: 24,
        alignItems: "center",
        maxHeight: "85%",
    },
    modalHeader: {
        alignItems: "center",
        marginBottom: 16,
    },
    emoji: {
        fontSize: 56,
        marginBottom: 4,
    },
    name: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1B1B1B",
    },
    category: {
        fontSize: 13,
        color: "#999",
        marginTop: 2,
    },
    editScroll: {
        width: "100%",
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#999",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: "#1B1B1B",
        padding: 0,
    },
    plantList: {
        marginBottom: 16,
    },
    plantItem: {
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 12,
        marginRight: 6,
        backgroundColor: "#F5F5F5",
        width: 62,
    },
    plantItemSelected: {
        backgroundColor: "#E3F2FD",
        borderWidth: 2,
        borderColor: "#2196F3",
    },
    plantEmoji: {
        fontSize: 26,
    },
    plantName: {
        fontSize: 9,
        color: "#666",
        marginTop: 3,
        textAlign: "center",
    },
    plantNameSelected: {
        color: "#2196F3",
        fontWeight: "700",
    },
    noResult: {
        fontSize: 13,
        color: "#999",
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    label: {
        fontSize: 13,
        color: "#999",
    },
    value: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1B1B1B",
    },
    editRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
        width: "100%",
    },
    editField: {
        flex: 1,
    },
    fieldLabel: {
        fontSize: 12,
        color: "#999",
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 12,
        height: 46,
        paddingHorizontal: 14,
        fontSize: 16,
        color: "#1B1B1B",
    },
    error: {
        color: "#FF4444",
        fontSize: 13,
        marginBottom: 8,
        textAlign: "center",
    },
    btns: {
        flexDirection: "row",
        gap: 10,
        marginTop: 16,
        width: "100%",
        marginBottom: 4,
    },
    btnEdit: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#E3F2FD",
    },
    btnEditText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#2196F3",
    },
    btnDelete: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#FFEBEE",
    },
    btnDeleteText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#FF4444",
    },
    btnSave: {
        flex: 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#2E7D32",
    },
    btnSaveText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#FFF",
    },
    btnCancel: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        height: 44,
        borderRadius: 14,
        backgroundColor: "#F5F5F5",
    },
    btnCancelText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#666",
    },
    sondeLinkRow: {
        flexDirection: "row",
        gap: 6,
    },
    sondeLinkBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#E3F2FD",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    sondeLinkBtnActive: {
        backgroundColor: "#1565C0",
    },
    sondeLinkText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#1565C0",
    },
    sondeLinkTextActive: {
        color: "#FFF",
    },
});
