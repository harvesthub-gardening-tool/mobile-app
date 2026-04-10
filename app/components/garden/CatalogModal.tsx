import { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    FlatList,
    Modal,
    StyleSheet,
    Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { PLANT_CATALOG } from "../../constants/garden";
import type { PlantType, PlacedSonde } from "../../types/garden";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type CatalogModalProps = {
    visible: boolean;
    sondes: PlacedSonde[];
    onClose: () => void;
    onSelectPlant: (plantType: PlantType, sondeId: string | null) => void;
};

export function CatalogModal({
    visible,
    sondes,
    onClose,
    onSelectPlant,
}: CatalogModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [pendingPlant, setPendingPlant] = useState<PlantType | null>(null);

    const filteredCatalog = PLANT_CATALOG.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleSelect = (plantType: PlantType) => {
        if (sondes.length > 0) {
            setPendingPlant(plantType);
        } else {
            onSelectPlant(plantType, null);
            handleClose();
        }
    };

    const handleSelectWithSonde = (sondeId: string | null) => {
        if (!pendingPlant) return;
        onSelectPlant(pendingPlant, sondeId);
        setPendingPlant(null);
        handleClose();
    };

    const handleClose = () => {
        setSearchQuery("");
        setPendingPlant(null);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Ajouter une plante</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Feather name="x" size={24} color="#2B2B2B" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchBar}>
                        <Feather name="search" size={18} color="#999" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Rechercher un fruit, l\u00e9gume..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                    </View>

                    <FlatList
                        data={filteredCatalog}
                        keyExtractor={(item) => item.id}
                        numColumns={3}
                        contentContainerStyle={styles.grid}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.catalogItem}
                                onPress={() => handleSelect(item)}
                            >
                                <Text style={styles.catalogEmoji}>
                                    {item.emoji}
                                </Text>
                                <Text style={styles.catalogName}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />

                    {pendingPlant && (
                        <View style={styles.sondePickerOverlay}>
                            <View style={styles.sondePickerCard}>
                                <Text style={styles.sondePickerTitle}>
                                    {pendingPlant.emoji} Lier \u00e0 une sonde ?
                                </Text>
                                {sondes.map((s) => (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={styles.sondePickerItem}
                                        onPress={() =>
                                            handleSelectWithSonde(s.id)
                                        }
                                    >
                                        <Feather
                                            name="radio"
                                            size={16}
                                            color="#1565C0"
                                        />
                                        <Text
                                            style={styles.sondePickerItemText}
                                        >
                                            {s.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={styles.sondePickerSkip}
                                    onPress={() => handleSelectWithSonde(null)}
                                >
                                    <Text style={styles.sondePickerSkipText}>
                                        Sans sonde
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.sondePickerCancel}
                                    onPress={() => setPendingPlant(null)}
                                >
                                    <Text style={styles.sondePickerCancelText}>
                                        Annuler
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    modal: {
        backgroundColor: "#FFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.7,
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
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F2F2F2",
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        marginBottom: 14,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: "#1B1B1B",
    },
    grid: {
        paddingBottom: 20,
    },
    catalogItem: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 14,
        margin: 4,
        backgroundColor: "#F0FFF0",
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: "#C8E6C9",
    },
    catalogEmoji: {
        fontSize: 38,
        marginBottom: 6,
    },
    catalogName: {
        fontSize: 12,
        fontWeight: "600",
        color: "#2B2B2B",
        textAlign: "center",
    },
    sondePickerOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    sondePickerCard: {
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 20,
        width: "85%",
        alignItems: "center",
    },
    sondePickerTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1B1B1B",
        marginBottom: 16,
    },
    sondePickerItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        width: "100%",
        backgroundColor: "#E3F2FD",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    sondePickerItemText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1565C0",
    },
    sondePickerSkip: {
        width: "100%",
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
        marginBottom: 8,
    },
    sondePickerSkipText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#666",
    },
    sondePickerCancel: {
        paddingVertical: 8,
    },
    sondePickerCancelText: {
        fontSize: 13,
        color: "#999",
    },
});
