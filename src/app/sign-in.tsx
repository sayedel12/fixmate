import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, Heading, Notice, Page } from '../components/ui';
import { isBackendConfigured, supabase } from '../lib/supabase';
import { colors, spacing } from '../lib/theme';
import { isValidUaeMobile } from '../lib/uae-time';
import { DEMO_USERS, useDemoStore } from '../lib/demo';
import { isDemoMode } from '../lib/mode';
import { useLanguage, translate } from '../lib/i18n';
import type { UserRole } from '../providers/auth-provider';

const schema = z.object({
  name: z.string().optional(),
  email: z.email('Enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Use at least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function SignInScreen() {
  const language = useLanguage((state) => state.language);
  const selectDemoRole = useDemoStore((state) => state.selectRole);
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'info' | 'error'>('info');
  const { control, handleSubmit, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', password: '' },
  });
  const showMessage = (text: string, tone: 'info' | 'error' = 'info') => {
    setMessage(text);
    setMessageTone(tone);
  };

  const submit = async (values: FormValues) => {
    if (mode === 'sign-up' && (!values.name || values.name.trim().length < 2)) {
      showMessage('Enter a name with at least 2 characters.', 'error');
      return;
    }
    if (mode === 'sign-up' && values.phone && !isValidUaeMobile(values.phone)) {
      showMessage('Use a UAE mobile number, for example +971501234567.', 'error');
      return;
    }
    if (!supabase) {
      showMessage('Authentication is unavailable until Supabase is configured. Add the EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY values.', 'error');
      return;
    }
    setBusy(true);
    showMessage('');
    try {
      if (mode === 'sign-up') {
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: { display_name: values.name, phone: values.phone },
          },
        });
        if (error) throw error;
        if (!data.session) {
          showMessage('Account created. Check your email to verify your address, then sign in.');
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
        if (error) throw error;
      }
      router.back();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Authentication failed. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!supabase) {
      showMessage('Password recovery is unavailable until Supabase is configured.', 'error');
      return;
    }
    const email = getValues('email');
    if (!z.email().safeParse(email).success) {
      showMessage('Enter your account email above, then request a reset link.', 'error');
      return;
    }
    setBusy(true);
    showMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      showMessage('If an account exists, a password reset email has been sent.');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Unable to request a password reset. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggle = () => {
    showMessage('');
    setMode((current) => current === 'sign-in' ? 'sign-up' : 'sign-in');
  };

  if (isDemoMode) {
    const labels: Record<UserRole, string> = {
      customer: translate(language, 'demoCustomer'),
      technician: translate(language, 'demoTechnician'),
      landlord: translate(language, 'demoLandlord'),
      admin: translate(language, 'demoAdmin'),
    };
    return (
      <Page>
        <ScrollView contentContainerStyle={styles.content}>
          <Button title={translate(language, 'back')} variant="outline" onPress={() => router.back()} />
          <Text style={styles.brand}>{translate(language, 'brand')} <Text style={styles.uae}>UAE · DEMO</Text></Text>
          <Heading subtitle={translate(language, 'roleHint')}>{translate(language, 'rolePicker')}</Heading>
          <Notice>{translate(language, 'simulated')}</Notice>
          {(Object.keys(DEMO_USERS) as UserRole[]).map((role) => (
            <Button
              key={role}
              title={`${labels[role]} · ${DEMO_USERS[role].name}\n${DEMO_USERS[role].email}`}
              variant="outline"
              onPress={() => {
                selectDemoRole(role);
                router.back();
              }}
            />
          ))}
          <Text style={styles.terms}>{language === 'ar' ? 'هذه هويات خيالية للعرض. لا تُستخدم كلمات مرور أو حسابات حقيقية.' : 'These are fictional demo identities. No passwords or real accounts are used.'}</Text>
        </ScrollView>
      </Page>
    );
  }

  return (
    <Page>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>DABBETHA <Text style={styles.uae}>UAE</Text></Text>
          <Heading subtitle={mode === 'sign-in' ? translate(language, 'signInPrompt') : translate(language, 'signUpPrompt')}>
            {mode === 'sign-in' ? translate(language, 'welcomeBack') : translate(language, 'createYourAccount')}
          </Heading>
          {!isBackendConfigured ? <Notice tone="error">Backend not configured. Browsing works, but authentication is not simulated.</Notice> : null}
          {message ? <Notice tone={messageTone}>{message}</Notice> : null}
          {mode === 'sign-up' ? (
            <>
              <Controller control={control} name="name" render={({ field: { onChange, value } }) => <Field label={translate(language, 'nameLabel')} value={value} onChangeText={onChange} autoCapitalize="words" error={errors.name?.message} />} />
              <Controller control={control} name="phone" render={({ field: { onChange, value } }) => <Field label={translate(language, 'phoneLabel')} value={value} onChangeText={onChange} placeholder="+971501234567" keyboardType="phone-pad" error={errors.phone?.message} />} />
            </>
          ) : null}
          <Controller control={control} name="email" render={({ field: { onChange, value } }) => <Field label={translate(language, 'emailLabel')} value={value} onChangeText={onChange} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errors.email?.message} />} />
          <Controller control={control} name="password" render={({ field: { onChange, value } }) => <Field label={translate(language, 'passwordLabel')} value={value} onChangeText={onChange} secureTextEntry autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} error={errors.password?.message} />} />
          <Button title={mode === 'sign-in' ? 'Sign in' : 'Create account'} onPress={handleSubmit(submit)} loading={busy} disabled={!isBackendConfigured} />
          {mode === 'sign-in' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy, busy }}
              disabled={busy}
              onPress={() => void resetPassword()}
              style={({ pressed }) => [styles.linkButton, pressed && !busy && styles.linkPressed]}
            >
              <Text style={styles.link}>{translate(language, 'forgotPassword')}</Text>
            </Pressable>
          ) : null}
          <View style={styles.switchRow}>
            <Text style={styles.switchCopy}>{mode === 'sign-in' ? translate(language, 'noAccount') : translate(language, 'accountExists')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy, busy }}
              disabled={busy}
              onPress={toggle}
              style={({ pressed }) => [styles.linkButton, pressed && !busy && styles.linkPressed]}
            >
              <Text style={styles.link}>{mode === 'sign-in' ? translate(language, 'createAccount') : translate(language, 'signIn')}</Text>
            </Pressable>
          </View>
          <Text style={styles.terms}>Your account role is assigned securely by the service. Registration cannot grant technician or administrator access.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, gap: spacing.md, justifyContent: 'center', paddingBottom: spacing.xl },
  brand: { color: colors.navy, fontSize: 17, fontWeight: '900', letterSpacing: 1.3 },
  uae: { color: colors.teal },
  linkButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  link: { color: colors.tealDark, fontWeight: '800', textAlign: 'center' },
  linkPressed: { opacity: 0.65 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchCopy: { color: colors.muted },
  terms: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 17, marginTop: 8 },
});
