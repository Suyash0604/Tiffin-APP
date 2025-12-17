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
    question: 'How do I add or update my menu?',
    answer: 'Go to the Menu tab and tap "Add Menu" to create a new menu for a specific date. You can add meal types (Full Tiffin, Half Tiffin, Rice Only) and select sabjis. To update an existing menu, find it in your menu list and tap "Edit".',
  },
  {
    id: '2',
    question: 'How do I manage orders?',
    answer: 'Go to the Orders tab to view all incoming orders. You can see order details, update order status (Pending, Confirmed, Preparing, Ready, Delivered), and manage your order queue. Tap on any order to view full details.',
  },
  {
    id: '3',
    question: 'How do I view my analytics?',
    answer: 'Go to the Analytics tab to see comprehensive insights including daily revenue trends, monthly revenue, overall summary, growth rate, average order value, and best-selling items. Use these insights to optimize your business.',
  },
  {
    id: '4',
    question: 'How do I update my order status?',
    answer: 'In the Orders tab, find the order you want to update, tap on it to view details, and use the status buttons to change the order status. This helps customers track their orders in real-time.',
  },
  {
    id: '5',
    question: 'Can I set different prices for different meal types?',
    answer: 'Yes! When creating or editing a menu, you can set individual prices for Full Tiffin, Half Tiffin, and Rice Only. You can also set prices for individual sabjis if needed.',
  },
  {
    id: '6',
    question: 'How do I handle cancellations?',
    answer: 'If a customer cancels an order before you confirm it, the order will be automatically removed. For confirmed orders, you can contact the customer directly or use the order management system to handle cancellations.',
  },
  {
    id: '7',
    question: 'What payment methods can I accept?',
    answer: 'You can accept various payment methods including cash on delivery, online payments, or other methods. Make sure to communicate your accepted payment methods clearly to customers.',
  },
  {
    id: '8',
    question: 'How do I track my revenue?',
    answer: 'Use the Analytics tab to view detailed revenue reports. You can see daily revenue trends in a line chart, monthly revenue in a bar chart, overall summary statistics, and track your growth rate over time.',
  },
  {
    id: '9',
    question: 'How do I see which items are selling best?',
    answer: 'The Analytics tab includes a "Best Sellers" section that shows your most popular meal types and sabjis. This helps you understand customer preferences and optimize your menu accordingly.',
  },
  {
    id: '10',
    question: 'Can I update my profile information?',
    answer: 'Yes! Go to the Profile tab to view and update your account information including email, mobile number, and address. Make sure your contact information is up to date for customer communication.',
  },
  {
    id: '11',
    question: 'How do I manage my delivery schedule?',
    answer: 'You can set your delivery times and availability when creating menus. Make sure to update your business hours in your profile so customers know when you\'re available for orders.',
  },
  {
    id: '12',
    question: 'What should I do if I have technical issues?',
    answer: 'If you encounter any technical issues, please contact our support team through the Contact Us section in your Profile. We\'re here to help you resolve any problems quickly.',
  },
];

export default function ProviderHelpScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.muted }]}>
        <TouchableOpacity onPress={() => router.push('/(provider-tabs)/profile')} style={styles.backButton}>
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
            Find answers to common questions about managing your tiffin business on TiffinHub
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
            onPress={() => router.push('/(provider-tabs)/contact')}
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
