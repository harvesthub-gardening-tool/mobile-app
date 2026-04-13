import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

type AddMenuProps = {
    visible: boolean;
    onToggle: () => void;
    onAddPlant: () => void;
    onAddSonde: () => void;
};

export function AddMenu({
    visible,
    onToggle,
    onAddPlant,
    onAddSonde,
}: AddMenuProps) {
    return (
        <>
            {visible && (
                <View style={styles.menu}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={onAddPlant}
                    >
                        <Feather name="feather" size={20} color="#2E7D32" />
                        <Text style={styles.menuText}>Plante</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={onAddSonde}
                    >
                        <Feather name="radio" size={20} color="#1565C0" />
                        <Text style={styles.menuText}>Ressource</Text>
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity style={styles.fab} onPress={onToggle}>
                <Feather name="plus" size={26} color="#FFF" />
            </TouchableOpacity>
        </>
    );
}

const styles = StyleSheet.create({
    menu: {
        position: "absolute",
        right: 14,
        bottom: 190,
        gap: 8,
    },
    menuItem: {
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
    menuText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1B1B1B",
    },
    fab: {
        position: "absolute",
        right: 14,
        bottom: 120,
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
});
