import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { Button, Card, Chip, Heading, Notice, Page } from '../components/ui';
import { RoleGuard } from '../components/role-guard';
import { supabase } from '../lib/supabase';
import { colors, spacing } from '../lib/theme';
import { DEMO_USERS, useDemoStore } from '../lib/demo';
import { isDemoMode } from '../lib/mode';
import { translateStatus, useLanguage } from '../lib/i18n';

export default function AdminScreen() {
  const language = useLanguage((state) => state.language);
  const demoBookings = useDemoStore((state) => state.bookings);
  const assignDemoTechnician = useDemoStore((state) => state.assignTechnician);
  const queryClient = useQueryClient();
  const queue = useQuery({
    queryKey: ['admin-booking-queue'],
    enabled: !isDemoMode,
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase.from('bookings')
        .select('id, reference, status, scheduled_at, service_id, emirate, area, services(name)')
        .in('status', ['requested', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
  const candidates = useQuery({
    queryKey: ['admin-technician-candidates'],
    enabled: !isDemoMode,
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase.from('admin_technician_candidates')
        .select('technician_id, display_name, bio, rating, service_ids, service_areas');
      if (error) throw error;
      return data ?? [];
    },
  });
  const waitingBookings = isDemoMode
    ? demoBookings.filter((booking) => booking.status === 'requested').map((booking) => ({
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      scheduled_at: booking.scheduledAt,
      service_id: booking.serviceId,
      emirate: booking.emirate,
      area: booking.area,
      service_name: language === 'ar' ? booking.serviceNameAr : booking.serviceName,
    }))
    : (queue.data ?? []).map((booking) => ({
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      scheduled_at: booking.scheduled_at,
      service_id: booking.service_id,
      emirate: booking.emirate,
      area: booking.area,
      service_name: Array.isArray(booking.services) ? booking.services[0]?.name ?? 'Service' : 'Service',
    }));
  const demoTechnician = {
    technician_id: DEMO_USERS.technician.id,
    display_name: DEMO_USERS.technician.name,
    service_ids: ['10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000004'],
    service_areas: ['Ajman/Al Nuaimia', 'Ajman/Al Rashidiya', 'Ajman/Al Jurf', 'Sharjah/Al Majaz', 'Sharjah/Muwaileh'],
  };
  const availableCandidates = isDemoMode ? [demoTechnician] : (candidates.data ?? []);

  const assignTechnician = (bookingId: string, technicianId: string) => {
    if (isDemoMode) {
      assignDemoTechnician(bookingId);
      Alert.alert(
        language === 'ar' ? 'تم التعيين التجريبي' : 'Demo assignment complete',
        language === 'ar' ? 'تم تحديث بيانات العرض على هذا الهاتف فقط.' : 'The local sample booking was updated. No technician was dispatched.',
      );
      return;
    }
    Alert.alert('Assign technician?', 'The server will verify service area, approval and schedule availability.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Assign', onPress: () => void (async () => {
        if (!supabase) return;
        const { error } = await supabase.rpc('admin_assign_technician', {
          p_booking_id: bookingId,
          p_technician_id: technicianId,
        });
        if (error) Alert.alert('Assignment failed', error.message);
        else await queryClient.invalidateQueries({ queryKey: ['admin-booking-queue'] });
      })() },
    ]);
  };

  return (
    <RoleGuard role="admin">
      <Page>
        <Heading subtitle={language === 'ar' ? 'إدارة الحجوزات في العرض التجريبي.' : 'Manage demo service requests.'}>{language === 'ar' ? 'الإدارة' : 'Operations'}</Heading>
        <Notice>{language === 'ar' ? 'بيانات خيالية. التعيين لا يرسل فنيين فعليين.' : 'Fictional demo data. Assignments do not dispatch real technicians.'}</Notice>
        {!isDemoMode ? <Notice>Administrative actions require server-side authorization.</Notice> : null}
        {!isDemoMode && queue.isLoading ? <ActivityIndicator color={colors.teal} /> : null}
        {!isDemoMode && queue.isError ? <Notice tone="error">{queue.error.message}</Notice> : null}
        {!isDemoMode && candidates.isError ? <Notice tone="error">Unable to load technician candidates: {candidates.error.message}</Notice> : null}
        <ScrollView contentContainerStyle={styles.list}>
          {waitingBookings.map((booking) => (
            <Card key={booking.id}>
              <Chip>{translateStatus(language, booking.status)}</Chip>
              <Text style={styles.title}>{booking.service_name}</Text>
              <Text style={styles.info}>#{booking.reference} · {new Date(booking.scheduled_at).toLocaleString('en-AE')}</Text>
              <Text style={styles.info}>{booking.area}, {booking.emirate}</Text>
              {availableCandidates.filter((technician) =>
                (technician.service_ids as string[] | null)?.includes(booking.service_id)
                && (technician.service_areas as string[] | null)?.includes(`${booking.emirate}/${booking.area}`),
              ).map((technician) => (
                <Button
                  key={technician.technician_id}
                  title={`Assign to ${technician.display_name}`}
                  variant="outline"
                  onPress={() => assignTechnician(booking.id, technician.technician_id)}
                />
              ))}
              {(isDemoMode || (!candidates.isLoading && !candidates.isError)) && !availableCandidates.some((technician) =>
                (technician.service_ids as string[] | null)?.includes(booking.service_id)
                && (technician.service_areas as string[] | null)?.includes(`${booking.emirate}/${booking.area}`),
              ) ? <Text style={styles.info}>No approved, available technician matches this service area.</Text> : null}
            </Card>
          ))}
          {!isDemoMode && (queue.isLoading || candidates.isLoading) ? <ActivityIndicator color={colors.teal} /> : null}
          {(isDemoMode || (!queue.isLoading && !queue.isError)) && !waitingBookings.length ? <Notice>{language === 'ar' ? 'لا توجد حجوزات بانتظار التعيين.' : 'No bookings are waiting for assignment.'}</Notice> : null}
        </ScrollView>
      </Page>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  title: { color: colors.navy, fontSize: 17, fontWeight: '800' },
  info: { color: colors.muted, fontSize: 13 },
});
