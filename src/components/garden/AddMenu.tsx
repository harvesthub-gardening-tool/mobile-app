import { TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, withAlpha } from "../../theme";

type AddMenuProps = {
    onPress: () => void;
};

export function AddMenu({
    onPress,
}: AddMenuProps) {
    return (
        <TouchableOpacity style={styles.fab} onPress={onPress}>
            <Feather name="plus" size={26} color={colors.text.onPrimary} />
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
        backgroundColor: colors.brand.primary,
        borderRadius: 27,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: colors.overlay.shadow,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.2),
    },
});
