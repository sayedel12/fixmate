import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, CircleUserRound, MapPin } from 'lucide-react-native';
import { BrandMark } from '../../components/brand-mark';
import { Entrance } from '../../components/entrance';
import { ServiceIcon } from '../../components/service-icon';
import { Button, Card, Chip, Field, Heading, Notice, Page } from '../../components/ui';
import { getPreviewServices, useServices } from '../../hooks/use-services';
import { colors, radii, spacing } from '../../lib/theme';
import { translate, useLanguage } from '../../lib/i18n';
import { isBackendConfigured } from '../../lib/supabase';
import { useAuth } from '../../providers/auth-provider';
import { isDemoMode } from '../../lib/mode';
import { useState } from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const language = useLanguage((state) => state.language);
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const catalog = useServices();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const featured = (catalog.data ?? getPreviewServices()).slice(0, 4);

  return (
    <Page style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Entrance>
          <View style={[styles.topline, language === 'ar' && styles.rowReverse]}>
            <View style={[styles.brand, language === 'ar' && styles.rowReverse]}>
              <BrandMark size={48} />
              <View>
                <Text style={styles.brandName}>{t('brand')}</Text>
                <Text style={styles.brandCaption}>{language === 'ar' ? 'خدمات منزلية موثوقة' : 'Trusted home services'}</Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={t('profile')} style={styles.avatar} onPress={() => router.push('/(tabs)/profile')}>
              <CircleUserRound size={22} color={colors.teal} strokeWidth={1.8} />
            </Pressable>
          </View>
          <View style={[styles.greetingRow, language === 'ar' && styles.rowReverse]}>
            <View style={styles.flex}>
            <Text style={styles.greeting}>{t('hello')}{session?.user ? `, ${session.user.user_metadata.display_name ?? 'there'}` : ''}</Text>
            <Text style={styles.tagline}>{t('tagline')}</Text>
          </View>
          </View>
        </Entrance>
        <View style={[styles.locationRow, language === 'ar' && styles.rowReverse]}>
          <MapPin size={16} color={colors.teal} strokeWidth={2.2} />
          <Text style={[styles.location, language === 'ar' && styles.rtl]}>{t('serviceAreas')}</Text>
          {isDemoMode ? <Chip>{t('demoMode')}</Chip> : null}
        </View>
        <Field
          label={t('serviceSearch')}
          value={search}
          onChangeText={setSearch}
          placeholder={t('searchExample')}
          returnKeyType="search"
          onSubmitEditing={() => router.push({ pathname: '/services', params: { q: search } })}
        />
        {!isDemoMode && !isBackendConfigured ? <Notice>Supabase is not configured.</Notice> : null}
        {catalog.isError ? <Notice tone="error">Unable to load services: {catalog.error.message}</Notice> : null}

        <Entrance delay={80}>
          <View style={styles.hero}>
            <View style={styles.heroGlow} />
            <View style={[styles.heroBadge, language === 'ar' && styles.rowReverse]}>
              <BrandMark size={28} dark />
              <Text style={styles.heroBadgeText}>{language === 'ar' ? 'عناية متكاملة بمنزلك' : 'A better way to care for home'}</Text>
            </View>
            <Text style={[styles.heroTitle, language === 'ar' && styles.rtl]}>
              {language === 'ar' ? 'بيتك بخير،\nونحن نهتم بالتفاصيل.' : 'Home care,\nhandled with care.'}
            </Text>
            <Text style={[styles.heroCopy, language === 'ar' && styles.rtl]}>
              {language === 'ar' ? 'احجز خدمات الصيانة المنزلية في عجمان والشارقة بكل سهولة.' : 'Book trusted maintenance services across Ajman & Sharjah.'}
            </Text>
            <Button
              title={t('bookNow')}
              onPress={() => router.push('/services')}
              icon={language === 'ar' ? <ArrowLeft size={17} color={colors.white} /> : <ArrowRight size={17} color={colors.white} />}
            />
            <View style={styles.heroStamp}><BrandMark size={118} dark /></View>
          </View>
        </Entrance>

        <View style={[styles.sectionHead, language === 'ar' && styles.rowReverse]}>
          <Heading>{t('popular')}</Heading>
          <Pressable style={[styles.seeAll, language === 'ar' && styles.rowReverse]} onPress={() => router.push('/services')}>
            <Text style={styles.seeAllText}>{t('seeAll')}</Text>
            {language === 'ar' ? <ChevronLeft size={15} color={colors.teal} /> : <ChevronRight size={15} color={colors.teal} />}
          </Pressable>
        </View>
        <View style={styles.grid}>
          {featured.map((item, index) => (
            <Entrance key={item.id} delay={120 + index * 55} style={styles.serviceCell}>
              <Card style={styles.serviceCard} onPress={() => router.push({ pathname: '/book', params: { serviceId: item.id } })}>
                <ServiceIcon serviceId={item.id} size={24} />
                <Text style={[styles.serviceName, language === 'ar' && styles.rtl]}>{language === 'ar' ? item.arabicTitle : item.title}</Text>
                <Text style={[styles.price, language === 'ar' && styles.rtl]}>
                  {language === 'ar' ? `ابتداءً من ${item.priceFrom} د.إ` : `From AED ${item.priceFrom}`}
                </Text>
              </Card>
            </Entrance>
          ))}
        </View>
        <Entrance delay={350}>
          <Card style={styles.assurance}>
            <View style={[styles.assuranceRow, language === 'ar' && styles.rowReverse]}>
              <View style={styles.assuranceIcon}><ArrowRight size={16} color={colors.teal} /></View>
              <Text style={[styles.assuranceText, language === 'ar' && styles.rtl]}>{language === 'ar' ? 'أسعار واضحة قبل التأكيد' : 'Clear pricing before you confirm'}</Text>
            </View>
            <View style={[styles.assuranceRow, language === 'ar' && styles.rowReverse]}>
              <View style={styles.assuranceIcon}><ArrowLeft size={16} color={colors.teal} /></View>
              <Text style={[styles.assuranceText, language === 'ar' && styles.rtl]}>{language === 'ar' ? 'تابع حالة طلبك خطوة بخطوة' : 'Follow your service request step by step'}</Text>
            </View>
          </Card>
        </Entrance>
        <View style={styles.presentationNote}>
          <Text style={styles.presentationNoteText}>
            {language === 'ar' ? 'تجربة توضيحية — لا يتم إرسال طلبات حقيقية.' : 'Presentation demo — no real service request is sent.'}
          </Text>
          <ChevronRight size={14} color={colors.muted} />
        </View>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 0, paddingTop: 0 },
  content: { padding: spacing.lg, paddingTop: spacing.lg, gap: spacing.lg },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandName: { fontSize: 18, fontWeight: '900', color: colors.navy },
  brandCaption: { color: colors.muted, fontSize: 11, marginTop: 1 },
  avatar: { width: 46, height: 46, borderRadius: 17, backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  greetingRow: { flexDirection: 'row' },
  flex: { flex: 1 },
  greeting: { fontSize: 15, fontWeight: '700', color: colors.muted },
  tagline: { fontSize: 27, lineHeight: 35, fontWeight: '900', color: colors.navy, marginTop: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  location: { color: colors.muted, fontWeight: '600', fontSize: 13, flex: 1 },
  hero: { position: 'relative', overflow: 'hidden', backgroundColor: colors.navy, padding: 22, borderRadius: radii.xl, gap: 12, minHeight: 290 },
  heroGlow: { position: 'absolute', top: -75, right: -44, width: 210, height: 210, borderRadius: 105, backgroundColor: '#1C4960', opacity: 0.65 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 9, alignSelf: 'flex-start', maxWidth: '78%' },
  heroBadgeText: { color: colors.mint, fontWeight: '800', fontSize: 11 },
  heroTitle: { color: colors.white, fontWeight: '900', fontSize: 31, lineHeight: 39, marginTop: 3 },
  heroCopy: { color: '#D5E1EA', fontSize: 14, lineHeight: 22, maxWidth: '85%', marginBottom: 3 },
  heroStamp: { position: 'absolute', right: -18, bottom: 18, opacity: 0.11 },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  rowReverse: { flexDirection: 'row-reverse' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText: { color: colors.teal, fontWeight: '800', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  serviceCell: { flexBasis: '47%', flexGrow: 1, minWidth: 0 },
  serviceCard: { minHeight: 150, justifyContent: 'space-between', borderRadius: radii.lg, padding: 15, shadowColor: colors.navy, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  serviceName: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  price: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  assurance: { gap: 14, borderRadius: radii.lg },
  assuranceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  assuranceIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.tealLight, alignItems: 'center', justifyContent: 'center' },
  assuranceText: { color: colors.ink, fontWeight: '600', fontSize: 13 },
  presentationNote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  presentationNoteText: { fontSize: 11, color: colors.muted },
});
