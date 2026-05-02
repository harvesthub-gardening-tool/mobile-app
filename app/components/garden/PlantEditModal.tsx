import { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Modal,
    StyleSheet,
    Dimensions,
} from "react-native";
import { DEFAULT_CELL, MIN_CARD_SIZE } from "../../constants/garden";
import type { PlacedPlant } from "../../types/garden";
import { colors, withAlpha } from "../../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type PlantEditModalProps = {
    plant: PlacedPlant | null;
    onClose: () => void;
    onSave: (id: string, width: number, height: number, quantity: number) => void;
};

export function PlantEditModal({
    plant,
    onClose,
    onSave,
}: PlantEditModalProps) {
    const [editSize, setEditSize] = useState("");
    const [editHeight, setEditHeight] = useState("");
    const [editQuantity, setEditQuantity] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (plant) {
            setEditSize(String(plant.width));
            setEditHeight(String(plant.height));
            setEditQuantity(String(plant.quantity));
            setError("");
        }
    }, [plant]);

    const handleSave = () => {
        if (!plant) return;
        const w = parseInt(editSize) || DEFAULT_CELL;
        const h = parseInt(editHeight) || DEFAULT_CELL;
        const q = parseInt(editQuantity) || 1;
        if (q > 20) {
            setError("Maximum 20 par carré !");
            return;
        }
        if (q < 1) {
            setError("Minimum 1 par carré !");
            return;
        }
        onSave(
            plant.id,
            Math.max(MIN_CARD_SIZE, Math.min(w, 400)),
            Math.max(MIN_CARD_SIZE, Math.min(h, 400)),
            q,
        );
        onClose();
    };

    return (
        <Modal visible={plant !== null} animationType="fade" transparent>
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.modal}>
                    <Text style={styles.title}>Modifier</Text>
                    {plant && (
                        <Text style={styles.subtitle}>
                            {plant.plantType.emoji} {plant.plantType.name}
                        </Text>
                    )}
                    <View style={styles.row}>
                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>Largeur (px)</Text>
                            <TextInput
                                style={styles.input}
                                value={editSize}
                                onChangeText={setEditSize}
                                keyboardType="numeric"
                                placeholder="140"
                            />
                        </View>
                        <View style={styles.field}>
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
                    <View style={styles.row}>
                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>
                                Quantité (max 20)
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={editQuantity}
                                onChangeText={(v) => {
                                    setEditQuantity(v);
                                    setError("");
                                }}
                                keyboardType="numeric"
                                placeholder="1"
                            />
                        </View>
                    </View>
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveBtnText}>Enregistrer</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: colors.overlay.backdrop,
        justifyContent: "center",
        alignItems: "center",
    },
    modal: {
        backgroundColor: colors.surface.lowest,
        borderRadius: 24,
        width: SCREEN_WIDTH - 40,
        padding: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.text.primary,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 14,
        color: colors.text.muted,
        marginBottom: 18,
    },
    row: {
        flexDirection: "row",
        gap: 12,
    },
    field: {
        flex: 1,
    },
    fieldLabel: {
        fontSize: 12,
        color: colors.text.muted,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.4),
        borderRadius: 16,
        height: 46,
        paddingHorizontal: 14,
        fontSize: 16,
        color: colors.text.primary,
        backgroundColor: colors.surface.low,
    },
    error: {
        color: colors.state.danger,
        fontSize: 13,
        marginTop: 8,
        textAlign: "center",
    },
    saveBtn: {
        backgroundColor: colors.brand.primary,
        borderRadius: 24,
        height: 48,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 18,
    },
    saveBtnText: {
        color: colors.text.onPrimary,
        fontSize: 15,
        fontWeight: "700",
    },
});
