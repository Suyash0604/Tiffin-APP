import { useEffect } from "react";
import { router } from "expo-router";
import { fetchAndStoreUser } from "@/utils/api";

export default function Index() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Fetch fresh user data from API and store it
        // fetchAndStoreUser will silently handle "Not authenticated" errors
        const user = await fetchAndStoreUser();
        
        if (user) {
          // Route based on user role
          if (user.role === 'provider') {
            router.replace("/(provider-tabs)");
          } else {
            router.replace("/(tabs)");
          }
        } else {
          router.replace("/(auth)/login");
        }
      } catch (error: any) {
        // Only log unexpected errors (fetchAndStoreUser already handles "Not authenticated" silently)
        if (!error?.message?.includes('Not authenticated') && !error?.message?.includes('Failed to fetch user')) {
          console.error('Error checking auth:', error);
        }
        router.replace("/(auth)/login");
      }
    };
    checkAuth();
  }, []);

  return null;
}
