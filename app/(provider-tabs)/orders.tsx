import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { api, Order, getUser } from '@/utils/api';

export default function ProviderOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    try {
      const user = await getUser();
      if (!user || !user.id) {
        return;
      }

      setLoading(true);
      const response = await api.getProviderOrders(user.id);
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


  const handleStatusChange = (orderId: string, newStatus: string) => {
    Alert.alert(
      'Change Status',
      `Change order status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // TODO: Call API to update order status
            setOrders(orders.map(order =>
              order._id === orderId ? { ...order, status: newStatus } : order
            ));
            Alert.alert('Success', 'Order status updated');
          },
        },
      ]
    );
  };

  const getStatusColor = (status?: string) => {
    const statusColors: Record<string, string> = {
      pending: colors.brand2,
      confirmed: colors.accent,
      preparing: colors.brand,
      ready: '#2196F3',
      delivered: colors.accent,
      cancelled: colors.danger,
    };
    return statusColors[status || 'pending'] || colors.muted;
  };


  const getNextStatus = (currentStatus?: string): string | null => {
    const statusFlow: Record<string, string | null> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'delivered',
      delivered: null,
      cancelled: null,
    };
    return statusFlow[currentStatus || 'pending'] || null;
  };

  const getCustomerName = (order: Order) => {
    if (typeof order.userId === 'object' && order.userId) {
      return (order.userId as any).name || 'Customer';
    }
    return 'Customer';
  };

  const getCustomerMobile = (order: Order) => {
    if (typeof order.userId === 'object' && order.userId) {
      return (order.userId as any).mobile || '';
    }
    return '';
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

  const getCustomerAddress = (order: Order) => {
    if (typeof order.userId === 'object' && order.userId) {
      return (order.userId as any).address || '';
    }
    return '';
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={colors.muted} />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>No orders yet</Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((order) => {
              const nextStatus = getNextStatus(order.status);
              const currentStatus = order.status || 'pending';
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
                        <Ionicons name="person" size={20} color={colors.brand} />
                        <Text style={styles.orderId}>{getCustomerName(order)}</Text>
                      </View>
                      <View style={styles.dateContainer}>
                        <Ionicons name="time-outline" size={14} color={colors.muted} />
                        <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryText}>
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''} • ₹{order.grandTotal}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.headerRight}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(currentStatus) + '20' },
                        ]}
                      >
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(currentStatus) }]} />
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(currentStatus) },
                          ]}
                        >
                          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                        </Text>
                      </View>
                      <Ionicons 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color={colors.muted} 
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <>
                      {getCustomerMobile(order) && (
                        <View style={styles.customerInfoSection}>
                          <View style={styles.customerInfoCard}>
                            <View style={styles.customerRow}>
                              <View style={styles.customerIconContainer}>
                                <Ionicons name="call-outline" size={18} color={colors.accent} />
                              </View>
                              <View style={styles.customerContent}>
                                <Text style={styles.customerLabel}>Mobile</Text>
                                <Text style={styles.customerMobile}>{getCustomerMobile(order)}</Text>
                              </View>
                            </View>
                            {getCustomerAddress(order) && (
                              <View style={styles.customerRow}>
                                <View style={styles.customerIconContainer}>
                                  <Ionicons name="location-outline" size={18} color={colors.brand2} />
                                </View>
                                <View style={styles.customerContent}>
                                  <Text style={styles.customerLabel}>Address</Text>
                                  <Text style={styles.deliveryAddress}>{getCustomerAddress(order)}</Text>
                                </View>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

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
                        <View style={styles.actionButtons}>
                          {nextStatus && currentStatus !== 'cancelled' && (
                            <TouchableOpacity
                              style={styles.updateButton}
                              onPress={() => handleStatusChange(order._id, nextStatus)}
                            >
                              <Ionicons name="checkmark-circle" size={18} color={colors.surface} />
                              <Text style={styles.updateButtonText}>
                                {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          )}
                          {currentStatus === 'pending' && (
                            <TouchableOpacity
                              style={styles.cancelButton}
                              onPress={() => handleStatusChange(order._id, 'cancelled')}
                            >
                              <Ionicons name="close-circle" size={18} color={colors.danger} />
                              <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                          )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderHeaderLeft: {
    flex: 1,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  customerInfoSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  customerInfoCard: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  customerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerContent: {
    flex: 1,
  },
  customerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  customerMobile: {
    fontSize: 13,
    color: colors.text,
  },
  deliveryAddress: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
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
    gap: 10,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.brand,
    flex: 1,
    minWidth: 120,
    justifyContent: 'center',
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.danger + '15',
    borderWidth: 1,
    borderColor: colors.danger + '40',
    flex: 1,
    minWidth: 120,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
  },
});
