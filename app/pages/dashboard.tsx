import { useState, useCallback, useMemo, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

import { useGardenStorage } from "../hooks/useGardenStorage";
import { useMapGestures } from "../hooks/useMapGestures";
import { MAP_SIZE } from "../constants/garden";
import type { PlacedPlant, PlantType } from "../types/garden";
import {
    GrassLayer,
    PlantCard,
    ZoomControls,
    AddMenu,
    CatalogModal,
    PlantDetailModal,
    PlantEditModal,
    SondeListModal,
} from "../components/garden";

export default function Dashboard() {
    const {
        plants,
        sondes,
        addPlant,
        removePlant,
        updatePlant,
        addSonde,
        removeSonde,
        linkPlantToSonde,
    } = useGardenStorage();

    const [selectedPlant, setSelectedPlant] = useState<PlacedPlant | null>(
        null,
    );
    const [editingPlant, setEditingPlant] = useState<PlacedPlant | null>(null);
    const [movingId, setMovingId] = useState<string | null>(null);
    const [showCatalog, setShowCatalog] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showSondeList, setShowSondeList] = useState(false);

    const tapHandlerRef = useRef<(x: number, y: number) => void>(() => {});

    const {
        composedGesture,
        animatedStyle,
        scale,
        translateX,
        translateY,
        zoomIn,
        zoomOut,
        recenter,
    } = useMapGestures((screenX, screenY) =>
        tapHandlerRef.current(screenX, screenY),
    );

    tapHandlerRef.current = (screenX: number, screenY: number) => {
        if (!movingId) return;
        const plant = plants.find((p) => p.id === movingId);
        if (!plant) return;
        const mapX = (screenX - translateX.value) / scale.value;
        const mapY = (screenY - translateY.value) / scale.value;
        const clampedX = Math.max(
            0,
            Math.min(mapX - plant.size / 2, MAP_SIZE - plant.size),
        );
        const clampedY = Math.max(
            0,
            Math.min(mapY - plant.size / 2, MAP_SIZE - plant.size),
        );
        updatePlant(movingId, { x: clampedX, y: clampedY });
        setMovingId(null);
    };

    const plantBounds = useMemo(() => {
        if (plants.length === 0) return null;
        let minX = MAP_SIZE,
            minY = MAP_SIZE,
            maxX = 0,
            maxY = 0;
        for (const p of plants) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x + p.size > maxX) maxX = p.x + p.size;
            if (p.y + p.size > maxY) maxY = p.y + p.size;
        }
        return { minX, minY, maxX, maxY };
    }, [plants]);

    const handleRecenter = useCallback(() => {
        recenter(plantBounds);
    }, [recenter, plantBounds]);

    const handleCatalogSelect = useCallback(
        (plantType: PlantType, sondeId: string | null) => {
            addPlant(plantType, sondeId);
        },
        [addPlant],
    );

    const handleEditSave = useCallback(
        (id: string, size: number, quantity: number) => {
            updatePlant(id, { size, quantity });
        },
        [updatePlant],
    );

    const handlePlantDelete = useCallback(
        (id: string) => {
            removePlant(id);
            setSelectedPlant(null);
        },
        [removePlant],
    );

    const handleDetailEdit = useCallback((plant: PlacedPlant) => {
        setSelectedPlant(null);
        setEditingPlant(plant);
    }, []);

    const handleDetailLinkSonde = useCallback(
        (plantId: string, sondeId: string | null) => {
            linkPlantToSonde(plantId, sondeId);
            setSelectedPlant((prev) =>
                prev?.id === plantId ? { ...prev, sondeId } : prev,
            );
        },
        [linkPlantToSonde],
    );

    const handleCardPress = useCallback(
        (id: string) => {
            if (movingId === id) {
                setMovingId(null);
            } else {
                const plant = plants.find((p) => p.id === id);
                if (plant) setSelectedPlant(plant);
            }
        },
        [movingId, plants],
    );

    const handleCardEdit = useCallback(
        (id: string) => {
            const plant = plants.find((p) => p.id === id);
            if (plant) setEditingPlant(plant);
        },
        [plants],
    );

    const handleCardDelete = useCallback(
        (id: string) => {
            removePlant(id);
        },
        [removePlant],
    );

    const handleCardToggleMove = useCallback((id: string) => {
        setMovingId((prev) => (prev === id ? null : id));
    }, []);

    return (
        <GestureHandlerRootView style={styles.root}>
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.header}>
                    <View style={styles.gardenSelector}>
                        <Text style={styles.gardenName}>Mon jardin</Text>
                    </View>
                </View>

                {movingId && (
                    <View style={styles.movingBanner}>
                        <Text style={styles.movingBannerText}>
                            Cliquez sur la carte pour placer la plante
                        </Text>
                        <TouchableOpacity onPress={() => setMovingId(null)}>
                            <Feather name="x" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )}

                <GestureDetector gesture={composedGesture}>
                    <Animated.View style={styles.mapContainer}>
                        <Animated.View style={[styles.map, animatedStyle]}>
                            <GrassLayer />

                            {plants.map((plant) => (
                                <PlantCard
                                    key={plant.id}
                                    plant={plant}
                                    sondes={sondes}
                                    isMoving={movingId === plant.id}
                                    onPress={handleCardPress}
                                    onEdit={handleCardEdit}
                                    onDelete={handleCardDelete}
                                    onToggleMove={handleCardToggleMove}
                                />
                            ))}

                            {plants.length === 0 && (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyEmoji}>
                                        {"\ud83c\udf31"}
                                    </Text>
                                    <Text style={styles.emptyText}>
                                        Votre jardin est vide
                                    </Text>
                                    <Text style={styles.emptySubtext}>
                                        Appuyez sur + pour ajouter des plantes
                                    </Text>
                                </View>
                            )}
                        </Animated.View>

                        <ZoomControls
                            onZoomIn={zoomIn}
                            onZoomOut={zoomOut}
                            onRecenter={handleRecenter}
                        />

                        <AddMenu
                            visible={showAddMenu}
                            onToggle={() => setShowAddMenu(!showAddMenu)}
                            onAddPlant={() => {
                                setShowAddMenu(false);
                                setShowCatalog(true);
                            }}
                            onAddSonde={() => {
                                setShowAddMenu(false);
                                setShowSondeList(true);
                            }}
                        />
                    </Animated.View>
                </GestureDetector>

                <CatalogModal
                    visible={showCatalog}
                    sondes={sondes}
                    onClose={() => setShowCatalog(false)}
                    onSelectPlant={handleCatalogSelect}
                />

                <PlantDetailModal
                    plant={selectedPlant}
                    sondes={sondes}
                    onClose={() => setSelectedPlant(null)}
                    onEdit={handleDetailEdit}
                    onDelete={handlePlantDelete}
                    onLinkSonde={handleDetailLinkSonde}
                />

                <PlantEditModal
                    plant={editingPlant}
                    onClose={() => setEditingPlant(null)}
                    onSave={handleEditSave}
                />

                <SondeListModal
                    visible={showSondeList}
                    sondes={sondes}
                    plants={plants}
                    onClose={() => setShowSondeList(false)}
                    onAddSonde={addSonde}
                    onRemoveSonde={removeSonde}
                />
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        // paddingBottom: 30,
    },
    safe: {
        flex: 1,
        backgroundColor: "#63FFA4",
    },
    header: {
        backgroundColor: "#63FFA4",
        paddingTop: 6,
        paddingBottom: 18,
        paddingHorizontal: 16,
    },
    gardenSelector: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFF",
        borderRadius: 16,
        height: 46,
        paddingHorizontal: 8,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    gardenName: {
        flex: 1,
        textAlign: "center",
        fontSize: 16,
        fontWeight: "700",
        color: "#1B1B1B",
    },
    movingBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2196F3",
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 10,
    },
    movingBannerText: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "600",
    },
    mapContainer: {
        flex: 1,
        overflow: "hidden",
        backgroundColor: "#7EC850",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    map: {
        width: MAP_SIZE,
        height: MAP_SIZE,
        backgroundColor: "#7EC850",
        position: "relative",
        borderWidth: 40,
        borderColor: "#C4A46C",
        borderRadius: 30,
    },
    emptyState: {
        position: "absolute",
        top: MAP_SIZE / 2 - 60,
        left: MAP_SIZE / 2 - 120,
        width: 240,
        alignItems: "center",
    },
    emptyEmoji: {
        fontSize: 60,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#FFF",
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 13,
        color: "rgba(255,255,255,0.8)",
    },
});
