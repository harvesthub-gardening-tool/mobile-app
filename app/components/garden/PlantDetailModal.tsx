import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { PlacedPlant, PlacedSonde } from "../../types/garden";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type PlantDetailModalProps = {
    plant: PlacedPlant | null;
    sondes: PlacedSonde[];
    onClose: () => void;
    onEdit: (plant: PlacedPlant) => void;
    onDelete: (id: string) => void;
    onLinkSonde: (plantId: string, sondeId: string | null) => void;
};

function getCategoryLabel(category: string): string {
    if (category === "fruit") return "Fruit";
    if (category === "legume") return "L\u00e9gume";
    return "Herbe aromatique";
}

export function PlantDetailModal({
    plant,
    sondes,
    onClose,
    onEdit,
    onDelete,
    onLinkSonde,
}: PlantDetailModalProps) {
    if (!plant) return null;

    const linkedSonde = plant.sondeId
        ? sondes.find((s) => s.id === plant.sondeId)
        : null;

    return (
        <Modal visible={plant !== null} animationType="fade" transparent>
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.modal}>
                    <Text style={styles.emoji}>{plant.plantType.emoji}</Text>
                    <Text style={styles.name}>{plant.plantType.name}</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Quantit\u00e9</Text>
                        <Text style={styles.value}>{plant.quantity}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Taille du carr\u00e9</Text>
                        <Text style={styles.value}>{plant.size}px</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Cat\u00e9gorie</Text>
                        <Text style={styles.value}>
                            {getCategoryLabel(plant.plantType.category)}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Sonde</Text>
                        {linkedSonde ? (
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onLinkSonde(plant.id, null);
                                }}
                            >
                                <Text
                                    style={[styles.value, { color: "#1565C0" }]}
                                >
                                    \ud83d\udce1 {linkedSonde.name} \u2715
                                </Text>
                            </TouchableOpacity>
                        ) : sondes.length > 0 ? (
                            <View style={styles.sondeLinkRow}>
                                {sondes.map((s) => (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={styles.sondeLinkBtn}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onLinkSonde(plant.id, s.id);
                                        }}
                                    >
                                        <Feather
                                            name="radio"
                                            size={10}
                                            color="#1565C0"
                                        />
                                        <Text style={styles.sondeLinkText}>
                                            {s.name.split(" ")[1]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <Text style={[styles.value, { color: "#bbb" }]}>
                                Aucune sonde
                            </Text>
                        )}
                    </View>

                    <View style={styles.btns}>
                        <TouchableOpacity
                            style={styles.btnEdit}
                            onPress={() => onEdit(plant)}
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
    },
    emoji: {
        fontSize: 64,
        marginBottom: 6,
    },
    name: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1B1B1B",
        marginBottom: 16,
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
    btns: {
        flexDirection: "row",
        gap: 10,
        marginTop: 20,
        width: "100%",
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
    sondeLinkText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#1565C0",
    },
});
