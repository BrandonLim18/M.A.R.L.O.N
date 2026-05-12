import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function MyBorrowingsScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchData = async () => {
    try {
      const [profile, data] = await Promise.all([
        api.getProfile(),
        api.getBorrowings()
      ]);
      setIsAdmin(profile.role === 'admin');
      
      // Filter out returned books exactly like the web app
      const active = data.filter((b: any) => b.return_date === null);
      setBorrowings(active);
    } catch (error) {
      console.error("Failed to load borrowings:", error);
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

  const handleAction = async (action: string, id: number) => {
    try {
      if (action === 'approve') await api.approveBorrowing(id);
      if (action === 'reject') await api.rejectBorrowing(id);
      if (action === 'return') await api.returnBook(id);
      
      Alert.alert("Success", `Book successfully ${action}ed!`);
      fetchData(); // Refresh the list
    } catch (error: any) {
      Alert.alert("Error", error.message || `Failed to ${action} book.`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading borrowings...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#f1f5f9', '#eff6ff', '#ecfeff']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
            <Ionicons name="arrow-back" size={24} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{isAdmin ? 'Manage Borrowings' : 'My Borrowings'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
        >
          {borrowings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>No active borrowings found.</Text>
            </View>
          ) : (
            borrowings.map((item) => {
              // Web Logic Translated to Mobile
              const isPending = item.status === "Pending";
              const dueDate = new Date(item.due_date);
              const today = new Date();
              const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isOverdue = !isPending && daysLeft < 0;

              // Determine Colors based on status
              let statusBg = "#d1fae5"; // Emerald light
              let statusText = "#047857"; // Emerald dark
              let statusLabel = "Active";

              if (isPending) {
                statusBg = "#f1f5f9"; statusText = "#475569"; statusLabel = "Pending";
              } else if (isOverdue) {
                statusBg = "#fee2e2"; statusText = "#b91c1c"; statusLabel = "Overdue";
              } else if (daysLeft <= 3) {
                statusBg = "#fef3c7"; statusText = "#b45309"; statusLabel = "Due Soon";
              }

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bookTitle} numberOfLines={2}>
                        {item.book_details?.title || `Book ID: ${item.book}`}
                      </Text>
                      <Text style={styles.bookAuthor}>{item.book_details?.author || "-"}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.badgeText, { color: statusText }]}>{statusLabel}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailBlock}>
                      <Text style={styles.detailLabel}>Borrow Date</Text>
                      <Text style={styles.detailValue}>{item.borrow_date}</Text>
                    </View>
                    <View style={styles.detailBlock}>
                      <Text style={styles.detailLabel}>Due Date</Text>
                      <Text style={[styles.detailValue, isOverdue && { color: '#b91c1c' }, isPending && { color: '#94a3b8' }]}>
                        {isPending ? "TBD" : item.due_date}
                      </Text>
                    </View>
                    <View style={styles.detailBlock}>
                      <Text style={styles.detailLabel}>Time Remaining</Text>
                      <Text style={[styles.detailValue, isOverdue && { color: '#b91c1c' }, isPending && { color: '#94a3b8' }]}>
                         {isPending ? "-" : isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days`}
                      </Text>
                    </View>
                  </View>

                  {/* Admin Actions */}
                  {isAdmin && (
                    <View style={styles.actionRow}>
                      {isPending ? (
                        <>
                          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction('reject', item.id)}>
                            <Text style={styles.rejectBtnText}>Reject</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction('approve', item.id)}>
                            <Text style={styles.approveBtnText}>Approve</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity style={styles.returnBtn} onPress={() => handleAction('return', item.id)}>
                          <Text style={styles.returnBtnText}>Process Return</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '600' },
  
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  navBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12 },
  navTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  
  scrollContent: { padding: 20, paddingBottom: 40, gap: 16 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#64748b', fontWeight: '600' },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  bookTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  bookAuthor: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginLeft: 12 },
  badgeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },

  detailsGrid: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, gap: 12, justifyContent: 'space-between' },
  detailBlock: { flex: 1 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '700', color: '#334155' },

  actionRow: { flexDirection: 'row', marginTop: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  approveBtn: { flex: 1, backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  rejectBtn: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#fca5a5', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  rejectBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },
  returnBtn: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  returnBtnText: { color: '#334155', fontWeight: '700', fontSize: 14 },
});