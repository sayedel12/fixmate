import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { Button, Card, Chip, Heading, Notice, Page } from '../components/ui';
import { RoleGuard } from '../components/role-guard';
import { supabase } from '../lib/supabase';
import { colors, spacing } from '../lib/theme';
import { isDemoMode } from '../lib/mode';
import { useDemoStore } from '../lib/demo';
import { translateStatus, useLanguage } from '../lib/i18n';

type Job = { id: string; reference: string; status: string; service_name: string; address: string; scheduled_at: string; customerName?: string };

export default function TechnicianScreen() {
  const language = useLanguage((state) => state.language);
  const demoBookings = useDemoStore((state) => state.bookings);
  const updateDemoStatus = useDemoStore((state) => state.updateStatus);
  const queryClient = useQueryClient();
  const jobs = useQuery({
    queryKey: ['technician-jobs'],
    enabled: !isDemoMode,
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase
        .from('bookings')
        .select('id, reference, status, address, scheduled_at, services(name)')
        .not('assigned_technician_id', 'is', null)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        reference: row.reference,
        status: row.status,
        address: row.address,
        scheduled_at: row.scheduled_at,
        service_name: Array.isArray(row.services) ? row.services[0]?.name ?? 'Service' : 'Service',
      })) as Job[];
    },
  });
  const displayedJobs = isDemoMode
    ? demoBookings.filter((booking) => booking.technicianId === 'demo-technician-ali').map((booking) => ({
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      address: booking.address,
      scheduled_at: booking.scheduledAt,
      customerName: booking.customerName,
      service_name: language === 'ar' ? booking.serviceNameAr : booking.serviceName,
    }))
    : (jobs.data ?? []);

  const updateStatus = (id: string, status: 'technician_en_route' | 'in_progress' | 'completed') => {
    if (isDemoMode) {
      updateDemoStatus(id, status);
      return;
    }
    Alert.alert('Update job status?', `Mark this job as ${status.replaceAll('_', ' ')}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => void (async () => {
        if (!supabase) return;
        const { error } = await supabase.rpc('technician_update_booking_status', { p_booking_id: id, p_new_status: status });
        if (error) Alert.alert('Update failed', error.message);
        else await queryClient.invalidateQueries({ queryKey: ['technician-jobs'] });
      })() },
    ]);
  };

  return (
    <RoleGuard role="technician">
      <Page>
        <Heading subtitle={language === 'ar' ? 'المهام والمواعيد المسندة إليك.' : 'Your assigned work and appointment details.'}>{language === 'ar' ? 'مساحة الفني' : 'Technician workspace'}</Heading>
        {isDemoMode ? <Notice>{translateStatus(language, 'requested')} · {language === 'ar' ? 'يمكن تغيير الحالة في هذا العرض.' : 'Demo status changes are saved on this phone.'}</Notice> : null}
        {!isDemoMode && jobs.isLoading ? <ActivityIndicator color={colors.teal} /> : null}
        {!isDemoMode && jobs.isError ? <Notice tone="error">{jobs.error.message}</Notice> : null}
        <ScrollView contentContainerStyle={styles.list}>
          {displayedJobs?.map((job) => (
            <Card key={job.id}>
              <Chip>{isDemoMode ? translateStatus(language, job.status) : job.status.replaceAll('_', ' ')}</Chip>
              <Text style={styles.title}>{job.service_name}</Text>
              <Text style={styles.info}>#{job.reference}</Text>
              <Text style={styles.info}>{new Date(job.scheduled_at).toLocaleString(language === 'ar' ? 'ar-AE' : 'en-AE')}</Text>
              <Text style={styles.info}>{job.customerName ? `${job.customerName} · ` : ''}{job.address}</Text>
              {job.status === 'technician_assigned' ? <Button title={language === 'ar' ? 'تحديد: في الطريق' : 'Mark en route'} onPress={() => updateStatus(job.id, 'technician_en_route')} /> : null}
              {job.status === 'technician_en_route' ? <Button title={language === 'ar' ? 'بدء العمل' : 'Start job'} onPress={() => updateStatus(job.id, 'in_progress')} /> : null}
              {job.status === 'in_progress' ? <Button title={language === 'ar' ? 'إرسال الإنجاز' : 'Submit completion'} variant="secondary" onPress={() => updateStatus(job.id, 'completed')} /> : null}
            </Card>
          ))}
          {(isDemoMode || !jobs.isLoading) && (isDemoMode || !jobs.isError) && !displayedJobs?.length ? <Notice>{language === 'ar' ? 'لا توجد مهام مسندة حالياً.' : 'No assigned jobs are available.'}</Notice> : null}
        </ScrollView>
      </Page>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  title: { color: colors.navy, fontSize: 17, fontWeight: '800' },
  info: { color: colors.muted, fontSize: 13, lineHeight: 19 },
});
