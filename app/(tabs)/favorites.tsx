import { useTheme } from '@/contexts/ThemeContext';
import { api, getUser, Provider } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [favorites, setFavorites] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      const user = await getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const response = await api.getFavorites(user.id);
      setFavorites(response.favoriteProviders || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      // Don't alert on 404/empty, just show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemoveFavorite = async (providerId: string, providerName: string) => {
    if (!userId) return;

    Alert.alert(
      'Remove Favorite',
      `Are you sure you want to remove ${providerName} from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeFavorite(userId, providerId);
              loadFavorites(); // Reload list
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove favorite');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const renderItem = ({ item }: { item: Provider }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.providerInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.providerName}>{item.name}</Text>
            <Text style={styles.providerEmail}>{item.email}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleRemoveFavorite(item._id, item.name)}
          style={styles.heartButton}
        >
          <Ionicons name="heart" size={24} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.viewMenuButton}
          onPress={() => {
            // Link to menu, possibly passing filtering params?
            // Since menu API is generic, maybe we can just navigate to Menu with params
            // But the current menu tab might not support params yet.
            // For now, let's just go there.
            router.push('/(tabs)/menu');
          }}
        >
          <Text style={styles.viewMenuText}>View Menu</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.brand} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/providers')}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.brand} />
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="heart-outline" size={80} color={colors.muted} />
          </View>
          <Text style={styles.title}>No Favorites Yet</Text>
          <Text style={styles.description}>
            Add providers to your favorites to quickly access their menus.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/providers')}
          >
            <Text style={styles.ctaButtonText}>Browse Providers</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addButtonText: {
    color: colors.brand,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 4,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.brand + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.brand,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  providerEmail: {
    fontSize: 14,
    color: colors.muted,
  },
  heartButton: {
    padding: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  viewMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMenuText: {
    color: colors.brand,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 300,
  },
  ctaButton: {
    backgroundColor: colors.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
