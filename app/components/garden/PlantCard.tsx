import { memo, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { PlacedPlant, PlacedSonde } from "../../types/garden";

type PlantCardProps = {
    plant: PlacedPlant;
    sondes: PlacedSonde[];
    isMoving: boolean;
    onPress: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleMove: (id: string) => void;
};

function getEmojiSize(quantity: number): number {
    if (quantity === 1) return 46;
    if (quantity <= 4) return 26;
    if (quantity <= 9) return 18;
    return 14;
}

export const PlantCard = memo(function PlantCard({
    plant,
    sondes,
    isMoving,
    onPress,
    onEdit,
    onDelete,
    onToggleMove,
}: PlantCardProps) {
    const linkedSonde = plant.sondeId
        ? sondes.find((s) => s.id === plant.sondeId)
        : null;

    const handlePress = useCallback(
        () => onPress(plant.id),
        [onPress, plant.id],
    );
    const handleEdit = useCallback(() => onEdit(plant.id), [onEdit, plant.id]);
    const handleDelete = useCallback(
        () => onDelete(plant.id),
        [onDelete, plant.id],
    );
    const handleToggleMove = useCallback(
        () => onToggleMove(plant.id),
        [onToggleMove, plant.id],
    );

    return (
        <Pressable
            style={[
                styles.card,
                {
                    left: plant.x,
                    top: plant.y,
                    width: plant.size,
                    height: plant.size + 36,
                },
                isMoving && styles.cardMoving,
            ]}
            onPress={handlePress}
        >
            <View style={styles.content}>
                <View style={styles.emojiGrid}>
                    {Array.from({ length: Math.min(plant.quantity, 20) }).map(
                        (_, i) => (
                            <Text
                                key={i}
                                style={{
                                    fontSize: getEmojiSize(plant.quantity),
                                }}
                            >
                                {plant.plantType.emoji}
                            </Text>
                        ),
                    )}
                </View>
                <Text style={styles.label}>
                    {plant.plantType.name} x{plant.quantity}
                </Text>
                {linkedSonde && (
                    <View style={styles.sondeIndicator}>
                        <Feather name="radio" size={10} color="#FFF" />
                        <Text style={styles.sondeText}>
                            {linkedSonde.name.split(" ")[1] || "Sonde"}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.crudBar}>
                <Pressable style={styles.crudBtn} onPress={handleEdit}>
                    <Feather name="edit-2" size={12} color="#2196F3" />
                </Pressable>
                <Pressable
                    style={[styles.crudBtn, styles.crudBtnDelete]}
                    onPress={handleDelete}
                >
                    <Feather name="trash-2" size={12} color="#FF4444" />
                </Pressable>
                <Pressable
                    style={[styles.crudBtn, isMoving && styles.crudBtnActive]}
                    onPress={handleToggleMove}
                >
                    <Feather
                        name="move"
                        size={12}
                        color={isMoving ? "#FFF" : "#666"}
                    />
                </Pressable>
            </View>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    card: {
        position: "absolute",
        borderRadius: 18,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.5)",
        backgroundColor: "rgba(255,255,255,0.15)",
        padding: 6,
    },
    cardMoving: {
        borderColor: "#2196F3",
        borderWidth: 3,
        backgroundColor: "rgba(33,150,243,0.15)",
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    emojiGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
    },
    label: {
        fontSize: 11,
        fontWeight: "700",
        color: "#FFF",
        textAlign: "center",
        textShadowColor: "rgba(0,0,0,0.3)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    sondeIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: "rgba(21,101,192,0.7)",
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginTop: 2,
    },
    sondeText: {
        fontSize: 8,
        fontWeight: "600",
        color: "#FFF",
    },
    crudBar: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
        paddingTop: 4,
    },
    crudBtn: {
        width: 28,
        height: 28,
        backgroundColor: "rgba(255,255,255,0.9)",
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    crudBtnDelete: {
        backgroundColor: "rgba(255,230,230,0.9)",
    },
    crudBtnActive: {
        backgroundColor: "#2196F3",
    },
});
