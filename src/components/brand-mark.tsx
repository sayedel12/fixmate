import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../lib/theme';

export function BrandMark({ size = 48, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.32 }, dark && styles.dark]}>
      <Svg width={size * 0.66} height={size * 0.66} viewBox="0 0 48 48" fill="none">
        <Path d="M5 22 24 6l19 16" stroke={dark ? colors.white : colors.teal} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M10 20v22h28V20" stroke={dark ? colors.white : colors.teal} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="m18 30 4.5 4.5L31 25" stroke={dark ? colors.mint : colors.navy} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tealLight },
  dark: { backgroundColor: colors.teal },
});
