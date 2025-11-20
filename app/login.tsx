import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Se connecter</Text>
        </View>

        <View style={styles.cardWrapper}>
          <ScrollView
            contentContainerStyle={styles.card}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.cardTitle}>Bon retour parmis nous !</Text>
            <Text style={styles.cardSubtitle}>
              Content de vous revoir ! Remplissez vos{"\n"}
              informations pour vous connecter.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Adresse mail</Text>
              <TextInput
                style={styles.input}
                placeholder=""
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder=""
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity>
              <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Se connecter</Text>
            </TouchableOpacity>

            <Link href="/signup" asChild>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>
                  Pas encore de compte ? S’inscrire
                </Text>
              </TouchableOpacity>
            </Link>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    height: 180,
    backgroundColor: "#63FFA4",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
  },

  cardWrapper: {
    flex: 1,
    marginTop: -40, 
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 24,
    lineHeight: 18,
  },

  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
  },

  forgotPassword: {
    fontSize: 11,
    color: "#6E6E6E",
    textDecorationLine: "underline",
    marginBottom: 26,
  },

  primaryButton: {
    backgroundColor: "#63FFA4",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: "#63FFA4",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 13,
    color: "#00000",
  },
});
