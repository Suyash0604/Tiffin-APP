import { colors } from '@/constants/theme';
import { api, getUser, Order } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrdersScreen() {
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
      const response = await api.getOrders(user.id);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
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
});

