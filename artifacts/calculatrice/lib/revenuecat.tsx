import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { AppState, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';

const ENTITLEMENT_IDENTIFIER = 'premium';
const LIFETIME_PACKAGE_IDENTIFIER = '$rc_lifetime';
const PREMIUM_PRODUCT_IDENTIFIER = 'calculatrice_premium';
const REVENUECAT_ANDROID_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

let revenueCatConfigured = false;

export function initializeRevenueCat() {
  if (revenueCatConfigured) return true;
  if (Platform.OS === 'web') return false;
  if (
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    console.info('RevenueCat is disabled while running in Expo Go.');
    return false;
  }
  if (!REVENUECAT_ANDROID_API_KEY) {
    console.warn('RevenueCat is unavailable: Android public API key is missing.');
    return false;
  }

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  try {
    Purchases.configure({ apiKey: REVENUECAT_ANDROID_API_KEY });
    revenueCatConfigured = true;
    return true;
  } catch (error) {
    console.warn('RevenueCat initialization failed.', error);
    return false;
  }
}

type SubscriptionContextValue = {
  isPremium: boolean;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  isRetrying: boolean;
  isConfigured: boolean;
  errorMessage: string | null;
  packageToPurchase: PurchasesPackage | null;
  priceString: string | null;
  purchase: () => Promise<boolean>;
  restore: () => Promise<boolean>;
  retry: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function hasPremiumAccess(customerInfo: CustomerInfo | undefined) {
  return Boolean(
    customerInfo?.entitlements.active?.[ENTITLEMENT_IDENTIFIER],
  );
}

export function SubscriptionProvider({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) {
  const queryClient = useQueryClient();
  const purchaseInFlight = useRef(false);

  const customerInfoQuery = useQuery({
    queryKey: ['revenuecat', 'customer-info'],
    queryFn: () => Purchases.getCustomerInfo(),
    enabled,
    staleTime: 60_000,
  });

  const offeringsQuery = useQuery<PurchasesOfferings>({
    queryKey: ['revenuecat', 'offerings'],
    queryFn: () => Purchases.getOfferings(),
    enabled,
    staleTime: 300_000,
  });

  const packageToPurchase =
    offeringsQuery.data?.current?.availablePackages.find(
      (item) =>
        item.identifier === LIFETIME_PACKAGE_IDENTIFIER &&
        item.product.identifier === PREMIUM_PRODUCT_IDENTIFIER,
    ) ??
    null;

  useEffect(() => {
    if (!enabled) return;

    const updateCustomerInfo = (customerInfo: CustomerInfo) => {
      queryClient.setQueryData(
        ['revenuecat', 'customer-info'],
        customerInfo,
      );
    };
    Purchases.addCustomerInfoUpdateListener(updateCustomerInfo);

    const appStateSubscription = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active') void customerInfoQuery.refetch();
      },
    );

    return () => {
      Purchases.removeCustomerInfoUpdateListener(updateCustomerInfo);
      appStateSubscription.remove();
    };
  }, [customerInfoQuery, enabled, queryClient]);

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const cachedCustomerInfo = queryClient.getQueryData<CustomerInfo>([
        'revenuecat',
        'customer-info',
      ]);
      if (hasPremiumAccess(cachedCustomerInfo)) return true;
      if (purchaseInFlight.current) {
        throw new Error('Un achat est déjà en cours.');
      }
      if (!packageToPurchase) {
        throw new Error('L’offre Premium est momentanément indisponible.');
      }

      purchaseInFlight.current = true;
      try {
        const { customerInfo } =
          await Purchases.purchasePackage(packageToPurchase);
        queryClient.setQueryData(
          ['revenuecat', 'customer-info'],
          customerInfo,
        );
        return hasPremiumAccess(customerInfo);
      } finally {
        purchaseInFlight.current = false;
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      const customerInfo = await Purchases.restorePurchases();
      queryClient.setQueryData(
        ['revenuecat', 'customer-info'],
        customerInfo,
      );
      return hasPremiumAccess(customerInfo);
    },
  });

  const retry = async () => {
    await Promise.all([
      customerInfoQuery.refetch(),
      offeringsQuery.refetch(),
    ]);
  };

  const queryError =
    customerInfoQuery.error ?? offeringsQuery.error ?? null;

  const value: SubscriptionContextValue = {
    isPremium: hasPremiumAccess(customerInfoQuery.data),
    isLoading:
      enabled &&
      (customerInfoQuery.isLoading || offeringsQuery.isLoading),
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    isRetrying:
      customerInfoQuery.isRefetching || offeringsQuery.isRefetching,
    isConfigured: enabled,
    errorMessage:
      queryError instanceof Error
        ? queryError.message
        : queryError
          ? 'Impossible de contacter Google Play.'
          : null,
    packageToPurchase,
    priceString: packageToPurchase?.product.priceString ?? null,
    purchase: purchaseMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    retry,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      'useSubscription must be used within SubscriptionProvider',
    );
  }
  return context;
}