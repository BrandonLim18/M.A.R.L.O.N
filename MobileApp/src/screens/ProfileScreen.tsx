import React, { useEffect, useMemo, useState } from "react";
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
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { api } from "../services/api";

export default function ProfileScreen({ navigation }: any) {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Data State
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [newPicture, setNewPicture] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [userData, setUserData] = useState({
    name: "User",
    email: "",
    address: "",
    age: 0,
    birthday: "",
    role: "Library User",
    bio: "No biography available.",
    profile_picture: "",
  });
  const [formData, setFormData] = useState(userData);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profile, borrowsData, historyData] = await Promise.all([
          api.getProfile(),
          api.getBorrowings(),
          api.getHistory(),
        ]);

        const fullName =
          `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
          profile.username ||
          profile.email ||
          "User";

        const nextData = {
          name: fullName,
          email: profile.email || "",
          address: profile.address || "No address provided",
          age: profile.age || 0,
          birthday: profile.birthday || "No birthday provided",
          role:
            profile.role === "admin"
              ? "System Administrator"
              : "Library Borrower",
          bio: profile.bio || "No biography available.",
          profile_picture: profile.profile_picture || "",
        };

        setUserData(nextData);
        setFormData(nextData);
        setBorrowings(borrowsData);
        setHistory(historyData);
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadData();
  }, []);

  const initials = useMemo(() => {
    return userData.name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
  }, [userData.name]);

  const recentActivities = useMemo(() => {
    const borrowActivities = borrowings.map((item) => ({
      action: item.return_date ? "Returned" : "Borrowed",
      book: item.book_details?.title || `Book ID: ${item.book}`,
      date: item.return_date || item.borrow_date || "Recent",
    }));

    const historyActivities = history.map((item) => ({
      action: "Completed",
      book:
        item.book_details?.title ||
        item.book_title ||
        `Transaction #${item.transaction}`,
      date: item.return_date || item.borrow_date || "Recent",
    }));

    const profileActivity = {
      action: "Updated",
      book: "Profile Information",
      date: "Recently",
    };
    return [...borrowActivities, ...historyActivities, profileActivity].slice(
      0,
      5,
    );
  }, [borrowings, history]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setNewPicture(result.assets[0]);
  };

  const handleSave = async () => {
    setSaveLoading(true);
    Keyboard.dismiss();
    try {
      const form = new FormData();
      const [firstName, ...lastNameParts] = formData.name.split(" ");
      form.append("first_name", firstName || "");
      form.append("last_name", lastNameParts.join(" ") || "");

      const cleanAddress =
        formData.address === "No address provided" ? "" : formData.address;
      const cleanBirthday =
        formData.birthday === "No birthday provided" ? "" : formData.birthday;

      form.append("address", cleanAddress);
      form.append("age", String(formData.age));
      if (cleanBirthday) form.append("birthday", cleanBirthday);
      form.append("bio", formData.bio);

      if (newPicture) {
        const localUri = newPicture.uri;
        const filename = localUri.split("/").pop() || "profile.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        form.append("profile_picture", {
          uri: localUri,
          name: filename,
          type,
        } as any);
      }

      const updatedProfile = await api.updateProfile(form);
      const fullName =
        `${updatedProfile.first_name || ""} ${updatedProfile.last_name || ""}`.trim() ||
        updatedProfile.username ||
        updatedProfile.email ||
        "User";

      const nextData = {
        name: fullName,
        email: updatedProfile.email || "",
        address: updatedProfile.address || "No address provided",
        age: updatedProfile.age || 0,
        birthday: updatedProfile.birthday || "No birthday provided",
        role:
          updatedProfile.role === "admin"
            ? "System Administrator"
            : "Library Borrower",
        bio: updatedProfile.bio || "No biography available.",
        profile_picture: updatedProfile.profile_picture || "",
      };

      setUserData(nextData);
      setFormData(nextData);
      setNewPicture(null);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update profile.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(userData);
    setNewPicture(null);
    setIsEditing(false);
  };

  if (loadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  const StatBlock = ({ value, label }: any) => (
    <View style={styles.statBlock}>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={["#f1f5f9", "#eff6ff", "#ecfeff"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Top Nav */}
              <View style={styles.navBar}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.navBtn}
                >
                  <Ionicons name="arrow-back" size={24} color="#475569" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>My Profile</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Top Card: Avatar & Stats */}
              <View style={styles.card}>
                <View style={styles.avatarContainer}>
                  {newPicture ? (
                    <Image
                      source={{ uri: newPicture.uri }}
                      style={styles.avatarImage}
                    />
                  ) : userData.profile_picture ? (
                    <Image
                      source={{ uri: userData.profile_picture }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                  )}
                  <View style={styles.statusDot} />
                </View>

                {isEditing && (
                  <TouchableOpacity
                    style={styles.changePhotoBtn}
                    onPress={pickImage}
                  >
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                  </TouchableOpacity>
                )}

                {isEditing ? (
                  <>
                    <TextInput
                      style={styles.nameInput}
                      value={formData.name}
                      onChangeText={(text) =>
                        setFormData({ ...formData, name: text })
                      }
                      textAlign="center"
                    />
                    <TextInput
                      style={styles.roleInput}
                      value={formData.role}
                      editable={false}
                      textAlign="center"
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.nameText}>{userData.name}</Text>
                    <Text style={styles.roleText}>{userData.role}</Text>
                  </>
                )}

                <View style={styles.statsDivider} />
                <View style={styles.statsRow}>
                  {/* ONLY show total borrows if the user is an Admin! */}
                  {userData.role === "System Administrator" && (
                    <StatBlock value={borrowings.length} label="BORROWS" />
                  )}
                  <StatBlock
                    value={borrowings.filter((b) => !b.return_date).length}
                    label="ACTIVE"
                  />
                  <StatBlock
                    value={
                      borrowings.filter(
                        (b) => (b.overdue_days || 0) > 0 && !b.return_date,
                      ).length
                    }
                    label="OVERDUE"
                  />
                </View>
              </View>

              {/* Middle Card: Personal Info */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Personal Information</Text>
                  {isEditing ? (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        onPress={handleCancel}
                        style={styles.cancelBtn}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveBtn}
                        disabled={saveLoading}
                      >
                        {saveLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.saveBtnText}>Save</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setIsEditing(true)}
                      style={styles.editBtn}
                    >
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Email Address</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.infoInput}
                        value={formData.email}
                        onChangeText={(t) =>
                          setFormData({ ...formData, email: t })
                        }
                        keyboardType="email-address"
                      />
                    ) : (
                      <Text style={styles.infoValue}>{userData.email}</Text>
                    )}
                  </View>
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Birthday (YYYY-MM-DD)</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.infoInput}
                        value={formData.birthday}
                        onChangeText={(t) =>
                          setFormData({ ...formData, birthday: t })
                        }
                      />
                    ) : (
                      <Text style={styles.infoValue}>{userData.birthday}</Text>
                    )}
                  </View>
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Age</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.infoInput}
                        value={String(formData.age)}
                        onChangeText={(t) =>
                          setFormData({ ...formData, age: Number(t) || 0 })
                        }
                        keyboardType="number-pad"
                      />
                    ) : (
                      <Text style={styles.infoValue}>
                        {userData.age} Years Old
                      </Text>
                    )}
                  </View>
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Address</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.infoInput}
                        value={formData.address}
                        onChangeText={(t) =>
                          setFormData({ ...formData, address: t })
                        }
                      />
                    ) : (
                      <Text style={styles.infoValue}>{userData.address}</Text>
                    )}
                  </View>
                </View>

                <View style={{ marginTop: 24 }}>
                  <Text style={styles.infoLabel}>Biography</Text>
                  {isEditing ? (
                    <TextInput
                      style={[
                        styles.infoInput,
                        { height: 100, textAlignVertical: "top" },
                      ]}
                      value={formData.bio}
                      onChangeText={(t) => setFormData({ ...formData, bio: t })}
                      multiline
                    />
                  ) : (
                    <View style={styles.bioBox}>
                      <Text style={styles.bioText}>"{userData.bio}"</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Bottom Card: Recent Activity */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Recent Activity</Text>
                <View style={{ marginTop: 16, gap: 12 }}>
                  {recentActivities.length === 0 ? (
                    <Text style={{ color: "#64748b" }}>
                      No recent activity found.
                    </Text>
                  ) : (
                    recentActivities.map((item, index) => (
                      <View key={index} style={styles.activityItem}>
                        <View style={styles.activityRow}>
                          <View
                            style={[
                              styles.activityIcon,
                              {
                                backgroundColor:
                                  item.action === "Borrowed"
                                    ? "#d1fae5"
                                    : item.action === "Returned"
                                      ? "#dbeafe"
                                      : "#f1f5f9",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.activityIconText,
                                {
                                  color:
                                    item.action === "Borrowed"
                                      ? "#059669"
                                      : item.action === "Returned"
                                        ? "#2563eb"
                                        : "#475569",
                                },
                              ]}
                            >
                              {item.action[0]}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.activityAction}>
                              {item.action}{" "}
                              <Text
                                style={{ fontWeight: "400", color: "#64748b" }}
                              >
                                "{item.book}"
                              </Text>
                            </Text>
                            <Text style={styles.activityDate}>{item.date}</Text>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#64748b", fontWeight: "600" },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 20 },

  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  navBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
  },
  navTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },

  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },

  avatarContainer: {
    alignSelf: "center",
    marginBottom: 20,
    position: "relative",
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarInitials: { fontSize: 36, fontWeight: "bold", color: "#fff" },
  statusDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    backgroundColor: "#10b981",
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#fff",
  },

  changePhotoBtn: {
    backgroundColor: "#eff6ff",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 16,
  },
  changePhotoText: { color: "#2563eb", fontWeight: "700", fontSize: 12 },

  nameText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
  },
  roleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563eb",
    textAlign: "center",
    marginTop: 4,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  roleInput: {
    fontSize: 15,
    fontWeight: "600",
    color: "#94a3b8",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 8,
  },

  statsDivider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 24 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statBlock: { alignItems: "center" },
  statNumber: { fontSize: 26, fontWeight: "bold", color: "#1e293b" },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 4,
    letterSpacing: 0.5,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  // Added flex: 1, marginRight, and bumped font down to 18 so it wraps/fits perfectly
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    flex: 1,
    marginRight: 8,
  },
  editBtn: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  editBtnText: { color: "#475569", fontWeight: "700", fontSize: 14 },
  actionRow: { flexDirection: "row", gap: 8 },
  // Reduced horizontal padding from 16 to 12 for smaller screens
  cancelBtn: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cancelBtnText: { color: "#475569", fontWeight: "700", fontSize: 14 },
  saveBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 60,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  infoGrid: { gap: 16 },
  infoBlock: { gap: 4 },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  infoInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#1e293b",
  },

  bioBox: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  bioText: { color: "#475569", fontStyle: "italic", lineHeight: 22 },

  activityItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  activityIconText: { fontSize: 16, fontWeight: "bold" },
  activityAction: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  activityDate: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    marginTop: 2,
  },
});
