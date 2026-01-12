import { useTheme } from '@/contexts/ThemeContext';
import { api, clearSession, fetchAndStoreUser, User } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
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
        fetchFavorites(userData.id);
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



  const fetchFavorites = async (userId: string) => {
    setLoadingFavorites(true);
    try {
      const response = await api.getFavorites(userId);
      console.log(response)
      setFavorites(response.favoriteProviders || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoadingFavorites(false);
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favorite Providers</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/favorites')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {loadingFavorites ? (
            <ActivityIndicator size="small" color={colors.brand} />
          ) : favorites.length > 0 ? (
            <FlatList
              horizontal
              data={favorites}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.favoritesList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.favoriteCard}
                  onPress={() => router.push({ pathname: '/(tabs)/menu', params: { providerId: item._id } })}
                >
                  <View style={styles.favoriteAvatar}>
                    <Text style={styles.favoriteAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.favoriteName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.favoriteRole}>Provider</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyFavorites}>
              <Text style={styles.emptyFavoritesText}>No favorites yet. Add some!</Text>
              <TouchableOpacity onPress={() => router.push('/providers')} style={styles.addFavoritesButton}>
                <Text style={styles.addFavoritesText}>Browse Providers</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/menu')}
            >
              <Ionicons name="restaurant" size={32} color={colors.brand} style={styles.actionIcon} />
              <Text style={styles.actionText}>View Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/orders')}
            >
              <Ionicons name="receipt" size={32} color={colors.brand} style={styles.actionIcon} />
              <Text style={styles.actionText}>My Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/providers')}
            >
              <Ionicons name="people" size={32} color={colors.brand} style={styles.actionIcon} />
              <Text style={styles.actionText}>All Providers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/history')}
            >
              <Ionicons name="time" size={32} color={colors.brand} style={styles.actionIcon} />
              <Text style={styles.actionText}>History</Text>
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
    borderRadius: 22,
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
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.brand,
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 22,
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
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 50,
  },
  favoritesList: {
    paddingRight: 20,
    gap: 12,
  },
  favoriteCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 22,
    alignItems: 'center',
    width: 110,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  favoriteAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.brand,
  },
  favoriteName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  favoriteRole: {
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  emptyFavorites: {
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFavoritesText: {
    color: colors.muted,
    marginBottom: 8,
  },
  addFavoritesButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.brand + '20',
    borderRadius: 12,
  },
  addFavoritesText: {
    color: colors.brand,
    fontWeight: '600',
    fontSize: 12,
  },
});

const styles = getStyles({}); // Will be overridden in component
