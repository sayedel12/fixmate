import { Tabs } from 'expo-router';
import { CalendarDays, House, Settings2, Wrench } from 'lucide-react-native';
import { colors } from '../../lib/theme';
import { useLanguage, translate } from '../../lib/i18n';

const icons = {
  index: House,
  services: Wrench,
  bookings: CalendarDays,
  profile: Settings2,
};

export default function TabLayout() {
  const language = useLanguage((state) => state.language);
  const screenNames: ('index' | 'services' | 'bookings' | 'profile')[] = language === 'ar'
    ? ['profile', 'bookings', 'services', 'index']
    : ['index', 'services', 'bookings', 'profile'];
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 82,
          paddingTop: 8,
          paddingBottom: 18,
          borderTopColor: colors.border,
          backgroundColor: colors.white,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, focused }) => {
          const Icon = icons[route.name as keyof typeof icons] ?? House;
          return <Icon size={21} color={color} strokeWidth={focused ? 2.4 : 1.8} />;
        },
      })}
    >
      {screenNames.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ tabBarLabel: translate(language, name === 'index' ? 'home' : name) }}
        />
      ))}
    </Tabs>
  );
}
