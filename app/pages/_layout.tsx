import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import BottomMenu from "@/components/BottomMenu";
import { colors } from "@/theme";

export default function PagesLayout() {
    return (
        <View style={styles.container}>
            <Tabs
                tabBar={() => null}
                screenOptions={{
                    headerShown: false,
                    freezeOnBlur: false,
                }}
            />
            <BottomMenu />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
});
