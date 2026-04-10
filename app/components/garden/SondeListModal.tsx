import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SONDE_TYPES } from "../../constants/garden";
import type { PlacedSonde, PlacedPlant } from "../../types/garden";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type SondeListModalProps = {
  visible: boolean;
  sondes: PlacedSonde[];
  plants: PlacedPlant[];
  onClose: () => void;
  onAddSonde: (type: (typeof SONDE_TYPES)[number]) => void;
  onRemoveSonde: (id: string) => void;
};

export function SondeListModal({
  visible,
  sondes,
  plants,
  onClose,
  onAddSonde,
  onRemoveSonde,
}: SondeListModalProps) {
  const allAdded = SONDE_TYPES.every((t) =>
    sondes.some((s) => s.name === t.name),
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Mes ressources</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#2B2B2B" />
            </TouchableOpacity>
          </View>

          {sondes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ajout\u00e9es</Text>
              {sondes.map((s) => (
                <View key={s.id} style={styles.listItem}>
                  <View style={styles.listIcon}>
                    <Feather name="radio" size={22} color="#1565C0" />
                  </View>
                  <View style={styles.listContent}>
                    <Text style={styles.listName}>{s.name}</Text>
                    <Text style={styles.listSub}>
                      {plants.filter((p) => p.sondeId === s.id).length}{" "}
                      plante(s) li\u00e9e(s)
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => onRemoveSonde(s.id)}>
                    <Feather name="trash-2" size={18} color="#FF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>Disponibles</Text>
          {SONDE_TYPES.map((type) => {
            const alreadyAdded = sondes.some((s) => s.name === type.name);
            if (alreadyAdded) return null;
            return (
              <TouchableOpacity
                key={type.id}
                style={styles.listItem}
                onPress={() => onAddSonde(type)}
              >
                <View style={styles.listIcon}>
                  <Feather name={type.icon} size={22} color="#1565C0" />
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listName}>{type.name}</Text>
                </View>
                <Feather name="plus-circle" size={22} color="#1565C0" />
              </TouchableOpacity>
            );
          })}
          {allAdded && (
            <Text style={styles.listSub}>
              Toutes les sondes sont ajout\u00e9es
            </Text>
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
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  listIcon: {
    width: 44,
    height: 44,
    backgroundColor: "#E3F2FD",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flex: 1,
  },
  listName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1B1B1B",
  },
  listSub: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
});
