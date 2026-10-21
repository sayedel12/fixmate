import { useEffect, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, type ViewStyle } from 'react-native';

export function Entrance({ children, delay = 0, style }: PropsWithChildren<{ delay?: number; style?: ViewStyle }>) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    const play = (reduceMotion: boolean) => {
      if (!active) return;
      if (reduceMotion) {
        progress.setValue(1);
        return;
      }
      animation = Animated.timing(progress, {
        toValue: 1,
        delay,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
        isInteraction: false,
      });
      animation.start();
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(play).catch(() => play(false));
    return () => {
      active = false;
      animation?.stop();
    };
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
