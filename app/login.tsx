import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useAuth } from "./context/AuthContext";
import { colors, withAlpha } from "./theme";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { login } = useAuth();

    const handleLogin = async () => {
        setError("");
        if (!email || !password) {
            setError("Veuillez remplir tous les champs.");
            return;
        }
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : "Échec de la connexion.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Se connecter</Text>
                </View>

                <View style={styles.cardWrapper}>
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.card}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.cardTitle}>
                            Bon retour parmis nous !
                        </Text>
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
                            <Text style={styles.forgotPassword}>
                                Mot de passe oublié ?
                            </Text>
                        </TouchableOpacity>

                        {error ? (
                            <Text style={styles.errorText}>{error}</Text>
                        ) : null}

                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                loading && styles.primaryButtonDisabled,
                            ]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.text.onPrimary} />
                            ) : (
                                <Text style={styles.primaryButtonText}>
                                    Se connecter
                                </Text>
                            )}
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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.surface.base,
    },
    container: {
        flex: 1,
        backgroundColor: colors.surface.base,
    },
    header: {
        height: 180,
        backgroundColor: colors.brand.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "700",
        color: colors.text.onPrimary,
    },

    cardWrapper: {
        flex: 1,
        marginTop: -40,
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: colors.surface.lowest,
        borderRadius: 24,
        padding: 20,
        paddingBottom: 32,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.text.primary,
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 13,
        color: colors.text.secondary,
        marginBottom: 24,
        lineHeight: 18,
    },

    fieldGroup: {
        marginBottom: 18,
    },
    label: {
        fontSize: 13,
        marginBottom: 6,
        color: colors.text.secondary,
    },
    input: {
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.42),
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 10,
        fontSize: 14,
        color: colors.text.primary,
        backgroundColor: colors.surface.low,
    },

    forgotPassword: {
        fontSize: 11,
        color: colors.text.secondary,
        textDecorationLine: "underline",
        marginBottom: 26,
    },

    primaryButton: {
        backgroundColor: colors.brand.primary,
        borderRadius: 999,
        paddingVertical: 14,
        alignItems: "center",
        marginBottom: 14,
    },
    primaryButtonDisabled: {
        opacity: 0.5,
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.text.onPrimary,
    },

    secondaryButton: {
        borderWidth: 1,
        borderColor: withAlpha(colors.border.subtle, 0.35),
        borderRadius: 999,
        paddingVertical: 12,
        alignItems: "center",
        backgroundColor: colors.surface.low,
    },
    secondaryButtonText: {
        fontSize: 13,
        color: colors.text.secondary,
    },
    errorText: {
        color: colors.state.danger,
        fontSize: 13,
        textAlign: "center",
        marginBottom: 14,
    },
});
