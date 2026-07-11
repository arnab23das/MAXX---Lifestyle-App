import React from 'react';
import {
  ShieldCheck,
  Barbell,
  Brain,
  DeviceMobile,
  Hamburger,
  Drop,
  Cigarette,
  Wine,
  Pill,
  DotsThree,
  Star,
  IconProps,
} from 'phosphor-react-native';

const ICONS: Record<string, React.ComponentType<IconProps>> = {
  'shield-check': ShieldCheck,
  dumbbell: Barbell,
  brain: Brain,
  phone: DeviceMobile,
  'food-apple': Hamburger,
  smoke: Drop,
  smoking: Cigarette,
  'bottle-wine': Wine,
  pill: Pill,
  'dots-horizontal': DotsThree,
  star: Star,
};

export function CategoryIcon({ name, size = 26, color, weight = 'fill' }: IconProps & { name: string }) {
  const Icon = ICONS[name] ?? Star;
  return <Icon size={size} color={color} weight={weight} />;
}
