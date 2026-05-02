import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, withAlpha } from "../../theme";

type ZoomControlsProps = {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onRecenter: () => void;
};

export function ZoomControls({
    onZoomIn,
    onZoomOut,
    onRecenter,
}: ZoomControlsProps) {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.btn} onPress={onZoomIn}>
                <Feather name="plus" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={onZoomOut}>
                <Feather name="minus" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={onRecenter}>
                <Feather name="crosshair" size={18} color={colors.text.secondary} />
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
        backgroundColor: colors.surface.glass,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: colors.overlay.shadow,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.2),
    },
});
