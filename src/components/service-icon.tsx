import { StyleSheet, View } from 'react-native';
import {
  Flame,
  PaintRoller,
  Refrigerator,
  Snowflake,
  Sparkles,
  Zap,
  Droplets,
  Wrench,
} from 'lucide-react-native';
import { colors } from '../lib/theme';

const icons = {
  '10000000-0000-4000-8000-000000000001': Snowflake,
  '10000000-0000-4000-8000-000000000002': Droplets,
  '10000000-0000-4000-8000-000000000003': Zap,
  '10000000-0000-4000-8000-000000000004': Wrench,
  '10000000-0000-4000-8000-000000000005': Refrigerator,
  '10000000-0000-4000-8000-000000000006': PaintRoller,
  '10000000-0000-4000-8000-000000000007': Sparkles,
  '10000000-0000-4000-8000-000000000008': Flame,
};

export function ServiceIcon({ serviceId, size = 26, compact = false }: { serviceId: string; size?: number; compact?: boolean }) {
  const Icon = icons[serviceId as keyof typeof icons] ?? Wrench;
  const color = serviceId.endsWith('000000000003') ? colors.amber : colors.teal;

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Icon size={size} color={color} strokeWidth={1.8} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tealLight },
  compact: { width: 44, height: 44, borderRadius: 15 },
});
