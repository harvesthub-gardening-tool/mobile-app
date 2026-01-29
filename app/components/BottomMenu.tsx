import { View, TouchableOpacity, StyleSheet } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type MenuItem = {
  href: string;
  icon:
    | { lib: "feather"; name: React.ComponentProps<typeof Feather>["name"] }
    | {
        lib: "mci";
        name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
      };
};

const MENU: MenuItem[] = [
    { href: "/pages/dashboard", icon: { lib: "feather", name: "home" } },
    { href: "/pages/alerts", icon: { lib: "feather", name: "bell" } },
    { href: "/pages/stats", icon: { lib: "feather", name: "pie-chart" } },
    {
      href: "/pages/chat",
      icon: { lib: "mci", name: "robot-outline" },
    },
  
    { href: "/pages/profile", icon: { lib: "feather", name: "user" } },
  ];

export default function BottomMenu() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {MENU.map((item) => {
        const active = pathname === item.href;
        const color = active ? "#2B2B2B" : "#B5B5B5";

        return (
          <TouchableOpacity
            key={item.href}
            style={styles.item}
            onPress={() => router.push(item.href)}
            activeOpacity={0.8}
          >
            {item.icon.lib === "feather" ? (
              <Feather name={item.icon.name} size={22} color={color} />
            ) : (
              <MaterialCommunityIcons
                name={item.icon.name}
                size={24}
                color={color}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 72,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#EFEFEF",
  },
  item: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
