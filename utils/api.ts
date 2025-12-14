import { API_BASE_URL } from '@/constants/theme';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Log API configuration on module load
console.log('📡 [API] Module loaded');
console.log('📡 [API] API_BASE_URL:', API_BASE_URL);
console.log('📡 [API] Platform:', Platform.OS);
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  console.log('📡 [API] Current origin:', window.location.origin);
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  address?: string;
  role: string;
}

export interface ApiResponse<T> {
  message: string;
  user?: T;
}

export interface Menu {
  _id: string;
  providerId: string | User;
  date: string;
  sabjis: string[];
  prices: {
    full: number;
    half: number;
    riceOnly: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMenuData {
  providerId: string;
  date: string;
  sabjis: string[];
  prices: {
    full: number;
    half: number;
    riceOnly: number;
  };
}

export interface OrderItem {
  mealType: 'full' | 'half' | 'riceOnly';
  sabji?: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface Order {
  _id: string;
  userId: string | User;
  providerId: string | User;
  menuId: string | Menu | null;
  items: OrderItem[];
  grandTotal: number;
  status?: string;
  orderDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlaceOrderData {
  userId: string;
  menuId: string;
  items: Array<{
    mealType: 'full' | 'half' | 'riceOnly';
    sabji?: string;
    quantity: number;
  }>;
}

// Helper to clear session
export const clearSession = async () => {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync('sessionId');
      await SecureStore.deleteItemAsync('user');
    } else {
      // For web, clear localStorage
      localStorage.removeItem('user');
    }
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

// Helper to store user data
export const storeUser = async (user: User) => {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync('user', JSON.stringify(user));
    } else {
      // For web, use localStorage
      localStorage.setItem('user', JSON.stringify(user));
    }
  } catch (error) {
    console.error('Error storing user:', error);
  }
};

// Helper to get user data from storage
export const getUser = async (): Promise<User | null> => {
  try {
    if (Platform.OS !== 'web') {
      const userStr = await SecureStore.getItemAsync('user');
      return userStr ? JSON.parse(userStr) : null;
    } else {
      // For web, use localStorage
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
  } catch {
    return null;
  }
};

// Helper to fetch user from API and store it
// This ensures we always have fresh data from the server
export const fetchAndStoreUser = async (): Promise<User | null> => {
  try {
    const userData = await api.getUser();
    if (userData) {
      await storeUser(userData);
      console.log('✅ [fetchAndStoreUser] User data fetched and stored');
      return userData;
    }
    return null;
  } catch (error: any) {
    // Silently handle "Not authenticated" errors - this is expected when user is not logged in
    const isNotAuthenticated = error?.message?.includes('Not authenticated') || 
                               error?.message?.includes('Failed to fetch user');
    
    if (!isNotAuthenticated) {
      console.error('🔴 [fetchAndStoreUser] Error fetching user:', error);
    }
    
    // Fallback to stored user if API fails
    const storedUser = await getUser();
    if (storedUser) {
      console.log('📦 [fetchAndStoreUser] Using stored user data');
      return storedUser;
    }
    return null;
  }
};

export const api = {
  async generateOTP(email: string): Promise<{ message: string }> {
    const url = `${API_BASE_URL}/auth/generate-otp`;
    const requestBody = { email };
    
    console.log('🔵 [generateOTP] Starting request...');
    console.log('🔵 [generateOTP] API_BASE_URL:', API_BASE_URL);
    console.log('🔵 [generateOTP] Full URL:', url);
    console.log('🔵 [generateOTP] Request body:', requestBody);
    console.log('🔵 [generateOTP] Platform:', Platform.OS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify(requestBody),
      });

      console.log('🟢 [generateOTP] Response received');
      console.log('🟢 [generateOTP] Status:', response.status);
      console.log('🟢 [generateOTP] Status Text:', response.statusText);
      console.log('🟢 [generateOTP] Headers:', Object.fromEntries(response.headers.entries()));
      console.log('🟢 [generateOTP] OK:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('🔴 [generateOTP] Error response:', errorData);
        } catch (e) {
          const text = await response.text();
          console.error('🔴 [generateOTP] Error response (text):', text);
          errorData = { message: text || 'Failed to generate OTP' };
        }
        throw new Error(errorData.message || 'Failed to generate OTP');
      }

      const data = await response.json();
      console.log('✅ [generateOTP] Success:', data);
      return data;
    } catch (error: any) {
      console.error('🔴 [generateOTP] Fetch error:', error);
      console.error('🔴 [generateOTP] Error name:', error.name);
      console.error('🔴 [generateOTP] Error message:', error.message);
      console.error('🔴 [generateOTP] Error stack:', error.stack);
      
      // Check for CORS-specific errors
      if (error.message?.includes('CORS') || error.message?.includes('Network request failed') || error.name === 'TypeError') {
        console.error('🔴 [generateOTP] CORS or Network Error detected!');
        console.error('🔴 [generateOTP] Make sure your backend has CORS enabled for:', Platform.OS === 'web' ? window.location.origin : 'mobile app');
      }
      
      throw error;
    }
  },

  async verifyOTP(
    email: string,
    otp: string,
    userData?: {
      name?: string;
      mobile?: string;
      password?: string;
      address?: string;
      role?: string;
    }
  ): Promise<ApiResponse<User>> {
    const url = `${API_BASE_URL}/auth/verify-otp`;
    const requestBody = { email, otp, ...userData };
    
    console.log('🔵 [verifyOTP] Starting request...');
    console.log('🔵 [verifyOTP] URL:', url);
    console.log('🔵 [verifyOTP] Request body (without sensitive data):', { email, otp, hasUserData: !!userData });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      console.log('🟢 [verifyOTP] Response status:', response.status);
      console.log('🟢 [verifyOTP] Response OK:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('🔴 [verifyOTP] Error response:', errorData);
        } catch (e) {
          const text = await response.text();
          console.error('🔴 [verifyOTP] Error response (text):', text);
          errorData = { message: text || 'Failed to verify OTP' };
        }
        throw new Error(errorData.message || 'Failed to verify OTP');
      }

      const data = await response.json();
      console.log('✅ [verifyOTP] Success:', { message: data.message, hasUser: !!data.user });
      if (data.user) {
        await storeUser(data.user);
      }
      return data;
    } catch (error: any) {
      console.error('🔴 [verifyOTP] Fetch error:', error);
      if (error.message?.includes('CORS') || error.message?.includes('Network request failed') || error.name === 'TypeError') {
        console.error('🔴 [verifyOTP] CORS or Network Error detected!');
      }
      throw error;
    }
  },

  async login(email: string, password: string): Promise<ApiResponse<User>> {
    const url = `${API_BASE_URL}/auth/login`;
    
    console.log('🔵 [login] Starting request...');
    console.log('🔵 [login] URL:', url);
    console.log('🔵 [login] Email:', email);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      console.log('🟢 [login] Response status:', response.status);
      console.log('🟢 [login] Response OK:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('🔴 [login] Error response:', errorData);
        } catch (e) {
          const text = await response.text();
          console.error('🔴 [login] Error response (text):', text);
          errorData = { message: text || 'Failed to login' };
        }
        throw new Error(errorData.message || 'Failed to login');
      }

      const data = await response.json();
      console.log('✅ [login] Success:', { message: data.message, hasUser: !!data.user });
      if (data.user) {
        await storeUser(data.user);
      }
      return data;
    } catch (error: any) {
      console.error('🔴 [login] Fetch error:', error);
      if (error.message?.includes('CORS') || error.message?.includes('Network request failed') || error.name === 'TypeError') {
        console.error('🔴 [login] CORS or Network Error detected!');
      }
      throw error;
    }
  },

  async getUser(): Promise<User> {
    const url = `${API_BASE_URL}/auth/user`;
    
    console.log('🔵 [getUser] Starting request...');
    console.log('🔵 [getUser] URL:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('🟢 [getUser] Response status:', response.status);
      console.log('🟢 [getUser] Response OK:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          // Don't log "Not authenticated" errors - this is expected when user is not logged in
          if (errorData.message !== 'Not authenticated') {
            console.error('🔴 [getUser] Error response:', errorData);
          }
        } catch (e) {
          const text = await response.text();
          // Don't log "Not authenticated" errors
          if (text !== 'Not authenticated' && !text.includes('Not authenticated')) {
            console.error('🔴 [getUser] Error response (text):', text);
          }
          errorData = { message: text || 'Failed to fetch user' };
        }
        throw new Error(errorData.message || 'Failed to fetch user');
      }

      const data = await response.json();
      console.log('✅ [getUser] Success:', { hasUser: !!data.user });
      if (data.user) {
        await storeUser(data.user);
      }
      return data.user;
    } catch (error: any) {
      // Silently handle "Not authenticated" errors - this is expected when user is not logged in
      const isNotAuthenticated = error?.message?.includes('Not authenticated');
      
      if (!isNotAuthenticated) {
        console.error('🔴 [getUser] Fetch error:', error);
        if (error.message?.includes('CORS') || error.message?.includes('Network request failed') || error.name === 'TypeError') {
          console.error('🔴 [getUser] CORS or Network Error detected!');
        }
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    await clearSession();
  },

  // Menu API (Provider routes)
  async createMenu(menuData: CreateMenuData): Promise<{ message: string; menu: Menu }> {
    const url = `${API_BASE_URL}/provider/create-menu`;
    
    console.log('🔵 [createMenu] Starting request...');
    console.log('🔵 [createMenu] URL:', url);
    console.log('🔵 [createMenu] Menu data:', menuData);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(menuData),
      });

      console.log('🟢 [createMenu] Response status:', response.status);
      console.log('🟢 [createMenu] Response OK:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('🔴 [createMenu] Error response:', errorData);
        } catch (e) {
          const text = await response.text();
          console.error('🔴 [createMenu] Error response (text):', text);
          errorData = { message: text || 'Failed to create menu' };
        }
        throw new Error(errorData.message || 'Failed to create menu');
      }

      const data = await response.json();
      console.log('✅ [createMenu] Success:', data);
      return data;
    } catch (error: any) {
      console.error('🔴 [createMenu] Fetch error:', error);
      throw error;
    }
  },

  async getMenus(): Promise<{ count: number; menus: Menu[] }> {
    const url = `${API_BASE_URL}/provider`;
    
    console.log('🔵 [getMenus] Starting request...');
    console.log('🔵 [getMenus] URL:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('🟢 [getMenus] Response status:', response.status);
      console.log('🟢 [getMenus] Response OK:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('🔴 [getMenus] Error response:', errorData);
        } catch (e) {
          const text = await response.text();
          console.error('🔴 [getMenus] Error response (text):', text);
          errorData = { message: text || 'Failed to fetch menus' };
        }
        throw new Error(errorData.message || 'Failed to fetch menus');
      }

      const data = await response.json();
      console.log('✅ [getMenus] Success:', { count: data.count });
      return data;
    } catch (error: any) {
      console.error('🔴 [getMenus] Fetch error:', error);
      throw error;
    }
  },

  async updateMenu(
    menuId: string,
    menuData: Partial<CreateMenuData>
  ): Promise<{ message: string; menu: Menu }> {
    const url = `${API_BASE_URL}/provider/${menuId}`;
    
    console.log('🔵 [updateMenu] Starting request...');
    console.log('🔵 [updateMenu] URL:', url);
    console.log('🔵 [updateMenu] Menu data:', menuData);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(menuData),
      });

      console.log('🟢 [updateMenu] Response status:', response.status);
      console.log('🟢 [updateMenu] Response OK:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('🔴 [updateMenu] Error response:', errorData);
        } catch (e) {
          const text = await response.text();
          console.error('🔴 [updateMenu] Error response (text):', text);
          errorData = { message: text || 'Failed to update menu' };
        }
        throw new Error(errorData.message || 'Failed to update menu');
      }

      const data = await response.json();
      console.log('✅ [updateMenu] Success:', data);
      return data;
    } catch (error: any) {
      console.error('🔴 [updateMenu] Fetch error:', error);
      throw error;
    }
  },

  async deleteMenu(menuId: string, providerId: string): Promise<{ message: string }> {
    const url = `${API_BASE_URL}/provider/${menuId}`;
    
    console.log('🔵 [deleteMenu] Starting request...');
    console.log('🔵 [deleteMenu] URL:', url);

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ providerId }),
      });

      console.log('🟢 [deleteMenu] Response status:', response.status);
      console.log('🟢 [deleteMenu] Response OK:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('🔴 [deleteMenu] Error response:', errorData);
        } catch (e) {
          const text = await response.text();
          console.error('🔴 [deleteMenu] Error response (text):', text);
          errorData = { message: text || 'Failed to delete menu' };
        }
        throw new Error(errorData.message || 'Failed to delete menu');
      }

      const data = await response.json();
      console.log('✅ [deleteMenu] Success:', data);
      return data;
    } catch (error: any) {
      console.error('🔴 [deleteMenu] Fetch error:', error);
      throw error;
    }
  },

  // Order API (Student routes)
  async placeOrder(orderData: PlaceOrderData): Promise<{ message: string; order: Order }> {
    const url = `${API_BASE_URL}/order`;
    
    console.log('🔵 [placeOrder] Starting request...');
    console.log('🔵 [placeOrder] URL:', url);
    console.log('🔵 [placeOrder] Order data:', orderData);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      console.log('🟢 [placeOrder] Response status:', response.status);
      console.log('🟢 [placeOrder] Response OK:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('🔴 [placeOrder] Error response:', errorData);
        } catch (e) {
          const text = await response.text();
          console.error('🔴 [placeOrder] Error response (text):', text);
          errorData = { message: text || 'Failed to place order' };
        }
        throw new Error(errorData.message || 'Failed to place order');
      }

      const data = await response.json();
      console.log('✅ [placeOrder] Success:', data);
      return data;
    } catch (error: any) {
      console.error('🔴 [placeOrder] Fetch error:', error);
      throw error;
    }
  },

  async getOrders(userId: string): Promise<{ count: number; orders: Order[] }> {
    const url = `${API_BASE_URL}/order?userId=${userId}`;
    
    console.log('🔵 [getOrders] Starting request...');
    console.log('🔵 [getOrders] URL:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('🟢 [getOrders] Response status:', response.status);
      console.log('🟢 [getOrders] Response OK:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('🔴 [getOrders] Error response:', errorData);
        } catch (e) {
          const text = await response.text();
          console.error('🔴 [getOrders] Error response (text):', text);
          errorData = { message: text || 'Failed to fetch orders' };
        }
        throw new Error(errorData.message || 'Failed to fetch orders');
      }

      const data = await response.json();
      console.log('✅ [getOrders] Success:', { count: data.count });
      return data;
    } catch (error: any) {
      console.error('🔴 [getOrders] Fetch error:', error);
      throw error;
    }
  },

  async getProviderOrders(providerId: string): Promise<{ count: number; orders: Order[] }> {
    const url = `${API_BASE_URL}/provider/provider?providerId=${providerId}`;
    
    console.log('🔵 [getProviderOrders] Starting request...');
    console.log('🔵 [getProviderOrders] URL:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('🟢 [getProviderOrders] Response status:', response.status);
      console.log('🟢 [getProviderOrders] Response OK:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('🔴 [getProviderOrders] Error response:', errorData);
        } catch (e) {
          const text = await response.text();
          console.error('🔴 [getProviderOrders] Error response (text):', text);
          errorData = { message: text || 'Failed to fetch orders' };
        }
        throw new Error(errorData.message || 'Failed to fetch orders');
      }

      const data = await response.json();
      console.log('✅ [getProviderOrders] Success:', { count: data.count });
      return data;
    } catch (error: any) {
      console.error('🔴 [getProviderOrders] Fetch error:', error);
      throw error;
    }
  },
};

