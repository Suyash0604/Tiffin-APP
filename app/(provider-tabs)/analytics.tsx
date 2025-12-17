import { useTheme } from '@/contexts/ThemeContext';
import { api, getUser } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    PanResponder,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

interface MonthlyRevenueData {
  revenue: number;
  orders: number;
  month: number;
}

interface DailyRevenueData {
  revenue: number;
  day: number;
}

interface BestSellersData {
  topMealType: {
    mealType: string;
    quantity: number;
  };
  topSabjis: Array<{
    sabji: string;
    quantity: number;
  }>;
}

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  
  // Data states
  const [overallSummary, setOverallSummary] = useState<{ totalRevenue: number; totalOrders: number } | null>(null);
  const [growthRate, setGrowthRate] = useState<{ previousRevenue: number; currentRevenue: number; growthPercent: number } | null>(null);
  const [avgOrderValue, setAvgOrderValue] = useState<{ avgOrderValue: number; totalRevenue: number; totalOrders: number } | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueData[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenueData[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSellersData | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDataPoint, setSelectedDataPoint] = useState<{ revenue: number; day: number; x: number; y: number } | null>(null);
  const chartDataRef = useRef<{ pointPositions: Array<{ x: number; y: number; item: DailyRevenueData; index: number }>; width: number; padding: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [])
  );

  const loadAnalytics = async () => {
    try {
      const user = await getUser();
      if (!user || !user.id) {
        return;
      }
      
      setProviderId(user.id);
      await Promise.all([
        loadOverallSummary(user.id),
        loadGrowthRate(user.id),
        loadAvgOrderValue(user.id),
        loadMonthlyRevenue(user.id, selectedYear),
        loadDailyRevenue(user.id),
        loadBestSellers(user.id),
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const loadOverallSummary = async (id: string) => {
    try {
      const response = await api.getOverallSummary(id);
      if (response.success) {
        setOverallSummary(response.data);
      }
    } catch (error) {
      console.error('Error loading overall summary:', error);
    }
  };

  const loadGrowthRate = async (id: string) => {
    try {
      const response = await api.getGrowthRate(id);
      if (response.success) {
        setGrowthRate(response.data);
      }
    } catch (error) {
      console.error('Error loading growth rate:', error);
    }
  };

  const loadAvgOrderValue = async (id: string) => {
    try {
      const response = await api.getAvgOrderValue(id);
      if (response.success) {
        setAvgOrderValue(response.data);
      }
    } catch (error) {
      console.error('Error loading average order value:', error);
    }
  };

  const loadMonthlyRevenue = async (id: string, year: number) => {
    try {
      const response = await api.getMonthlyRevenue(id, year);
      if (response.success) {
        console.log('📊 Monthly Revenue Data:', response.data);
        setMonthlyRevenue(response.data);
      }
    } catch (error) {
      console.error('Error loading monthly revenue:', error);
    }
  };

  const loadDailyRevenue = async (id: string) => {
    try {
      const now = new Date();
      const response = await api.getDailyRevenueTrend(id, now.getMonth() + 1, now.getFullYear());
      if (response.success) {
        setDailyRevenue(response.data);
      }
    } catch (error) {
      console.error('Error loading daily revenue:', error);
    }
  };

  const loadBestSellers = async (id: string) => {
    try {
      const response = await api.getBestSellers(id);
      if (response.success) {
        setBestSellers(response.data);
      }
    } catch (error) {
      console.error('Error loading best sellers:', error);
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    if (providerId) {
      loadMonthlyRevenue(providerId, year);
    }
  };

  const renderLineChart = (data: DailyRevenueData[]) => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      );
    }

    const screenWidth = Dimensions.get('window').width;
    const width = screenWidth - 64; // Account for padding (16 * 2) + section card padding (16 * 2)
    const height = 280;
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
    const minRevenue = Math.min(...data.map(d => d.revenue), 0);
    const revenueRange = maxRevenue - minRevenue || 1;

    // Calculate all point positions
    const pointPositions = data.map((item, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
      const y = padding + chartHeight - ((item.revenue - minRevenue) / revenueRange) * chartHeight;
      return { x, y, item, index };
    });

    // Store point positions in ref for PanResponder
    chartDataRef.current = { pointPositions, width, padding };

    const points = pointPositions.map(p => `${p.x},${p.y}`).join(' ');

    // Find closest point to touch position
    const findClosestPoint = (touchX: number, touchY: number) => {
      if (!chartDataRef.current) return null;
      
      let closestPoint = chartDataRef.current.pointPositions[0];
      let minDistance = Infinity;

      chartDataRef.current.pointPositions.forEach((point) => {
        const distance = Math.sqrt(
          Math.pow(touchX - point.x, 2) + Math.pow(touchY - point.y, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      });

      // Only select if within reasonable distance (50px)
      if (minDistance < 50) {
        return closestPoint;
      }
      return null;
    };

    // Create PanResponder for slide gesture
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const closest = findClosestPoint(locationX, locationY);
        if (closest) {
          setSelectedDataPoint({
            revenue: closest.item.revenue,
            day: closest.item.day,
            x: closest.x,
            y: closest.y,
          });
        }
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const closest = findClosestPoint(locationX, locationY);
        if (closest) {
          setSelectedDataPoint({
            revenue: closest.item.revenue,
            day: closest.item.day,
            x: closest.x,
            y: closest.y,
          });
        }
      },
      onPanResponderRelease: () => {
        // Keep the tooltip visible after release for a moment, then hide
        setTimeout(() => {
          setSelectedDataPoint(null);
        }, 2000);
      },
    });

    return (
      <View 
        style={styles.chartContainer}
        {...panResponder.panHandlers}
      >
        <Svg width={width} height={height}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding + chartHeight * (1 - ratio); // 0 at bottom, 1 at top
            return (
              <Line
                key={`grid-${i}`}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke={colors.muted}
                strokeWidth="0.5"
                opacity={0.3}
              />
            );
          })}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const value = minRevenue + revenueRange * ratio; // 0 at bottom, max at top
            const y = padding + chartHeight * (1 - ratio);
            return (
              <G key={`y-label-${i}`}>
                <SvgText
                  x={padding - 10}
                  y={y + 4}
                  fontSize="11"
                  fill={colors.muted}
                  textAnchor="end"
                  fontWeight="500"
                >
                  {Math.round(value).toLocaleString()}
                </SvgText>
              </G>
            );
          })}

          {/* X-axis labels */}
          {data.map((item, index) => {
            const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
            return (
              <G key={`x-label-${index}`}>
                <SvgText
                  x={x}
                  y={height - padding + 15}
                  fontSize="10"
                  fill={colors.muted}
                  textAnchor="middle"
                >
                  {item.day}
                </SvgText>
              </G>
            );
          })}

          {/* Line */}
          <Polyline
            points={points}
            fill="none"
            stroke={colors.brand}
            strokeWidth="2"
          />

          {/* Data points */}
          {pointPositions.map((point) => {
            const isSelected = selectedDataPoint?.day === point.item.day && selectedDataPoint?.revenue === point.item.revenue;
            return (
              <G key={`point-${point.index}`}>
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={isSelected ? "6" : "4"}
                  fill={isSelected ? colors.accent : colors.brand}
                />
              </G>
            );
          })}
        </Svg>
        
        {/* Tooltip for selected data point - shows when sliding */}
        {selectedDataPoint && (
          <View 
            style={[
              styles.dataPointTooltip,
              {
                left: Math.min(Math.max(selectedDataPoint.x - 60, 10), width - 130),
                top: Math.max(selectedDataPoint.y - 50, 10),
                backgroundColor: colors.surface,
              }
            ]}
          >
            <Text style={[styles.tooltipTitle, { color: colors.text }]}>Day {selectedDataPoint.day}</Text>
            <Text style={[styles.tooltipValue, { color: colors.brand }]}>
              ₹{selectedDataPoint.revenue}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderMonthlyRevenue = () => {
    if (!monthlyRevenue || monthlyRevenue.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No monthly data available</Text>
        </View>
      );
    }

    const screenWidth = Dimensions.get('window').width;
    const height = 280;
    const padding = 50;
    const chartHeight = height - padding * 2;
    
    const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Sort by month to ensure proper order
    const sortedData = [...monthlyRevenue].sort((a, b) => a.month - b.month);
    
    // Calculate bar dimensions - use fixed bar width for better scrolling
    const minBarWidth = 50;
    const barSpacing = 12;
    const barWidth = minBarWidth;
    // Always calculate chart width based on number of months for scrolling
    const chartWidth = Math.max(
      sortedData.length * (barWidth + barSpacing) + padding * 2,
      screenWidth - 64 // Minimum width
    );

    // Calculate scrollable chart width (without Y-axis labels area)
    const scrollableChartWidth = sortedData.length * (barWidth + barSpacing) + padding;
    const yAxisWidth = 50; // Fixed width for Y-axis labels

    return (
      <View style={styles.monthlyChartWrapper}>
        {/* Fixed Y-axis labels */}
        <View style={styles.yAxisContainer}>
          <Svg width={yAxisWidth} height={height}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const value = maxRevenue * ratio;
              const y = padding + chartHeight * (1 - ratio);
              return (
                <G key={`y-label-${i}`}>
                  <SvgText
                    x={yAxisWidth - 10}
                    y={y + 4}
                    fontSize="11"
                    fill={colors.muted}
                    textAnchor="end"
                    fontWeight="500"
                  >
                    {Math.round(value).toLocaleString()}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </View>

        {/* Scrollable chart area */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          style={styles.chartScrollView}
          contentContainerStyle={styles.chartScrollContent}
          nestedScrollEnabled={true}
        >
          <View style={styles.chartContainer}>
            <Svg width={scrollableChartWidth} height={height}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = padding + chartHeight * (1 - ratio);
                return (
                  <Line
                    key={`grid-${i}`}
                    x1={0}
                    y1={y}
                    x2={scrollableChartWidth}
                    y2={y}
                    stroke={colors.muted}
                    strokeWidth="0.5"
                    opacity={0.3}
                  />
                );
              })}

              {/* Bars */}
              {sortedData.map((item, index) => {
                const barHeight = (item.revenue / maxRevenue) * chartHeight;
                const x = index * (barWidth + barSpacing);
                const y = padding + chartHeight - barHeight;
                
                return (
                  <G key={`bar-${item.month}`}>
                    {/* Bar */}
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={colors.brand}
                      rx="4"
                    />
                    
                    {/* Value label on top of bar */}
                    <SvgText
                      x={x + barWidth / 2}
                      y={y - 8}
                      fontSize="12"
                      fill={colors.text}
                      textAnchor="middle"
                      fontWeight="700"
                    >
                      {`₹${item.revenue}`}
                    </SvgText>
                    
                    {/* Month label */}
                    <SvgText
                      x={x + barWidth / 2}
                      y={height - padding + 15}
                      fontSize="11"
                      fill={colors.text}
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {monthNames[item.month - 1] || `M${item.month}`}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>
          </View>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Analytics Dashboard</Text>
          <Ionicons name="analytics" size={24} color={colors.brand} />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="cash-outline" size={24} color={colors.accent} />
            </View>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={[styles.summaryValue, { color: colors.accent }]}>
              ₹{overallSummary?.totalRevenue.toLocaleString() || '0'}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="receipt-outline" size={24} color={colors.brand} />
            </View>
            <Text style={styles.summaryLabel}>Total Orders</Text>
            <Text style={[styles.summaryValue, { color: colors.brand }]}>
              {overallSummary?.totalOrders.toLocaleString() || '0'}
            </Text>
          </View>
        </View>

        {/* Growth Rate & AOV */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={styles.summaryIconContainer}>
              <Ionicons 
                name={growthRate && growthRate.growthPercent >= 0 ? "trending-up" : "trending-down"} 
                size={24} 
                color={growthRate && growthRate.growthPercent >= 0 ? colors.accent : colors.danger} 
              />
            </View>
            <Text style={styles.summaryLabel}>Growth Rate</Text>
            <Text style={[
              styles.summaryValue,
              { color: growthRate && growthRate.growthPercent >= 0 ? colors.accent : colors.danger }
            ]}>
              {growthRate ? `${growthRate.growthPercent >= 0 ? '+' : ''}${growthRate.growthPercent.toFixed(1)}%` : '0%'}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="calculator-outline" size={24} color={colors.brand2} />
            </View>
            <Text style={styles.summaryLabel}>Avg Order Value</Text>
            <Text style={[styles.summaryValue, { color: colors.brand2 }]}>
              ₹{avgOrderValue?.avgOrderValue.toFixed(0) || '0'}
            </Text>
          </View>
        </View>

        {/* Daily Revenue Trend */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Revenue Trend</Text>
            <Ionicons name="trending-up-outline" size={20} color={colors.brand} />
          </View>
          {renderLineChart(dailyRevenue)}
        </View>

        {/* Monthly Revenue */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monthly Revenue</Text>
            <View style={styles.yearSelector}>
              <TouchableOpacity
                onPress={() => handleYearChange(selectedYear - 1)}
                style={styles.yearButton}
              >
                <Ionicons name="chevron-back" size={16} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.yearText}>{selectedYear}</Text>
              <TouchableOpacity
                onPress={() => handleYearChange(selectedYear + 1)}
                style={styles.yearButton}
              >
                <Ionicons name="chevron-forward" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
          {renderMonthlyRevenue()}
        </View>

        {/* Best Sellers */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Best Sellers</Text>
            <Ionicons name="star-outline" size={20} color={colors.brand} />
          </View>
          {bestSellers ? (
            <ScrollView 
              style={styles.bestSellersScrollContainer}
              contentContainerStyle={styles.bestSellersContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {/* Top Meal Type */}
              {bestSellers.topMealType && (
                <View style={styles.bestSellerSection}>
                  <View style={styles.sectionSubtitle}>
                    <Ionicons name="fast-food-outline" size={16} color={colors.brand} />
                    <Text style={styles.sectionSubtitleText}>Top Meal Type</Text>
                  </View>
                  <View style={styles.bestSellerItem}>
                    <View style={[styles.rankBadge, { backgroundColor: colors.accent }]}>
                      <Ionicons name="trophy" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.bestSellerInfo}>
                      <Text style={styles.bestSellerName} numberOfLines={1}>
                        {bestSellers.topMealType.mealType === 'full' 
                          ? 'Full Tiffin' 
                          : bestSellers.topMealType.mealType === 'half' 
                          ? 'Half Tiffin' 
                          : 'Rice Only'}
                      </Text>
                      <View style={styles.bestSellerMeta}>
                        <Ionicons name="restaurant-outline" size={14} color={colors.muted} />
                        <Text style={styles.bestSellerType}>
                          Most Popular Meal Type
        </Text>
      </View>
                    </View>
                    <View style={styles.quantityContainer}>
                      <Text style={[styles.quantityValue, { color: colors.accent }]}>
                        {bestSellers.topMealType.quantity}
                      </Text>
                      <Text style={styles.quantityLabel}>sold</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Top Sabjis */}
              {bestSellers.topSabjis && bestSellers.topSabjis.length > 0 && (
                <View style={styles.bestSellerSection}>
                  <View style={styles.sectionSubtitle}>
                    <Ionicons name="restaurant" size={16} color={colors.brand} />
                    <Text style={styles.sectionSubtitleText}>Top Sabjis</Text>
                  </View>
                  <View style={styles.bestSellersList}>
                    {bestSellers.topSabjis.map((item, index) => {
                      // Different colors for top 3 ranks
                      const getRankColor = () => {
                        if (index === 0) return colors.accent;
                        if (index === 1) return colors.brand2;
                        if (index === 2) return colors.brand;
                        return colors.muted;
                      };
                      
                      return (
                        <View key={index} style={styles.bestSellerItem}>
                          <View style={[styles.rankBadge, { backgroundColor: getRankColor() }]}>
                            <Text style={styles.rankText}>#{index + 1}</Text>
                          </View>
                          <View style={styles.bestSellerInfo}>
                            <Text style={styles.bestSellerName} numberOfLines={1}>
                              {item.sabji}
                            </Text>
                            <View style={styles.bestSellerMeta}>
                              <Ionicons name="restaurant-outline" size={14} color={colors.muted} />
                              <Text style={styles.bestSellerType}>Sabji</Text>
                            </View>
                          </View>
                          <View style={styles.quantityContainer}>
                            <Text style={[styles.quantityValue, { color: getRankColor() }]}>
                              {item.quantity}
                            </Text>
                            <Text style={styles.quantityLabel}>sold</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No best sellers data available</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yearButton: {
    padding: 4,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    minWidth: 60,
    textAlign: 'center',
  },
  monthlyChartWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yAxisContainer: {
    paddingTop: 16,
    paddingRight: 8,
  },
  chartScrollView: {
    flex: 1,
    marginHorizontal: -16,
  },
  chartScrollContent: {
    paddingHorizontal: 16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  dataPointTouchable: {
    position: 'absolute',
    borderRadius: 15,
    backgroundColor: 'transparent',
  },
  dataPointTooltip: {
    position: 'absolute',
    borderRadius: 12,
    padding: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tooltipTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  tooltipClose: {
    padding: 2,
  },
  tooltipValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyChart: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
  },
  monthlyContainer: {
    gap: 12,
  },
  monthlyItem: {
    marginBottom: 12,
  },
  monthlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  monthRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.brand,
  },
  barContainer: {
    height: 8,
    backgroundColor: colors.bg,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  monthOrders: {
    fontSize: 12,
    color: colors.muted,
  },
  bestSellersScrollContainer: {
    maxHeight: 280, // Height to show approximately 3 items (80px per item + gaps)
  },
  bestSellersContent: {
    gap: 20,
    paddingBottom: 4,
  },
  bestSellerSection: {
    gap: 12,
  },
  sectionSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionSubtitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  bestSellersList: {
    gap: 12,
  },
  bestSellerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.muted + '30',
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bestSellerInfo: {
    flex: 1,
    marginRight: 12,
  },
  bestSellerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  bestSellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bestSellerType: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  bestSellerSeparator: {
    fontSize: 12,
    color: colors.muted,
  },
  bestSellerSabji: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  quantityContainer: {
    alignItems: 'flex-end',
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  quantityLabel: {
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

const styles = getStyles({}); // Will be overridden in component
