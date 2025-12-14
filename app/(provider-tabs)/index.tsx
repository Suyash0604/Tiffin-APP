import { useTheme } from '@/contexts/ThemeContext';
import { api, clearSession, fetchAndStoreUser, getUser, User } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OrdersSummary {
  date: string;
  totalOrders: number;
  fullTiffin: number;
  halfTiffin: number;
  riceOnly: number;
  totalRevenue: number;
}

export default function ProviderDashboardScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersSummary, setOrdersSummary] = useState<OrdersSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const logoAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create infinite up and down animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(logoAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUser();
      loadOrdersSummary();
    }, [])
  );

  const loadUser = async () => {
    try {
      // Fetch fresh user data from API and store it
      const userData = await fetchAndStoreUser();
      if (userData) {
        if (userData.role !== 'provider') {
          // Redirect to user dashboard if not a provider
          router.replace('/(tabs)');
          return;
        }
        setUser(userData);
      } else {
        // No user found, redirect to login
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      router.replace('/(auth)/login');
    } finally {
      setLoading(false);
    }
  };

  const loadOrdersSummary = async () => {
    try {
      const userData = await getUser();
      if (!userData || !userData.id) {
        return;
      }

      setSummaryLoading(true);
      // Get today's orders summary from API
      const summary = await api.getProviderOrdersSummary(userData.id);
      setOrdersSummary(summary);
    } catch (error: any) {
      console.error('Error loading orders summary:', error);
      // Don't show error alert for summary, just set empty summary
      const today = new Date().toISOString().split('T')[0];
      setOrdersSummary({
        date: today,
        totalOrders: 0,
        fullTiffin: 0,
        halfTiffin: 0,
        riceOnly: 0,
        totalRevenue: 0,
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Animated.Image
            source={require('@/assets/images/logo3.png')}
            style={[
              styles.logo,
              {
                transform: [
                  {
                    translateY: logoAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -7],
                    }),
                  },
                ],
              },
            ]}
            resizeMode="contain"
          />
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.greeting}>Hello</Text>
          <Text style={styles.name}>{user?.name || 'Provider'}</Text>
          <Text style={styles.subtitle}>Provider Dashboard</Text>
        </View>

        {ordersSummary && (
          <TouchableOpacity
            style={styles.summaryCard}
            onPress={() => router.push('/(provider-tabs)/orders')}
            activeOpacity={0.7}
          >
            <View style={styles.summaryHeader}>
              <View style={styles.summaryTitleContainer}>
                <Text style={styles.summaryTitle}>Orders Summary</Text>
                <Text style={styles.summaryDate}>{formatDate(ordersSummary.date)}</Text>
              </View>
              <View style={styles.viewMoreButton}>
                <Text style={styles.viewMoreText}>View More</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.brand} />
              </View>
            </View>

            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{ordersSummary.totalOrders}</Text>
                <Text style={styles.summaryStatLabel}>Total Orders</Text>
              </View>
              <View style={styles.summaryStatDivider} />
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{ordersSummary.fullTiffin}</Text>
                <Text style={styles.summaryStatLabel}>Full Tiffin</Text>
              </View>
              <View style={styles.summaryStatDivider} />
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{ordersSummary.halfTiffin}</Text>
                <Text style={styles.summaryStatLabel}>Half Tiffin</Text>
              </View>
              <View style={styles.summaryStatDivider} />
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{ordersSummary.riceOnly}</Text>
                <Text style={styles.summaryStatLabel}>Rice Only</Text>
              </View>
            </View>

            <View style={styles.totalRevenueContainer}>
              <Text style={styles.totalRevenueLabel}>Total Revenue</Text>
              <Text style={styles.totalRevenueValue}>₹{ordersSummary.totalRevenue.toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(provider-tabs)/menu')}
            >
              <Text style={styles.actionIcon}>🍽️</Text>
              <Text style={styles.actionText}>Manage Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(provider-tabs)/orders')}
            >
              <Text style={styles.actionIcon}>📦</Text>
              <Text style={styles.actionText}>View Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(provider-tabs)/analytics')}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(provider-tabs)/profile')}
            >
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  logo: {
    width: 70,
    height: 70,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  welcomeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.brand,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitleContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.brand,
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },
  summaryStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.muted,
    opacity: 0.3,
  },
  totalRevenueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.muted,
  },
  totalRevenueLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalRevenueValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.accent,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
});

const styles = getStyles({}); // Will be overridden in component
