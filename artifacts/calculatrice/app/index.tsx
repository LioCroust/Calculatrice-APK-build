import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  PanResponder,
  Platform,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
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

const ROUTINE_STEPS = [
  'Avant de commencer, le magicien appuie deux fois rapidement sur AC. Le nombre d’accueil s’efface, le tour est activé, puis le fonctionnement secret se reverrouille après la restauration finale.',
  'Le magicien effectue un calcul ou tape un nombre (par exemple le résultat d’un choix du public ou une prédiction).',
  'Au moment de retirer le tout premier chiffre, le magicien demande au spectateur de tendre la main et de fermer fermement le poing.',
  'En effectuant un glissement (swipe) vers la droite directement sur l’écran d’affichage, le dernier chiffre disparaît de la calculatrice.',
  'Le magicien fait semblant de tenir ce chiffre invisible entre le pouce et l’index, puis mime le geste de le lancer dans la main fermée du spectateur.',
  'L’opération est répétée pour chaque chiffre : à chaque swipe vers la droite, un chiffre disparaît et est symboliquement projeté dans le poing du spectateur.',
  'Lorsque le dernier chiffre s’efface, l’écran devient totalement vide (aucun zéro ne subsiste).',
  'Le magicien tient la calculatrice orientée vers le spectateur. Il lui demande d’ouvrir la main et de faire semblant de rejeter tous les chiffres invisibles d’un coup vers le téléphone.',
  'Au moment exact où le spectateur mime le lancer, une infime secousse naturelle du téléphone fait réapparaître instantanément tous les chiffres à leur position exacte. Effet magique garanti !',
];

export default function CalculatorScreen() {
  const {
    expression,
    resultPreview,
    isEvaluated,
    magicEnabled,
    handlePress,
    swipeDelete,
    unlockMagic,
  } = useCalculator();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [showRoutine, setShowRoutine] = useState<boolean>(false);
  const lastAcTapAt = useRef<number | null>(null);
  const magicEnabledRef = useRef<boolean>(false);

  magicEnabledRef.current = magicEnabled;

  useEffect(() => {
    if (expression === '1234' && !isEvaluated) {
      setShowRoutine(true);
    }
  }, [expression, isEvaluated]);

  const settleDisplay = () => {
    setSwipeOffset(0);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => magicEnabledRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          magicEnabledRef.current &&
          Math.abs(gestureState.dx) > 12 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2
        );
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        setSwipeOffset(0);
      },
      onPanResponderMove: (_, gestureState) => {
        setSwipeOffset(Math.max(0, Math.min(gestureState.dx, 96)));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (
          gestureState.dx > 28 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2
        ) {
          swipeDelete();
          if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }
        settleDisplay();
      },
      onPanResponderTerminate: () => {
        settleDisplay();
      }
    })
  ).current;

  const onButtonPress = (btn: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (btn === 'AC') {
      const now = Date.now();
      if (lastAcTapAt.current !== null && now - lastAcTapAt.current <= 500) {
        unlockMagic();
        lastAcTapAt.current = null;
      } else {
        lastAcTapAt.current = now;
      }
    } else {
      lastAcTapAt.current = null;
    }
    handlePress(btn);
  };

  const closeRoutine = () => {
    handlePress('AC');
    setShowRoutine(false);
  };

  const effectiveWidth = Math.min(width, 480);
  const buttonMargin = 6;
  const maxButtonWidth = (effectiveWidth - 32 - buttonMargin * 8) / 4;
  const buttonSize = Math.min(maxButtonWidth, 84);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom || 16 }]}>
      <View
        style={[
          styles.displayContainer,
          swipeOffset > 0 ? { transform: [{ translateX: swipeOffset }] } : undefined,
        ]}
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

      <Modal
        visible={showRoutine}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeRoutine}
      >
        <View style={styles.modalRoot}>
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background, opacity: 0.9 }]}
          />
          <View
            style={[
              styles.routineCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius * 3,
              },
            ]}
            testID="routine-modal"
          >
            <View style={styles.routineHeader}>
              <View style={styles.routineTitleGroup}>
                <View style={[styles.routineBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.routineBadgeText, { color: colors.primaryForeground }]}>?</Text>
                </View>
                <View style={styles.routineTitleText}>
                  <Text style={[styles.routineEyebrow, { color: colors.primary }]}>ROUTINE</Text>
                  <Text style={[styles.routineTitle, { color: colors.foreground }]}>
                    LE DÉROULÉ DE L’EFFET
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView
              style={styles.routineScroll}
              contentContainerStyle={styles.routineContent}
              showsVerticalScrollIndicator={false}
            >
              {ROUTINE_STEPS.map((step, index) => (
                <View key={step} style={styles.routineStep}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.stepNumberText, { color: colors.primary }]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.cardForeground }]}>{step}</Text>
                </View>
              ))}
              <View style={[styles.routineNote, { backgroundColor: colors.muted }]}>
                <Text style={[styles.routineNoteText, { color: colors.mutedForeground }]}>
                  AC remet à zéro le nombre mémorisé pour sa réapparition après la légère secousse.
                </Text>
              </View>
            </ScrollView>

            <View style={[styles.routineFooter, { borderTopColor: colors.border }]}>
              <Pressable
                onPress={closeRoutine}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && { opacity: 0.7 },
                ]}
                android_ripple={{ color: colors.muted }}
                testID="routine-close"
                accessibilityRole="button"
                accessibilityLabel="Retour et remise à zéro"
              >
                <Text style={[styles.closeButtonText, { color: colors.primary }]}>RETOUR</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  routineCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '92%',
    alignSelf: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    overflow: 'hidden',
  },
  routineHeader: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
  },
  routineTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routineBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routineBadgeText: {
    fontSize: 22,
    fontFamily: 'Inter_500Medium',
  },
  routineTitleText: {
    flex: 1,
  },
  routineEyebrow: {
    fontSize: 12,
    letterSpacing: 1.2,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  routineTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Inter_600SemiBold',
  },
  routineScroll: {
    flexShrink: 1,
  },
  routineContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  routineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  routineNote: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  routineNoteText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Inter_400Regular',
  },
  routineFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  closeButton: {
    minHeight: 48,
    minWidth: 96,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  closeButtonText: {
    fontSize: 14,
    letterSpacing: 0.8,
    fontFamily: 'Inter_600SemiBold',
  },
});