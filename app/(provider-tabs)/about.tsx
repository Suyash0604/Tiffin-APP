import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.muted }]}>
        <TouchableOpacity onPress={() => router.push('/(provider-tabs)/profile')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>About Us</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* App Logo and Name */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/logo3.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.text }]}>TiffinHub</Text>
          <Text style={[styles.appVersion, { color: colors.muted }]}>Version 1.0.0</Text>
        </View>

        {/* About Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color={colors.brand} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About TiffinHub</Text>
          </View>
          <Text style={[styles.sectionText, { color: colors.text }]}>
            TiffinHub is a modern food delivery platform that connects hungry customers with local tiffin providers. 
            Our mission is to make home-cooked meals accessible to everyone, supporting local businesses and 
            bringing authentic flavors to your doorstep.
          </Text>
        </View>

        {/* Features Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={24} color={colors.brand} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Features</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="restaurant" size={20} color={colors.brand} style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Fresh Daily Menus</Text>
              <Text style={[styles.featureText, { color: colors.muted }]}>
                Browse through daily updated menus from local providers
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="time" size={20} color={colors.brand} style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Easy Ordering</Text>
              <Text style={[styles.featureText, { color: colors.muted }]}>
                Place orders quickly and track them in real-time
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="business" size={20} color={colors.brand} style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Provider Dashboard</Text>
              <Text style={[styles.featureText, { color: colors.muted }]}>
                Comprehensive analytics and menu management for providers
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={20} color={colors.brand} style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Secure & Reliable</Text>
              <Text style={[styles.featureText, { color: colors.muted }]}>
                Your data and transactions are safe with us
              </Text>
            </View>
          </View>
        </View>

        {/* Mission Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart" size={24} color={colors.brand} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Mission</Text>
          </View>
          <Text style={[styles.sectionText, { color: colors.text }]}>
            We believe that everyone deserves access to healthy, home-cooked meals. TiffinHub bridges the gap 
            between local tiffin providers and customers, creating a sustainable ecosystem that benefits both 
            parties while promoting local businesses and traditional cuisine.
          </Text>
        </View>

        {/* Values Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="ribbon" size={24} color={colors.brand} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Values</Text>
          </View>
          
          <View style={styles.valueItem}>
            <Text style={[styles.valueTitle, { color: colors.brand }]}>Quality</Text>
            <Text style={[styles.valueText, { color: colors.muted }]}>
              We ensure only the best quality food reaches our customers
            </Text>
          </View>

          <View style={styles.valueItem}>
            <Text style={[styles.valueTitle, { color: colors.brand }]}>Transparency</Text>
            <Text style={[styles.valueText, { color: colors.muted }]}>
              Clear pricing and honest communication with all stakeholders
            </Text>
          </View>

          <View style={styles.valueItem}>
            <Text style={[styles.valueTitle, { color: colors.brand }]}>Community</Text>
            <Text style={[styles.valueText, { color: colors.muted }]}>
              Supporting local businesses and building stronger communities
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            © 2024 TiffinHub. All rights reserved.
          </Text>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            Made with ❤️ for food lovers
          </Text>
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
    padding: 20,
    paddingBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 14,
  },
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  featureIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
  },
  valueItem: {
    marginBottom: 16,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  valueText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
});












