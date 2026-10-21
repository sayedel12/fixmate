import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../providers/auth-provider';
import { useLanguage } from '../lib/i18n';
import { colors } from '../lib/theme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const hydrateLanguage = useLanguage((state) => state.hydrate);
  useEffect(() => {
    void hydrateLanguage().catch((error: unknown) => {
      console.error('Unable to restore language preference:', error);
    });
  }, [hydrateLanguage]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
          <Stack.Screen name="book" options={{ presentation: 'modal' }} />
          <Stack.Screen name="technician" />
          <Stack.Screen name="landlord" />
          <Stack.Screen name="admin" />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
