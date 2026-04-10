import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

type ZoomControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
};

export function ZoomControls({ onZoomIn, onZoomOut, onRecenter }: ZoomControlsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={onZoomIn}>
        <Feather name="plus" size={18} color="#333" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={onZoomOut}>
        <Feather name="minus" size={18} color="#333" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={onRecenter}>
        <Feather name="crosshair" size={18} color="#333" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 14,
    top: 14,
    gap: 6,
  },
  btn: {
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
});
