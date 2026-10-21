import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../lib/theme';
import { useLanguage } from '../lib/i18n';

export function Page({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const language = useLanguage((state) => state.language);
  return (
    <View style={[styles.page, { direction: language === 'ar' ? 'rtl' : 'ltr' }, style]}>
      {children}
    </View>
  );
}

export function Heading({ children, subtitle, right }: { children: string; subtitle?: string; right?: ReactNode }) {
  const language = useLanguage((state) => state.language);
  return (
    <View style={[styles.headingRow, language === 'ar' && styles.rowReverse]}>
      <View style={styles.flex}>
        <Text style={[styles.heading, language === 'ar' && styles.arabicText]}>{children}</Text>
        {subtitle ? <Text style={[styles.subtitle, language === 'ar' && styles.arabicText]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style, onPress }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; onPress?: () => void }>) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, style, pressed && styles.cardPressed]}
    >
      {children}
    </Pressable>
  );
}

export function Button({ title, onPress, variant = 'primary', disabled = false, loading = false, icon, selected = false }: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  selected?: boolean;
}) {
  const language = useLanguage((state) => state.language);
  const isUnavailable = disabled || loading;
  const inverse = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isUnavailable, busy: loading, selected }}
      onPress={onPress}
      disabled={isUnavailable}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'outline' && styles.outlineButton,
        isUnavailable && styles.disabled,
        pressed && !isUnavailable && styles.pressed,
      ]}
    >
      {loading ? <ActivityIndicator color={inverse ? colors.white : colors.teal} /> : (
          <View style={styles.buttonContent}>
            {language === 'ar' && icon}
            <Text style={[styles.buttonText, inverse && styles.primaryButtonText]}>{title}</Text>
            {language !== 'ar' && icon}
          </View>
        )}
    </Pressable>
  );
}

export function Field({ label, error, ...inputProps }: TextInputProps & { label: string; error?: string }) {
  const language = useLanguage((state) => state.language);
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, language === 'ar' && styles.arabicText]}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={inputProps.accessibilityLabel ?? label}
        accessibilityHint={error ?? inputProps.accessibilityHint}
        placeholderTextColor={colors.muted}
        style={[styles.input, language === 'ar' && styles.arabicText, inputProps.style]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function Notice({ children, tone = 'info' }: PropsWithChildren<{ tone?: 'info' | 'error' | 'success' }>) {
  return (
    <View style={[styles.notice, tone === 'error' && styles.errorNotice, tone === 'success' && styles.successNotice]}>
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

export function Chip({ children }: PropsWithChildren) {
  return <View style={styles.chip}><Text style={styles.chipText}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.lg },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowReverse: { flexDirection: 'row-reverse' },
  flex: { flex: 1 },
  heading: { color: colors.navy, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4, lineHeight: 20 },
  arabicText: { textAlign: 'right', writingDirection: 'rtl' },
  card: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, gap: spacing.sm, shadowColor: colors.navy, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.035, shadowRadius: 8, elevation: 1 },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  button: { minHeight: 52, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  primaryButton: { backgroundColor: colors.teal, shadowColor: colors.navy, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.14, shadowRadius: 10, elevation: 2 },
  secondaryButton: { backgroundColor: colors.tealLight, borderColor: colors.tealLight, borderWidth: 1 },
  outlineButton: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  buttonText: { color: colors.tealDark, fontSize: 15, fontWeight: '800' },
  primaryButtonText: { color: colors.white },
  disabled: { opacity: 0.5, elevation: 0, shadowOpacity: 0 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  fieldWrap: { gap: 7 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.ink },
  input: { minHeight: 52, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 14, color: colors.ink, fontSize: 15 },
  errorText: { color: colors.red, fontSize: 13 },
  notice: { backgroundColor: '#EAF2FA', borderRadius: 14, padding: 14 },
  errorNotice: { backgroundColor: colors.redLight },
  successNotice: { backgroundColor: colors.tealLight },
  noticeText: { color: colors.ink, lineHeight: 21, fontSize: 14 },
  chip: { borderRadius: 20, backgroundColor: colors.tealLight, paddingVertical: 7, paddingHorizontal: 11, alignSelf: 'flex-start' },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.tealDark },
});
