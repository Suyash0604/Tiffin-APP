import { useTheme } from '@/contexts/ThemeContext';
import { api, getUser } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ContactScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!subject || !message) {
      Alert.alert('Error', 'Please fill in all fields');
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

      await api.contactThroughEmail(user.id, subject, message);
      
      Alert.alert(
        'Message Sent',
        'Your message has been sent to the developer. We will get back to you soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSubject('');
    setMessage('');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleOpenMap = () => {
    // Open maps with a generic address
    Linking.openURL('https://maps.google.com/?q=TiffinHub+Office');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.muted }]}>
        <TouchableOpacity onPress={() => router.push('/(provider-tabs)/profile')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Contact Us</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Contact Information Cards */}
        <View style={[styles.contactCard, { backgroundColor: colors.surface }]}>
          <View style={styles.contactHeader}>
            <Ionicons name="call" size={24} color={colors.brand} />
            <Text style={[styles.contactTitle, { color: colors.text }]}>Phone</Text>
          </View>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleCall('+919356832376')}
          >
            <Ionicons name="call-outline" size={20} color={colors.brand} />
            <Text style={[styles.contactValue, { color: colors.text }]}>+91 9356832376</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleCall('+918421713789')}
          >
            <Ionicons name="call-outline" size={20} color={colors.brand} />
            <Text style={[styles.contactValue, { color: colors.text }]}>+91 8421713789</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={[styles.contactCard, { backgroundColor: colors.surface }]}>
          <View style={styles.contactHeader}>
            <Ionicons name="mail" size={24} color={colors.brand} />
            <Text style={[styles.contactTitle, { color: colors.text }]}>Email</Text>
          </View>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleEmail('support@tiffinhub.com')}
          >
            <Ionicons name="mail-outline" size={20} color={colors.brand} />
            <Text style={[styles.contactValue, { color: colors.text }]}>support@tiffinhub.com</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleEmail('info@tiffinhub.com')}
          >
            <Ionicons name="mail-outline" size={20} color={colors.brand} />
            <Text style={[styles.contactValue, { color: colors.text }]}>info@tiffinhub.com</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={[styles.contactCard, { backgroundColor: colors.surface }]}>
          <View style={styles.contactHeader}>
            <Ionicons name="location" size={24} color={colors.brand} />
            <Text style={[styles.contactTitle, { color: colors.text }]}>Address</Text>
          </View>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={handleOpenMap}
          >
            <Ionicons name="location-outline" size={20} color={colors.brand} />
            <View style={styles.addressContainer}>
              <Text style={[styles.contactValue, { color: colors.text }]}>
                Bibewadi,{'\n'}
                Pune,{'\n'}
                Maharashtra, India
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={[styles.contactCard, { backgroundColor: colors.surface }]}>
          <View style={styles.contactHeader}>
            <Ionicons name="time" size={24} color={colors.brand} />
            <Text style={[styles.contactTitle, { color: colors.text }]}>Business Hours</Text>
          </View>
          <View style={styles.hoursContainer}>
            <View style={styles.hoursRow}>
              <Text style={[styles.hoursDay, { color: colors.text }]}>Monday - Friday</Text>
              <Text style={[styles.hoursTime, { color: colors.muted }]}>9:00 AM - 8:00 PM</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={[styles.hoursDay, { color: colors.text }]}>Saturday</Text>
              <Text style={[styles.hoursTime, { color: colors.muted }]}>10:00 AM - 6:00 PM</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={[styles.hoursDay, { color: colors.text }]}>Sunday</Text>
              <Text style={[styles.hoursTime, { color: colors.muted }]}>Closed</Text>
            </View>
          </View>
        </View>

        {/* Contact Form */}
        <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <View style={styles.contactHeader}>
            <Ionicons name="chatbubbles" size={24} color={colors.brand} />
            <Text style={[styles.contactTitle, { color: colors.text }]}>Send us a Message</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Subject</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.muted + '40' }]}
              placeholder="What is this regarding?"
              placeholderTextColor={colors.muted}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Message</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.muted + '40' }]}
              placeholder="Your message..."
              placeholderTextColor={colors.muted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[
              styles.sendButton, 
              { 
                backgroundColor: colors.brand,
                opacity: loading ? 0.6 : 1,
              }
            ]}
            onPress={handleSendMessage}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.sendButtonText}>Send Message</Text>
              </>
            )}
          </TouchableOpacity>
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
    paddingBottom: 100, // Extra padding to account for bottom tab bar
  },
  contactCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.muted + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted + '20',
  },
  contactValue: {
    flex: 1,
    fontSize: 15,
    marginLeft: 12,
  },
  addressContainer: {
    flex: 1,
    marginLeft: 12,
  },
  hoursContainer: {
    marginTop: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted + '20',
  },
  hoursDay: {
    fontSize: 15,
    fontWeight: '500',
  },
  hoursTime: {
    fontSize: 15,
  },
  formCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.muted + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    fontSize: 15,
    minHeight: 120,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 22,
    gap: 8,
    marginTop: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
