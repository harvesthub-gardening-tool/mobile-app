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
import {
  createMotorCommand,
  getMotorReasonPresentation,
  pollMotorCommandStatus,
} from "../../services/controlService";
import { getSondeDisplayName } from "../../utils/sondeDisplay";
import { colors, withAlpha } from "../../theme";
import type { MotorCommand } from "@harvesthub-gardening-tool/protos-typescript/control/v1/control_pb";
import { MotorCommandStatus } from "@harvesthub-gardening-tool/protos-typescript/control/v1/control_pb";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DEFAULT_MOTOR_DURATION_MS = 3000;

const NON_TERMINAL_MOTOR_STATUSES = new Set<MotorCommandStatus>([
  MotorCommandStatus.QUEUED,
  MotorCommandStatus.LEASED_TO_HUB,
  MotorCommandStatus.SENT_TO_PROBE,
  MotorCommandStatus.EXECUTING,
]);

type PlantDetailModalProps = {
  plant: PlacedPlant | null;
  sondes: PlacedSonde[];
  startInEditMode?: boolean;
  onClose: () => void;
  onSave: (id: string, plantType: PlantType, width: number, height: number, quantity: number) => void;
  onDelete: (id: string) => void;
  onLinkSonde: (plantId: string, sondeId: string | null) => void;
};

function getCategoryLabel(category: string): string {
  if (category === "fruit") return "Fruit";
  if (category === "legume") return "Légume";
  return "Herbe aromatique";
}

function getMotorStatusLabel(command: MotorCommand | null): string | null {
  const status = command?.status ?? null;
  const reasonPresentation = getMotorReasonPresentation(command);

  switch (status) {
    case MotorCommandStatus.QUEUED:
      return "Commande en attente...";
    case MotorCommandStatus.LEASED_TO_HUB:
      return "Commande transmise au hub...";
    case MotorCommandStatus.SENT_TO_PROBE:
      return "Commande envoyée à la sonde...";
    case MotorCommandStatus.EXECUTING:
      return "Arrosage en cours...";
    case MotorCommandStatus.SUCCEEDED:
      return "Arrosage terminé avec succès.";
    case MotorCommandStatus.FAILED:
      return reasonPresentation?.message ?? "Échec de la commande. Vous pouvez réessayer.";
    case MotorCommandStatus.EXPIRED:
      return reasonPresentation?.message ?? "Commande expirée avant exécution. Vous pouvez réessayer.";
    case MotorCommandStatus.CANCELLED:
      return "Commande annulée. Vous pouvez réessayer.";
    default:
      return null;
  }
}

export function PlantDetailModal({
  plant,
  sondes,
  startInEditMode = false,
  onClose,
  onSave,
  onDelete,
}: PlantDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [selectedPlantType, setSelectedPlantType] = useState<PlantType | null>(null);
  const [search, setSearch] = useState("");
  const [motorCommand, setMotorCommand] = useState<MotorCommand | null>(null);
  const [motorCommandNodeId, setMotorCommandNodeId] = useState<string | null>(null);
  const [motorLoading, setMotorLoading] = useState(false);
  const [motorError, setMotorError] = useState<string | null>(null);

  useEffect(() => {
    if (plant) {
      setSelectedPlantType(plant.plantType);
      setSearch("");
      setEditing(startInEditMode);
      setMotorCommand(null);
      setMotorCommandNodeId(null);
      setMotorLoading(false);
      setMotorError(null);
    }
  }, [plant, startInEditMode]);

  if (!plant) return null;

  const isEditing = editing || startInEditMode;
  const currentType = selectedPlantType ?? plant.plantType;
  const linkedSonde = plant.sondeId
    ? sondes.find((s) => s.id === plant.sondeId)
    : null;
  const linkedNodeId = linkedSonde?.nodeId.trim() ?? "";
  const linkedHubId = linkedSonde?.hubId?.trim() ?? "";
  const canTriggerMotor = linkedNodeId.length > 0 && linkedHubId.length > 0;
  const motorStatus = motorCommand?.status ?? null;
  const motorStatusLabel = getMotorStatusLabel(motorCommand);
  const hasActiveCommandForProbe =
    motorCommandNodeId === linkedNodeId && motorStatus !== null && NON_TERMINAL_MOTOR_STATUSES.has(motorStatus);
  const motorActionDisabled = motorLoading || hasActiveCommandForProbe;

  const filteredCatalog = search.trim()
    ? PLANT_CATALOG.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : PLANT_CATALOG;

  const handleClose = () => {
    setEditing(false);
    onClose();
  };

  const handleSave = () => {
    onSave(plant.id, currentType, plant.width, plant.height, 1);
    handleClose();
  };

  const handleMotorTrigger = async () => {
    if (!linkedSonde || !canTriggerMotor || motorActionDisabled) return;

    setMotorLoading(true);
    setMotorError(null);
    setMotorCommand(null);
    setMotorCommandNodeId(linkedNodeId);

    try {
      const response = await createMotorCommand(linkedHubId, linkedNodeId, DEFAULT_MOTOR_DURATION_MS);
      const command = response.command ?? null;
      setMotorCommand(command);

      if (command?.commandId && NON_TERMINAL_MOTOR_STATUSES.has(command.status)) {
        const result = await pollMotorCommandStatus(command.commandId, {
          onStatusChange: (_status, updatedCommand) => setMotorCommand(updatedCommand),
        });
        setMotorCommand(result.command);
      }
    } catch (err: unknown) {
      setMotorError(err instanceof Error ? err.message : "Impossible de lancer la commande moteur.");
    } finally {
      setMotorLoading(false);
    }
  };

  return (
    <Modal
      visible
      animationType={isEditing ? "slide" : "fade"}
      transparent
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={[styles.overlay, isEditing && styles.editOverlay]}
        activeOpacity={1}
        onPress={handleClose}
      >
        <View style={[styles.modal, isEditing && styles.editSheet]} onStartShouldSetResponder={() => true}>
          {isEditing ? (
            <>
              <View style={styles.editHeader}>
                <View>
                  <Text style={styles.editTitle}>Choisir une plante</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                  <Feather name="x" size={18} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.selectedPlantPreview}>
                <Text style={styles.selectedPlantEmoji}>{currentType.emoji}</Text>
                <View style={styles.selectedPlantCopy}>
                  <Text style={styles.selectedPlantLabel}>Sélection</Text>
                  <Text style={styles.selectedPlantName}>{currentType.name}</Text>
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
                      style={[styles.plantGridItem, isSelected && styles.plantGridItemSelected]}
                      activeOpacity={0.86}
                      onPress={() => setSelectedPlantType(item)}
                    >
                      <Text style={styles.plantEmoji}>{item.emoji}</Text>
                      <Text style={[styles.plantName, isSelected && styles.plantNameSelected]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.selectedCheck}>
                          <Feather name="check" size={12} color={colors.text.onPrimary} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />

              <View style={styles.editFooter}>
                <TouchableOpacity style={styles.btnCancel} onPress={handleClose}>
                  <Text style={styles.btnCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
                  <Feather name="check" size={15} color={colors.text.onPrimary} />
                  <Text style={styles.btnSaveText}>Associer</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.emoji}>{currentType.emoji}</Text>
                <Text style={styles.name}>{currentType.name}</Text>
                <Text style={styles.category}>{getCategoryLabel(currentType.category)}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Ensoleillement</Text>
                <Text style={[styles.value, { color: colors.text.muted }]}>Pas de données</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Sonde</Text>
                {(() => {
                  return linkedSonde ? (
                    <View style={[styles.sondeLinkBtn, styles.sondeLinkBtnActive]}>
                      <Feather name="check-circle" size={10} color={colors.text.onPrimary} />
                      <Text style={[styles.sondeLinkText, styles.sondeLinkTextActive]}>
                        {getSondeDisplayName(linkedSonde, sondes)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.value, { color: colors.text.muted }]}>Aucune sonde</Text>
                  );
                })()}
              </View>

              {canTriggerMotor && (
                <View style={styles.motorPanel}>
                  <View style={styles.motorPanelCopy}>
                    <Text style={styles.motorTitle}>Commande moteur</Text>
                    <Text style={styles.motorHint}>
                      Lance un arrosage court et sécurisé de {DEFAULT_MOTOR_DURATION_MS / 1000}s.
                    </Text>
                    {motorLoading && !motorStatusLabel ? (
                      <Text style={styles.motorStatus}>Création de la commande...</Text>
                    ) : null}
                    {motorStatusLabel ? (
                      <Text
                        style={[
                          styles.motorStatus,
                          motorStatus === MotorCommandStatus.SUCCEEDED && styles.motorStatusSuccess,
                          (motorStatus === MotorCommandStatus.FAILED || motorStatus === MotorCommandStatus.EXPIRED) &&
                            styles.motorStatusDanger,
                        ]}
                      >
                        {motorStatusLabel}
                      </Text>
                    ) : null}
                    {motorError ? <Text style={styles.motorStatusDanger}>{motorError}</Text> : null}
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Lancer le moteur de la sonde"
                    style={[styles.motorButton, motorActionDisabled && styles.motorButtonDisabled]}
                    disabled={motorActionDisabled}
                    activeOpacity={0.86}
                    onPress={handleMotorTrigger}
                  >
                    <Feather name="droplet" size={15} color={colors.text.onPrimary} />
                    <Text style={styles.motorButtonText}>
                      {motorActionDisabled ? "En cours" : "Arroser"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.btns}>
                <TouchableOpacity style={[styles.btnDelete, styles.btnDeleteSingle]} onPress={() => onDelete(plant.id)}>
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
    backgroundColor: colors.surface.lowest,
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
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface.low,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedPlantPreview: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface.low,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: withAlpha(colors.border.subtle, 0.2),
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
    backgroundColor: colors.surface.low,
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
    borderRadius: 24,
    margin: 4,
    backgroundColor: colors.surface.low,
    borderWidth: 1,
    borderColor: withAlpha(colors.border.subtle, 0.2),
    position: "relative",
  },
  plantGridItemSelected: {
    backgroundColor: colors.state.successSoft,
    borderWidth: 2,
    borderColor: colors.brand.primary,
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
    borderBottomColor: withAlpha(colors.border.subtle, 0.2),
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
    borderRadius: 24,
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
    borderRadius: 24,
    backgroundColor: colors.brand.primary,
  },
  btnSaveText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.onPrimary,
  },
  btnCancel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 24,
    backgroundColor: colors.surface.low,
    borderWidth: 1,
    borderColor: withAlpha(colors.border.subtle, 0.2),
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
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
    color: colors.text.onPrimary,
  },
  motorPanel: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.surface.low,
    borderWidth: 1,
    borderColor: withAlpha(colors.border.subtle, 0.2),
  },
  motorPanelCopy: {
    flex: 1,
  },
  motorTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text.primary,
  },
  motorHint: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 3,
  },
  motorStatus: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.brand.secondary,
    marginTop: 6,
  },
  motorStatusSuccess: {
    color: colors.state.success,
  },
  motorStatusDanger: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.state.danger,
    marginTop: 6,
  },
  motorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minWidth: 94,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.primary,
  },
  motorButtonDisabled: {
    opacity: 0.56,
  },
  motorButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text.onPrimary,
  },
});
