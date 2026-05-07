import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";

import { useGardenStorage } from "@/hooks/useGardenStorage";
import { sendChatMessage } from "@/services/chatService";
import { colors, withAlpha } from "@/theme";

type ChatMessage = {
  id: string;
  author: "user" | "assistant";
  text: string;
};

const NAVBAR_HEIGHT = 68;
const NAVBAR_BOTTOM_OFFSET = 25;
const COMPOSER_NAVBAR_GAP = 10;

const QUICK_PROMPTS = [
  { id: "health", icon: "activity", label: "Santé du jardin", prompt: "Résume la santé de mon jardin." },
  { id: "watering", icon: "droplet", label: "Conseil arrosage", prompt: "Quelles plantes dois-je arroser ?" },
  { id: "alerts", icon: "bell", label: "Alertes", prompt: "Quelles alertes dois-je surveiller ?" },
] as const;

const COMPOSER_BOTTOM_OFFSET = NAVBAR_HEIGHT + NAVBAR_BOTTOM_OFFSET + COMPOSER_NAVBAR_GAP;

export default function Chat() {
  const { plants, sondes } = useGardenStorage();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSend = async (text = draft) => {
    const message = text.trim();
    if (!message || sending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      author: "user",
      text: message,
    };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setError(null);
    setSending(true);

    try {
      const reply = await sendChatMessage({ message, plants, sondes });
      setMessages((current) => [
        ...current,
        { id: `assistant-${Date.now()}`, author: "assistant", text: reply },
      ]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de contacter l'assistant.");
    } finally {
      setSending(false);
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
            <View style={styles.assistantAvatar}>
              <Feather name="message-circle" size={28} color={colors.text.onPrimary} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.kicker}>Assistant Harvest Hub</Text>
              <Text style={styles.headerTitle}>Chat</Text>
              <Text style={styles.heroSubtitle}>Posez une question sur vos plantes, sondes ou alertes.</Text>
            </View>
          </View>

          <View style={styles.quickPromptSection}>
            <Text style={styles.sectionTitle}>Raccourcis</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptList}>
              {QUICK_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt.id}
                  activeOpacity={0.85}
                  style={styles.promptChip}
                  onPress={() => handleSend(prompt.prompt)}
                  disabled={sending}
                >
                  <View style={styles.promptIcon}>
                    <Feather name={prompt.icon} size={16} color={colors.brand.primary} />
                  </View>
                  <Text style={styles.promptLabel}>{prompt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.thread}>
            {messages.length === 0 ? (
              <View style={styles.emptyCard}>
                <Feather name="cpu" size={20} color={colors.brand.primary} />
                <Text style={styles.emptyTitle}>Assistant prêt</Text>
                <Text style={styles.emptyText}>Vos plantes locales et les dernières lectures de sondes autorisées seront ajoutées au contexte.</Text>
              </View>
            ) : (
              messages.map((message) => <MessageBubble key={message.id} message={message} />)
            )}
            {sending ? (
              <View style={styles.thinkingRow}>
                <ActivityIndicator size="small" color={colors.brand.primary} />
                <Text style={styles.thinkingText}>Assistant en réflexion...</Text>
              </View>
            ) : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </ScrollView>

        <View style={styles.composerShell}>
          <View style={styles.composer}>
            <Text style={styles.composerLabel}>Message</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                editable={!sending}
                placeholder="Posez une question sur votre jardin..."
                placeholderTextColor={colors.text.subtle}
                accessibilityLabel="Message pour l'assistant jardin"
              />
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
                disabled={!draft.trim() || sending}
                accessibilityRole="button"
                onPress={() => handleSend()}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.text.onPrimary} />
                ) : (
                  <Feather name="send" size={18} color={colors.text.onPrimary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.author === "user";
  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {isUser ? (
          <Text style={[styles.messageText, styles.userMessageText]}>{message.text}</Text>
        ) : (
          <Markdown
            style={markdownStyles}
            onLinkPress={(url) => {
              if (!url) {
                return false;
              }
              void Linking.openURL(url);
              return false;
            }}
          >
            {message.text}
          </Markdown>
        )}
      </View>
    </View>
  );
}

const markdownStyles = StyleSheet.create({
  body: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 10,
  },
  heading1: {
    color: colors.text.primary,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    marginTop: 0,
    marginBottom: 10,
  },
  heading2: {
    color: colors.text.primary,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "900",
    marginTop: 0,
    marginBottom: 8,
  },
  heading3: {
    color: colors.text.primary,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800",
    marginTop: 0,
    marginBottom: 8,
  },
  heading4: {
    color: colors.text.primary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    marginTop: 0,
    marginBottom: 8,
  },
  heading5: {
    color: colors.text.primary,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
    marginTop: 0,
    marginBottom: 8,
  },
  heading6: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    marginTop: 0,
    marginBottom: 8,
  },
  bullet_list: {
    marginTop: 0,
    marginBottom: 10,
  },
  ordered_list: {
    marginTop: 0,
    marginBottom: 10,
  },
  list_item: {
    marginBottom: 4,
  },
  bullet_list_icon: {
    color: colors.text.secondary,
  },
  ordered_list_icon: {
    color: colors.text.secondary,
  },
  bullet_list_content: {
    color: colors.text.secondary,
  },
  ordered_list_content: {
    color: colors.text.secondary,
  },
  strong: {
    color: colors.text.primary,
    fontWeight: "900",
  },
  em: {
    fontStyle: "italic",
  },
  code_inline: {
    color: colors.text.primary,
    backgroundColor: colors.surface.base,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  code_block: {
    color: colors.text.primary,
    backgroundColor: colors.surface.base,
    borderRadius: 14,
    padding: 12,
  },
  fence: {
    color: colors.text.primary,
    backgroundColor: colors.surface.base,
    borderRadius: 14,
    padding: 12,
  },
  blockquote: {
    backgroundColor: withAlpha(colors.brand.primaryFixed, 0.5),
    borderLeftWidth: 3,
    borderLeftColor: colors.brand.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 0,
    marginBottom: 10,
  },
  link: {
    color: colors.brand.primary,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  hr: {
    backgroundColor: withAlpha(colors.border.subtle, 0.5),
    height: 1,
    marginVertical: 12,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  keyboardView: { flex: 1 },
  scrollContent: {
    padding: 18,
    paddingBottom: 190,
    gap: 18,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.brand.primary,
    borderRadius: 32,
    padding: 20,
    shadowColor: colors.overlay.shadow,
    shadowOpacity: 1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  assistantAvatar: {
    width: 62,
    height: 62,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: withAlpha(colors.surface.lowest, 0.18),
    borderWidth: 1,
    borderColor: withAlpha(colors.surface.lowest, 0.28),
  },
  heroCopy: { flex: 1 },
  kicker: {
    color: withAlpha(colors.text.onPrimary, 0.72),
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 5,
  },
  headerTitle: {
    color: colors.text.onPrimary,
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: withAlpha(colors.text.onPrimary, 0.82),
    fontSize: 14,
    lineHeight: 20,
  },
  quickPromptSection: { gap: 12 },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: "900",
    paddingHorizontal: 2,
  },
  promptList: { gap: 10, paddingRight: 18 },
  promptChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.surface.lowest,
    borderRadius: 999,
    paddingLeft: 8,
    paddingRight: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: withAlpha(colors.border.subtle, 0.22),
  },
  promptIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.primaryFixed,
  },
  promptLabel: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "800",
  },
  thread: { gap: 12 },
  emptyCard: {
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface.lowest,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: withAlpha(colors.border.subtle, 0.22),
  },
  emptyTitle: { color: colors.text.primary, fontSize: 16, fontWeight: "900" },
  emptyText: { color: colors.text.muted, fontSize: 13, lineHeight: 19, textAlign: "center" },
  messageRow: { flexDirection: "row" },
  messageRowUser: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "82%",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  assistantBubble: { backgroundColor: colors.surface.low, borderBottomLeftRadius: 8 },
  userBubble: { backgroundColor: colors.brand.primary, borderBottomRightRadius: 8 },
  messageText: { color: colors.text.secondary, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  userMessageText: { color: colors.text.onPrimary },
  thinkingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
  thinkingText: { color: colors.text.muted, fontSize: 13, fontWeight: "700" },
  errorText: { color: colors.state.danger, fontSize: 13, fontWeight: "700" },
  composerShell: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: COMPOSER_BOTTOM_OFFSET,
    paddingHorizontal: 18,
  },
  composer: {
    backgroundColor: colors.surface.lowest,
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: withAlpha(colors.border.subtle, 0.3),
    shadowColor: colors.overlay.shadow,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  composerLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 8,
    marginBottom: 7,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 46,
    borderRadius: 18,
    paddingHorizontal: 14,
    color: colors.text.primary,
    backgroundColor: colors.surface.low,
    fontSize: 14,
    fontWeight: "600",
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.primary,
  },
  sendButtonDisabled: { opacity: 0.58 },
});
