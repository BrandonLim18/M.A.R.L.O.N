import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function HistoryScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const data = await api.getHistory();
      setHistory(data);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, []);

  if (loading) return (
    <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#7c3aed" /><Text style={styles.loadingText}>Loading history...</Text></View>
  );

  return (
    <LinearGradient colors={['#f1f5f9', '#eff6ff', '#ecfeff']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
            <Ionicons name="arrow-back" size={24} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Transaction History</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}>
          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>No past transactions found.</Text>
            </View>
          ) : (
            history.map((item, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {item.book_details?.title || item.book_title || `Transaction #${item.transaction || item.id}`}
                    </Text>
                    <Text style={styles.bookAuthor}>Borrower: {item.borrower_name || item.borrower_email || "User"}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Returned</Text>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Borrowed</Text>
                    <Text style={styles.detailValue}>{item.borrow_date}</Text>
                  </View>
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Returned</Text>
                    <Text style={styles.detailValue}>{item.return_date}</Text>
                  </View>
                </View>
              </View>
            ))
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
  badge: { backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginLeft: 12 },
  badgeText: { color: '#4338ca', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  detailsGrid: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, gap: 12, justifyContent: 'space-between' },
  detailBlock: { flex: 1 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '700', color: '#334155' },
});