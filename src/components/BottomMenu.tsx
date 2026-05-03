import React, { useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { colors, withAlpha } from "../theme";

type MenuItem = {
    href: MenuHref;
    icon:
        | { lib: "feather"; name: React.ComponentProps<typeof Feather>["name"] }
        | {
              lib: "mci";
              name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
          };
};

type MenuHref =
    | "/pages/dashboard"
    | "/pages/alerts"
    | "/pages/stats"
    | "/pages/chat"
    | "/pages/profile";

const MENU: MenuItem[] = [
    { href: "/pages/dashboard", icon: { lib: "feather", name: "home" } },
    { href: "/pages/alerts", icon: { lib: "feather", name: "bell" } },
    { href: "/pages/stats", icon: { lib: "feather", name: "pie-chart" } },
    { href: "/pages/chat", icon: { lib: "mci", name: "robot-outline" } },
    { href: "/pages/profile", icon: { lib: "feather", name: "user" } },
];

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTAINER_HORIZONTAL_INSET = 20;
const CONTAINER_BOTTOM_OFFSET = 25;
const CONTAINER_HEIGHT = 68;
const CONTAINER_WIDTH = SCREEN_WIDTH - CONTAINER_HORIZONTAL_INSET * 2;
const TAB_WIDTH = CONTAINER_WIDTH / MENU.length;
const INDICATOR_SIZE = 48;
const ACTIVE_COLOR = colors.text.onPrimary;
const INACTIVE_COLOR = colors.text.secondary;

type MenuIconProps = {
    item: MenuItem;
    active: boolean;
};

function MenuIcon({ item, active }: MenuIconProps) {
    const scale = useSharedValue(active ? 1.15 : 1);
    const activeOpacity = useSharedValue(active ? 1 : 0);
    const inactiveOpacity = useSharedValue(active ? 0 : 1);

    useEffect(() => {
        scale.value = withTiming(active ? 1.15 : 1, { duration: 180 });
        activeOpacity.value = withTiming(active ? 1 : 0, { duration: 180 });
        inactiveOpacity.value = withTiming(active ? 0 : 1, { duration: 180 });
    }, [active, activeOpacity, inactiveOpacity, scale]);

    const iconScaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const activeIconStyle = useAnimatedStyle(() => ({
        opacity: activeOpacity.value,
    }));

    const inactiveIconStyle = useAnimatedStyle(() => ({
        opacity: inactiveOpacity.value,
    }));

    const iconSize = item.icon.lib === "mci" ? 24 : 22;

    return (
        <Animated.View style={[styles.iconWrapper, iconScaleStyle]}>
            <Animated.View style={[styles.iconLayer, inactiveIconStyle]}>
                {item.icon.lib === "feather" ? (
                    <Feather
                        name={item.icon.name}
                        size={iconSize}
                        color={INACTIVE_COLOR}
                    />
                ) : (
                    <MaterialCommunityIcons
                        name={item.icon.name}
                        size={iconSize}
                        color={INACTIVE_COLOR}
                    />
                )}
            </Animated.View>

            <Animated.View style={[styles.iconLayer, activeIconStyle]}>
                {item.icon.lib === "feather" ? (
                    <Feather
                        name={item.icon.name}
                        size={iconSize}
                        color={ACTIVE_COLOR}
                    />
                ) : (
                    <MaterialCommunityIcons
                        name={item.icon.name}
                        size={iconSize}
                        color={ACTIVE_COLOR}
                    />
                )}
            </Animated.View>
        </Animated.View>
    );
}

export default function BottomMenu() {
    const router = useRouter();
    const pathname = usePathname();
    const resolvedActiveIndex = MENU.findIndex(
        (item) => pathname === item.href,
    );
    const activeIndex = resolvedActiveIndex >= 0 ? resolvedActiveIndex : 0;
    const activeTabIndex = useSharedValue(activeIndex);

    useEffect(() => {
        activeTabIndex.value = withSpring(activeIndex, {
            mass: 1,
            damping: 41,
            stiffness: 530,
        });
    }, [activeIndex, activeTabIndex]);

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateX:
                    activeTabIndex.value * TAB_WIDTH +
                    (TAB_WIDTH - INDICATOR_SIZE) / 2,
            },
        ],
    }));

    return (
        <View pointerEvents="box-none" style={styles.wrapper}>
            <View style={styles.container}>
                <Animated.View
                    style={[styles.activeIndicator, indicatorStyle]}
                />

                {MENU.map((item, index) => {
                    const active = activeIndex === index;

                    return (
                        <Pressable
                            key={item.href}
                            style={styles.item}
                            onPress={() => router.navigate(item.href)}
                        >
                            <MenuIcon item={item} active={active} />
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "flex-end",
    },
    container: {
        position: "absolute",
        left: CONTAINER_HORIZONTAL_INSET,
        right: CONTAINER_HORIZONTAL_INSET,
        bottom: CONTAINER_BOTTOM_OFFSET,
        height: CONTAINER_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface.glass,
        borderRadius: 22,
        shadowColor: colors.overlay.shadow,
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.58,
        shadowRadius: 16.0,
        elevation: 8,
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.35),
    },
    activeIndicator: {
        position: "absolute",
        top: (CONTAINER_HEIGHT - INDICATOR_SIZE) / 2,
        width: INDICATOR_SIZE,
        height: INDICATOR_SIZE,
        borderRadius: 16,
        backgroundColor: colors.brand.primary,
    },
    item: {
        flex: 1,
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    iconWrapper: {
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    iconLayer: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
    },
});
