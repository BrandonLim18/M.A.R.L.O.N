import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

interface DashboardScreenProps {
  setToken: (token: string | null) => void;
  navigation: any; 
}

export default function DashboardScreen({ setToken, navigation }: DashboardScreenProps) {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [userRole, setUserRole] = useState<"admin" | "borrower" | null>(null);
  const [userName, setUserName] = useState("User");
  
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    activeBorrowings: 0,
    overdueRecords: 0,
  });

  const fetchData = async () => {
    try {
      const profile = await api.getProfile();
      setUserRole(profile.role);
      setUserName(profile.first_name || profile.username || "User");

      const [booksData, borrowingsData] = await Promise.all([
        api.getBooks(),
        api.getBorrowings(),
      ]);

      const availableCount = booksData.filter((b: any) => b.copies_available > 0).length;
      const activeBorrowings = borrowingsData.filter((item: any) => !item.return_date);
      const overdueCount = activeBorrowings.filter((item: any) => (item.overdue_days || 0) > 0).length;

      setStats({
        totalBooks: booksData.length,
        availableBooks: availableCount,
        activeBorrowings: activeBorrowings.length,
        overdueRecords: overdueCount,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
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

  const handleLogout = async () => {
    await api.logout();
    setToken(null); 
  };

  // Dynamically calculate exactly half the screen minus padding and gap
  const cardWidth = (width - 40 - 16) / 2; 

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { width: cardWidth }]}>
      <View style={[styles.iconWrapper, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.statTitle} numberOfLines={1}>{title}</Text>
    </View>
  );

  const ActionCard = ({ title, subtitle, icon, colors, onPress }: any) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.actionCardWrapper}>
      <LinearGradient colors={colors} style={styles.actionCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.actionContent}>
          <View>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionSubtitle}>{subtitle}</Text>
          </View>
          <View style={styles.actionIconCircle}>
            <Ionicons name={icon} size={28} color={colors[0]} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading your library...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#f1f5f9', '#eff6ff', '#ecfeff']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header - Matches Web's Glassmorphism */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting} numberOfLines={1}>Hello, {userName} 👋</Text>
            <Text style={styles.roleText}>
              {userRole === 'admin' ? 'Administrator' : 'Borrower'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#dc2626" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        >
          {/* Section: Metrics */}
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {userRole === 'admin' && (
               <StatCard title="Total Books" value={stats.totalBooks} icon="library" color="#2563eb" />
            )}
            <StatCard title="Available" value={stats.availableBooks} icon="book" color="#059669" />
            <StatCard title="Active Borrows" value={stats.activeBorrowings} icon="swap-horizontal" color="#f59e0b" />
            <StatCard title="Overdue" value={stats.overdueRecords} icon="warning" color="#dc2626" />
          </View>

          {/* Section: Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {userRole === 'admin' ? (
              <>
                <ActionCard title="Add Book" subtitle="Register new titles" icon="add" colors={['#2563eb', '#3b82f6']} onPress={() => console.log('To Add Book')} />
                <ActionCard title="Manage Books" subtitle="Edit or remove inventory" icon="settings" colors={['#f59e0b', '#fbbf24']} onPress={() => navigation.navigate('Books')} />
                <ActionCard title="Borrowings" subtitle="Approve/Reject requests" icon="people" colors={['#059669', '#10b981']} onPress={() => navigation.navigate('MyBorrowings')} />
                <ActionCard title="History" subtitle="View past transactions" icon="time" colors={['#7c3aed', '#8b5cf6']} onPress={() => navigation.navigate('History')} />
              </>
            ) : (
              <>
                <ActionCard title="Borrow a Book" subtitle="Browse the library catalog" icon="search" colors={['#059669', '#10b981']} onPress={() => navigation.navigate('Books')} />
                <ActionCard title="My Borrowings" subtitle="View status & due dates" icon="bookmarks" colors={['#2563eb', '#3b82f6']} onPress={() => navigation.navigate('MyBorrowings')} />
                <ActionCard title="My Profile" subtitle="Update personal info" icon="person" colors={['#7c3aed', '#8b5cf6']} onPress={() => navigation.navigate('Profile')} />
              </>
            )}
          </View>
        </ScrollView>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '600', fontSize: 16 },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.9)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
      android: { elevation: 3 }
    })
  },
  headerTextContainer: { flex: 1, paddingRight: 15 },
  greeting: { fontSize: 26, fontWeight: '900', color: '#1e293b', letterSpacing: -0.5 },
  roleText: { fontSize: 14, color: '#64748b', fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  logoutBtn: { padding: 12, backgroundColor: '#fef2f2', borderRadius: 16, borderWidth: 1, borderColor: '#fee2e2' },
  
  scrollContent: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#334155', marginBottom: 16, marginTop: 10, letterSpacing: -0.2 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 28 },
  statCard: { 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    padding: 16, 
    borderRadius: 24, 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 4 }
    })
  },
  iconWrapper: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  statValue: { fontSize: 28, fontWeight: '900', color: '#1e293b', marginBottom: 2 },
  statTitle: { fontSize: 13, color: '#64748b', fontWeight: '700' },

  actionGrid: { gap: 16 },
  actionCardWrapper: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 6 }
    })
  },
  actionCard: { 
    borderRadius: 24, 
    padding: 20, 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  actionContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5, marginBottom: 4 },
  actionSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  actionIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center' }
});