import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

export default function Profile() {
  return (
    <SafeAreaView style={styles.safe}>
      {}
      <View style={styles.header}>
        <Text style={styles.name}>Le beau Baptiste</Text>
        <Text style={styles.sub}>Membre depuis 2023</Text>
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
              <Feather name="wifi" size={18} color="#2B2B2B" />
              <Text style={styles.pillText}>Wifi</Text>
            </View>

            <View style={styles.pill}>
              <Feather name="database" size={18} color="#2B2B2B" />
              <Text style={styles.pillText}>Donnés</Text>
            </View>

            <View style={styles.pill}>
              <Feather name="tool" size={18} color="#2B2B2B" />
              <Text style={styles.pillText}>Aide</Text>
            </View>
          </ScrollView>
        </View>

        {}
        <View style={styles.list}>
          <Row icon="user" label="Mes informations" />
          <Row icon="cpu" label="Paramètres des hubs" />
          <Row icon="globe" label="Confidentialité" />
          <Row icon="headphones" label="Support" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Row({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.rowCard}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>
          <Feather name={icon} size={18} color="#2B2B2B" />
        </View>
        <Text style={styles.rowText}>{label}</Text>
      </View>

      <Feather name="chevron-right" size={18} color="#2B2B2B" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F5F5" },

  header: {
    height: 220,
    backgroundColor: "#63FFA4",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2B2B2B",
  },
  sub: {
    marginTop: 6,
    fontSize: 12,
    color: "#2B2B2B",
    opacity: 0.7,
  },

  content: {
    flex: 1,
    marginTop: -28,
    backgroundColor: "#F5F5F5",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 44,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  pillText: {
    fontSize: 12,
    color: "#2B2B2B",
    opacity: 0.8,
    fontWeight: "500",
  },

  list: {
    gap: 16,
    paddingHorizontal: 8,
  },
  rowCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
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
    color: "#2B2B2B",
    opacity: 0.7,
    fontWeight: "500",
  },
});
