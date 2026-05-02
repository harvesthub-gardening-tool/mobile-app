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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { PlacedPlant, PlacedSonde, PlantType } from "../../types/garden";
import { PLANT_CATALOG } from "../../constants/garden";
import { getSondeDisplayName } from "../../utils/sondeDisplay";
import { colors } from "../../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type PlantDetailModalProps = {
  plant: PlacedPlant | null;
  sondes: PlacedSonde[];
  startInEditMode?: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    plantType: PlantType,
    width: number,
    height: number,
    quantity: number,
  ) => void;
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
  startInEditMode = false,
  onClose,
  onSave,
  onDelete,
  onLinkSonde,
}: PlantDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [selectedPlantType, setSelectedPlantType] = useState<PlantType | null>(
    null,
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (plant) {
      setSelectedPlantType(plant.plantType);
      setSearch("");
      setEditing(startInEditMode);
    }
  }, [plant, startInEditMode]);

  if (!plant) return null;

  const isEditing = editing || startInEditMode;
  const currentType = selectedPlantType ?? plant.plantType;

  const filteredCatalog = search.trim()
    ? PLANT_CATALOG.filter((p) =>
        p.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : PLANT_CATALOG;

  const handleClose = () => {
    setEditing(false);
    onClose();
  };

  const handleSave = () => {
    onSave(plant.id, currentType, plant.width, plant.height, 1);
    handleClose();
  };

  return (
    <Modal
      visible
      animationType={isEditing ? "slide" : "fade"}
      transparent
      onRequestClose={handleClose}
    >
      {/* Tap outside → ferme */}
      <TouchableOpacity
        style={[styles.overlay, isEditing && styles.editOverlay]}
        activeOpacity={1}
        onPress={handleClose}
      >
        {/* onStartShouldSetResponder stoppe la propagation vers l'overlay */}
        <View
          style={[styles.modal, isEditing && styles.editSheet]}
          onStartShouldSetResponder={() => true}
        >
          {isEditing ? (
            /* ── MODE ÉDITION ── */
            <>
              <View style={styles.editHeader}>
                <View>
                  <Text style={styles.editTitle}>Choisir une plante</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Feather name="x" size={18} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.selectedPlantPreview}>
                <Text style={styles.selectedPlantEmoji}>
                  {currentType.emoji}
                </Text>
                <View style={styles.selectedPlantCopy}>
                  <Text style={styles.selectedPlantLabel}>Sélection</Text>
                  <Text style={styles.selectedPlantName}>
                    {currentType.name}
                  </Text>
                </View>
              </View>

              <View style={styles.searchBar}>
                <Feather name="search" size={14} color={colors.text.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher une plante..."
                  placeholderTextColor={colors.text.muted}
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <Feather name="x" size={14} color={colors.text.muted} />
                  </TouchableOpacity>
                )}
              </View>

              <FlatList
                data={filteredCatalog}
                keyExtractor={(item) => item.id}
                numColumns={3}
                showsVerticalScrollIndicator={false}
                style={styles.plantGrid}
                contentContainerStyle={styles.plantGridContent}
                keyboardShouldPersistTaps="handled"
                extraData={currentType.id}
                ListEmptyComponent={
                  <View style={styles.noResultState}>
                    <Text style={styles.noResult}>Aucune plante</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isSelected = currentType.id === item.id;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Associer ${item.name}`}
                      style={[
                        styles.plantGridItem,
                        isSelected && styles.plantGridItemSelected,
                      ]}
                      activeOpacity={0.86}
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
                      {isSelected && (
                        <View style={styles.selectedCheck}>
                          <Feather name="check" size={12} color={colors.text.onDark} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />

              <View style={styles.editFooter}>
                <TouchableOpacity
                  style={styles.btnCancel}
                  onPress={handleClose}
                >
                  <Text style={styles.btnCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
                  <Feather name="check" size={15} color={colors.text.onDark} />
                  <Text style={styles.btnSaveText}>Associer</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* ── MODE DÉTAIL ── */
            <>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.emoji}>{currentType.emoji}</Text>
                <Text style={styles.name}>{currentType.name}</Text>
                <Text style={styles.category}>
                  {getCategoryLabel(currentType.category)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Ensoleillement</Text>
                <Text style={[styles.value, { color: colors.text.muted }]}> 
                  Pas de données
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Sonde</Text>
                {(() => {
                  const linked = sondes.find((s) => s.id === plant.sondeId);
                  return linked ? (
                    <View
                      style={[styles.sondeLinkBtn, styles.sondeLinkBtnActive]}
                    >
                      <Feather
                        name="check-circle"
                        size={10}
                        color={colors.text.onDark}
                      />
                      <Text
                        style={[
                          styles.sondeLinkText,
                          styles.sondeLinkTextActive,
                        ]}
                      >
                        {getSondeDisplayName(linked, sondes)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.value, { color: colors.text.muted }]}> 
                      Aucune sonde
                    </Text>
                  );
                })()}
              </View>

              <View style={styles.btns}>
                <TouchableOpacity
                  style={[styles.btnDelete, styles.btnDeleteSingle]}
                  onPress={() => onDelete(plant.id)}
                >
                  <Feather name="trash-2" size={15} color={colors.state.danger} />
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
    backgroundColor: colors.overlay.backdrop,
    justifyContent: "center",
    alignItems: "center",
  },
  editOverlay: {
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: colors.surface.base,
    borderRadius: 24,
    width: SCREEN_WIDTH - 40,
    padding: 24,
    alignItems: "center",
    maxHeight: "85%",
  },
  editSheet: {
    width: "100%",
    maxHeight: "88%",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 22,
    alignItems: "stretch",
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
    color: colors.text.primary,
  },
  category: {
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 2,
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text.primary,
  },
  editSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  selectedPlantPreview: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface.subtle,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  selectedPlantEmoji: {
    fontSize: 36,
  },
  selectedPlantCopy: {
    flex: 1,
  },
  selectedPlantLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.brand.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selectedPlantName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text.primary,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface.soft,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    padding: 0,
  },
  plantGrid: {
    maxHeight: 326,
  },
  plantGridContent: {
    paddingBottom: 8,
  },
  plantGridItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 88,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 18,
    margin: 4,
    backgroundColor: colors.surface.subtle,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    position: "relative",
  },
  plantGridItemSelected: {
    backgroundColor: colors.state.successSoft,
    borderWidth: 2,
    borderColor: colors.border.accent,
  },
  plantEmoji: {
    fontSize: 34,
  },
  plantName: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  plantNameSelected: {
    color: colors.brand.primary,
    fontWeight: "800",
  },
  selectedCheck: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  noResult: {
    fontSize: 13,
    color: colors.text.muted,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.soft,
  },
  label: {
    fontSize: 13,
    color: colors.text.muted,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.primary,
  },
  btns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    width: "100%",
    marginBottom: 4,
  },
  editFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  btnDelete: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.state.dangerSoft,
  },
  btnDeleteSingle: {
    flex: 2,
  },
  btnDeleteText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.state.danger,
  },
  btnSave: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brand.primary,
  },
  btnSaveText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.onDark,
  },
  btnCancel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface.soft,
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  sondeLinkRow: {
    flexDirection: "row",
    gap: 6,
  },
  sondeLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.state.infoSoft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sondeLinkBtnActive: {
    backgroundColor: colors.brand.secondary,
  },
  sondeLinkText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.brand.secondary,
  },
  sondeLinkTextActive: {
    color: colors.text.onDark,
  },
});
