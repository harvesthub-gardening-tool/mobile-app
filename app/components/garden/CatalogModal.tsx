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
import { colors, withAlpha } from "../../theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type CatalogModalProps = {
  visible: boolean;
  sondes: PlacedSonde[];
  onClose: () => void;
  onSelectPlant: (plantType: PlantType) => void;
};

export function CatalogModal({
  visible,
  sondes: _sondes,
  onClose,
  onSelectPlant,
}: CatalogModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCatalog = PLANT_CATALOG.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelect = (plantType: PlantType) => {
    onSelectPlant(plantType);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Ajouter une plante</Text>
            <TouchableOpacity onPress={handleClose}>
              <Feather name="x" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Feather name="search" size={18} color={colors.text.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un fruit, légume..."
              placeholderTextColor={colors.text.muted}
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
              <TouchableOpacity style={styles.catalogItem} onPress={() => handleSelect(item)}>
                <Text style={styles.catalogEmoji}>{item.emoji}</Text>
                <Text style={styles.catalogName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay.backdrop,
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: colors.surface.lowest,
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
    color: colors.text.primary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface.low,
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.primary,
  },
  grid: {
    paddingBottom: 20,
  },
  catalogItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    margin: 4,
    backgroundColor: colors.surface.low,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: withAlpha(colors.border.subtle, 0.2),
  },
  catalogEmoji: {
    fontSize: 38,
    marginBottom: 6,
  },
  catalogName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.secondary,
    textAlign: "center",
  },
});
