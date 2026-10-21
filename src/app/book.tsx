import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheckBig } from 'lucide-react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ServiceIcon } from '../components/service-icon';
import { Button, Card, Chip, Field, Heading, Notice, Page } from '../components/ui';
import { getPreviewServices, useServices } from '../hooks/use-services';
import { serviceAreas } from '../lib/catalog';
import { getDubaiDate } from '../lib/uae-time';
import { isBackendConfigured, supabase } from '../lib/supabase';
import { useAuth } from '../providers/auth-provider';
import { colors, spacing } from '../lib/theme';
import type { BookingValues } from '../types/booking';
import { useDemoStore } from '../lib/demo';
import { isDemoMode } from '../lib/mode';
import { translate, useLanguage } from '../lib/i18n';

const bookingSchema = z.object({
  details: z.string().trim().min(10).max(1200),
  emirate: z.enum(['Ajman', 'Sharjah']),
  area: z.string().trim().min(2),
  address: z.string().trim().min(8),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeWindow: z.enum(['morning', 'afternoon', 'evening']),
});
export default function BookingScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId?: string }>();
  const { session } = useAuth();
  const language = useLanguage((state) => state.language);
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const addDemoBooking = useDemoStore((state) => state.addBooking);
  const catalog = useServices();
  const services = catalog.data ?? getPreviewServices();
  const service = services.find((item) => item.id === serviceId) ?? services[0];
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState('');
  const [dateChoices] = useState(() => Array.from({ length: 14 }, (_, index) => getDubaiDate(index + 1)));
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      details: '',
      emirate: 'Ajman',
      area: '',
      address: '',
      scheduledDate: getDubaiDate(1),
      timeWindow: 'morning',
    },
  });
  const selectedEmirate = useWatch({ control, name: 'emirate' });
  const selectedTime = useWatch({ control, name: 'timeWindow' });
  const selectedArea = useWatch({ control, name: 'area' });
  const selectedDate = useWatch({ control, name: 'scheduledDate' });
  const emirateLabels = { Ajman: 'عجمان', Sharjah: 'الشارقة' } as const;
  const areaLabels: Record<string, string> = {
    'Al Nuaimia': 'النعيمية',
    'Al Rashidiya': 'الراشدية',
    'Al Jurf': 'الجرف',
    'Al Majaz': 'المجاز',
    'Al Nahda': 'النهدة',
    Muwaileh: 'مويلح',
  };

  const submit = async (values: BookingValues) => {
    if (isDemoMode) {
      setBusy(true);
      try {
        setReference(addDemoBooking(values, service));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!session) {
      Alert.alert('Sign in required', 'Sign in before submitting a service request.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/sign-in') },
      ]);
      return;
    }
    if (!supabase) {
      Alert.alert('Backend unavailable', 'Connect Supabase before submitting a booking. No request was saved.');
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('request_booking', {
        p_service_id: service.id,
        p_problem_description: values.details,
        p_emirate: values.emirate,
        p_area: values.area,
        p_address: values.address,
        p_scheduled_date: values.scheduledDate,
        p_time_window: values.timeWindow,
      });
      if (error) throw error;
      setReference(String(data));
    } catch (error) {
      Alert.alert('Booking was not submitted', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (reference) {
    return (
      <Page>
        <Card style={styles.success}>
          <View style={styles.successIcon}><CircleCheckBig size={36} color={colors.teal} strokeWidth={1.8} /></View>
          <Heading subtitle={isDemoMode ? translate(language, 'requestSaved') : 'Your request has securely been saved.'} right={<Button title={translate(language, 'back')} variant="outline" onPress={() => router.back()} />}>
            {language === 'ar' ? 'تم استلام الطلب' : 'Request received'}
          </Heading>
          <Text style={styles.reference}>{language === 'ar' ? 'رقم الطلب' : 'Reference'}: {reference}</Text>
          <Text style={styles.copy}>{isDemoMode ? translate(language, 'demoBookingMessage') : 'We’ll update your booking status here when it is confirmed.'}</Text>
          <Button title={language === 'ar' ? 'عرض حجوزاتي' : 'View my bookings'} onPress={() => router.replace('/(tabs)/bookings')} />
        </Card>
      </Page>
    );
  }

  return (
    <Page style={styles.page}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Heading subtitle={language === 'ar' ? 'أخبرنا بما تحتاجه واختر موعداً مناسباً.' : 'Tell us what’s needed and choose a preferred appointment.'} right={<Button title={translate(language, 'back')} variant="outline" onPress={() => router.back()} />}>{language === 'ar' ? service.arabicTitle : service.title}</Heading>
          <Card style={styles.serviceCard}>
            <ServiceIcon serviceId={service.id} />
            <View style={styles.flex}>
              <Text style={[styles.serviceName, language === 'ar' && styles.rtl]}>{language === 'ar' ? service.arabicTitle : service.title}</Text>
              <Text style={[styles.price, language === 'ar' && styles.rtl]}>{t('startingPriceNote').replace('{price}', String(service.priceFrom))}</Text>
            </View>
          </Card>
          {isDemoMode ? <Notice>{translate(language, 'simulated')}</Notice> : null}
          {!isDemoMode && !session ? <Notice>Sign in is required to save a booking. You can complete the request after authentication.</Notice> : null}
          {!isDemoMode && !isBackendConfigured ? <Notice tone="error">Supabase is not configured. This form will not save a request.</Notice> : null}

          <Controller control={control} name="details" render={({ field: { onChange, value } }) => <Field label={t('describeIssue')} value={value} onChangeText={onChange} multiline numberOfLines={4} textAlignVertical="top" style={styles.textArea} placeholder={t('issuePlaceholder')} error={errors.details ? t('issueRequired') : undefined} />} />

          <Text style={[styles.label, language === 'ar' && styles.rtl]}>{t('serviceArea')}</Text>
          <View style={styles.options}>
            {(['Ajman', 'Sharjah'] as const).map((emirate) => (
              <View key={emirate} style={styles.optionButton}>
                <Button
                  title={language === 'ar' ? emirateLabels[emirate] : emirate}
                  variant={selectedEmirate === emirate ? 'secondary' : 'outline'}
                  selected={selectedEmirate === emirate}
                  onPress={() => {
                    setValue('emirate', emirate, { shouldDirty: true, shouldValidate: true });
                    setValue('area', '', { shouldDirty: true, shouldValidate: true });
                  }}
                />
              </View>
            ))}
          </View>
          <Text style={[styles.label, language === 'ar' && styles.rtl]}>{t('neighborhood')}</Text>
          <View style={styles.options}>
            {serviceAreas[selectedEmirate].map((area) => (
              <View key={area} style={styles.optionButton}>
                <Button
                  title={language === 'ar' ? areaLabels[area] ?? area : area}
                  variant={selectedArea === area ? 'secondary' : 'outline'}
                  selected={selectedArea === area}
                  onPress={() => setValue('area', area, { shouldDirty: true, shouldValidate: true })}
                />
              </View>
            ))}
          </View>
          {errors.area ? <Text style={styles.error}>{t('areaRequired')}</Text> : null}
          <Controller control={control} name="address" render={({ field: { onChange, value } }) => <Field label={t('addressLabel')} value={value} onChangeText={onChange} placeholder={t('addressPlaceholder')} multiline error={errors.address ? t('fullAddressRequired') : undefined} />} />

          <Text style={[styles.label, language === 'ar' && styles.rtl]}>{t('preferredDate')}</Text>
          <View style={styles.dateChoices}>
            {dateChoices.slice(0, 7).map((date) => (
              <View key={date} style={styles.dateButton}>
                <Button
                  title={new Intl.DateTimeFormat(language === 'ar' ? 'ar-AE' : 'en-AE', { timeZone: 'Asia/Dubai', day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00+04:00`))}
                  variant={selectedDate === date ? 'secondary' : 'outline'}
                  selected={selectedDate === date}
                  onPress={() => setValue('scheduledDate', date, { shouldDirty: true, shouldValidate: true })}
                />
              </View>
            ))}
          </View>
          <Text style={[styles.label, language === 'ar' && styles.rtl]}>{t('timeWindow')}</Text>
          <View style={styles.options}>
            {(['morning', 'afternoon', 'evening'] as const).map((time) => (
              <View key={time} style={styles.optionButton}>
                <Button
                  title={t(time)}
                  variant={selectedTime === time ? 'secondary' : 'outline'}
                  selected={selectedTime === time}
                  onPress={() => setValue('timeWindow', time, { shouldDirty: true, shouldValidate: true })}
                />
              </View>
            ))}
          </View>
          <Card style={styles.priceCard}><Text style={[styles.priceLabel, language === 'ar' && styles.rtl]}>{t('estimatedCallout')}</Text><Text style={[styles.priceValue, language === 'ar' && styles.rtl]}>{language === 'ar' ? 'د.إ' : 'AED'} {service.priceFrom}</Text><Text style={[styles.note, language === 'ar' && styles.rtl]}>{t('finalChargeNote')}</Text></Card>
          <Button title={language === 'ar' ? 'تأكيد طلب الخدمة' : 'Submit service request'} onPress={handleSubmit(submit)} loading={busy} disabled={!isDemoMode && !isBackendConfigured} />
          <Chip>{language === 'ar' ? 'عنوانك للاستخدام التجريبي فقط' : 'Demo address stays on this phone'}</Chip>
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 0, paddingTop: 0 },
  flex: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl },
  serviceCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  serviceName: { color: colors.navy, fontSize: 17, fontWeight: '800' },
  price: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  label: { color: colors.ink, fontWeight: '700', fontSize: 14 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionButton: { flexGrow: 1, minWidth: '30%' },
  dateChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateButton: { flexGrow: 1, minWidth: '23%' },
  error: { color: colors.red, fontSize: 13 },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  textArea: { minHeight: 105, paddingTop: 12 },
  priceCard: { backgroundColor: colors.tealLight, borderColor: colors.tealLight },
  priceLabel: { color: colors.ink, fontWeight: '600', fontSize: 13 },
  priceValue: { color: colors.teal, fontSize: 25, fontWeight: '900' },
  note: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  success: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  successIcon: { backgroundColor: colors.tealLight, width: 70, height: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 24, marginBottom: spacing.md },
  reference: { fontWeight: '800', color: colors.teal, fontSize: 16 },
  copy: { color: colors.muted, textAlign: 'center', lineHeight: 21 },
});
