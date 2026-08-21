import React, { useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { generateCoachReply } from "../engine/coachReply";
import { todayKey, useApp } from "../state/AppContext";

interface ChatMessage {
  id: string;
  role: "user" | "coach";
  text: string;
}

const SUGGESTIONS = [
  "How many calories do I have left?",
  "Can I have pizza tonight?",
  "Why am I going over my calories?",
];

export function CoachScreen() {
  const { budgetForDate, services } = useApp();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "coach",
      text: "Ask me about your calories today, or whether a particular food fits your target.",
    },
  ]);

  function send(text: string) {
    if (!text.trim()) return;
    const budget = budgetForDate(todayKey());
    const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: "user", text };

    if (!budget) {
      setMessages((prev) => [...prev, userMessage, { id: `c-${Date.now()}`, role: "coach", text: "Set up your profile first so I can calculate your daily budget." }]);
      setInput("");
      return;
    }

    const reply = generateCoachReply(text, { budget, nutritionDb: services.nutritionDb });
    setMessages((prev) => [...prev, userMessage, { id: `c-${Date.now()}`, role: "coach", text: reply }]);
    setInput("");
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.coachBubble]}>
            <Text style={item.role === "user" ? styles.userText : styles.coachText}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.suggestionsRow}>
        {SUGGESTIONS.map((s) => (
          <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => send(s)}>
            <Text style={styles.suggestionText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your AI coach…"
          onSubmitEditing={() => send(input)}
        />
        <TouchableOpacity style={styles.sendButton} onPress={() => send(input)}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  list: { flex: 1 },
  listContent: { padding: 16 },
  bubble: { maxWidth: "85%", borderRadius: 14, padding: 12, marginBottom: 10 },
  userBubble: { backgroundColor: "#111827", alignSelf: "flex-end" },
  coachBubble: { backgroundColor: "#F3F4F6", alignSelf: "flex-start" },
  userText: { color: "#FFFFFF", fontSize: 14 },
  coachText: { color: "#111827", fontSize: 14 },
  suggestionsRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12 },
  suggestionChip: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  suggestionText: { fontSize: 12, color: "#374151" },
  inputRow: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  input: { flex: 1, borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8 },
  sendButton: { backgroundColor: "#111827", borderRadius: 20, paddingHorizontal: 18, justifyContent: "center" },
  sendButtonText: { color: "#FFFFFF", fontWeight: "700" },
});
