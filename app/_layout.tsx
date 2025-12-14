import { Stack } from "expo-router";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useEffect, useRef, useState } from "react";
import { Animated, View, Image, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { lightColors } from "@/constants/theme";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AnimatedSplashScreen({ children }: { children: React.ReactNode }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const [isAppReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Start the animation immediately
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();

        // Pre-load fonts, make any API calls you need to do here
        await new Promise(resolve => setTimeout(resolve, 2000)); // Show splash for 2 seconds
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (isAppReady) {
      // Fade out animation before hiding splash
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        SplashScreen.hideAsync();
      });
    }
  }, [isAppReady]);

  return (
    <>
      {!isAppReady && (
        <View style={[styles.splashContainer, { backgroundColor: lightColors.bg }]}>
          <Animated.View
            style={[
              styles.splashContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Image
              source={require("@/assets/images/logo3.png")}
              style={styles.splashLogo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      )}
      {isAppReady && children}
    </>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  splashContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  splashLogo: {
    width: 150,
    height: 150,
  },
});

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AnimatedSplashScreen>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(provider-tabs)" options={{ headerShown: false }} />
        </Stack>
      </AnimatedSplashScreen>
    </ThemeProvider>
  );
}
