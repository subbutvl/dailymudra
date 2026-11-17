import { Outfit_500Medium, Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import { Geist_400Regular, Geist_500Medium } from '@expo-google-fonts/geist';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getDb } from '@/db/db';
import { clearCheckpoint, readCheckpoint, recover, type Recovery } from '@/features/session/checkpoint';
import { saveSession } from '@/features/progress/sessionRepo';
import { useProgress } from '@/features/progress/useProgress';
import { useSettings } from '@/settings/useSettings';
import { useTheme } from '@/theme/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Outfit_500Medium, Outfit_600SemiBold, Geist_400Regular, Geist_500Medium });
  // Boot synchronously, once: open DB (runs migrations), hydrate settings,
  // settle any in-flight session left by a kill or crash.
  const [recovery] = useState(boot);
  const { color } = useTheme();

  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready && recovery.kind === 'resume') {
      // Let the stack mount first, then reopen Practice where it left off.
      const id = recovery.state.mudraId;
      setTimeout(() => router.push({ pathname: '/practice/[id]', params: { id, resume: '1' } }), 0);
    }
  }, [ready, recovery]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          // Gentle native transitions; Android turns them off when "Remove animations" is on.
          animation: 'slide_from_right',
          animationDuration: 280,
          contentStyle: { backgroundColor: color.bg },
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="practice/[id]"
          options={{ animation: 'fade', animationDuration: 450, gestureEnabled: false, contentStyle: { backgroundColor: color.night } }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

function boot(): Recovery {
  getDb();
  useSettings.getState().hydrate();
  const r = recover(readCheckpoint(), Date.now());
  if (r.kind === 'finished') {
    saveSession(r.record);
    clearCheckpoint();
  }
  useProgress.getState().refresh();
  return r;
}
