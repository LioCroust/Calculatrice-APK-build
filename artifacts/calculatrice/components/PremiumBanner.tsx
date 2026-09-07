import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function PremiumBanner({ onPress }: { onPress: () => void }) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.banner,
        {
          backgroundColor: colors.card,
          borderColor: colors.primary,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
      android_ripple={{ color: colors.muted }}
      accessibilityRole="button"
      accessibilityLabel="Découvrir Calculatrice Premium"
      testID="premium-banner"
    >
      <View style={styles.copy}>
        <Text style={[styles.label, { color: colors.primary }]}>
          VERSION GRATUITE
        </Text>
        <Text style={[styles.message, { color: colors.foreground }]}>
          Calculatrice magique — passez à Premium pour retirer ce bandeau
        </Text>
      </View>
      <Text style={[styles.chevron, { color: colors.primary }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 76,
    marginHorizontal: 6,
    marginBottom: 12,
    paddingLeft: 18,
    paddingRight: 14,
    borderWidth: 2,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    paddingVertical: 13,
  },
  label: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  message: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 20,
  },
  chevron: {
    fontFamily: 'Inter_400Regular',
    fontSize: 38,
    lineHeight: 42,
    marginLeft: 12,
  },
});