import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useCalculator, formatExpression } from '../hooks/useCalculator';
import { useColors } from '../hooks/useColors';

const BUTTONS = [
  ['AC', '( )', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', ',', '⌫', '=']
];

export default function CalculatorScreen() {
  const { expression, resultPreview, handlePress, swipeDelete } = useCalculator();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          swipeDelete();
          if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }
      }
    })
  ).current;

  const onButtonPress = (btn: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    handlePress(btn);
  };

  const effectiveWidth = Math.min(width, 480);
  const buttonMargin = 6;
  const maxButtonWidth = (effectiveWidth - 32 - buttonMargin * 8) / 4;
  const buttonSize = Math.min(maxButtonWidth, 84);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom || 16 }]}>
      <View
        style={styles.displayContainer}
        {...panResponder.panHandlers}
        testID="display-area"
      >
        <Text
           style={[styles.expressionText, { color: colors.foreground, fontSize: expression.length > 12 ? 52 : 64 }]}
          adjustsFontSizeToFit
          numberOfLines={1}
          minimumFontScale={0.4}
          testID="expression-text"
        >
          {formatExpression(expression)}
        </Text>
         <Text style={[styles.resultText, { color: colors.mutedForeground }]} numberOfLines={1} testID="result-text">
          {resultPreview}
        </Text>
      </View>

      <View style={styles.keypad}>
        {BUTTONS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((btn) => {
               let bgColor = colors.card;
               let textColor = colors.foreground;
              let isEquals = btn === '=';
              let isOperator = ['÷', '×', '-', '+'].includes(btn);
              let isTop = ['AC', '( )', '%'].includes(btn);

              if (isTop || isOperator) {
                 textColor = colors.primary;
                if (btn === 'AC') {
                     textColor = colors.accent;
                }
              } else if (isEquals) {
                 bgColor = colors.primary;
                 textColor = colors.primaryForeground;
              }

              return (
                <TouchableOpacity
                  key={btn}
                  style={[
                    styles.button,
                    {
                      width: buttonSize,
                      height: buttonSize,
                      borderRadius: buttonSize / 2,
                      backgroundColor: bgColor,
                      margin: buttonMargin,
                    }
                  ]}
                  onPress={() => onButtonPress(btn)}
                  testID={`btn-${btn}`}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: textColor,
                        fontSize: isOperator ? 36 : isTop ? 24 : 32,
                        fontWeight: isEquals ? '500' : '400',
                      }
                    ]}
                  >
                    {btn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  displayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  expressionText: {
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
    width: '100%',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 32,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
    width: '100%',
    minHeight: 40,
  },
  keypad: {
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Inter_400Regular',
  },
});