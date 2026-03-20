import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "expo-router";

export default function Dashboard() {
  const { token, userId, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      <View style={styles.cardWrapper}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion réussie !</Text>

          <Text style={styles.label}>Authentifié</Text>
          <Text style={styles.value}>{isAuthenticated ? "Oui" : "Non"}</Text>

          {userId && (
            <>
              <Text style={styles.label}>User ID</Text>
              <Text style={styles.value} selectable>
                {userId}
              </Text>
            </>
          )}

          <Text style={styles.label}>Token</Text>
          <Text style={styles.value} selectable numberOfLines={4}>
            {token ?? "—"}
          </Text>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    height: 180,
    backgroundColor: "#63FFA4",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 26, fontWeight: "700" },
  cardWrapper: { flex: 1, marginTop: -40, paddingHorizontal: 20 },
  card: { backgroundColor: "#FFF", borderRadius: 24, padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 12, color: "#888", marginTop: 12 },
  value: { fontSize: 14, color: "#2B2B2B", marginTop: 4 },
  logoutButton: {
    marginTop: 24,
    backgroundColor: "#FF6B6B",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
});
