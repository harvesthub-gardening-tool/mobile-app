import { memo, useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    runOnJS,
    type SharedValue,
} from "react-native-reanimated";
import type { PlacedPlant, PlacedSonde } from "../../types/garden";
import { MIN_CARD_SIZE } from "../../constants/garden";

const HANDLE_SIZE = 24;
const HANDLE_HIT = 32;
const CRUD_BAR_HEIGHT = 36;

type PlantCardProps = {
    plant: PlacedPlant;
    sondes: PlacedSonde[];
    isMoving: boolean;
    mapScale: SharedValue<number>;
    isCardInteracting: SharedValue<boolean>;
    onPress: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleMove: (id: string) => void;
    onMove: (id: string, x: number, y: number) => void;
    onResize: (
        id: string,
        x: number,
        y: number,
        width: number,
        height: number,
    ) => void;
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
    mapScale,
    isCardInteracting,
    onPress,
    onEdit,
    onDelete,
    onToggleMove,
    onMove,
    onResize,
}: PlantCardProps) {
    const linkedSonde = plant.sondeId
        ? sondes.find((s) => s.id === plant.sondeId)
        : null;

    const offsetX = useSharedValue(0);
    const offsetY = useSharedValue(0);
    const offsetW = useSharedValue(0);
    const offsetH = useSharedValue(0);

    useEffect(() => {
        offsetX.value = 0;
        offsetY.value = 0;
        offsetW.value = 0;
        offsetH.value = 0;
    }, [plant.x, plant.y, plant.width, plant.height]);

    const commitMove = useCallback(
        (dx: number, dy: number) => {
            onMove(plant.id, plant.x + dx, plant.y + dy);
        },
        [onMove, plant.id, plant.x, plant.y],
    );

    const commitResize = useCallback(
        (dx: number, dy: number, dw: number, dh: number) => {
            const newW = Math.max(MIN_CARD_SIZE, plant.width + dw);
            const newH = Math.max(MIN_CARD_SIZE, plant.height + dh);
            onResize(plant.id, plant.x + dx, plant.y + dy, newW, newH);
        },
        [onResize, plant.id, plant.x, plant.y, plant.width, plant.height],
    );

    const dragGesture = Gesture.Pan()
        .enabled(isMoving)
        .onBegin(() => {
            isCardInteracting.value = true;
        })
        .onChange((e) => {
            offsetX.value += e.changeX / mapScale.value;
            offsetY.value += e.changeY / mapScale.value;
        })
        .onFinalize(() => {
            isCardInteracting.value = false;
            runOnJS(commitMove)(offsetX.value, offsetY.value);
        });

    function makeCornerGesture(
        anchorX: "left" | "right",
        anchorY: "top" | "bottom",
    ) {
        return Gesture.Pan()
            .enabled(isMoving)
            .onBegin(() => {
                isCardInteracting.value = true;
            })
            .onChange((e) => {
                const dx = e.changeX / mapScale.value;
                const dy = e.changeY / mapScale.value;

                if (anchorX === "left") {
                    const proposedW = offsetW.value - dx;
                    if (plant.width + proposedW >= MIN_CARD_SIZE) {
                        offsetX.value += dx;
                        offsetW.value = proposedW;
                    }
                } else {
                    const proposedW = offsetW.value + dx;
                    if (plant.width + proposedW >= MIN_CARD_SIZE) {
                        offsetW.value = proposedW;
                    }
                }

                if (anchorY === "top") {
                    const proposedH = offsetH.value - dy;
                    if (plant.height + proposedH >= MIN_CARD_SIZE) {
                        offsetY.value += dy;
                        offsetH.value = proposedH;
                    }
                } else {
                    const proposedH = offsetH.value + dy;
                    if (plant.height + proposedH >= MIN_CARD_SIZE) {
                        offsetH.value = proposedH;
                    }
                }
            })
            .onFinalize(() => {
                isCardInteracting.value = false;
                runOnJS(commitResize)(
                    offsetX.value,
                    offsetY.value,
                    offsetW.value,
                    offsetH.value,
                );
            });
    }

    const topLeftGesture = makeCornerGesture("left", "top");
    const topRightGesture = makeCornerGesture("right", "top");
    const bottomLeftGesture = makeCornerGesture("left", "bottom");
    const bottomRightGesture = makeCornerGesture("right", "bottom");

    const animatedCardStyle = useAnimatedStyle(() => {
        const w = Math.max(MIN_CARD_SIZE, plant.width + offsetW.value);
        const h = Math.max(MIN_CARD_SIZE, plant.height + offsetH.value);
        return {
            left: plant.x + offsetX.value,
            top: plant.y + offsetY.value,
            width: w,
            height: h + CRUD_BAR_HEIGHT,
        };
    });

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

    const handleHitSlop = (HANDLE_HIT - HANDLE_SIZE) / 2;

    const cardContent = (
        <>
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

            {isMoving && (
                <>
                    <GestureDetector gesture={topLeftGesture}>
                        <Animated.View
                            hitSlop={handleHitSlop}
                            style={[styles.handle, styles.handleTL]}
                        />
                    </GestureDetector>
                    <GestureDetector gesture={topRightGesture}>
                        <Animated.View
                            hitSlop={handleHitSlop}
                            style={[styles.handle, styles.handleTR]}
                        />
                    </GestureDetector>
                    <GestureDetector gesture={bottomLeftGesture}>
                        <Animated.View
                            hitSlop={handleHitSlop}
                            style={[styles.handle, styles.handleBL]}
                        />
                    </GestureDetector>
                    <GestureDetector gesture={bottomRightGesture}>
                        <Animated.View
                            hitSlop={handleHitSlop}
                            style={[styles.handle, styles.handleBR]}
                        />
                    </GestureDetector>
                </>
            )}
        </>
    );

    if (isMoving) {
        return (
            <GestureDetector gesture={dragGesture}>
                <Animated.View
                    style={[
                        styles.card,
                        styles.cardMoving,
                        animatedCardStyle,
                    ]}
                >
                    {cardContent}
                </Animated.View>
            </GestureDetector>
        );
    }

    return (
        <Pressable
            style={[
                styles.card,
                {
                    left: plant.x,
                    top: plant.y,
                    width: plant.width,
                    height: plant.height + CRUD_BAR_HEIGHT,
                },
            ]}
            onPress={handlePress}
        >
            {cardContent}
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
    handle: {
        position: "absolute",
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        borderRadius: HANDLE_SIZE / 2,
        backgroundColor: "#2196F3",
        borderWidth: 2,
        borderColor: "#FFF",
    },
    handleTL: {
        top: -HANDLE_SIZE / 2,
        left: -HANDLE_SIZE / 2,
    },
    handleTR: {
        top: -HANDLE_SIZE / 2,
        right: -HANDLE_SIZE / 2,
    },
    handleBL: {
        bottom: -HANDLE_SIZE / 2,
        left: -HANDLE_SIZE / 2,
    },
    handleBR: {
        bottom: -HANDLE_SIZE / 2,
        right: -HANDLE_SIZE / 2,
    },
});
