// components/StreakBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors, FontSize, FontWeight } from '../lib/theme';

interface Props {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

function FlameIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#F59E0B">
      <Path d="M12 2C12 2 7 7.5 7 13c0 2.76 2.24 5 5 5s5-2.24 5-5c0-3.5-5-11-5-11zm0 16a3 3 0 01-3-3c0-2.5 3-7 3-7s3 4.5 3 7a3 3 0 01-3 3z" />
    </Svg>
  );
}

export default function StreakBadge({ streak, size = 'md' }: Props) {
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 18 : 24;
  const textStyle =
    size === 'sm' ? styles.textSm : size === 'md' ? styles.textMd : styles.textLg;

  return (
    <View style={styles.container}>
      <FlameIcon size={iconSize} />
      <Text style={[styles.text, textStyle]}>{streak}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  text: {
    color: Colors.warning,
    fontWeight: FontWeight.bold,
  },
  textSm: { fontSize: FontSize.sm },
  textMd: { fontSize: FontSize.md },
  textLg: { fontSize: FontSize.xl },
});
