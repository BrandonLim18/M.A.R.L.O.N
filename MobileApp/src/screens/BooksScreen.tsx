import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../services/api";

// --- NEW GENRE LIST ---
const GENRES = [
  "All",
  "Romance",
  "Fantasy",
  "Science Fiction",
  "Historical Fiction",
  "Networking & Systems Administration",
  "Programming & Software Development",
  "Other",
];

export default function BooksScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [books, setBooks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All"); // New State for Filtering

  // Modal States
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [contactNumber, setContactNumber] = useState("");
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    isbn: "",
    genre: "Other",
    year_published: "",
    copies_available: "1",
  });

  const fetchData = async () => {
    try {
      const [profile, booksData] = await Promise.all([
        api.getProfile(),
        api.getBooks(),
      ]);
      setIsAdmin(profile.role === "admin");
      setBooks(booksData);
    } catch (error) {
      console.error("Failed to load catalog:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  // --- ACTIONS ---
  const handleBorrow = async () => {
    if (!contactNumber.trim())
      return Alert.alert("Error", "Contact number is required.");
    Keyboard.dismiss();
    setActionLoading(true);
    try {
      await api.borrowBook({
        book: selectedBook.id,
        borrower_contact_number: contactNumber,
      });
      Alert.alert(
        "Success",
        "Borrow request sent! Waiting for Admin approval.",
      );
      setShowBorrowModal(false);
      setContactNumber("");
      fetchData();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error || "Failed to borrow book.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveBook = async () => {
    if (!bookForm.title || !bookForm.author)
      return Alert.alert("Error", "Title and Author are required.");
    Keyboard.dismiss();
    setActionLoading(true);
    try {
      const payload = {
        ...bookForm,
        copies_available: Number(bookForm.copies_available) || 0,
      };
      if (selectedBook) {
        await api.updateBook(selectedBook.id, payload);
        Alert.alert("Success", "Book updated!");
      } else {
        await api.createBook(payload);
        Alert.alert("Success", "Book added to library!");
      }
      setShowBookModal(false);
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", "Failed to save book.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBook = (id: number) => {
    Alert.alert("Delete Book", "Are you sure you want to remove this book?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteBook(id);
            fetchData();
          } catch (err) {
            Alert.alert("Error", "Failed to delete book.");
          }
        },
      },
    ]);
  };

  const openBookModal = (book: any = null) => {
    setSelectedBook(book);
    if (book) {
      setBookForm({
        title: book.title,
        author: book.author,
        isbn: book.isbn || "",
        genre: book.genre || "Other",
        year_published: String(book.year_published || ""),
        copies_available: String(book.copies_available),
      });
    } else {
      setBookForm({
        title: "",
        author: "",
        isbn: "",
        genre: "Other",
        year_published: "",
        copies_available: "1",
      });
    }
    setShowBookModal(true);
  };

  // --- UPDATED FILTERING LOGIC ---
  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "All" || b.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading Catalog...</Text>
      </View>
    );

  return (
    <LinearGradient
      colors={["#f1f5f9", "#eff6ff", "#ecfeff"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header & Search */}
        <View style={styles.header}>
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.navBtn}
            >
              <Ionicons name="arrow-back" size={24} color="#475569" />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Library Catalog</Text>
            {isAdmin ? (
              <TouchableOpacity
                onPress={() => openBookModal()}
                style={styles.addBtn}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search books, authors..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* --- NEW CATEGORY FILTER UI --- */}
        <View style={styles.genreContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreScroll}
          >
            {GENRES.map((genre) => (
              <TouchableOpacity
                key={genre}
                style={[
                  styles.genreChip,
                  selectedGenre === genre && styles.genreChipActive,
                ]}
                onPress={() => setSelectedGenre(genre)}
              >
                <Text
                  style={[
                    styles.genreText,
                    selectedGenre === genre && styles.genreTextActive,
                  ]}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Book List */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#059669"
            />
          }
        >
          {filteredBooks.map((book) => {
            const isAvailable = book.copies_available > 0;
            return (
              <View key={book.id} style={styles.bookCard}>
                <View style={styles.bookHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    <Text style={styles.bookAuthor}>by {book.author}</Text>
                    {/* Genre Display in Card */}
                    <Text style={styles.bookGenre}>
                      {book.genre || "Other"} • {book.year_published || "N/A"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: isAvailable ? "#d1fae5" : "#fee2e2" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: isAvailable ? "#059669" : "#dc2626" },
                      ]}
                    >
                      {isAvailable
                        ? `${book.copies_available} Available`
                        : "Borrowed"}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  {isAdmin ? (
                    <>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => openBookModal(book)}
                      >
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteBook(book.id)}
                      >
                        <Text style={styles.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.borrowBtn,
                        !isAvailable && { opacity: 0.5 },
                      ]}
                      disabled={!isAvailable}
                      onPress={() => {
                        setSelectedBook(book);
                        setShowBorrowModal(true);
                      }}
                    >
                      <Text style={styles.borrowBtnText}>
                        {isAvailable
                          ? "Request to Borrow"
                          : "Currently Unavailable"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {filteredBooks.length === 0 && (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Ionicons name="library-outline" size={60} color="#cbd5e1" />
              <Text
                style={{ color: "#64748b", marginTop: 10, fontWeight: "600" }}
              >
                No books found in this category.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* --- BORROW MODAL --- */}
        <Modal visible={showBorrowModal} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Borrow Book</Text>
              <Text style={styles.modalSubtitle}>
                Requesting: {selectedBook?.title}
              </Text>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Duration: 14 days upon admin approval
                </Text>
              </View>

              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Your phone number"
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowBorrowModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleBorrow}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Confirm Borrow</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* --- ADMIN BOOK MODAL --- */}
        <Modal visible={showBookModal} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {selectedBook ? "Edit Book" : "Add New Book"}
              </Text>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 450 }}
              >
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={bookForm.title}
                  onChangeText={(t) => setBookForm({ ...bookForm, title: t })}
                />
                <Text style={styles.label}>Author *</Text>
                <TextInput
                  style={styles.input}
                  value={bookForm.author}
                  onChangeText={(t) => setBookForm({ ...bookForm, author: t })}
                />

                {/* --- NEW GENRE SELECTOR FOR ADMINS --- */}
                <Text style={styles.label}>Category / Genre</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
                >
                  {GENRES.filter((g) => g !== "All").map((genre) => (
                    <TouchableOpacity
                      key={genre}
                      style={[
                        styles.modalGenreChip,
                        bookForm.genre === genre && styles.modalGenreChipActive,
                      ]}
                      onPress={() => setBookForm({ ...bookForm, genre })}
                    >
                      <Text
                        style={[
                          styles.modalGenreText,
                          bookForm.genre === genre &&
                            styles.modalGenreTextActive,
                        ]}
                      >
                        {genre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.label}>ISBN</Text>
                    <TextInput
                      style={styles.input}
                      value={bookForm.isbn}
                      onChangeText={(t) =>
                        setBookForm({ ...bookForm, isbn: t })
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Year</Text>
                    <TextInput
                      style={styles.input}
                      value={bookForm.year_published}
                      onChangeText={(t) =>
                        setBookForm({ ...bookForm, year_published: t })
                      }
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={{ marginTop: 10, marginBottom: 20 }}>
                  <Text style={styles.label}>Copies Available</Text>
                  <TextInput
                    style={styles.input}
                    value={bookForm.copies_available}
                    onChangeText={(t) =>
                      setBookForm({ ...bookForm, copies_available: t })
                    }
                    keyboardType="number-pad"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowBookModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSaveBook}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Save Book</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#64748b", fontWeight: "600" },

  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navBtn: { padding: 8, backgroundColor: "#fff", borderRadius: 12 },
  navTitle: { fontSize: 22, fontWeight: "800", color: "#1e293b" },
  addBtn: { padding: 8, backgroundColor: "#2563eb", borderRadius: 12 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: "#1e293b" },

  // --- GENRE FILTER STYLES ---
  genreContainer: {
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.9)",
  },
  genreScroll: { paddingHorizontal: 20, gap: 10 },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  genreChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  genreText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  genreTextActive: { color: "#fff" },

  scrollContent: { padding: 20, paddingBottom: 40, gap: 16 },
  bookCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bookHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 4,
  },
  bookAuthor: { fontSize: 14, color: "#475569", fontWeight: "600" },
  bookGenre: {
    fontSize: 12,
    color: "#2563eb",
    marginTop: 4,
    fontWeight: "700",
  }, // Highlighted genre in blue
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  badgeText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

  actionRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 16,
  },
  borrowBtn: {
    flex: 1,
    backgroundColor: "#059669",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  borrowBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  editBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  editBtnText: { color: "#334155", fontWeight: "700", fontSize: 14 },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#fef2f2",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteBtnText: { color: "#ef4444", fontWeight: "700", fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 4,
  },
  modalSubtitle: { fontSize: 14, color: "#64748b", marginBottom: 20 },
  infoBox: {
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  infoText: { color: "#1e40af", fontSize: 13, fontWeight: "600" },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    marginLeft: 4,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: "#1e293b",
  },

  // --- ADMIN MODAL GENRE CHIP STYLES ---
  modalGenreChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalGenreChipActive: { backgroundColor: "#dbeafe", borderColor: "#3b82f6" },
  modalGenreText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  modalGenreTextActive: { color: "#2563eb" },

  modalActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  cancelBtnText: { color: "#475569", fontWeight: "700", fontSize: 16 },
  submitBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
