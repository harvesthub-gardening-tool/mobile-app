import { useState, useCallback, useMemo } from "react";
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
import { useSensorData } from "../hooks/useSensorData";
import { MAP_SIZE, MIN_CARD_SIZE, PLANT_CATALOG } from "../constants/garden";
import type { PlacedPlant, PlantType } from "../types/garden";
import {
  GrassLayer,
  PlantCard,
  ZoomControls,
  AddMenu,
  CatalogModal,
  PlantDetailModal,
  SondeListModal,
} from "../components/garden";
import { colors, withAlpha } from "../theme";

export default function Dashboard() {
  const [mapViewportSize, setMapViewportSize] = useState({ width: 0, height: 0 });

  const {
    plants,
    sondes,
    addPlant,
    addPlantForSonde,
    removePlant,
    updatePlant,
    addSonde,
    linkPlantToSonde,
  } = useGardenStorage();

  const sensorData = useSensorData();

  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [detailPlantId, setDetailPlantId] = useState<string | null>(null);
  const [detailStartsInEditMode, setDetailStartsInEditMode] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showSondeList, setShowSondeList] = useState(false);

  const handleMapTap = useCallback(() => {
    setMovingId(null);
    setSelectedPlantId(null);
    setDetailPlantId(null);
    setDetailStartsInEditMode(false);
  }, []);

  const selectedPlant = useMemo<PlacedPlant | null>(() => {
    if (!selectedPlantId) {
      return null;
    }
    return plants.find((p) => p.id === selectedPlantId) ?? null;
  }, [plants, selectedPlantId]);

  const detailPlant = useMemo<PlacedPlant | null>(() => {
    if (!detailPlantId) {
      return null;
    }
    return plants.find((p) => p.id === detailPlantId) ?? null;
  }, [plants, detailPlantId]);

  const {
    composedGesture,
    animatedStyle,
    scale,
    translateX,
    translateY,
    isCardInteracting,
    zoomIn,
    zoomOut,
    recenter,
  } = useMapGestures(handleMapTap);

  const plantBounds = useMemo(() => {
    if (plants.length === 0) return null;
    let minX = MAP_SIZE;
    let minY = MAP_SIZE;
    let maxX = 0;
    let maxY = 0;
    for (const p of plants) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x + p.width > maxX) maxX = p.x + p.width;
      if (p.y + p.height > maxY) maxY = p.y + p.height;
    }
    return { minX, minY, maxX, maxY };
  }, [plants]);

  const handleRecenter = useCallback(() => {
    recenter(plantBounds);
  }, [recenter, plantBounds]);

  const handleCatalogSelect = useCallback(
    (plantType: PlantType) => {
      addPlant(plantType);
    },
    [addPlant],
  );

  const handleEditSave = useCallback(
    (id: string, plantType: PlantType, width: number, height: number, quantity: number) => {
      updatePlant(id, { plantType, width, height, quantity });
    },
    [updatePlant],
  );

  const handlePlantDelete = useCallback(
    (id: string) => {
      removePlant(id);
      setSelectedPlantId((prev) => (prev === id ? null : prev));
      setDetailPlantId((prev) => (prev === id ? null : prev));
      setDetailStartsInEditMode(false);
    },
    [removePlant],
  );

  const handleDetailLinkSonde = useCallback(
    (plantId: string, sondeId: string | null) => {
      linkPlantToSonde(plantId, sondeId);
    },
    [linkPlantToSonde],
  );

  const handleCardPress = useCallback(
    (id: string) => {
      const plant = plants.find((p) => p.id === id);
      if (!plant) {
        return;
      }
      setSelectedPlantId(id);
    },
    [plants],
  );

  const handleCardDelete = useCallback(
    (id: string) => {
      removePlant(id);
      setSelectedPlantId((prev) => (prev === id ? null : prev));
      setDetailPlantId((prev) => (prev === id ? null : prev));
      setDetailStartsInEditMode(false);
    },
    [removePlant],
  );

  const handleCardToggleMove = useCallback((id: string) => {
    setMovingId((prev) => (prev === id ? null : id));
  }, []);

  const handleOpenSelectedDetails = useCallback(() => {
    if (!selectedPlantId) {
      return;
    }
    setDetailStartsInEditMode(false);
    setDetailPlantId(selectedPlantId);
  }, [selectedPlantId]);

  const handleOpenSelectedEdit = useCallback(() => {
    if (!selectedPlantId) {
      return;
    }
    setDetailStartsInEditMode(true);
    setDetailPlantId(selectedPlantId);
  }, [selectedPlantId]);

  const handleMoveSelectedPlant = useCallback(() => {
    if (!selectedPlantId) {
      return;
    }
    setMovingId(selectedPlantId);
  }, [selectedPlantId]);

  const handleCardMove = useCallback(
    (id: string, x: number, y: number) => {
      const clampedX = Math.max(0, Math.min(x, MAP_SIZE - 60));
      const clampedY = Math.max(0, Math.min(y, MAP_SIZE - 60));
      updatePlant(id, { x: clampedX, y: clampedY });
    },
    [updatePlant],
  );

  const handleCardResize = useCallback(
    (id: string, x: number, y: number, width: number, height: number) => {
      const w = Math.max(MIN_CARD_SIZE, width);
      const h = Math.max(MIN_CARD_SIZE, height);
      const clampedX = Math.max(0, Math.min(x, MAP_SIZE - w));
      const clampedY = Math.max(0, Math.min(y, MAP_SIZE - h));
      updatePlant(id, { x: clampedX, y: clampedY, width: w, height: h });
    },
    [updatePlant],
  );

  const handleSelectProbe = useCallback(
    (probe: { nodeId: string; hubName: string }) => {
      const sonde = addSonde({ nodeId: probe.nodeId, hubName: probe.hubName });
      if (!sonde) {
        return;
      }

      let spawnX: number | undefined;
      let spawnY: number | undefined;

      const { width, height } = mapViewportSize;
      const viewportCenterX = width / 2;
      const viewportCenterY = height / 2;

      if (width > 0 && height > 0 && scale.value > 0) {
        const worldCenterX = (viewportCenterX - translateX.value) / scale.value;
        const worldCenterY = (viewportCenterY - translateY.value) / scale.value;

        spawnX = Math.max(0, Math.min(worldCenterX - 70, MAP_SIZE - 140));
        spawnY = Math.max(0, Math.min(worldCenterY - 70, MAP_SIZE - 140));
      }

      const createdPlant = addPlantForSonde(
        PLANT_CATALOG[0],
        sonde.id,
        spawnX !== undefined && spawnY !== undefined ? { x: spawnX, y: spawnY } : undefined,
      );
      setMovingId(createdPlant.id);
      setSelectedPlantId(createdPlant.id);
      setShowSondeList(false);
    },
    [addPlantForSonde, addSonde, mapViewportSize, scale, translateX, translateY],
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={styles.mapContainer}>
            <View
              pointerEvents="none"
              style={styles.mapViewportMeasure}
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                setMapViewportSize({ width, height });
              }}
            />

            <Animated.View style={[styles.map, animatedStyle]}>
              <GrassLayer />

              {plants.map((plant) => (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  sondes={sondes}
                  sensorData={sensorData}
                  isMoving={movingId === plant.id}
                  isSelected={selectedPlantId === plant.id}
                  mapScale={scale}
                  isCardInteracting={isCardInteracting}
                  onPress={handleCardPress}
                  onDelete={handleCardDelete}
                  onToggleMove={handleCardToggleMove}
                  onMove={handleCardMove}
                  onResize={handleCardResize}
                />
              ))}

              {plants.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>{"🌱"}</Text>
                  <Text style={styles.emptyText}>Votre jardin est vide</Text>
                  <Text style={styles.emptySubtext}>Appuyez sur + pour ajouter des plantes</Text>
                </View>
              )}
            </Animated.View>

            <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onRecenter={handleRecenter} />

            <AddMenu onPress={() => setShowSondeList(true)} />
          </Animated.View>
        </GestureDetector>

        <CatalogModal
          visible={showCatalog}
          sondes={sondes}
          onClose={() => setShowCatalog(false)}
          onSelectPlant={handleCatalogSelect}
        />

        <PlantDetailModal
          plant={detailPlant}
          sondes={sondes}
          startInEditMode={detailStartsInEditMode}
          onClose={() => {
            setDetailPlantId(null);
            setDetailStartsInEditMode(false);
          }}
          onSave={handleEditSave}
          onDelete={handlePlantDelete}
          onLinkSonde={handleDetailLinkSonde}
        />

        <SondeListModal
          visible={showSondeList}
          plants={plants}
          sondes={sondes}
          onClose={() => setShowSondeList(false)}
          onSelectProbe={handleSelectProbe}
        />

        {selectedPlant && (
          <View pointerEvents="box-none" style={styles.selectionActionsWrapper}>
            <View style={styles.selectionActionsRow}>
              <TouchableOpacity
                style={[styles.selectionActionButton, styles.selectionActionMoveButton]}
                onPress={handleMoveSelectedPlant}
              >
                <Feather name="move" size={16} color={colors.text.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.selectionActionButton, styles.selectionActionEdit]}
                onPress={handleOpenSelectedEdit}
              >
                <Feather name="edit-2" size={16} color={colors.text.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.selectionActionButton, styles.selectionActionPrimary]}
                onPress={handleOpenSelectedDetails}
              >
                <Feather name="info" size={16} color={colors.text.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  mapContainer: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: colors.garden.map,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  mapViewportMeasure: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    width: MAP_SIZE,
    height: MAP_SIZE,
    backgroundColor: colors.garden.map,
    position: "relative",
    borderWidth: 40,
    borderColor: colors.garden.mapBorder,
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
    color: colors.text.onPrimary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: withAlpha(colors.base.white, 0.8),
  },
  selectionActionsWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 108,
    pointerEvents: "box-none",
  },
  selectionActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  selectionActionButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    borderRadius: 21,
    shadowColor: colors.overlay.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 6,
  },
  selectionActionMoveButton: {
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: withAlpha(colors.border.subtle, 0.2),
  },
  selectionActionEdit: {
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: withAlpha(colors.border.subtle, 0.2),
  },
  selectionActionPrimary: {
    backgroundColor: colors.brand.secondary,
  },
});
