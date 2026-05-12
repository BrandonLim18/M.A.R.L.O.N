import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
  useWindowDimensions,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';

interface LoginScreenProps {
  setToken: (token: string) => void;
  navigation: any;
}

export default function LoginScreen({ setToken, navigation }: LoginScreenProps) {
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<"login" | "register">("login");
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [profilePicture, setProfilePicture] = useState<ImagePicker.ImagePickerAsset | null>(null);
  
  // UI State
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => email.includes("@");

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0]);
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address."); return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long."); return;
    }

    try {
      setLoading(true);
      const response = await api.login({ email, password });
      if (response.token) {
        setToken(response.token);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Login failed. Check your credentials.";
      setError(msg.includes("401") ? "Invalid email or password" : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address."); return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long."); return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match."); return;
    }
    if (!username.trim()) {
      setError("Username is required."); return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("username", username);
      formData.append("first_name", firstName);
      formData.append("last_name", lastName);
      formData.append("address", address);
      
      if (birthday) formData.append("birthday", birthday);
      
      if (profilePicture) {
        const localUri = profilePicture.uri;
        const filename = localUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append("profile_picture", {
          uri: localUri,
          name: filename,
          type,
        } as any);
      }

      await api.register(formData);
      
      // FIX IMPLEMENTED HERE: Route to VerifyEmail on success!
      Alert.alert("Success", "Registration successful! Please check your email for the OTP.", [
        { 
          text: "OK", 
          onPress: () => {
            switchMode("login");
            navigation.navigate("VerifyEmail", { email: email });
          } 
        }
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail(""); setPassword(""); setConfirmPassword("");
    setFirstName(""); setLastName(""); setUsername("");
    setAddress(""); setBirthday(""); setProfilePicture(null);
    setError("");
  };

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    resetForm();
  };

  return (
    <LinearGradient colors={['#f1f5f9', '#eff6ff', '#ecfeff']} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardView} 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.card, { maxWidth: Math.min(width * 0.9, 450) }]}>
                
                <View style={styles.header}>
                  <Text style={styles.title}>M.A.R.L.O.N</Text>
                  <Text style={styles.subtitle}>Library Management System</Text>
                </View>

                {/* Mode Tabs */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[styles.tab, mode === 'login' ? styles.tabLoginActive : styles.tabInactive]}
                    onPress={() => switchMode("login")}
                  >
                    <Text style={[styles.tabText, mode === 'login' ? styles.tabTextActive : styles.tabTextInactive]}>
                      Login
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, mode === 'register' ? styles.tabRegisterActive : styles.tabInactive]}
                    onPress={() => switchMode("register")}
                  >
                    <Text style={[styles.tabText, mode === 'register' ? styles.tabTextActive : styles.tabTextInactive]}>
                      Register
                    </Text>
                  </TouchableOpacity>
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Forms */}
                {mode === "login" ? (
                  <View style={styles.form}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email Address</Text>
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="name@example.com"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Password</Text>
                      <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry
                      />
                    </View>

                    <TouchableOpacity 
                      style={styles.loginButton} 
                      onPress={handleLogin} 
                      disabled={loading}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.form}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Username</Text>
                      <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Choose a username" placeholderTextColor="#94a3b8" autoCapitalize="none" />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email Address</Text>
                      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="name@example.com" placeholderTextColor="#94a3b8" keyboardType="email-address" autoCapitalize="none" />
                    </View>

                    <View style={styles.row}>
                      <View style={styles.halfInput}>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholderTextColor="#94a3b8" placeholder="First name" />
                      </View>
                      <View style={styles.halfInput}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholderTextColor="#94a3b8" placeholder="Last name" />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Address</Text>
                      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholderTextColor="#94a3b8" placeholder="Complete address" />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Birthday (YYYY-MM-DD)</Text>
                      <TextInput style={styles.input} value={birthday} onChangeText={setBirthday} placeholderTextColor="#94a3b8" placeholder="2000-01-01" />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Password</Text>
                      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#94a3b8" secureTextEntry />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Confirm Password</Text>
                      <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" placeholderTextColor="#94a3b8" secureTextEntry />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Profile Picture (Optional)</Text>
                      <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                        <Text style={styles.imagePickerText}>{profilePicture ? "Change Photo" : "Choose Photo"}</Text>
                      </TouchableOpacity>
                      {profilePicture && (
                        <Image source={{ uri: profilePicture.uri }} style={styles.previewImage} />
                      )}
                    </View>

                    <TouchableOpacity 
                      style={styles.registerButton} 
                      onPress={handleRegister} 
                      disabled={loading}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
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
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20 
  },
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
  title: { fontSize: 32, fontWeight: '900', color: '#1e293b', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: '500' },
  tabContainer: { flexDirection: 'row', marginBottom: 24, gap: 10, backgroundColor: '#f1f5f9', padding: 4, borderRadius: 18 },
  tab: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  tabLoginActive: { backgroundColor: '#2563eb', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  tabRegisterActive: { backgroundColor: '#059669', shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  tabInactive: { backgroundColor: 'transparent' },
  tabText: { fontWeight: '700', fontSize: 15 },
  tabTextActive: { color: '#ffffff' },
  tabTextInactive: { color: '#64748b' },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1, gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginLeft: 4 },
  input: { 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    fontSize: 16, 
    color: '#1e293b' 
  },
  loginButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  registerButton: { backgroundColor: '#059669', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8, shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  errorBox: { backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: '#dc2626', fontSize: 13, textAlign: 'center', fontWeight: '500' },
  imagePickerBtn: { backgroundColor: '#ecfdf5', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#a7f3d0', alignItems: 'center' },
  imagePickerText: { color: '#047857', fontWeight: '700', fontSize: 15 },
  previewImage: { width: 90, height: 90, borderRadius: 45, alignSelf: 'center', marginTop: 12, borderWidth: 3, borderColor: '#ecfdf5' }
});