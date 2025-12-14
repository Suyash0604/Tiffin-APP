import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { api, Menu, getUser } from '@/utils/api';

export default function ProviderMenuScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    sabjis: [''],
    fullPrice: '',
    halfPrice: '',
    riceOnlyPrice: '',
  });
  const [providerId, setProviderId] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRefs = useRef<{ [key: string]: TextInput | null }>({});

  useFocusEffect(
    React.useCallback(() => {
      initializeData();
    }, [])
  );

  const scrollToInput = (inputKey: string) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const initializeData = async () => {
    try {
      const user = await getUser();
      if (user && user.id) {
        setProviderId(user.id);
        // Load menus after providerId is set
        await loadMenus(user.id);
      } else {
        Alert.alert('Error', 'Provider ID not found. Please login again.');
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      Alert.alert('Error', 'Failed to load provider information');
    }
  };

  const loadMenus = async (currentProviderId?: string) => {
    const idToUse = currentProviderId || providerId;
    
    if (!idToUse) {
      console.log('⏳ [loadMenus] Waiting for provider ID...');
      return;
    }

    setLoading(true);
    try {
      const response = await api.getMenus();
      console.log('📦 [loadMenus] All menus received:', response.menus.length);
      
      // Filter menus for current provider
      const providerMenus = response.menus.filter((menu) => {
        // Handle both populated and non-populated providerId
        let menuProviderId: string;
        if (typeof menu.providerId === 'string') {
          menuProviderId = menu.providerId;
        } else if (menu.providerId && typeof menu.providerId === 'object') {
          // If populated, it might have _id or id
          menuProviderId = (menu.providerId as any)._id || (menu.providerId as any).id || '';
        } else {
          return false;
        }
        
        // Convert both to strings for comparison
        return String(menuProviderId) === String(idToUse);
      });
      
      console.log('✅ [loadMenus] Provider menus:', providerMenus.length);
      setMenus(providerMenus);
    } catch (error: any) {
      console.error('🔴 [loadMenus] Error loading menus:', error);
      // Don't show alert if it's just a server error - might be no menus yet
      if (error.message && !error.message.includes('Server error')) {
        Alert.alert('Error', error.message || 'Failed to load menus');
      } else {
        // Server error might mean no menus exist yet, which is okay
        console.log('ℹ️ [loadMenus] No menus found or server error (this is okay for new providers)');
        setMenus([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenu = () => {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    setEditingMenuId(null);
    setFormData({
      date: today,
      sabjis: [''],
      fullPrice: '',
      halfPrice: '',
      riceOnlyPrice: '',
    });
    setModalVisible(true);
  };

  const handleEditMenu = (menu: Menu) => {
    // Format date for input (YYYY-MM-DD)
    const dateStr = new Date(menu.date).toISOString().split('T')[0];
    
    setEditingMenuId(menu._id);
    setFormData({
      date: dateStr,
      sabjis: menu.sabjis.length > 0 ? menu.sabjis : [''],
      fullPrice: menu.prices.full.toString(),
      halfPrice: menu.prices.half.toString(),
      riceOnlyPrice: menu.prices.riceOnly.toString(),
    });
    setModalVisible(true);
  };

  const handleDeleteMenu = async (menuId: string) => {
    Alert.alert(
      'Delete Menu',
      'Are you sure you want to delete this menu? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!providerId) {
              Alert.alert('Error', 'Provider ID not found');
              return;
            }

            setLoading(true);
            try {
              await api.deleteMenu(menuId, providerId);
              Alert.alert('Success', 'Menu deleted successfully');
              await loadMenus();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete menu');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAddSabzi = () => {
    setFormData({
      ...formData,
      sabjis: [...formData.sabjis, ''],
    });
  };

  const handleRemoveSabzi = (index: number) => {
    if (formData.sabjis.length > 1) {
      const newSabjis = formData.sabjis.filter((_, i) => i !== index);
      setFormData({ ...formData, sabjis: newSabjis });
    }
  };

  const handleSabziChange = (index: number, value: string) => {
    const newSabjis = [...formData.sabjis];
    newSabjis[index] = value;
    setFormData({ ...formData, sabjis: newSabjis });
  };

  const handleSaveMenu = async () => {
    if (!formData.date) {
      Alert.alert('Error', 'Please select a date');
      return;
    }

    const sabjis = formData.sabjis.filter(sabzi => sabzi.trim() !== '');
    if (sabjis.length === 0) {
      Alert.alert('Error', 'Please add at least one sabzi');
      return;
    }

    if (!formData.fullPrice || !formData.halfPrice || !formData.riceOnlyPrice) {
      Alert.alert('Error', 'Please fill in all prices');
      return;
    }

    const fullPrice = parseFloat(formData.fullPrice);
    const halfPrice = parseFloat(formData.halfPrice);
    const riceOnlyPrice = parseFloat(formData.riceOnlyPrice);

    if (isNaN(fullPrice) || isNaN(halfPrice) || isNaN(riceOnlyPrice)) {
      Alert.alert('Error', 'Please enter valid prices');
      return;
    }

    if (fullPrice <= 0 || halfPrice <= 0 || riceOnlyPrice <= 0) {
      Alert.alert('Error', 'Prices must be greater than 0');
      return;
    }

    if (!providerId) {
      Alert.alert('Error', 'Provider ID not found');
      return;
    }

    setLoading(true);
    try {
      const menuPayload = {
        providerId,
        date: formData.date,
        sabjis,
        prices: {
          full: fullPrice,
          half: halfPrice,
          riceOnly: riceOnlyPrice,
        },
      };

      if (editingMenuId) {
        // Update existing menu
        await api.updateMenu(editingMenuId, menuPayload);
        Alert.alert('Success', 'Menu updated successfully');
      } else {
        // Create new menu
        await api.createMenu(menuPayload);
        Alert.alert('Success', 'Menu created successfully');
      }

      setModalVisible(false);
      setEditingMenuId(null);
      // Refresh menus list
      await loadMenus();
    } catch (error: any) {
      Alert.alert('Error', error.message || `Failed to ${editingMenuId ? 'update' : 'create'} menu`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Menu</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddMenu}
          disabled={loading}
        >
          <Ionicons name="add" size={24} color={colors.surface} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {loading && menus.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.loadingText}>Loading menus...</Text>
          </View>
        ) : menus.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color={colors.muted} />
            <Text style={styles.emptyText}>No menus created yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to create your first menu</Text>
          </View>
        ) : (
          <View style={styles.menuList}>
            {menus.map((menu) => (
              <View key={menu._id} style={styles.menuCard}>
                <View style={styles.menuHeader}>
                  <View style={styles.menuHeaderLeft}>
                    <Text style={styles.menuDate}>{formatDate(menu.date)}</Text>
                    <Text style={styles.menuId}>Menu ID: {menu._id.slice(-6)}</Text>
                  </View>
                  <View style={styles.menuActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditMenu(menu)}
                      disabled={loading}
                    >
                      <Ionicons name="pencil" size={20} color={colors.brand} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteMenu(menu._id)}
                      disabled={loading}
                    >
                      <Ionicons name="trash" size={20} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.sabjisContainer}>
                  <Text style={styles.sabjisTitle}>Sabjis:</Text>
                  <View style={styles.sabjisList}>
                    {menu.sabjis.map((sabzi, index) => (
                      <View key={index} style={styles.sabziItem}>
                        <Text style={styles.sabziText}>{sabzi}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.pricesContainer}>
                  <Text style={styles.pricesTitle}>Prices:</Text>
                  <View style={styles.pricesGrid}>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>Full</Text>
                      <Text style={styles.priceValue}>₹{menu.prices.full}</Text>
                    </View>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>Half</Text>
                      <Text style={styles.priceValue}>₹{menu.prices.half}</Text>
                    </View>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>Rice Only</Text>
                      <Text style={styles.priceValue}>₹{menu.prices.riceOnly}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <SafeAreaView edges={['bottom']} style={styles.modalSafeArea}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              style={styles.modalKeyboardView}
            >
              <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingMenuId ? 'Edit Menu' : 'Create Menu'}
                </Text>
                <TouchableOpacity onPress={() => {
                  setModalVisible(false);
                  setEditingMenuId(null);
                }}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                ref={scrollViewRef}
                style={styles.modalBody}
                contentContainerStyle={styles.modalBodyContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput
                    ref={(ref) => (inputRefs.current['date'] = ref)}
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.muted}
                    value={formData.date}
                    onChangeText={(text) => setFormData({ ...formData, date: text })}
                    onFocus={() => scrollToInput('date')}
                  />
                  <Text style={styles.hint}>Format: YYYY-MM-DD (e.g., 2024-01-15)</Text>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.sabjisHeader}>
                    <Text style={styles.label}>Sabjis</Text>
                    <TouchableOpacity
                      style={styles.addSabziButton}
                      onPress={handleAddSabzi}
                    >
                      <Ionicons name="add-circle" size={24} color={colors.brand} />
                    </TouchableOpacity>
                  </View>
                  {formData.sabjis.map((sabzi, index) => (
                    <View key={index} style={styles.sabziInputRow}>
                      <TextInput
                        ref={(ref) => (inputRefs.current[`sabzi-${index}`] = ref)}
                        style={[styles.input, styles.sabziInput]}
                        placeholder={`Sabzi ${index + 1}`}
                        placeholderTextColor={colors.muted}
                        value={sabzi}
                        onChangeText={(value) => handleSabziChange(index, value)}
                        autoCapitalize="words"
                        onFocus={() => scrollToInput(`sabzi-${index}`)}
                      />
                      {formData.sabjis.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveSabzi(index)}
                        >
                          <Ionicons name="close-circle" size={24} color={colors.danger} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Prices (₹)</Text>
                  <View style={styles.priceInputs}>
                    <View style={styles.priceInputRow}>
                      <Text style={styles.priceInputLabel}>Full:</Text>
                      <TextInput
                        ref={(ref) => (inputRefs.current['fullPrice'] = ref)}
                        style={[styles.input, styles.priceInput]}
                        placeholder="0"
                        placeholderTextColor={colors.muted}
                        value={formData.fullPrice}
                        onChangeText={(text) => setFormData({ ...formData, fullPrice: text })}
                        keyboardType="decimal-pad"
                        onFocus={() => scrollToInput('fullPrice')}
                      />
                    </View>
                    <View style={styles.priceInputRow}>
                      <Text style={styles.priceInputLabel}>Half:</Text>
                      <TextInput
                        ref={(ref) => (inputRefs.current['halfPrice'] = ref)}
                        style={[styles.input, styles.priceInput]}
                        placeholder="0"
                        placeholderTextColor={colors.muted}
                        value={formData.halfPrice}
                        onChangeText={(text) => setFormData({ ...formData, halfPrice: text })}
                        keyboardType="decimal-pad"
                        onFocus={() => scrollToInput('halfPrice')}
                      />
                    </View>
                    <View style={styles.priceInputRow}>
                      <Text style={styles.priceInputLabel}>Rice Only:</Text>
                      <TextInput
                        ref={(ref) => (inputRefs.current['riceOnlyPrice'] = ref)}
                        style={[styles.input, styles.priceInput]}
                        placeholder="0"
                        placeholderTextColor={colors.muted}
                        value={formData.riceOnlyPrice}
                        onChangeText={(text) => setFormData({ ...formData, riceOnlyPrice: text })}
                        keyboardType="decimal-pad"
                        onFocus={() => scrollToInput('riceOnlyPrice')}
                      />
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, loading && styles.buttonDisabled]}
                  onPress={handleSaveMenu}
                  disabled={loading}
                >
                <Text style={styles.saveButtonText}>
                  {loading 
                    ? (editingMenuId ? 'Updating...' : 'Creating...') 
                    : (editingMenuId ? 'Update Menu' : 'Create Menu')
                  }
                </Text>
                </TouchableOpacity>
              </View>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 8,
    textAlign: 'center',
  },
  menuList: {
    gap: 16,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  menuHeaderLeft: {
    flex: 1,
  },
  menuDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  menuId: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  menuActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  sabjisContainer: {
    marginBottom: 12,
  },
  sabjisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sabjisList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sabziItem: {
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sabziText: {
    fontSize: 14,
    color: colors.text,
  },
  pricesContainer: {
    marginTop: 8,
  },
  pricesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  pricesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  priceItem: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.brand,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalSafeArea: {
    width: '100%',
  },
  modalKeyboardView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: 500,
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    flexGrow: 0,
  },
  modalBodyContent: {
    padding: 20,
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  hint: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  sabjisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addSabziButton: {
    padding: 4,
  },
  sabziInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sabziInput: {
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  priceInputs: {
    gap: 12,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    minWidth: 80,
  },
  priceInput: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.muted,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.muted,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.brand,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
});

const styles = getStyles({}); // Will be overridden in component