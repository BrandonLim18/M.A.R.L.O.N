import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function ChatbotModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([{ role: "assistant", text: "Hi! I am MARLON. How can I help you today?" }]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const userMsg = { role: "user", text: message };
    setMessages(prev => [...prev, userMsg]);
    setMessage("");
    setLoading(true);

    try {
      const res = await api.sendChatMessage(userMsg.text);
      setMessages(prev => [...prev, { role: "assistant", text: res.assistant.message }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", text: "Server error. Is Ollama running?" }]);
    }
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", text: "Chat cleared! How can I help you today?" }]);
  };

  const handleQuickReply = async (text: string) => {
    const userMsg = { role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.sendChatMessage(text);
      setMessages(prev => [...prev, { role: "assistant", text: res.assistant.message }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", text: "Server error. Is Ollama running?" }]);
    }
    setLoading(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => setIsOpen(true)}>
        <Ionicons name="chatbubbles" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.chatContainer}>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>MARLON AI</Text>
                <Text style={styles.headerSubtitle}>Library Assistant</Text>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              ref={scrollViewRef}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              style={styles.messagesContainer}
              contentContainerStyle={{ padding: 16, gap: 12 }}
            >
              {messages.map((msg, idx) => (
                <View key={idx} style={[styles.bubbleWrapper, msg.role === 'user' ? styles.wrapperUser : styles.wrapperBot]}>
                  <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
                    <Text style={[styles.bubbleText, msg.role === 'user' ? styles.textUser : styles.textBot]}>{msg.text}</Text>
                  </View>
                </View>
              ))}
              {loading && <ActivityIndicator size="small" color="#2563eb" style={{ alignSelf: 'flex-start', marginLeft: 10 }} />}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput 
                style={styles.input} 
                placeholder="Ask me anything..." 
                value={message} 
                onChangeText={setMessage} 
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading}>
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>MARLON AI</Text>
                <Text style={styles.headerSubtitle}>Library Assistant</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                <TouchableOpacity onPress={clearChat}>
                  <Text style={{ color: '#fff', fontSize: 12, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  chatContainer: { backgroundColor: '#f8fafc', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '80%', overflow: 'hidden' },
  header: { backgroundColor: '#2563eb', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#bfdbfe', fontSize: 12 },
  closeBtn: { padding: 4 },
  messagesContainer: { flex: 1 },
  bubbleWrapper: { flexDirection: 'row', width: '100%' },
  wrapperUser: { justifyContent: 'flex-end' },
  wrapperBot: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 20 },
  bubbleUser: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  bubbleBot: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  bubbleText: { fontSize: 15 },
  textUser: { color: '#fff' },
  textBot: { color: '#1e293b' },
  inputRow: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 16 },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, fontSize: 15, color: '#1e293b' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' }
});