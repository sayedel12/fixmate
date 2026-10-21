import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Entrance } from '../../components/entrance';
import { ServiceIcon } from '../../components/service-icon';
import { Card, Field, Heading, Page, Notice } from '../../components/ui';
import { getPreviewServices, useServices } from '../../hooks/use-services';
import { colors, spacing } from '../../lib/theme';
import { translate, useLanguage } from '../../lib/i18n';
import { isBackendConfigured } from '../../lib/supabase';
import { isDemoMode } from '../../lib/mode';

export default function ServicesScreen() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const language = useLanguage((state) => state.language);
  const [search, setSearch] = useState(q ?? '');
  const catalog = useServices();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const list = catalog.data ?? getPreviewServices();
  const results = useMemo(() => list.filter((service) =>
    `${service.title} ${service.arabicTitle}`.toLowerCase().includes(search.toLowerCase()),
  ), [list, search]);

  return (
    <Page>
      <Heading subtitle={t('serviceSubtitle')}>
        {t('services')}
      </Heading>
      <Field label={t('serviceSearch')} value={search} onChangeText={setSearch} placeholder={t('searchExample')} />
      {!isDemoMode && !isBackendConfigured ? <Notice>Preview catalog · live services require Supabase setup.</Notice> : null}
      {catalog.isError ? <Notice tone="error">Unable to load live services: {catalog.error.message}</Notice> : null}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {results.map((service, index) => (
          <Entrance key={service.id} delay={Math.min(index * 45, 270)}>
            <Card style={[styles.item, language === 'ar' ? styles.rtlRow : undefined]} onPress={() => router.push({ pathname: '/book', params: { serviceId: service.id } })}>
              <ServiceIcon serviceId={service.id} />
              <View style={styles.copy}>
                <Text style={[styles.title, language === 'ar' && styles.rtl]}>{language === 'ar' ? service.arabicTitle : service.title}</Text>
                <Text style={[styles.description, language === 'ar' && styles.rtl]}>{language === 'ar' ? t('professionalService') : service.description}</Text>
                <Text style={[styles.price, language === 'ar' && styles.rtl]}>
                  {language === 'ar' ? `ابتداءً من ${service.priceFrom} د.إ` : `From AED ${service.priceFrom}`}
                </Text>
              </View>
              {language === 'ar' ? <ChevronLeft size={18} color={colors.muted} /> : <ChevronRight size={18} color={colors.muted} />}
            </Card>
          </Entrance>
        ))}
        {results.length === 0 ? <Text style={styles.empty}>{t('noSearchResults')}</Text> : null}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, paddingBottom: spacing.xl },
  item: { minHeight: 106, flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 22, gap: 14 },
  rtlRow: { flexDirection: 'row-reverse' },
  copy: { flex: 1, gap: 3 },
  title: { color: colors.navy, fontWeight: '800', fontSize: 17 },
  description: { color: colors.muted, fontSize: 13 },
  price: { color: colors.teal, fontSize: 13, fontWeight: '700', marginTop: 3 },
  empty: { color: colors.muted, textAlign: 'center', padding: spacing.lg },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
});
