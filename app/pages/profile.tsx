import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { colors, withAlpha } from "@/theme";

export default function Profile() {
    const { logout } = useAuth();
    const router = useRouter();
    return (
        <SafeAreaView style={styles.safe}>
            {}
            <View style={styles.header}>
                <View style={styles.avatarPlaceholder}>
                    <Feather name="user" size={36} color={colors.text.secondary} />
                </View>
            </View>

            {}
            <View style={styles.content}>
                {}
                <View style={styles.pillsRow}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.pillsScroll}
                    >
                        <View style={styles.pill}>
                            <Feather name="wifi" size={18} color={colors.text.secondary} />
                            <Text style={styles.pillText}>Wifi</Text>
                        </View>

                        <View style={styles.pill}>
                            <Feather
                                name="database"
                                size={18}
                                color={colors.text.secondary}
                            />
                            <Text style={styles.pillText}>Donnés</Text>
                        </View>

                        <View style={styles.pill}>
                            <Feather name="tool" size={18} color={colors.text.secondary} />
                            <Text style={styles.pillText}>Aide</Text>
                        </View>
                    </ScrollView>
                </View>

                {}
                <View style={styles.list}>
                    <Row icon="user" label="Mes informations" />
                    <Row
                        icon="cpu"
                        label="Paramètres des hubs"
                        onPress={() => router.push("./hubs")}
                    />
                    <Row icon="globe" label="Confidentialité" />
                    <Row icon="headphones" label="Support" />
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Feather name="log-out" size={18} color={colors.state.danger} />
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

function Row({
    icon,
    label,
    onPress,
}: {
    icon: React.ComponentProps<typeof Feather>["name"];
    label: string;
    onPress?: () => void;
}) {
    return (
        <TouchableOpacity activeOpacity={0.85} style={styles.rowCard} onPress={onPress}>
            <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                    <Feather name={icon} size={18} color={colors.text.secondary} />
                </View>
                <Text style={styles.rowText}>{label}</Text>
            </View>

            <Feather name="chevron-right" size={18} color={colors.text.secondary} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface.base },

    header: {
        height: 220,
        backgroundColor: colors.brand.primary,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 10,
    },
    avatarPlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: withAlpha(colors.surface.lowest, 0.55),
        justifyContent: "center",
        alignItems: "center",
    },

    content: {
        flex: 1,
        marginTop: -28,
        backgroundColor: colors.surface.base,
        paddingHorizontal: 18,
    },

    pillsRow: {
        marginBottom: 18,
    },
    pillsScroll: {
        gap: 14,
        paddingLeft: 8,
        paddingRight: 8,
    },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: colors.surface.lowest,
        borderRadius: 24,
        paddingHorizontal: 18,
        height: 44,
        shadowColor: colors.overlay.shadow,
        shadowOpacity: 1,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: 12 },
        elevation: 2,
    },
    pillText: {
        fontSize: 12,
        color: colors.text.secondary,
        opacity: 0.8,
        fontWeight: "500",
    },

    list: {
        gap: 16,
        paddingHorizontal: 8,
    },
    rowCard: {
        backgroundColor: colors.surface.lowest,
        borderRadius: 24,
        paddingHorizontal: 16,
        height: 64,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        shadowColor: colors.overlay.shadow,
        shadowOpacity: 1,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: 12 },
        elevation: 2,
    },
    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    rowIcon: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    rowText: {
        fontSize: 13,
        color: colors.text.secondary,
        opacity: 0.7,
        fontWeight: "500",
    },

    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginTop: 28,
        marginHorizontal: 8,
        backgroundColor: colors.state.dangerSoft,
        borderRadius: 24,
        height: 52,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.state.danger,
    },
});
