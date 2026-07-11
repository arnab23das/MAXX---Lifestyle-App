import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
  distance?: number;
}

/** Gentle entrance animation for lists/cards — staggers by `index` so items settle in one after another instead of popping in all at once. */
export function FadeSlideIn({ children, index = 0, style, distance = 14 }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 320,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });

  // Flatten first: a caller-supplied `transform` array in `style` would
  // otherwise be silently overwritten by ours when both set the same key.
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const { transform: incomingTransform, ...restStyle } = flatStyle as ViewStyle;

  const transform = [...((incomingTransform as any[]) ?? []), { translateY }];

  return (
    <Animated.View style={[restStyle, { opacity: progress, transform } as any]}>{children}</Animated.View>
  );
}
