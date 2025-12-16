import { useTheme } from '@/contexts/ThemeContext';
import { clearSession, fetchAndStoreUser, User } from '@/utils/api';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
    }, [])
  );

  const loadUser = async () => {
    try {
      // Fetch fresh user data from API and store it
      const userData = await fetchAndStoreUser();
      if (userData) {
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
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.subtitle}>Welcome to Tiffin App</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/menu')}
          >
            <Text style={styles.actionIcon}>🍽️</Text>
            <Text style={styles.actionText}>View Menu</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionText}>My Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/favorites')}
          >
            <Text style={styles.actionIcon}>⭐</Text>
            <Text style={styles.actionText}>Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/history')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  logo: {
    width: 60,
    height: 60,
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
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.brand,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 50,
  },
});

const styles = getStyles({}); // Will be overridden in component
