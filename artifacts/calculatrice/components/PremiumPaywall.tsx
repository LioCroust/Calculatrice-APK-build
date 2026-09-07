import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSubscription } from '@/lib/revenuecat';

const BENEFITS = [
  'Aucun bandeau pendant la présentation',
  'Déverrouillage définitif sur votre compte',
  'Achat restaurable après réinstallation',
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return 'Une erreur est survenue. Veuillez réessayer.';
}

export function PremiumPaywall({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    isPremium,
    isConfigured,
    packageToPurchase,
    priceString,
    purchase,
    restore,
    retry,
    errorMessage,
    isPurchasing,
    isRestoring,
    isRetrying,
  } = useSubscription();
  const [showConfirmation, setShowConfirmation] =
    useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!visible) {
      setMessage('');
      setShowConfirmation(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && isPremium) onClose();
  }, [isPremium, onClose, visible]);

  const confirmPurchase = async () => {
    setMessage('');
    try {
      const unlocked = await purchase();
      setShowConfirmation(false);
      if (unlocked) {
        onClose();
      } else {
        setMessage(
          'L’achat a été reçu, mais l’accès Premium n’est pas encore actif.',
        );
      }
    } catch (error) {
      setShowConfirmation(false);
      const cancelled =
        typeof error === 'object' &&
        error !== null &&
        'userCancelled' in error &&
        error.userCancelled === true;
      if (!cancelled) setMessage(getErrorMessage(error));
    }
  };

  const restorePurchase = async () => {
    setMessage('');
    try {
      const restored = await restore();
      if (restored) {
        onClose();
      } else {
        setMessage('Aucun achat Premium à restaurer sur ce compte.');
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const busy = isPurchasing || isRestoring;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View
          style={[
            styles.screen,
            {
              backgroundColor: colors.background,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
          testID="premium-paywall"
        >
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.close,
                {
                  backgroundColor: colors.card,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              android_ripple={{ color: colors.muted }}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <Text style={[styles.closeText, { color: colors.foreground }]}>
                ×
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.premiumBadge,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.premiumBadgeText,
                  { color: colors.primaryForeground },
                ]}
              >
                PREMIUM
              </Text>
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>
              Une présentation sans distraction
            </Text>
            <Text
              style={[styles.subtitle, { color: colors.mutedForeground }]}
            >
              Retirez définitivement le bandeau de la version gratuite.
            </Text>

            <View style={styles.benefits}>
              {BENEFITS.map((benefit) => (
                <View key={benefit} style={styles.benefit}>
                  <View
                    style={[
                      styles.check,
                      { backgroundColor: colors.muted },
                    ]}
                  >
                    <Text
                      style={[styles.checkText, { color: colors.primary }]}
                    >
                      ✓
                    </Text>
                  </View>
                  <Text
                    style={[styles.benefitText, { color: colors.foreground }]}
                  >
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={[
                styles.plan,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.primary,
                },
              ]}
            >
              <View>
                <Text style={[styles.planTitle, { color: colors.foreground }]}>
                  Premium à vie
                </Text>
                <Text
                  style={[styles.planCaption, { color: colors.mutedForeground }]}
                >
                  Paiement unique
                </Text>
              </View>
              <Text style={[styles.price, { color: colors.primary }]}>
                {priceString ?? 'Prix Google Play'}
              </Text>
            </View>

            {!packageToPurchase && !errorMessage && (
              <Text
                style={[styles.storeNotice, { color: colors.mutedForeground }]}
              >
                {isConfigured
                  ? 'Le tarif sera chargé automatiquement depuis Google Play dès que le produit sera publié.'
                  : 'Le tarif et les achats sont disponibles dans l’application Android.'}
              </Text>
            )}

            {errorMessage ? (
              <View
                style={[
                  styles.messageBox,
                  { backgroundColor: colors.muted },
                ]}
              >
                <Text
                  style={[styles.messageText, { color: colors.foreground }]}
                >
                  Impossible de charger l’offre Premium. Vérifiez votre
                  connexion puis réessayez.
                </Text>
                <Pressable
                  onPress={retry}
                  disabled={isRetrying}
                  style={styles.retryButton}
                  accessibilityRole="button"
                >
                  {isRetrying ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text
                      style={[styles.retryText, { color: colors.primary }]}
                    >
                      RÉESSAYER
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : message ? (
              <View
                style={[
                  styles.messageBox,
                  { backgroundColor: colors.muted },
                ]}
              >
                <Text
                  style={[styles.messageText, { color: colors.foreground }]}
                >
                  {message}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => setShowConfirmation(true)}
              disabled={!packageToPurchase || busy}
              style={({ pressed }) => [
                styles.purchaseButton,
                {
                  backgroundColor: colors.primary,
                  opacity:
                    !packageToPurchase || busy ? 0.45 : pressed ? 0.78 : 1,
                },
              ]}
              android_ripple={{ color: colors.accent }}
              accessibilityRole="button"
              testID="premium-purchase"
            >
              {isPurchasing ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text
                  style={[
                    styles.purchaseButtonText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  ACHETER{priceString ? ` · ${priceString}` : ''}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={restorePurchase}
              disabled={!isConfigured || busy}
              style={({ pressed }) => [
                styles.restoreButton,
                {
                  opacity:
                    !isConfigured || busy ? 0.45 : pressed ? 0.7 : 1,
                },
              ]}
              accessibilityRole="button"
              testID="premium-restore"
            >
              {isRestoring ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text
                  style={[styles.restoreText, { color: colors.primary }]}
                >
                  RESTAURER MES ACHATS
                </Text>
              )}
            </Pressable>

            <Text
              style={[styles.legal, { color: colors.mutedForeground }]}
            >
              Achat traité de manière sécurisée par Google Play.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showConfirmation}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.confirmRoot}>
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.background, opacity: 0.9 },
            ]}
          />
          <View
            style={[
              styles.confirmCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[styles.confirmTitle, { color: colors.foreground }]}
            >
              Confirmer l’achat
            </Text>
            <Text
              style={[
                styles.confirmText,
                { color: colors.mutedForeground },
              ]}
            >
              Débloquer Premium à vie
              {priceString ? ` pour ${priceString}` : ''} ?
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={() => setShowConfirmation(false)}
                disabled={busy}
                style={styles.confirmAction}
              >
                <Text
                  style={[styles.confirmActionText, { color: colors.primary }]}
                >
                  ANNULER
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmPurchase}
                disabled={busy}
                style={styles.confirmAction}
              >
                {isPurchasing ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text
                    style={[
                      styles.confirmActionText,
                      { color: colors.primary },
                    ]}
                  >
                    ACHETER
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  closeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 32,
    lineHeight: 34,
    marginTop: -2,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  premiumBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
  },
  premiumBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 1.3,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 32,
    lineHeight: 39,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    lineHeight: 25,
  },
  benefits: {
    marginTop: 30,
    marginBottom: 14,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  checkText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  benefitText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 21,
  },
  plan: {
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  planTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    marginBottom: 4,
  },
  planCaption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginLeft: 12,
  },
  storeNotice: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  messageBox: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  messageText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  retryButton: {
    minHeight: 42,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    marginTop: 4,
  },
  retryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  purchaseButton: {
    minHeight: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    overflow: 'hidden',
  },
  purchaseButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    letterSpacing: 0.8,
  },
  restoreButton: {
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  restoreText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  legal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  confirmRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 10,
    elevation: 10,
  },
  confirmTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 21,
    marginBottom: 12,
  },
  confirmText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
  },
  confirmAction: {
    minWidth: 92,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  confirmActionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});