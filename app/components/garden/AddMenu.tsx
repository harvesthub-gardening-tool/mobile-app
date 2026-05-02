import { TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

type AddMenuProps = {
    onPress: () => void;
};

export function AddMenu({
    onPress,
}: AddMenuProps) {
    return (
        <TouchableOpacity style={styles.fab} onPress={onPress}>
            <Feather name="plus" size={26} color="#FFF" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
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
