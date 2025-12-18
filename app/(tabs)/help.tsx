import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How do I place an order?',
    answer: 'To place an order, go to the Menu tab, browse through the available menus for today, select your preferred meal type (Full Tiffin, Half Tiffin, or Rice Only) and sabjis, then tap "Place Order". You can review your order before confirming.',
  },
  {
    id: '2',
    question: 'Can I order for multiple days?',
    answer: 'Currently, you can only place orders for today\'s menu. Check back daily to see the updated menu and place your orders.',
  },
  {
    id: '3',
    question: 'How do I track my order?',
    answer: 'Go to the Orders tab to view all your orders. You can see the status of each order (Pending, Confirmed, Preparing, Ready, Delivered) and track them in real-time.',
  },
  {
    id: '4',
    question: 'What payment methods are accepted?',
    answer: 'Payment methods may vary by provider. Please check with your provider or refer to the order details for accepted payment options. Most providers accept cash on delivery.',
  },
  {
    id: '5',
    question: 'Can I cancel my order?',
    answer: 'You can cancel your order if it hasn\'t been confirmed by the provider yet. Go to the Orders tab, find your order, and tap the cancel option if available.',
  },
  {
    id: '6',
    question: 'How do I change my delivery address?',
    answer: 'You can update your delivery address in your Profile. Go to Profile > Account Information and update your address. Make sure to update it before placing new orders.',
  },
  {
    id: '7',
    question: 'What if I receive the wrong order?',
    answer: 'If you receive an incorrect order, please contact the provider immediately through the Contact Us section or call them directly. They will help resolve the issue.',
  },
  {
    id: '8',
    question: 'How do I save my favorite menus?',
    answer: 'The Favorites feature is coming soon! You\'ll be able to save your favorite menus and providers for quick access in the future.',
  },
  {
    id: '9',
    question: 'Can I see my order history?',
    answer: 'Yes! Go to the History tab to view all your past orders. You can see details of previous orders including date, items ordered, and total amount.',
  },
  {
    id: '10',
    question: 'What should I do if I have a complaint?',
    answer: 'If you have any complaints or issues, please use the Contact Us section in your Profile. You can send us a message or call our support team, and we\'ll help resolve your concern.',
  },
];

export default function HelpScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.muted }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help Center</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Welcome Section */}
        <View style={[styles.welcomeCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="help-circle" size={48} color={colors.brand} />
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>How can we help you?</Text>
          <Text style={[styles.welcomeText, { color: colors.muted }]}>
            Find answers to common questions about using TiffinHub
          </Text>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
          
          {faqs.map((faq) => (
            <View key={faq.id} style={[styles.faqCard, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFAQ(faq.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.faqQuestionText, { color: colors.text }]}>{faq.question}</Text>
                <Ionicons
                  name={expandedId === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.brand}
                />
              </TouchableOpacity>
              
              {expandedId === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={[styles.faqAnswerText, { color: colors.muted }]}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Support */}
        <View style={[styles.supportCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="chatbubbles" size={32} color={colors.brand} />
          <Text style={[styles.supportTitle, { color: colors.text }]}>Still need help?</Text>
          <Text style={[styles.supportText, { color: colors.muted }]}>
            Can't find what you're looking for? Contact our support team
          </Text>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.brand }]}
            onPress={() => router.push('/(tabs)/contact')}
          >
            <Ionicons name="mail" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Contact Support</Text>
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
    paddingBottom: 100,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.muted + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  faqSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  faqCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.muted + '40',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.muted + '20',
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  supportCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.muted + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    minWidth: 180,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


