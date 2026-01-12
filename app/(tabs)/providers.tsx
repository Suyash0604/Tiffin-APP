import { useTheme } from '@/contexts/ThemeContext';
import { api, getUser, Provider } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProvidersScreen() {
    const { colors } = useTheme();
    const styles = getStyles(colors);

    const [providers, setProviders] = useState<Provider[]>([]);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await getUser();
            if (user) {
                setUserId(user.id);
                const [providersData, favoritesData] = await Promise.all([
                    api.getProviders(),
                    api.getFavorites(user.id)
                ]);

                if (providersData.success) {
                    setProviders(providersData.providers || []);
                }

                const favSet = new Set((favoritesData.favoriteProviders || []).map(p => p._id));
                setFavorites(favSet);
            }
        } catch (error) {
            console.error('Error loading providers data:', error);
            Alert.alert('Error', 'Failed to load providers');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const toggleFavorite = async (provider: Provider) => {
        if (!userId) return;

        try {
            if (favorites.has(provider._id)) {
                await api.removeFavorite(userId, provider._id);
                const newFavs = new Set(favorites);
                newFavs.delete(provider._id);
                setFavorites(newFavs);
            } else {
                await api.addFavorite(userId, provider._id);
                const newFavs = new Set(favorites);
                newFavs.add(provider._id);
                setFavorites(newFavs);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update favorite');
        }
    };

    const filteredProviders = providers.filter(provider =>
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: Provider }) => {
        const isFavorite = favorites.has(item._id);

        return (
            <View style={styles.card}>
                <View style={styles.cardContent}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>

                    <View style={styles.infoContainer}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                        <View style={styles.roleContainer}>
                            <Text style={styles.roleText}>Tiffin Provider</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.favButton}
                        onPress={() => toggleFavorite(item)}
                    >
                        <Ionicons
                            name={isFavorite ? "heart" : "heart-outline"}
                            size={28}
                            color={isFavorite ? colors.danger : colors.muted}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={colors.brand} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Providers</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.muted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search providers..."
                    placeholderTextColor={colors.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={colors.muted} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={filteredProviders}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No providers found matching "{searchQuery}"</Text>
                    </View>
                }
            />
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 48,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        color: colors.text,
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.brand,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: colors.brand,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: colors.muted,
        marginBottom: 4,
    },
    roleContainer: {
        backgroundColor: colors.background,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    roleText: {
        fontSize: 10,
        color: colors.text,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    favButton: {
        padding: 8,
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: colors.muted,
        textAlign: 'center',
    },
});
