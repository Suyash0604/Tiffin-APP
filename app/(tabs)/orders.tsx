import { useTheme } from '@/contexts/ThemeContext';
import { api, getUser, Order } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrdersScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useFocusEffect(
    React.useCallback(() => {
      // On load, apply today's date filter by default
      const today = new Date();
      const todayStr = formatDateForAPI(today);
      setFromDate(today);
      setToDate(today);
      setIsFiltered(true);
      loadOrders(todayStr, todayStr);
    }, [])
  );

  const loadOrders = async (startDate?: string, endDate?: string) => {
    try {
      const user = await getUser();
      if (!user || !user.id) {
        return;
      }

      setLoading(true);
      const response = await api.getOrders(user.id, startDate, endDate);
      setOrders(response.orders);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      if (error.message && !error.message.includes('Server error')) {
        Alert.alert('Error', error.message || 'Failed to load orders');
      } else {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMenuDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getProviderName = (order: Order) => {
    if (typeof order.providerId === 'object' && order.providerId) {
      return (order.providerId as any).name || 'Provider';
    }
    return 'Provider';
  };

  const getMenuDate = (order: Order) => {
    if (typeof order.menuId === 'object' && order.menuId) {
      const menu = order.menuId as any;
      if (menu && menu.date) {
        return formatMenuDate(menu.date);
      }
    }
    return 'N/A';
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const handleApplyFilter = () => {
    const startDateStr = formatDateForAPI(fromDate);
    const endDateStr = formatDateForAPI(toDate);
    setIsFiltered(true);
    setShowFilterModal(false);
    loadOrders(startDateStr, endDateStr);
  };

  const handleClearFilter = () => {
    const today = new Date();
    const todayStr = formatDateForAPI(today);
    setFromDate(today);
    setToDate(today);
    setIsFiltered(true); // Keep filtered state but reset to today
    setShowFilterModal(false);
    loadOrders(todayStr, todayStr); // Load today's orders
  };

  const handleFromDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowFromDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setFromDate(selectedDate);
      }
    } else {
      if (selectedDate) {
        setFromDate(selectedDate);
      }
    }
  };

  const handleToDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowToDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setToDate(selectedDate);
      }
    } else {
      if (selectedDate) {
        setToDate(selectedDate);
      }
    }
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
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <TouchableOpacity onPress={handleFilterPress} style={styles.filterButton}>
          <Ionicons name="filter-outline" size={22} color={colors.brand} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {loading && orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={colors.muted} />
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>Place your first order from the Menu tab</Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((order) => {
              const isExpanded = expandedOrders.has(order._id);
              return (
                <View key={order._id} style={styles.orderCard}>
                  <TouchableOpacity 
                    style={styles.orderHeader}
                    onPress={() => toggleOrder(order._id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.orderHeaderLeft}>
                      <View style={styles.orderIdContainer}>
                        <Ionicons name="restaurant" size={20} color={colors.brand} />
                        <Text style={styles.orderId}>{getProviderName(order)}</Text>
                      </View>
                      <View style={styles.dateContainer}>
                        <Ionicons name="time-outline" size={14} color={colors.muted} />
                        <Text style={styles.orderDate}>
                          {formatDate(order.orderDate || order.createdAt)}
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryText}>
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''} • ₹{order.grandTotal}
                        </Text>
                      </View>
                    </View>
                    <Ionicons 
                      name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color={colors.muted} 
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <>
                      <View style={styles.orderInfoSection}>
                        <View style={styles.infoCard}>
                          <View style={styles.infoRow}>
                            <View style={styles.iconContainer}>
                              <Ionicons name="restaurant" size={18} color={colors.brand} />
                            </View>
                            <View style={styles.infoContent}>
                              <Text style={styles.infoLabel}>Provider</Text>
                              <Text style={styles.infoText}>{getProviderName(order)}</Text>
                            </View>
                          </View>
                          <View style={styles.infoRow}>
                            <View style={styles.iconContainer}>
                              <Ionicons name="calendar-outline" size={18} color={colors.accent} />
                            </View>
                            <View style={styles.infoContent}>
                              <Text style={styles.infoLabel}>Order Date</Text>
                              <Text style={styles.infoText}>
                                {formatMenuDate(order.orderDate || order.createdAt)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      <View style={styles.itemsContainer}>
                        <View style={styles.itemsHeader}>
                          <Ionicons name="list" size={18} color={colors.text} />
                          <Text style={styles.itemsTitle}>Order Items</Text>
                        </View>
                        <View style={styles.itemsList}>
                          {order.items.map((item, index) => (
                            <View key={index} style={styles.itemCard}>
                              <View style={styles.itemDetails}>
                                <View style={styles.itemIconContainer}>
                                  <Ionicons 
                                    name={item.mealType === 'riceOnly' ? 'restaurant-outline' : 'fast-food-outline'} 
                                    size={20} 
                                    color={colors.brand} 
                                  />
                                </View>
                                <View style={styles.itemInfo}>
                                  <Text style={styles.itemName} numberOfLines={1}>
                                    {item.mealType === 'riceOnly' 
                                      ? 'Rice Only' 
                                      : `${item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)} - ${item.sabji || ''}`}
                                  </Text>
                                  <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                                </View>
                              </View>
                              <Text style={styles.itemPrice}>₹{item.totalPrice}</Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      <View style={styles.orderFooter}>
                        <View style={styles.totalContainer}>
                          <Text style={styles.totalLabel}>Total Amount</Text>
                          <Text style={styles.totalText}>₹{order.grandTotal}</Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Orders</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputContainer}>
              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateLabel}>From Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => {
                    if (Platform.OS === 'android') {
                      setShowFromDatePicker(true);
                    } else {
                      setShowFromDatePicker(!showFromDatePicker);
                    }
                  }}
                >
                  <Text style={styles.dateInputText}>{formatDateForDisplay(fromDate)}</Text>
                  <Ionicons name="calendar-outline" size={20} color={colors.brand} />
                </TouchableOpacity>
                {showFromDatePicker && (
                  <DateTimePicker
                    value={fromDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleFromDateChange}
                    maximumDate={toDate}
                  />
                )}
              </View>

              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateLabel}>To Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => {
                    if (Platform.OS === 'android') {
                      setShowToDatePicker(true);
                    } else {
                      setShowToDatePicker(!showToDatePicker);
                    }
                  }}
                >
                  <Text style={styles.dateInputText}>{formatDateForDisplay(toDate)}</Text>
                  <Ionicons name="calendar-outline" size={20} color={colors.brand} />
                </TouchableOpacity>
                {showToDatePicker && (
                  <DateTimePicker
                    value={toDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleToDateChange}
                    minimumDate={fromDate}
                  />
                )}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.clearButton]}
                onPress={handleClearFilter}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={handleApplyFilter}
              >
                <Text style={styles.applyButtonText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.brand + '15',
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
  ordersList: {
    gap: 20,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.muted + '30',
  },
  orderHeader: {
    marginBottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderHeaderLeft: {
    gap: 8,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  orderDate: {
    fontSize: 13,
    color: colors.muted,
  },
  summaryRow: {
    marginTop: 6,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  orderInfoSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  itemsContainer: {
    marginBottom: 12,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  itemsList: {
    gap: 8,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 10,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: colors.muted,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.brand,
  },
  orderFooter: {
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.brand + '20',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  totalText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.brand,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  dateInputContainer: {
    gap: 20,
    marginBottom: 24,
  },
  dateInputWrapper: {
    position: 'relative',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.muted + '40',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    fontSize: 16,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.muted + '40',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  applyButton: {
    backgroundColor: colors.brand,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
});

const styles = getStyles({}); // Will be overridden in component
