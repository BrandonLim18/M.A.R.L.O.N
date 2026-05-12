import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function VerifyEmailScreen({ route, navigation }: any) {
  const { width } = useWindowDimensions();
  // We will pass the email from the LoginScreen via route params
  const { email } = route.params; 
  
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    Keyboard.dismiss();
    setError("");

    if (!otp.trim() || otp.length < 4) {
      setError("Please enter a valid OTP code.");
      return;
    }

    try {
      setLoading(true);
      await api.verifyEmail({ email, otp });
      
      Alert.alert("Verified!", "Your email has been successfully verified. You can now log in.", [
        { text: "Go to Login", onPress: () => navigation.navigate("Login") }
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Verification failed. Please check your code.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#f1f5f9', '#eff6ff', '#ecfeff']} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardView} 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#475569" />
              </TouchableOpacity>

              <View style={[styles.card, { maxWidth: Math.min(width * 0.9, 450) }]}>
                <View style={styles.header}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="mail-unread-outline" size={40} color="#059669" />
                  </View>
                  <Text style={styles.title}>Check your email</Text>
                  <Text style={styles.subtitle}>
                    We sent a verification code to{'\n'}
                    <Text style={styles.emailText}>{email}</Text>
                  </Text>
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>One-Time Password (OTP)</Text>
                    <TextInput
                      style={styles.input}
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="Enter code"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      maxLength={6}
                    />
                  </View>

                  <TouchableOpacity 
                    style={styles.verifyButton} 
                    onPress={handleVerify} 
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Verify Account</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  backButton: { position: 'absolute', top: 20, left: 20, padding: 10, zIndex: 10 },
  card: { 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    borderRadius: 24, 
    padding: 24, 
    width: '100%',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 15, 
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)'
  },
  header: { alignItems: 'center', marginBottom: 28 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '900', color: '#1e293b', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 8, fontWeight: '500', textAlign: 'center', lineHeight: 22 },
  emailText: { color: '#059669', fontWeight: '700' },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginLeft: 4 },
  input: { 
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', 
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, 
    fontSize: 20, color: '#1e293b', textAlign: 'center', letterSpacing: 4, fontWeight: 'bold'
  },
  verifyButton: { 
    backgroundColor: '#059669', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8, 
    shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 
  },
  buttonText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  errorBox: { backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: '#dc2626', fontSize: 13, textAlign: 'center', fontWeight: '500' },
});