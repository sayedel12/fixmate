import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Card, Heading, Notice, Page, Button, Chip } from '../../components/ui';
import { colors, spacing } from '../../lib/theme';
import { useLanguage, translate, translateStatus } from '../../lib/i18n';
import { useAuth } from '../../providers/auth-provider';
import { isBackendConfigured, supabase } from '../../lib/supabase';
import { isDemoMode } from '../../lib/mode';
import { DEMO_PROPERTIES, useDemoStore } from '../../lib/demo';

type Booking = { id: string; reference: string; status: string; service_name: string; scheduled_at: string };

export default function BookingsScreen() {
  const language = useLanguage((state) => state.language);
  const { session, role } = useAuth();
  const demoBookings = useDemoStore((state) => state.bookings);
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const query = useQuery({
    queryKey: ['bookings', session?.user.id],
    enabled: !isDemoMode && Boolean(session && supabase),
    queryFn: async () => {
      if (!supabase) throw new Error('Backend is not configured.');
      const { data, error } = await supabase
        .from('booking_summaries')
        .select('id, reference, status, service_name, scheduled_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Booking[];
    },
  });
  const visibleDemoBookings = demoBookings.filter((booking) => {
    if (role === 'admin') return true;
    if (role === 'technician') return booking.technicianId === session?.user.id;
    if (role === 'landlord') return DEMO_PROPERTIES.some((property) => property.emirate === booking.emirate && property.area === booking.area);
    return booking.customerId === session?.user.id;
  });
  const visibleBookings = isDemoMode
    ? visibleDemoBookings.map((booking) => ({
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      service_name: language === 'ar' ? booking.serviceNameAr : booking.serviceName,
      scheduled_at: booking.scheduledAt,
    }))
    : query.data;
  const isLoading = !isDemoMode && query.isLoading;
  const isError = !isDemoMode && query.isError;

  return (
    <Page>
      <Heading subtitle={language === 'ar' ? 'تابع مواعيد الصيانة وطلبات الخدمة' : 'Track your service requests and appointments'}>
        {t('bookings')}
      </Heading>
      {isDemoMode ? <Notice>{translate(language, 'simulated')}</Notice> : null}
      {!session ? (
        <Card>
          <Text style={styles.title}>{t('loginRequired')}</Text>
          {!isDemoMode && !isBackendConfigured ? <Notice>Connect Supabase to enable secure accounts and saved bookings.</Notice> : null}
          <Button title={t('signIn')} onPress={() => router.push('/sign-in')} />
        </Card>
      ) : isLoading ? <ActivityIndicator color={colors.teal} /> :
        isError ? <Notice tone="error">{query.error?.message}</Notice> :
          visibleBookings?.length ? (
            <ScrollView contentContainerStyle={styles.list}>
              {visibleBookings.map((booking) => (
                <Card key={booking.id}>
                  <Chip>{isDemoMode ? translateStatus(language, booking.status) : booking.status.replaceAll('_', ' ')}</Chip>
                  <Text style={styles.title}>{booking.service_name}</Text>
                  <Text style={styles.info}>#{booking.reference}</Text>
                  <Text style={styles.info}>{new Date(booking.scheduled_at).toLocaleString(language === 'ar' ? 'ar-AE' : 'en-AE', { timeZone: 'Asia/Dubai' })}</Text>
                </Card>
              ))}
            </ScrollView>
          ) : (
            <Card>
              <Text style={styles.title}>{t('noBookings')}</Text>
              <Text style={styles.info}>{t('noBookingsHelp')}</Text>
              <Button title={t('bookNow')} onPress={() => router.push('/services')} />
            </Card>
          )}
    </Page>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, paddingBottom: spacing.xl },
  title: { color: colors.navy, fontWeight: '800', fontSize: 17 },
  info: { color: colors.muted, fontSize: 13 },
});
