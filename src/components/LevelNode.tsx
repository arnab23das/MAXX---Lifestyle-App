import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, LockSimple, BookOpen, Wind, NotePencil } from 'phosphor-react-native';
import { useTheme } from '@/theme';
import { LevelType } from '@/types/content';

export type LevelNodeStatus = 'locked' | 'unlocked' | 'completed';

interface Props {
  type: LevelType;
  title: string;
  status: LevelNodeStatus;
  onPress: () => void;
  isCurrent?: boolean;
}

const TYPE_META: Record<LevelType, { shape: 'circle' | 'diamond' | 'roundedSquare'; label: string; Icon: typeof Wind }> = {
  lesson: { shape: 'circle', label: 'Lesson', Icon: BookOpen },
  exercise: { shape: 'diamond', label: 'Exercise', Icon: Wind },
  documentation: { shape: 'roundedSquare', label: 'Reflect', Icon: NotePencil },
};

const NODE_SIZE = 64;
const CURRENT_SIZE = 70;

function colorsFor(theme: ReturnType<typeof useTheme>, type: LevelType, status: LevelNodeStatus) {
  if (status === 'locked') {
    return { bg: theme.colors.lockedSoft, lip: theme.colors.lockedLip, fg: theme.colors.locked };
  }
  const map = {
    lesson: theme.colors.lesson,
    exercise: theme.colors.exercise,
    documentation: theme.colors.documentation,
  } as const;
  return { bg: map[type], lip: theme.colors.primaryLip, fg: theme.colors.onPrimary };
}

/** Pulsing ring drawn behind the "current" node — see reference `pulseRing` animation. */
function PulseRing({ size, color }: { size: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

/** Gentle up-and-down bob for the current node, echoing the reference's floating "START" bubble. */
function useBob(enabled: boolean) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, enabled]);
  return anim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
}

export function LevelNode({ type, title, status, onPress, isCurrent }: Props) {
  const theme = useTheme();
  const meta = TYPE_META[type];
  const { bg, lip, fg } = colorsFor(theme, type, status);
  const size = isCurrent ? CURRENT_SIZE : NODE_SIZE;
  const shapeRadius = meta.shape === 'circle' ? size / 2 : meta.shape === 'roundedSquare' ? 20 : 18;
  const rotate = meta.shape === 'diamond' ? '45deg' : '0deg';
  const Icon = meta.Icon;

  const press = useRef(new Animated.Value(0)).current;
  const bob = useBob(!!isCurrent && status !== 'locked');

  function handlePressIn() {
    if (status === 'locked') return;
    Animated.timing(press, { toValue: 1, duration: 90, useNativeDriver: true }).start();
  }
  function handlePressOut() {
    Animated.spring(press, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  }

  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, theme.lip.heightLarge * 0.6] });
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] });

  return (
    <View style={styles.column}>
      <Animated.View style={{ width: size, height: size + theme.lip.heightLarge, alignItems: 'center', transform: [{ translateY: bob }] }}>
        {isCurrent && status !== 'locked' && <PulseRing size={size} color={theme.colors.primary} />}

        {/* Lip: same silhouette, offset down, peeking out from behind the front shape. */}
        <View
          style={[
            styles.lipShape,
            {
              width: size,
              height: size,
              borderRadius: shapeRadius,
              backgroundColor: lip,
              top: theme.lip.heightLarge,
              transform: [{ rotate }],
            },
          ]}
        />

        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={status === 'locked'}
          accessibilityRole="button"
          accessibilityLabel={`${meta.label}: ${title}${status === 'locked' ? ', locked' : status === 'completed' ? ', completed' : ''}`}
        >
          <Animated.View
            style={[
              styles.frontShape,
              {
                width: size,
                height: size,
                borderRadius: shapeRadius,
                backgroundColor: bg,
                transform: [{ rotate }, { translateY }, { scale }],
              },
            ]}
          >
            <View style={{ transform: [{ rotate: meta.shape === 'diamond' ? '-45deg' : '0deg' }] }}>
              {status === 'completed' ? (
                <Check size={26} color={fg} weight="bold" />
              ) : status === 'locked' ? (
                <LockSimple size={24} color={fg} weight="fill" />
              ) : (
                <Icon size={26} color={fg} weight="fill" />
              )}
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
      <Text numberOfLines={2} style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semibold }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { width: 140, alignItems: 'center', gap: 8 },
  lipShape: { position: 'absolute' },
  frontShape: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 12.5, textAlign: 'center' },
});
