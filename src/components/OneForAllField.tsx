// src/components/OneForAllField.tsx
// Sparkles multicolores façon éclat "Plus Ultra", via caractère Unicode étoile.

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const SPARKLE_COLORS = ['#4ade80', '#f87171', '#facc15', '#60a5fa', '#e879f9', '#ffffff'];

type SparkleData = {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
};

function generateSparkles(count: number): SparkleData[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 14 + Math.random() * 20,
    color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
    delay: Math.random() * 3500,
    duration: 1400 + Math.random() * 1200,
  }));
}

function Sparkle({ sparkle }: { sparkle: SparkleData }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(sparkle.delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.95, duration: sparkle.duration * 0.35, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: sparkle.duration * 0.35, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: sparkle.duration * 0.65, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.3, duration: sparkle.duration * 0.65, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: sparkle.x,
        top: sparkle.y,
        opacity,
        transform: [{ scale }],
      }}
    >
      <Text
        style={{
          fontSize: sparkle.size,
          color: sparkle.color,
          textShadowColor: sparkle.color,
          textShadowRadius: sparkle.size * 0.6,
          textShadowOffset: { width: 0, height: 0 },
        }}
      >
        ✦
      </Text>
    </Animated.View>
  );
}

export default function OneForAllField({ count = 22 }: { count?: number }) {
  const sparkles = useMemo(() => generateSparkles(count), [count]);

  return (
    <View style={styles.container} pointerEvents="none">
      {sparkles.map((sparkle, i) => (
        <Sparkle key={i} sparkle={sparkle} />
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
});