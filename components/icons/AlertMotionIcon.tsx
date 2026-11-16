import AnimatedFloodIcon from '@/components/icons/AnimatedFloodIcon';
import AnimatedRainIcon from '@/components/icons/AnimatedRainIcon';
import AnimatedStormIcon from '@/components/icons/AnimatedStormIcon';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface AlertMotionIconProps {
  name: IconName;
  color: string;
  size?: number;
}

export default function AlertMotionIcon({ name, color, size = 28 }: AlertMotionIconProps) {
  if (name === 'rainy') return <AnimatedRainIcon color={color} size={size} />;
  if (name === 'thunderstorm') return <AnimatedStormIcon color={color} size={size} />;
  if (name === 'water') return <AnimatedFloodIcon color={color} size={size} />;
  return <Ionicons name={name} size={Math.round(size * 0.8)} color={color} />;
}
