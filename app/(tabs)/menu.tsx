import { useTheme } from '@/contexts/ThemeContext';
import { api, getUser, Menu } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MenuScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [orderItems, setOrderItems] = useState<Array<{
    mealType: 'full' | 'half' | 'riceOnly';
    sabji?: string;
    quantity: number;
  }>>([]);
  const [userId, setUserId] = useState<string>('');

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const user = await getUser();
      if (user && user.id) {
        setUserId(user.id);
        await loadMenus();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadMenus = async () => {
    setLoading(true);
    try {
      const response = await api.getMenus();
      console.log('📦 [loadMenus] Response received:', { count: response.count, menusLength: response.menus?.length });
      
      // Ensure menus array exists
      if (!response.menus || !Array.isArray(response.menus)) {
        console.warn('⚠️ [loadMenus] menus array is missing or invalid');
        setMenus([]);
        return;
      }
      
      // Filter menus - show only today's date menu
      // Use UTC dates to avoid timezone issues
      const today = new Date();
      const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const tomorrowUTC = new Date(todayUTC);
      tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);
      
      console.log('📅 [loadMenus] Date filter - Today (UTC):', todayUTC.toISOString());
      
      const availableMenus = response.menus.filter((menu) => {
        if (!menu || !menu.date) {
          console.warn('⚠️ [loadMenus] Invalid menu item:', menu);
          return false;
        }
        
        // Check if menu is active (if isActive field exists)
        if (menu.hasOwnProperty('isActive') && !menu.isActive) {
          console.log('⏭️ [loadMenus] Menu filtered out (not active):', menu._id);
          return false;
        }
        
        // Check if menu is deleted
        if (menu.deletedAt) {
          console.log('⏭️ [loadMenus] Menu filtered out (deleted):', menu._id);
          return false;
        }
        
        // Parse menu date and extract just the date part (YYYY-MM-DD) to avoid timezone issues
        const menuDateStr = menu.date.split('T')[0]; // Get YYYY-MM-DD part
        const [year, month, day] = menuDateStr.split('-').map(Number);
        const menuDateUTC = new Date(Date.UTC(year, month - 1, day));
        
        // Show only today's menu (menu date must be today)
        const isToday = menuDateUTC >= todayUTC && menuDateUTC < tomorrowUTC;
        
        console.log(`📅 [loadMenus] Menu ${menu._id} - Date string: ${menuDateStr}, Date (UTC): ${menuDateUTC.toISOString()}, Is today: ${isToday}`);
        
        return isToday;
      });
      
      console.log('✅ [loadMenus] Available menus after filtering:', availableMenus.length);
      setMenus(availableMenus);
    } catch (error: any) {
      console.error('Error loading menus:', error);
      if (error.message && !error.message.includes('Server error')) {
        Alert.alert('Error', error.message || 'Failed to load menus');
      } else {
        setMenus([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOrderMenu = (menu: Menu) => {
    if (!menu.sabjis || menu.sabjis.length === 0) {
      Alert.alert('Error', 'This menu has no sabjis available');
      return;
    }
    
    setSelectedMenu(menu);
    setOrderItems([{
      mealType: 'full',
      sabji: menu.sabjis[0],
      quantity: 1,
    }]);
    setOrderModalVisible(true);
  };

  const handleAddOrderItem = () => {
    if (selectedMenu && selectedMenu.sabjis && selectedMenu.sabjis.length > 0) {
      setOrderItems([...orderItems, {
        mealType: 'full',
        sabji: selectedMenu.sabjis[0],
        quantity: 1,
      }]);
    }
  };

  const handleRemoveOrderItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const handleOrderItemChange = (index: number, field: string, value: any) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If meal type changes to riceOnly, clear sabji
    if (field === 'mealType' && value === 'riceOnly') {
      delete newItems[index].sabji;
    }
    // If meal type changes from riceOnly to full/half, set default sabji
    if (field === 'mealType' && value !== 'riceOnly' && !newItems[index].sabji && selectedMenu) {
      newItems[index].sabji = selectedMenu.sabjis[0];
    }
    
    setOrderItems(newItems);
  };

  const calculateTotal = () => {
    if (!selectedMenu) return 0;
    return orderItems.reduce((total, item) => {
      const price = selectedMenu.prices[item.mealType];
      return total + (price * item.quantity);
    }, 0);
  };

  const handlePlaceOrder = async () => {
    if (!selectedMenu || !userId) {
      Alert.alert('Error', 'Missing required information');
      return;
    }

    // Validate items array
    if (!orderItems || orderItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item to your order');
      return;
    }

    // Validate all items
    for (const item of orderItems) {
      if (item.quantity < 1) {
        Alert.alert('Error', 'Quantity must be at least 1');
        return;
      }
      if (item.mealType !== 'riceOnly' && !item.sabji) {
        Alert.alert('Error', 'Please select a sabji for all items');
        return;
      }
      if (item.mealType !== 'riceOnly' && item.sabji && !selectedMenu.sabjis.includes(item.sabji)) {
        Alert.alert('Error', `Invalid sabji: ${item.sabji}`);
        return;
      }
    }

    setLoading(true);
    try {
      // Format items for API - remove sabji for riceOnly items
      const formattedItems = orderItems.map(item => {
        const formattedItem: any = {
          mealType: item.mealType,
          quantity: item.quantity,
        };
        
        // Only include sabji if meal type is not riceOnly
        if (item.mealType !== 'riceOnly' && item.sabji) {
          formattedItem.sabji = item.sabji;
        }
        
        return formattedItem;
      });

      console.log('📦 [handlePlaceOrder] Sending order:', {
        userId,
        menuId: selectedMenu._id,
        items: formattedItems,
      });

      await api.placeOrder({
        userId,
        menuId: selectedMenu._id,
        items: formattedItems,
      });

      Alert.alert('Success', 'Order placed successfully!');
      setOrderModalVisible(false);
      setSelectedMenu(null);
      setOrderItems([]);
    } catch (error: any) {
      console.error('❌ [handlePlaceOrder] Error:', error);
      Alert.alert('Error', error.message || 'Failed to place order');
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

  const getProviderName = (menu: Menu) => {
    if (typeof menu.providerId === 'object' && menu.providerId) {
      return (menu.providerId as any).name || 'Provider';
    }
    return 'Provider';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={require('@/assets/images/logo3.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Available Menus</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {loading && menus.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.loadingText}>Loading menus...</Text>
          </View>
        ) : menus.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color={colors.muted} />
            <Text style={styles.emptyText}>No menus available</Text>
            <Text style={styles.emptySubtext}>Check back later for new menus</Text>
          </View>
        ) : (
          <View style={styles.menuList}>
            {menus.map((menu) => (
              <View
                key={menu._id}
                style={styles.menuCard}
              >
                <View style={styles.menuHeader}>
                  <View style={styles.menuHeaderLeft}>
                    <Text style={styles.providerName}>{getProviderName(menu)}</Text>
                    <Text style={styles.menuDate}>{formatDate(menu.date)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.orderButton}
                    onPress={() => handleOrderMenu(menu)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.orderButtonText}>Order</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.sabjisTagsContainer}>
                  {menu.sabjis.map((sabji, index) => (
                    <View key={index} style={styles.sabjiTag}>
                      <Text style={styles.sabjiTagText}>{sabji}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.pricesTagsContainer}>
                  <View style={styles.priceTag}>
                    <Text style={styles.priceTagLabel}>Full</Text>
                    <Text style={styles.priceTagValue}>₹{menu.prices.full}</Text>
                  </View>
                  <View style={styles.priceTag}>
                    <Text style={styles.priceTagLabel}>Half</Text>
                    <Text style={styles.priceTagValue}>₹{menu.prices.half}</Text>
                  </View>
                  <View style={styles.priceTag}>
                    <Text style={styles.priceTagLabel}>Rice</Text>
                    <Text style={styles.priceTagValue}>₹{menu.prices.riceOnly}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={orderModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay} edges={['bottom']}>
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setOrderModalVisible(false)}
            />
          </View>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Place Order</Text>
              <TouchableOpacity onPress={() => setOrderModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedMenu && (
              <>
                <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
                  <View style={styles.menuInfoCard}>
                    <Text style={styles.menuInfoText}>
                      {getProviderName(selectedMenu)} - {formatDate(selectedMenu.date)}
                    </Text>
                  </View>

                  <Text style={styles.sectionTitle}>Order Items</Text>
                  {orderItems.map((item, index) => (
                    <View key={index} style={styles.orderItemCard}>
                      <View style={styles.orderItemHeader}>
                        <Text style={styles.orderItemNumber}>Item {index + 1}</Text>
                        {orderItems.length > 1 && (
                          <TouchableOpacity
                            onPress={() => handleRemoveOrderItem(index)}
                            style={styles.removeItemButton}
                          >
                            <Ionicons name="close-circle" size={20} color={colors.danger} />
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.orderItemRow}>
                        <Text style={styles.orderItemLabel}>Meal Type:</Text>
                        <View style={styles.mealTypeButtons}>
                          {(['full', 'half', 'riceOnly'] as const).map((type) => (
                            <TouchableOpacity
                              key={type}
                              style={[
                                styles.mealTypeButton,
                                item.mealType === type && styles.mealTypeButtonActive,
                              ]}
                              onPress={() => handleOrderItemChange(index, 'mealType', type)}
                            >
                              <Text
                                style={[
                                  styles.mealTypeButtonText,
                                  item.mealType === type && styles.mealTypeButtonTextActive,
                                ]}
                              >
                                {type === 'riceOnly' ? 'Rice Only' : type.charAt(0).toUpperCase() + type.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {item.mealType !== 'riceOnly' && (
                        <View style={styles.orderItemRow}>
                          <Text style={styles.orderItemLabel}>Sabji:</Text>
                          <View style={styles.sabjiButtons}>
                            {selectedMenu.sabjis.map((sabji) => (
                              <TouchableOpacity
                                key={sabji}
                                style={[
                                  styles.sabjiButton,
                                  item.sabji === sabji && styles.sabjiButtonActive,
                                ]}
                                onPress={() => handleOrderItemChange(index, 'sabji', sabji)}
                              >
                                <Text
                                  style={[
                                    styles.sabjiButtonText,
                                    item.sabji === sabji && styles.sabjiButtonTextActive,
                                  ]}
                                >
                                  {sabji}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}

                      <View style={styles.orderItemRow}>
                        <Text style={styles.orderItemLabel}>Quantity:</Text>
                        <View style={styles.quantityRow}>
                          <View style={styles.quantityControls}>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => {
                                if (item.quantity > 1) {
                                  handleOrderItemChange(index, 'quantity', item.quantity - 1);
                                }
                              }}
                            >
                              <Ionicons name="remove" size={20} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{item.quantity}</Text>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => handleOrderItemChange(index, 'quantity', item.quantity + 1)}
                            >
                              <Ionicons name="add" size={20} color={colors.text} />
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.itemPrice}>
                            ₹{selectedMenu.prices[item.mealType] * item.quantity}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={handleAddOrderItem}
                  >
                    <Ionicons name="add-circle" size={24} color={colors.brand} />
                    <Text style={styles.addItemText}>Add Another Item</Text>
                  </TouchableOpacity>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalAmount}>₹{calculateTotal()}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.placeOrderButton, loading && styles.buttonDisabled]}
                    onPress={handlePlaceOrder}
                    disabled={loading}
                  >
                    <Text style={styles.placeOrderButtonText}>
                      {loading ? 'Placing Order...' : 'Place Order'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </SafeAreaView>
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
    padding: 16,
    paddingTop: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
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
    color: colors.text,
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
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuHeaderLeft: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.brand,
    marginBottom: 2,
  },
  menuDate: {
    fontSize: 12,
    color: colors.muted,
  },
  sabjisTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  sabjiTag: {
    backgroundColor: colors.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.muted,
  },
  sabjiTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  pricesTagsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priceTag: {
    backgroundColor: colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceTagLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.surface,
    textTransform: 'uppercase',
  },
  priceTagValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.surface,
  },
  orderButton: {
    backgroundColor: colors.brand,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  orderButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.surface,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    maxHeight: 500,
  },
  modalBodyContent: {
    padding: 20,
  },
  menuInfoCard: {
    backgroundColor: colors.bg,
    padding: 12,
    borderRadius: 22,
    marginBottom: 20,
  },
  menuInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  orderItemCard: {
    backgroundColor: colors.bg,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderItemNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  removeItemButton: {
    padding: 4,
  },
  orderItemRow: {
    marginBottom: 12,
  },
  orderItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  mealTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.muted,
    backgroundColor: colors.surface,
  },
  mealTypeButtonActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  mealTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  mealTypeButtonTextActive: {
    color: colors.surface,
  },
  sabjiButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sabjiButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.muted,
    backgroundColor: colors.surface,
  },
  sabjiButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  sabjiButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  sabjiButtonTextActive: {
    color: colors.surface,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 22,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.brand,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    marginTop: 8,
  },
  addItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.muted,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.brand,
  },
  placeOrderButton: {
    backgroundColor: colors.brand,
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

const styles = getStyles({}); // Will be overridden in component