// src/components/StarField.tsx
// Champ d'étoiles généré procéduralement, à poser en fond derrière le contenu.
// Léger : pas d'image, juste des View positionnées + une animation d'opacité douce.

import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

type Star = {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  delay: number;
};

const { width, height } = Dimensions.get('window');

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() < 0.85 ? 1 + Math.random() * 1.2 : 2 + Math.random() * 1.5,
    baseOpacity: 0.25 + Math.random() * 0.55,
    delay: Math.random() * 3000,
  }));
}

function TwinklingStar({ star }: { star: Star }) {
  const opacity = useRef(new Animated.Value(star.baseOpacity)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: star.baseOpacity * 0.3,
          duration: 1800 + Math.random() * 1200,
          delay: star.delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: star.baseOpacity,
          duration: 1800 + Math.random() * 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: star.x,
          top: star.y,
          width: star.size,
          height: star.size,
          opacity,
        },
      ]}
    />
  );
}

export default function StarField({ count = 80 }: { count?: number }) {
  const stars = useMemo(() => generateStars(count), [count]);

  return (
    <View style={styles.container} pointerEvents="none">
      {stars.map((star, i) => (
        <TwinklingStar key={i} star={star} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 50,
  },
});