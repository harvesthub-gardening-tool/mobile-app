import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";

type PlantType = {
  id: string;
  name: string;
  emoji: string;
  category: "fruit" | "legume" | "herbe";
};

type PlacedSonde = {
  id: string;
  name: string;
  x: number;
  y: number;
};

type PlacedPlant = {
  id: string;
  plantType: PlantType;
  x: number;
  y: number;
  size: number;
  quantity: number;
  sondeId: string | null;
};

const SONDE_TYPES = [
  { id: "sonde1", name: "Sonde Humidité", icon: "droplet" as const },
  { id: "sonde2", name: "Sonde Température", icon: "thermometer" as const },
];

const PLANT_CATALOG: PlantType[] = [
  { id: "t1", name: "Tomate", emoji: "🍅", category: "legume" },
  { id: "t2", name: "Aubergine", emoji: "🍆", category: "legume" },
  { id: "t3", name: "Carotte", emoji: "🥕", category: "legume" },
  { id: "t4", name: "Salade", emoji: "🥬", category: "legume" },
  { id: "t5", name: "Poivron", emoji: "🫑", category: "legume" },
  { id: "t6", name: "Brocoli", emoji: "🥦", category: "legume" },
  { id: "t7", name: "Maïs", emoji: "🌽", category: "legume" },
  { id: "t8", name: "Oignon", emoji: "🧅", category: "legume" },
  { id: "t9", name: "Ail", emoji: "🧄", category: "legume" },
  { id: "t10", name: "Pomme de terre", emoji: "🥔", category: "legume" },
  { id: "t11", name: "Concombre", emoji: "🥒", category: "legume" },
  { id: "t12", name: "Courgette", emoji: "🥒", category: "legume" },
  { id: "t13", name: "Petit pois", emoji: "🫛", category: "legume" },
  { id: "t14", name: "Haricot", emoji: "🫘", category: "legume" },
  { id: "t15", name: "Radis", emoji: "🫐", category: "legume" },
  { id: "t16", name: "Chou", emoji: "🥬", category: "legume" },
  { id: "t17", name: "Chou-fleur", emoji: "🥦", category: "legume" },
  { id: "t18", name: "Épinard", emoji: "🥬", category: "legume" },
  { id: "t19", name: "Betterave", emoji: "🫐", category: "legume" },
  { id: "t20", name: "Navet", emoji: "🥔", category: "legume" },
  { id: "t21", name: "Artichaut", emoji: "🌿", category: "legume" },
  { id: "t22", name: "Asperge", emoji: "🌿", category: "legume" },
  { id: "t23", name: "Céleri", emoji: "🥬", category: "legume" },
  { id: "t24", name: "Fenouil", emoji: "🌿", category: "legume" },
  { id: "t25", name: "Poireau", emoji: "🧅", category: "legume" },
  { id: "t26", name: "Citrouille", emoji: "🎃", category: "legume" },
  { id: "t27", name: "Patate douce", emoji: "🍠", category: "legume" },
  { id: "f1", name: "Fraise", emoji: "🍓", category: "fruit" },
  { id: "f2", name: "Pastèque", emoji: "🍉", category: "fruit" },
  { id: "f3", name: "Raisin", emoji: "🍇", category: "fruit" },
  { id: "f4", name: "Cerise", emoji: "🍒", category: "fruit" },
  { id: "f5", name: "Citron", emoji: "🍋", category: "fruit" },
  { id: "f6", name: "Pêche", emoji: "🍑", category: "fruit" },
  { id: "f7", name: "Pomme", emoji: "🍎", category: "fruit" },
  { id: "f8", name: "Poire", emoji: "🍐", category: "fruit" },
  { id: "f9", name: "Orange", emoji: "🍊", category: "fruit" },
  { id: "f10", name: "Banane", emoji: "🍌", category: "fruit" },
  { id: "f11", name: "Ananas", emoji: "🍍", category: "fruit" },
  { id: "f12", name: "Mangue", emoji: "🥭", category: "fruit" },
  { id: "f13", name: "Kiwi", emoji: "🥝", category: "fruit" },
  { id: "f14", name: "Myrtille", emoji: "🫐", category: "fruit" },
  { id: "f15", name: "Framboise", emoji: "🍓", category: "fruit" },
  { id: "f16", name: "Abricot", emoji: "🍑", category: "fruit" },
  { id: "f17", name: "Prune", emoji: "🍑", category: "fruit" },
  { id: "f18", name: "Figue", emoji: "🍇", category: "fruit" },
  { id: "f19", name: "Melon", emoji: "🍈", category: "fruit" },
  { id: "f20", name: "Noix de coco", emoji: "🥥", category: "fruit" },
  { id: "f21", name: "Avocat", emoji: "🥑", category: "fruit" },
  { id: "f22", name: "Grenade", emoji: "🍎", category: "fruit" },
  { id: "f23", name: "Cassis", emoji: "🫐", category: "fruit" },
  { id: "f24", name: "Groseille", emoji: "🍒", category: "fruit" },
  { id: "h1", name: "Basilic", emoji: "🌿", category: "herbe" },
  { id: "h2", name: "Menthe", emoji: "🍃", category: "herbe" },
  { id: "h3", name: "Piment", emoji: "🌶️", category: "herbe" },
  { id: "h4", name: "Tournesol", emoji: "🌻", category: "herbe" },
  { id: "h5", name: "Persil", emoji: "🌿", category: "herbe" },
  { id: "h6", name: "Ciboulette", emoji: "🌿", category: "herbe" },
  { id: "h7", name: "Thym", emoji: "🌿", category: "herbe" },
  { id: "h8", name: "Romarin", emoji: "🌿", category: "herbe" },
  { id: "h9", name: "Coriandre", emoji: "🌿", category: "herbe" },
  { id: "h10", name: "Aneth", emoji: "🌿", category: "herbe" },
  { id: "h11", name: "Sauge", emoji: "🍃", category: "herbe" },
  { id: "h12", name: "Origan", emoji: "🍃", category: "herbe" },
  { id: "h13", name: "Estragon", emoji: "🌿", category: "herbe" },
  { id: "h14", name: "Lavande", emoji: "💜", category: "herbe" },
  { id: "h15", name: "Citronnelle", emoji: "🌿", category: "herbe" },
  { id: "h16", name: "Rose", emoji: "🌹", category: "herbe" },
  { id: "h17", name: "Tulipe", emoji: "🌷", category: "herbe" },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_SIZE = 2000;
const DEFAULT_CELL = 140;
const GRID_COLS = 8;
const GRID_ROWS = 8;
const CELL_GAP = 12;
const STORAGE_KEY = "garden_plants";

const GRASS_STEP = 40;
const GRASS_DECORATIONS: Array<{ x: number; y: number; emoji: string; size: number }> = [];
const grassEmojis = ["🌿", "☘️", "🍀"];
let grassIdx = 0;
for (let y = 0; y < MAP_SIZE; y += GRASS_STEP) {
  for (let x = 0; x < MAP_SIZE; x += GRASS_STEP) {
    const seed = grassIdx * 7919;
    const offsetX = (seed % 15) - 7;
    const offsetY = ((seed * 3) % 15) - 7;
    GRASS_DECORATIONS.push({
      x: x + offsetX,
      y: y + offsetY,
      emoji: grassEmojis[grassIdx % grassEmojis.length],
      size: 22 + (seed % 8),
    });
    grassIdx++;
  }
}

let plantIdCounter = Date.now();

export default function Dashboard() {
  const { userId } = useAuth();
  const [plants, setPlants] = useState<PlacedPlant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<PlacedPlant | null>(null);
  const [editingPlant, setEditingPlant] = useState<PlacedPlant | null>(null);
  const [editSize, setEditSize] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editError, setEditError] = useState("");
  const [movingId, setMovingId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [sondes, setSondes] = useState<PlacedSonde[]>([]);
  const [showSondeList, setShowSondeList] = useState(false);

  const userKey = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
  const sondeKey = `${userKey}_sondes`;

  useEffect(() => {
    AsyncStorage.getItem(userKey).then((data) => {
      if (data) {
        try { setPlants(JSON.parse(data)); } catch {}
      } else {
        setPlants([]);
      }
    });
    AsyncStorage.getItem(sondeKey).then((data) => {
      if (data) {
        try { setSondes(JSON.parse(data)); } catch {}
      } else {
        setSondes([]);
      }
    });
  }, [userKey]);

  const savePlants = useCallback((newPlants: PlacedPlant[]) => {
    setPlants(newPlants);
    AsyncStorage.setItem(userKey, JSON.stringify(newPlants));
  }, [userKey]);

  const saveSondes = useCallback((newSondes: PlacedSonde[]) => {
    setSondes(newSondes);
    AsyncStorage.setItem(sondeKey, JSON.stringify(newSondes));
  }, [sondeKey]);

  const addSonde = (type: typeof SONDE_TYPES[number]) => {
    const existing = sondes.filter((s) => s.name.startsWith(type.name));
    if (existing.length >= 1) return; // max 1 de chaque type
    const startX = MAP_SIZE / 2;
    const startY = MAP_SIZE / 2 + (sondes.length * 80);
    saveSondes([...sondes, { id: `sonde_${Date.now()}`, name: type.name, x: startX, y: startY }]);
    setShowSondeList(false);
  };

  const removeSonde = (id: string) => {
    savePlants(plants.map((p) => (p.sondeId === id ? { ...p, sondeId: null } : p)));
    saveSondes(sondes.filter((s) => s.id !== id));
  };

  const linkPlantToSonde = (plantId: string, sondeId: string | null) => {
    savePlants(plants.map((p) => (p.id === plantId ? { ...p, sondeId } : p)));
  };

  const mapAreaHeight = SCREEN_HEIGHT - 180;
  const fitScale = Math.max(SCREEN_WIDTH / MAP_SIZE, mapAreaHeight / MAP_SIZE);
  const initX = (SCREEN_WIDTH - MAP_SIZE * fitScale) / 2;
  const initY = (mapAreaHeight - MAP_SIZE * fitScale) / 2;
  const scale = useSharedValue(fitScale);
  const savedScale = useSharedValue(fitScale);
  const translateX = useSharedValue(initX);
  const translateY = useSharedValue(initY);
  const savedTranslateX = useSharedValue(initX);
  const savedTranslateY = useSharedValue(initY);

  const handleMapTap = useCallback((screenX: number, screenY: number) => {
    if (!movingId) return;
    const mapX = (screenX - translateX.value) / scale.value;
    const mapY = (screenY - translateY.value) / scale.value;
    const plant = plants.find((p) => p.id === movingId);
    if (!plant) return;
    const clampedX = Math.max(0, Math.min(mapX - plant.size / 2, MAP_SIZE - plant.size));
    const clampedY = Math.max(0, Math.min(mapY - plant.size / 2, MAP_SIZE - plant.size));
    savePlants(
      plants.map((p) =>
        p.id === movingId ? { ...p, x: clampedX, y: clampedY } : p
      )
    );
    setMovingId(null);
  }, [movingId, plants, savePlants]);

  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      if (movingId) {
        runOnJS(handleMapTap)(e.absoluteX, e.absoluteY);
      }
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 0.15), 3);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composed = Gesture.Race(
    tapGesture,
    Gesture.Simultaneous(panGesture, pinchGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    transformOrigin: "top left",
  }));

  const filteredCatalog = PLANT_CATALOG.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const findFreePosition = (): { x: number; y: number } => {
    const startX = MAP_SIZE / 2 - (GRID_COLS * (DEFAULT_CELL + CELL_GAP)) / 2;
    const startY = MAP_SIZE / 2 - (GRID_ROWS * (DEFAULT_CELL + CELL_GAP)) / 2;
    for (let row = 0; row < GRID_ROWS * 3; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = startX + col * (DEFAULT_CELL + CELL_GAP);
        const y = startY + row * (DEFAULT_CELL + CELL_GAP);
        const occupied = plants.some(
          (p) =>
            x < p.x + p.size &&
            x + DEFAULT_CELL > p.x &&
            y < p.y + p.size &&
            y + DEFAULT_CELL > p.y
        );
        if (!occupied) return { x, y };
      }
    }
    return { x: CELL_GAP, y: CELL_GAP };
  };

  const [pendingPlant, setPendingPlant] = useState<PlantType | null>(null);

  const onCatalogSelect = (plantType: PlantType) => {
    if (sondes.length > 0) {
      setPendingPlant(plantType);
    } else {
      addPlantWithSonde(plantType, null);
    }
  };

  const addPlantWithSonde = (plantType: PlantType, sondeId: string | null) => {
    const pos = findFreePosition();
    const newPlants = [
      ...plants,
      {
        id: `placed_${++plantIdCounter}`,
        plantType,
        x: pos.x,
        y: pos.y,
        size: DEFAULT_CELL,
        quantity: 1,
        sondeId,
      },
    ];
    savePlants(newPlants);
    setShowCatalog(false);
    setSearchQuery("");
    setPendingPlant(null);
  };

  const removePlant = (id: string) => {
    savePlants(plants.filter((p) => p.id !== id));
    setSelectedPlant(null);
  };

  const updatePlant = () => {
    if (!editingPlant) return;
    const s = parseInt(editSize) || DEFAULT_CELL;
    const q = parseInt(editQuantity) || 1;
    if (q > 20) {
      setEditError("Maximum 20 par carré !");
      return;
    }
    if (q < 1) {
      setEditError("Minimum 1 par carré !");
      return;
    }
    savePlants(
      plants.map((p) =>
        p.id === editingPlant.id
          ? { ...p, size: Math.max(80, Math.min(s, 400)), quantity: q }
          : p
      )
    );
    setEditingPlant(null);
    setEditError("");
  };

  const recenterOnPlants = () => {
    if (plants.length === 0) return;
    let minX = MAP_SIZE, minY = MAP_SIZE, maxX = 0, maxY = 0;
    plants.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x + p.size > maxX) maxX = p.x + p.size;
      if (p.y + p.size > maxY) maxY = p.y + p.size;
    });
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const contentW = maxX - minX + 100;
    const contentH = maxY - minY + 100;
    const newScale = Math.min(
      SCREEN_WIDTH / contentW,
      mapAreaHeight / contentH,
      1.5
    );
    const newX = SCREEN_WIDTH / 2 - centerX * newScale;
    const newY = mapAreaHeight / 2 - centerY * newScale;
    scale.value = withSpring(newScale);
    savedScale.value = newScale;
    translateX.value = withSpring(newX);
    translateY.value = withSpring(newY);
    savedTranslateX.value = newX;
    savedTranslateY.value = newY;
  };

  const zoomIn = () => {
    scale.value = withSpring(Math.min(scale.value * 1.3, 3));
    savedScale.value = Math.min(savedScale.value * 1.3, 3);
  };
  const zoomOut = () => {
    scale.value = withSpring(Math.max(scale.value * 0.7, 0.15));
    savedScale.value = Math.max(savedScale.value * 0.7, 0.15);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
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

        <GestureDetector gesture={composed}>
          <Animated.View style={styles.mapContainer}>
            <Animated.View style={[styles.map, animatedStyle]}>
              {GRASS_DECORATIONS.map((g, i) => (
                <Text
                  key={`grass_${i}`}
                  style={[
                    styles.grassDeco,
                    { left: g.x, top: g.y, fontSize: g.size },
                  ]}
                >
                  {g.emoji}
                </Text>
              ))}

              {plants.map((plant) => (
                <TouchableOpacity
                  key={plant.id}
                  style={[
                    styles.plantCard,
                    {
                      left: plant.x,
                      top: plant.y,
                      width: plant.size,
                      height: plant.size + 36,
                    },
                    movingId === plant.id && styles.plantCardMoving,
                  ]}
                  onPress={() => {
                    if (movingId === plant.id) {
                      setMovingId(null);
                    } else {
                      setSelectedPlant(plant);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.plantContent}>
                    <View style={styles.emojiGrid}>
                      {Array.from({ length: Math.min(plant.quantity, 20) }).map(
                        (_, i) => (
                          <Text
                            key={i}
                            style={{
                              fontSize:
                                plant.quantity === 1
                                  ? 46
                                  : plant.quantity <= 4
                                  ? 26
                                  : plant.quantity <= 9
                                  ? 18
                                  : 14,
                            }}
                          >
                            {plant.plantType.emoji}
                          </Text>
                        )
                      )}
                    </View>
                    <Text style={styles.plantLabel}>
                      {plant.plantType.name} x{plant.quantity}
                    </Text>
                    {plant.sondeId && (
                      <View style={styles.sondeIndicator}>
                        <Feather name="radio" size={10} color="#FFF" />
                        <Text style={styles.sondeIndicatorText}>
                          {sondes.find((s) => s.id === plant.sondeId)?.name?.split(" ")[1] || "Sonde"}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.crudBar}>
                    <TouchableOpacity
                      style={styles.crudBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setEditingPlant(plant);
                        setEditSize(String(plant.size));
                        setEditQuantity(String(plant.quantity));
                        setEditError("");
                      }}
                    >
                      <Feather name="edit-2" size={12} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.crudBtn, styles.crudBtnDelete]}
                      onPress={(e) => {
                        e.stopPropagation();
                        removePlant(plant.id);
                      }}
                    >
                      <Feather name="trash-2" size={12} color="#FF4444" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.crudBtn,
                        movingId === plant.id && styles.crudBtnActive,
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        setMovingId(movingId === plant.id ? null : plant.id);
                      }}
                    >
                      <Feather
                        name="move"
                        size={12}
                        color={movingId === plant.id ? "#FFF" : "#666"}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}

              {plants.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🌱</Text>
                  <Text style={styles.emptyText}>Votre jardin est vide</Text>
                  <Text style={styles.emptySubtext}>
                    Appuyez sur + pour ajouter des plantes
                  </Text>
                </View>
              )}
            </Animated.View>

            <View style={styles.zoomControls}>
              <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn}>
                <Feather name="plus" size={18} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut}>
                <Feather name="minus" size={18} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.zoomBtn} onPress={recenterOnPlants}>
                <Feather name="crosshair" size={18} color="#333" />
              </TouchableOpacity>
            </View>

            {showAddMenu && (
              <View style={styles.addMenu}>
                <TouchableOpacity
                  style={styles.addMenuItem}
                  onPress={() => { setShowAddMenu(false); setShowCatalog(true); }}
                >
                  <Feather name="feather" size={20} color="#2E7D32" />
                  <Text style={styles.addMenuText}>Plante</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addMenuItem}
                  onPress={() => { setShowAddMenu(false); setShowSondeList(true); }}
                >
                  <Feather name="radio" size={20} color="#1565C0" />
                  <Text style={styles.addMenuText}>Ressource</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddMenu(!showAddMenu)}
            >
              <Feather name="plus" size={26} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>

        <Modal visible={showCatalog} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.catalogModal}>
              <View style={styles.catalogHeader}>
                <Text style={styles.catalogTitle}>Ajouter une plante</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowCatalog(false);
                    setSearchQuery("");
                  }}
                >
                  <Feather name="x" size={24} color="#2B2B2B" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchBar}>
                <Feather name="search" size={18} color="#999" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher un fruit, légume..."
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
                contentContainerStyle={styles.catalogGrid}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.catalogItem}
                    onPress={() => onCatalogSelect(item)}
                  >
                    <Text style={styles.catalogEmoji}>{item.emoji}</Text>
                    <Text style={styles.catalogName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />

              {pendingPlant && (
                <View style={styles.sondePickerOverlay}>
                  <View style={styles.sondePickerCard}>
                    <Text style={styles.sondePickerTitle}>
                      {pendingPlant.emoji} Lier à une sonde ?
                    </Text>
                    {sondes.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={styles.sondePickerItem}
                        onPress={() => addPlantWithSonde(pendingPlant, s.id)}
                      >
                        <Feather name="radio" size={16} color="#1565C0" />
                        <Text style={styles.sondePickerItemText}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={styles.sondePickerSkip}
                      onPress={() => addPlantWithSonde(pendingPlant, null)}
                    >
                      <Text style={styles.sondePickerSkipText}>Sans sonde</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sondePickerCancel}
                      onPress={() => setPendingPlant(null)}
                    >
                      <Text style={styles.sondePickerCancelText}>Annuler</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <Modal
          visible={selectedPlant !== null}
          animationType="fade"
          transparent
        >
          <TouchableOpacity
            style={styles.detailOverlay}
            activeOpacity={1}
            onPress={() => setSelectedPlant(null)}
          >
            <View style={styles.detailModal}>
              {selectedPlant && (
                <>
                  <Text style={styles.detailEmoji}>
                    {selectedPlant.plantType.emoji}
                  </Text>
                  <Text style={styles.detailName}>
                    {selectedPlant.plantType.name}
                  </Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Quantité</Text>
                    <Text style={styles.detailValue}>
                      {selectedPlant.quantity}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Taille du carré</Text>
                    <Text style={styles.detailValue}>
                      {selectedPlant.size}px
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Catégorie</Text>
                    <Text style={styles.detailValue}>
                      {selectedPlant.plantType.category === "fruit"
                        ? "Fruit"
                        : selectedPlant.plantType.category === "legume"
                        ? "Légume"
                        : "Herbe aromatique"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Sonde</Text>
                    {selectedPlant.sondeId ? (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          linkPlantToSonde(selectedPlant.id, null);
                          setSelectedPlant({ ...selectedPlant, sondeId: null });
                        }}
                      >
                        <Text style={[styles.detailValue, { color: "#1565C0" }]}>
                          📡 {sondes.find((s) => s.id === selectedPlant.sondeId)?.name || "Sonde"} ✕
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
                              linkPlantToSonde(selectedPlant.id, s.id);
                              setSelectedPlant({ ...selectedPlant, sondeId: s.id });
                            }}
                          >
                            <Feather name="radio" size={10} color="#1565C0" />
                            <Text style={styles.sondeLinkText}>{s.name.split(" ")[1]}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <Text style={[styles.detailValue, { color: "#bbb" }]}>
                        Aucune sonde
                      </Text>
                    )}
                  </View>

                  <View style={styles.detailBtns}>
                    <TouchableOpacity
                      style={styles.detailBtnEdit}
                      onPress={() => {
                        setSelectedPlant(null);
                        setEditingPlant(selectedPlant);
                        setEditSize(String(selectedPlant.size));
                        setEditQuantity(String(selectedPlant.quantity));
                        setEditError("");
                      }}
                    >
                      <Feather name="edit-2" size={15} color="#2196F3" />
                      <Text style={styles.detailBtnEditText}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detailBtnDelete}
                      onPress={() => removePlant(selectedPlant.id)}
                    >
                      <Feather name="trash-2" size={15} color="#FF4444" />
                      <Text style={styles.detailBtnDeleteText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={editingPlant !== null}
          animationType="fade"
          transparent
        >
          <View style={styles.detailOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => {
                setEditingPlant(null);
                setEditError("");
              }}
            />
            <View style={styles.editModal}>
              <Text style={styles.editTitle}>Modifier</Text>
              {editingPlant && (
                <Text style={styles.editSubtitle}>
                  {editingPlant.plantType.emoji} {editingPlant.plantType.name}
                </Text>
              )}
              <View style={styles.editRow}>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Taille (px)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editSize}
                    onChangeText={setEditSize}
                    keyboardType="numeric"
                    placeholder="140"
                  />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Quantité (max 20)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editQuantity}
                    onChangeText={(v) => {
                      setEditQuantity(v);
                      setEditError("");
                    }}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                </View>
              </View>
              {editError ? (
                <Text style={styles.editErrorText}>{editError}</Text>
              ) : null}
              <TouchableOpacity
                style={styles.editSaveBtn}
                onPress={updatePlant}
              >
                <Text style={styles.editSaveBtnText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showSondeList} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.catalogModal}>
              <View style={styles.catalogHeader}>
                <Text style={styles.catalogTitle}>Mes ressources</Text>
                <TouchableOpacity onPress={() => setShowSondeList(false)}>
                  <Feather name="x" size={24} color="#2B2B2B" />
                </TouchableOpacity>
              </View>

              {sondes.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.sondeSectionTitle}>Ajoutées</Text>
                  {sondes.map((s) => (
                    <View key={s.id} style={styles.sondeListItem}>
                      <View style={styles.sondeListIcon}>
                        <Feather name="radio" size={22} color="#1565C0" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sondeListName}>{s.name}</Text>
                        <Text style={styles.sondeListAdded}>
                          {plants.filter((p) => p.sondeId === s.id).length} plante(s) liée(s)
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeSonde(s.id)}>
                        <Feather name="trash-2" size={18} color="#FF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.sondeSectionTitle}>Disponibles</Text>
              {SONDE_TYPES.map((type) => {
                const alreadyAdded = sondes.some((s) => s.name === type.name);
                if (alreadyAdded) return null;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={styles.sondeListItem}
                    onPress={() => addSonde(type)}
                  >
                    <View style={styles.sondeListIcon}>
                      <Feather name={type.icon} size={22} color="#1565C0" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sondeListName}>{type.name}</Text>
                    </View>
                    <Feather name="plus-circle" size={22} color="#1565C0" />
                  </TouchableOpacity>
                );
              })}
              {SONDE_TYPES.every((t) => sondes.some((s) => s.name === t.name)) && (
                <Text style={styles.sondeListAdded}>Toutes les sondes sont ajoutées</Text>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#63FFA4",
  },

  header: {
    backgroundColor: "#63FFA4",
    paddingTop: 6,
    paddingBottom: 14,
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
  arrowButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  gardenName: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#1B1B1B",
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

  grassDeco: {
    position: "absolute",
    opacity: 0.5,
  },

  plantCard: {
    position: "absolute",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 6,
  },
  plantContent: {
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
  plantLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  plantCardMoving: {
    borderColor: "#2196F3",
    borderWidth: 3,
    backgroundColor: "rgba(33,150,243,0.15)",
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

  zoomControls: {
    position: "absolute",
    right: 14,
    top: 14,
    gap: 6,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    backgroundColor: "#FFF",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  addButton: {
    position: "absolute",
    right: 14,
    bottom: 14,
    width: 54,
    height: 54,
    backgroundColor: "#2E7D32",
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  catalogModal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
    padding: 20,
  },
  catalogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  catalogTitle: {
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
  catalogGrid: {
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

  detailModal: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    width: SCREEN_WIDTH - 40,
    padding: 24,
    alignItems: "center",
  },
  detailEmoji: {
    fontSize: 64,
    marginBottom: 6,
  },
  detailName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1B1B1B",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailLabel: {
    fontSize: 13,
    color: "#999",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B1B1B",
  },
  detailBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    width: "100%",
  },
  detailBtnEdit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E3F2FD",
  },
  detailBtnEditText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2196F3",
  },
  detailBtnDelete: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFEBEE",
  },
  detailBtnDeleteText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF4444",
  },

  editModal: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    width: SCREEN_WIDTH - 40,
    padding: 24,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B1B1B",
    marginBottom: 2,
  },
  editSubtitle: {
    fontSize: 14,
    color: "#999",
    marginBottom: 18,
  },
  editRow: {
    flexDirection: "row",
    gap: 12,
  },
  editField: {
    flex: 1,
  },
  editLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 6,
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#1B1B1B",
  },
  editErrorText: {
    color: "#FF4444",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  editSaveBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  editSaveBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
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
  sondeIndicatorText: {
    fontSize: 8,
    fontWeight: "600",
    color: "#FFF",
  },

  sondeCard: {
    position: "absolute",
    backgroundColor: "#1565C0",
    borderRadius: 14,
    padding: 8,
    alignItems: "center",
    width: 80,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sondeCardLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: "#FFF",
    marginTop: 4,
    textAlign: "center",
  },
  sondeDeleteBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    backgroundColor: "#FFF",
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },

  addMenu: {
    position: "absolute",
    right: 14,
    bottom: 78,
    gap: 8,
  },
  addMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  addMenuText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1B1B1B",
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

  sondeListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sondeListItemDisabled: {
    opacity: 0.5,
  },
  sondeListIcon: {
    width: 44,
    height: 44,
    backgroundColor: "#E3F2FD",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  sondeListName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1B1B1B",
  },
  sondeListAdded: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  sondeSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
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
