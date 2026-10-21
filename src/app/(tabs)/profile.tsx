import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BrandMark } from '../../components/brand-mark';
import { Button, Card, Heading, Notice, Page } from '../../components/ui';
import { isBackendConfigured, supabase } from '../../lib/supabase';
import { useLanguage, translate } from '../../lib/i18n';
import { useAuth } from '../../providers/auth-provider';
import { colors, spacing } from '../../lib/theme';
import { DEMO_USERS, useDemoStore } from '../../lib/demo';
import { isDemoMode } from '../../lib/mode';

export default function ProfileScreen() {
  const language = useLanguage((state) => state.language);
  const setLanguage = useLanguage((state) => state.setLanguage);
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const { session, role } = useAuth();
  const selectDemoRole = useDemoStore((state) => state.selectRole);
  const resetDemo = useDemoStore((state) => state.resetDemo);
  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Unable to sign out', error.message);
  };
  const changeLanguage = async (nextLanguage: 'en' | 'ar') => {
    try {
      await setLanguage(nextLanguage);
    } catch (error) {
      Alert.alert('Unable to save language', error instanceof Error ? error.message : 'Please try again.');
    }
  };
  const demoRoleLabels = {
    customer: t('demoCustomer'),
    technician: t('demoTechnician'),
    landlord: t('demoLandlord'),
    admin: t('demoAdmin'),
  } as const;

  return (
    <Page>
      <Heading subtitle={language === 'ar' ? 'إعدادات الحساب والتفضيلات' : 'Account settings and preferences'}>
        {t('profile')}
      </Heading>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <BrandMark size={64} />
          <Text style={styles.name}>{session?.user.user_metadata.display_name ?? (session ? session.user.email : 'Welcome to Dabbetha')}</Text>
          {session ? <Text style={styles.detail}>{role ? demoRoleLabels[role] : 'Verifying account…'}</Text> : <Text style={styles.detail}>{language === 'ar' ? 'سجل الدخول لحفظ بياناتك' : 'Sign in to save your details'}</Text>}
        </Card>
        <Card>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <View style={styles.languageRow}>
            <Button title={t('english')} variant={language === 'en' ? 'secondary' : 'outline'} selected={language === 'en'} onPress={() => void changeLanguage('en')} />
            <Button title={t('arabic')} variant={language === 'ar' ? 'secondary' : 'outline'} selected={language === 'ar'} onPress={() => void changeLanguage('ar')} />
          </View>
        </Card>
        {role === 'technician' ? <Button title={language === 'ar' ? 'لوحة الفني' : 'Technician workspace'} variant="outline" onPress={() => router.push('/technician')} /> : null}
        {role === 'landlord' ? <Button title={language === 'ar' ? 'إدارة العقارات' : 'Property manager'} variant="outline" onPress={() => router.push('/landlord')} /> : null}
        {role === 'admin' ? <Button title={language === 'ar' ? 'الإدارة' : 'Admin tools'} variant="outline" onPress={() => router.push('/admin')} /> : null}
        {isDemoMode ? (
          <>
            <Card>
              <Text style={styles.sectionTitle}>{t('rolePicker')}</Text>
              <Text style={styles.detail}>{t('roleHint')}</Text>
              {(Object.keys(DEMO_USERS) as (keyof typeof DEMO_USERS)[]).map((demoRole) => (
                <Button
                  key={demoRole}
                  title={`${demoRoleLabels[demoRole]}${role === demoRole ? ' ✓' : ''} · ${DEMO_USERS[demoRole].name}`}
                  variant={role === demoRole ? 'secondary' : 'outline'}
                  selected={role === demoRole}
                  onPress={() => selectDemoRole(demoRole)}
                />
              ))}
            </Card>
            <Notice>{t('simulated')}</Notice>
            <Button title={t('demoReset')} variant="outline" onPress={() => resetDemo()} />
          </>
        ) : (
          <>
            {!isBackendConfigured ? <Notice>Account and booking features need Supabase configuration.</Notice> : null}
            {session ? <Button title={t('signOut')} variant="outline" onPress={() => void signOut()} /> : <Button title={t('signIn')} onPress={() => router.push('/sign-in')} />}
          </>
        )}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  profileCard: { alignItems: 'center', paddingVertical: spacing.lg },
  avatar: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.tealLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.teal, fontSize: 22, fontWeight: '900' },
  name: { color: colors.navy, fontSize: 18, fontWeight: '800', marginTop: 5 },
  detail: { color: colors.muted, fontSize: 13 },
  sectionTitle: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  languageRow: { flexDirection: 'row', gap: 10 },
});
