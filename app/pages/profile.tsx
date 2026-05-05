import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { changeEmail, changePassword } from "@/services/authService";
import { colors, withAlpha } from "@/theme";

type Notice = {
  type: "success" | "error";
  message: string;
};

type AccountPanel = "email" | "password";

function decodeUsername(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded) as { username?: string };
    return parsed.username || null;
  } catch {
    return null;
  }
}

export default function Profile() {
  const { logout, refreshToken, token } = useAuth();
  const router = useRouter();
  const currentEmail = useMemo(() => decodeUsername(token), [token]);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<AccountPanel | null>(null);

  const togglePanel = (panel: AccountPanel) => {
    setExpandedPanel((current) => (current === panel ? null : panel));
  };

  const handleChangeEmail = async () => {
    setNotice(null);
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail || !emailPassword) {
      setNotice({ type: "error", message: "Renseignez le nouvel email et votre mot de passe." });
      return;
    }

    setSavingEmail(true);
    try {
      const res = await changeEmail(trimmedEmail, emailPassword);
      refreshToken(res.token);
      setNewEmail("");
      setEmailPassword("");
      setExpandedPanel(null);
      setNotice({ type: "success", message: "Votre adresse email a été mise à jour." });
    } catch (err: unknown) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Impossible de modifier l’email.",
      });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    setNotice(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setNotice({ type: "error", message: "Complétez tous les champs du mot de passe." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: "error", message: "Les nouveaux mots de passe ne correspondent pas." });
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setExpandedPanel(null);
      setNotice({ type: "success", message: "Votre mot de passe a été changé." });
    } catch (err: unknown) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Impossible de modifier le mot de passe.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroCard}>
            <View style={styles.avatarPlaceholder}>
              <Feather name="user" size={30} color={colors.text.onPrimary} />
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.kicker}>Compte Harvest Hub</Text>
              <Text style={styles.title}>Profil & sécurité</Text>
              <Text style={styles.subtitle}>
                Gardez les actions sensibles repliées et ouvrez-les seulement quand vous en avez besoin.
              </Text>
            </View>
          </View>

          {notice ? (
            <View style={[styles.notice, notice.type === "error" ? styles.noticeError : styles.noticeSuccess]}>
              <Feather
                name={notice.type === "error" ? "alert-circle" : "check-circle"}
                size={18}
                color={notice.type === "error" ? colors.state.danger : colors.state.success}
              />
              <Text style={[styles.noticeText, notice.type === "error" ? styles.noticeErrorText : styles.noticeSuccessText]}>
                {notice.message}
              </Text>
            </View>
          ) : null}

          <CollapsibleSectionCard
            icon="mail"
            title="Changer l'adresse email"
            description="Votre mot de passe confirme que c'est bien vous. Aucun lien de vérification n'est envoyé."
            summary={currentEmail ? `Connecté avec ${currentEmail}` : "Email du compte non disponible"}
            expanded={expandedPanel === "email"}
            onToggle={() => togglePanel("email")}
          >
            <InfoPill label="Email actuel" value={currentEmail || "Non disponible"} />
            <Field
              label="Nouvelle adresse email"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
            />
            <Field
              label="Mot de passe actuel"
              value={emailPassword}
              onChangeText={setEmailPassword}
              secureTextEntry
              textContentType="password"
            />
            <PrimaryButton
              label="Mettre à jour l'email"
              loading={savingEmail}
              onPress={handleChangeEmail}
            />
          </CollapsibleSectionCard>

          <CollapsibleSectionCard
            icon="lock"
            title="Changer le mot de passe"
            description="Choisissez au moins 8 caractères. Le changement se fait immédiatement dans l'application."
            summary="Action protégée par votre mot de passe actuel"
            expanded={expandedPanel === "password"}
            onToggle={() => togglePanel("password")}
          >
            <Field
              label="Mot de passe actuel"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              textContentType="password"
            />
            <Field
              label="Nouveau mot de passe"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              textContentType="newPassword"
            />
            <Field
              label="Confirmer le nouveau mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
            />
            <PrimaryButton
              label="Changer le mot de passe"
              loading={savingPassword}
              onPress={handleChangePassword}
            />
          </CollapsibleSectionCard>

          <View style={styles.quickLinks}>
            <Text style={styles.quickLinksTitle}>Raccourcis utiles</Text>
            <ActionRow
              icon="cpu"
              label="Mes hubs"
              helper="Voir l’état, les appareils associés et les hubs en attente."
              onPress={() => router.push("./hubs")}
            />
            <ActionRow
              icon="bar-chart-2"
              label="Santé du jardin"
              helper="Comparer la couverture des hubs et les dernières tendances."
              onPress={() => router.push("/pages/stats")}
            />
            <ActionRow
              icon="grid"
              label="Carte du jardin"
              helper="Retourner à vos plantes, sondes et zones de culture."
              onPress={() => router.push("/pages/dashboard")}
            />
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.85}>
            <Feather name="log-out" size={18} color={colors.state.danger} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CollapsibleSectionCard({
  icon,
  title,
  description,
  summary,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  description: string;
  summary: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        activeOpacity={0.85}
        style={styles.sectionHeader}
        onPress={onToggle}
      >
        <View style={styles.sectionIcon}>
          <Feather name={icon} size={18} color={colors.brand.primary} />
        </View>
        <View style={styles.sectionTitleBlock}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionDescription}>{description}</Text>
        </View>
        <View style={styles.sectionChevron}>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.text.muted} />
        </View>
      </TouchableOpacity>
      {expanded ? <View style={styles.panelBody}>{children}</View> : <Text style={styles.panelSummary}>{summary}</Text>}
    </View>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "sentences",
  secureTextEntry = false,
  textContentType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
  secureTextEntry?: boolean;
  textContentType?: "emailAddress" | "password" | "newPassword";
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
        placeholderTextColor={colors.text.subtle}
      />
    </View>
  );
}

function PrimaryButton({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.onPrimary} />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

function ActionRow({
  icon,
  label,
  helper,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  helper: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.rowCard} onPress={onPress}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>
          <Feather name={icon} size={18} color={colors.brand.primary} />
        </View>
        <View style={styles.rowTextBlock}>
          <Text style={styles.rowText}>{label}</Text>
          <Text style={styles.rowHelper}>{helper}</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={colors.text.subtle} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  keyboardView: { flex: 1 },
  scrollContent: {
    padding: 18,
    paddingBottom: 140,
    gap: 16,
  },
  heroCard: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    backgroundColor: colors.brand.primary,
    borderRadius: 30,
    padding: 20,
    shadowColor: colors.overlay.shadow,
    shadowOpacity: 1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  avatarPlaceholder: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: withAlpha(colors.surface.lowest, 0.18),
    borderWidth: 1,
    borderColor: withAlpha(colors.surface.lowest, 0.28),
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextBlock: { flex: 1 },
  kicker: {
    color: withAlpha(colors.text.onPrimary, 0.72),
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
  },
  title: {
    color: colors.text.onPrimary,
    fontSize: 25,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: withAlpha(colors.text.onPrimary, 0.82),
    fontSize: 13,
    lineHeight: 19,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  noticeSuccess: {
    backgroundColor: colors.state.successSoft,
    borderColor: withAlpha(colors.state.success, 0.24),
  },
  noticeError: {
    backgroundColor: colors.state.dangerSoft,
    borderColor: withAlpha(colors.state.danger, 0.24),
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  noticeSuccessText: { color: colors.state.success },
  noticeErrorText: { color: colors.state.danger },
  sectionCard: {
    backgroundColor: colors.surface.lowest,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: withAlpha(colors.border.subtle, 0.28),
    shadowColor: colors.overlay.shadow,
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.brand.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleBlock: { flex: 1 },
  sectionChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface.low,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  sectionDescription: {
    color: colors.text.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  panelBody: { marginTop: 16 },
  panelSummary: {
    marginTop: 14,
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    backgroundColor: colors.surface.low,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  infoPill: {
    backgroundColor: colors.surface.low,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  infoLabel: {
    color: colors.text.muted,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  infoValue: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  fieldGroup: { marginBottom: 14 },
  label: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: withAlpha(colors.border.subtle, 0.44),
    borderRadius: 17,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text.primary,
    backgroundColor: colors.surface.low,
  },
  primaryButton: {
    marginTop: 4,
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: { opacity: 0.62 },
  primaryButtonText: {
    color: colors.text.onPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  quickLinks: { gap: 12 },
  quickLinksTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 2,
  },
  rowCard: {
    backgroundColor: colors.surface.lowest,
    borderRadius: 22,
    paddingHorizontal: 15,
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: withAlpha(colors.border.subtle, 0.22),
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface.low,
  },
  rowTextBlock: { flex: 1, gap: 3 },
  rowText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: "800",
  },
  rowHelper: {
    fontSize: 12,
    color: colors.text.muted,
    lineHeight: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.state.dangerSoft,
    borderRadius: 999,
    minHeight: 52,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.state.danger,
  },
});
