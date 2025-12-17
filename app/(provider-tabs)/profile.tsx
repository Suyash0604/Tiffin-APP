import { useTheme } from '@/contexts/ThemeContext';
import { clearSession, fetchAndStoreUser, User } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProviderProfileScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const styles = getStyles(colors);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.muted }]}>
        <View style={styles.headerLeft}>
          <Image 
            source={require('@/assets/images/logo3.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutHeaderButton}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.logoutHeaderText, { color: colors.danger }]}>Logout</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.brand + '20' }]}>
            <Ionicons name="business" size={48} color={colors.brand} />
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'Provider'}</Text>
          <Text style={[styles.profileEmail, { color: colors.muted }]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.brand + '20' }]}>
            <Text style={[styles.roleText, { color: colors.brand }]}>
              {user?.role?.toUpperCase() || 'PROVIDER'}
            </Text>
          </View>
        </View>

        {/* Account Information */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={20} color={colors.brand} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>Account Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={colors.muted} style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Email</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{user?.email}</Text>
            </View>
          </View>
          {user?.mobile && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color={colors.muted} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.muted }]}>Mobile</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{user.mobile}</Text>
              </View>
            </View>
          )}
          {user?.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={colors.muted} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.muted }]}>Address</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{user.address}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={20} color={colors.brand} />
            <Text style={[styles.settingsTitle, { color: colors.text }]}>Settings</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name={theme === 'dark' ? 'moon' : 'sunny'} 
                size={24} 
                color={colors.brand} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingDescription, { color: colors.muted }]}>
                  Switch to dark theme
                </Text>
              </View>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.muted + '40', true: colors.brand + '80' }}
              thumbColor={theme === 'dark' ? colors.brand : colors.surface}
              ios_backgroundColor={colors.muted + '40'}
            />
          </View>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color={colors.brand} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Notifications</Text>
                <Text style={[styles.settingDescription, { color: colors.muted }]}>
                  Manage notification preferences
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/(provider-tabs)/security')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed-outline" size={24} color={colors.brand} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Privacy & Security</Text>
                <Text style={[styles.settingDescription, { color: colors.muted }]}>
                  Manage your privacy settings
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Help & Support */}
        <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="help-circle-outline" size={20} color={colors.brand} />
            <Text style={[styles.settingsTitle, { color: colors.text }]}>Help & Support</Text>
          </View>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/(provider-tabs)/help')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={24} color={colors.brand} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Help Center</Text>
                <Text style={[styles.settingDescription, { color: colors.muted }]}>
                  Get help and support
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/(provider-tabs)/contact')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="chatbubble-outline" size={24} color={colors.brand} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Contact Us</Text>
                <Text style={[styles.settingDescription, { color: colors.muted }]}>
                  Reach out to our support team
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/(provider-tabs)/about')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={24} color={colors.brand} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>About</Text>
                <Text style={[styles.settingDescription, { color: colors.muted }]}>
                  App version and information
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.logoutButtonText, { color: colors.danger }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 4,
  },
  logoutHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileHeader: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.muted + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.muted + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.muted + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted + '20',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

const styles = getStyles({}); // Will be overridden in component

