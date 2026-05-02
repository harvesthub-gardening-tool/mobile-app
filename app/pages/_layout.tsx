import { Slot } from "expo-router";
import { View, StyleSheet } from "react-native";
import BottomMenu from "../components/BottomMenu";
import { colors } from "../theme";

export default function PagesLayout() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Slot />
            </View>
            <BottomMenu />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
    content: { flex: 1 },
});
