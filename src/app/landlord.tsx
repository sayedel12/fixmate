import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Chip, Heading, Notice, Page } from '../components/ui';
import { RoleGuard } from '../components/role-guard';
import { supabase } from '../lib/supabase';
import { colors, spacing } from '../lib/theme';
import { DEMO_PROPERTIES, useDemoStore } from '../lib/demo';
import { isDemoMode } from '../lib/mode';
import { translate, translateStatus, useLanguage } from '../lib/i18n';

export default function LandlordScreen() {
  const language = useLanguage((state) => state.language);
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const demoBookings = useDemoStore((state) => state.bookings);
  const decideQuotation = useDemoStore((state) => state.decideQuotation);
  const properties = useQuery({
    queryKey: ['managed-properties'],
    enabled: !isDemoMode,
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase.from('properties').select('id, name, emirate, area, address').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const visibleProperties = isDemoMode ? DEMO_PROPERTIES : properties.data;
  const approvalRequests = isDemoMode ? demoBookings.filter((booking) =>
    booking.quotePending && DEMO_PROPERTIES.some((property) => property.emirate === booking.emirate && property.area === booking.area),
  ) : [];

  const decide = (bookingId: string, approve: boolean) => {
    if (isDemoMode) {
      decideQuotation(bookingId, approve);
      Alert.alert(
        t('demoQuoteUpdated'),
        t('demoChoiceSaved'),
      );
      return;
    }
  };

  return (
    <RoleGuard role="landlord">
      <Page>
        <Heading subtitle={language === 'ar' ? 'عقاراتك وسجل الصيانة.' : 'Your properties and maintenance history.'}>{t('demoLandlord')}</Heading>
        {isDemoMode ? <Notice>{language === 'ar' ? 'بيانات خيالية للعرض فقط.' : 'Fictional properties for demonstration only.'}</Notice> : null}
        {!isDemoMode && properties.isLoading ? <ActivityIndicator color={colors.teal} /> : null}
        {!isDemoMode && properties.isError ? <Notice tone="error">{properties.error.message}</Notice> : null}
        <ScrollView contentContainerStyle={styles.list}>
          {visibleProperties?.map((property) => (
            <Card key={property.id}>
              <Text style={styles.title}>{property.name}</Text>
              <Text style={styles.info}>{property.area}, {property.emirate}</Text>
              <Text style={styles.info}>{property.address}</Text>
              {'tenant' in property ? <Text style={styles.info}>{language === 'ar' ? 'المقيم' : 'Resident'}: {String(property.tenant)}</Text> : null}
              {!isDemoMode ? <Notice>Property access is limited by your verified property relationship.</Notice> : null}
            </Card>
          ))}
          {approvalRequests.map((booking) => (
            <Card key={booking.id}>
              <Chip>{translateStatus(language, booking.status)}</Chip>
              <Text style={styles.title}>{language === 'ar' ? booking.serviceNameAr : booking.serviceName}</Text>
              <Text style={styles.info}>{booking.area}, {booking.emirate} · AED {booking.priceAed}</Text>
              <Text style={styles.info}>{booking.details}</Text>
              <Notice>{t('demoQuoteNotice')}</Notice>
              <View style={styles.actions}>
                <Button title={t('approve')} onPress={() => decide(booking.id, true)} />
                <Button title={t('reject')} variant="outline" onPress={() => decide(booking.id, false)} />
              </View>
            </Card>
          ))}
          {!isDemoMode && !properties.isLoading && !properties.isError && !properties.data?.length ? <Notice>No properties are linked to your account yet. An authorized property manager can add you.</Notice> : null}
        </ScrollView>
      </Page>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  title: { color: colors.navy, fontSize: 17, fontWeight: '800' },
  info: { color: colors.muted, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10 },
});
