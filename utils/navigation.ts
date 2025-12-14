import { router } from 'expo-router';
import { User } from './api';

/**
 * Routes user to appropriate dashboard based on their role
 */
export const routeBasedOnRole = (user: User | null) => {
  if (!user) {
    router.replace('/(auth)/login');
    return;
  }

  if (user.role === 'provider') {
    router.replace('/(provider-tabs)');
  } else {
    router.replace('/(tabs)');
  }
};

