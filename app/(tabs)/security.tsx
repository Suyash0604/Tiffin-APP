import { useTheme } from '@/contexts/ThemeContext';
import { api, getUser } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SecurityScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return;
    }

    if (!passwordValidation?.isValid) {
      Alert.alert('Error', 'Password does not meet security requirements');
      return;
    }

    setLoading(true);
    try {
      const user = await getUser();
      if (!user || !user.id) {
        Alert.alert('Error', 'User not found. Please login again.');
        router.replace('/(auth)/login');
        return;
      }

      await api.updatePassword(user.id, currentPassword, newPassword);
      
      Alert.alert(
        'Success',
        'Password updated successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    };
  };

  const passwordValidation = newPassword ? validatePassword(newPassword) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.muted }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Security Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="shield-checkmark" size={24} color={colors.brand} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>Password Security</Text>
          </View>
          <Text style={[styles.infoText, { color: colors.muted }]}>
            Keep your account secure by using a strong password. Make sure to use a combination of letters, 
            numbers, and special characters.
          </Text>
        </View>

        {/* Password Reset Form */}
        <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <View style={styles.formHeader}>
            <Ionicons name="lock-closed" size={24} color={colors.brand} />
            <Text style={[styles.formTitle, { color: colors.text }]}>Reset Password</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Current Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.muted + '40' }]}
                placeholder="Enter current password"
                placeholderTextColor={colors.muted}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.muted + '40' }]}
                placeholder="Enter new password"
                placeholderTextColor={colors.muted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
            {passwordValidation && (
              <View style={styles.validationContainer}>
                <View style={styles.validationItem}>
                  <Ionicons
                    name={passwordValidation.hasMinLength ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={passwordValidation.hasMinLength ? colors.brand : colors.muted}
                  />
                  <Text style={[styles.validationText, { color: passwordValidation.hasMinLength ? colors.brand : colors.muted }]}>
                    At least 8 characters
                  </Text>
                </View>
                <View style={styles.validationItem}>
                  <Ionicons
                    name={passwordValidation.hasUpperCase ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={passwordValidation.hasUpperCase ? colors.brand : colors.muted}
                  />
                  <Text style={[styles.validationText, { color: passwordValidation.hasUpperCase ? colors.brand : colors.muted }]}>
                    One uppercase letter
                  </Text>
                </View>
                <View style={styles.validationItem}>
                  <Ionicons
                    name={passwordValidation.hasLowerCase ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={passwordValidation.hasLowerCase ? colors.brand : colors.muted}
                  />
                  <Text style={[styles.validationText, { color: passwordValidation.hasLowerCase ? colors.brand : colors.muted }]}>
                    One lowercase letter
                  </Text>
                </View>
                <View style={styles.validationItem}>
                  <Ionicons
                    name={passwordValidation.hasNumber ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={passwordValidation.hasNumber ? colors.brand : colors.muted}
                  />
                  <Text style={[styles.validationText, { color: passwordValidation.hasNumber ? colors.brand : colors.muted }]}>
                    One number
                  </Text>
                </View>
                <View style={styles.validationItem}>
                  <Ionicons
                    name={passwordValidation.hasSpecialChar ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={passwordValidation.hasSpecialChar ? colors.brand : colors.muted}
                  />
                  <Text style={[styles.validationText, { color: passwordValidation.hasSpecialChar ? colors.brand : colors.muted }]}>
                    One special character
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.muted + '40' }]}
                placeholder="Confirm new password"
                placeholderTextColor={colors.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
            {confirmPassword && newPassword !== confirmPassword && (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                Passwords do not match
              </Text>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <Text style={[styles.successText, { color: colors.brand }]}>
                Passwords match
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.resetButton,
              {
                backgroundColor: colors.brand,
                opacity: (passwordValidation?.isValid && newPassword === confirmPassword && !loading) ? 1 : 0.6,
              },
            ]}
            onPress={handleResetPassword}
            disabled={!passwordValidation?.isValid || newPassword !== confirmPassword || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={20} color="#fff" />
                <Text style={styles.resetButtonText}>Reset Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={24} color={colors.brand} />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Security Tips</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
            <Text style={[styles.tipText, { color: colors.text }]}>
              Use a unique password that you don't use elsewhere
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
            <Text style={[styles.tipText, { color: colors.text }]}>
              Change your password regularly
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
            <Text style={[styles.tipText, { color: colors.text }]}>
              Never share your password with anyone
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
            <Text style={[styles.tipText, { color: colors.text }]}>
              Enable two-factor authentication if available
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    borderRadius: 22,
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
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 22,
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
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 22,
    backgroundColor: colors.bg,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
  },
  eyeButton: {
    padding: 14,
  },
  validationContainer: {
    marginTop: 12,
    gap: 8,
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  validationText: {
    fontSize: 13,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  successText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 22,
    gap: 8,
    marginTop: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    borderRadius: 22,
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
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});


