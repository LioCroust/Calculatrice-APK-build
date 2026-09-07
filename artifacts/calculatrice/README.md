# Calculatrice

Calculatrice Android native hors ligne, avec suppression discrète par glissement et restauration par secousse.

## Lancer pour le développement

```bash
pnpm install
pnpm --filter @workspace/calculatrice run dev
```

Ouvrez ensuite le projet avec Expo Go sur un appareil Android.

## Vérifications utiles

```bash
pnpm --filter @workspace/calculatrice run typecheck
cd artifacts/calculatrice && pnpm dlx expo-doctor
```

## Premium avec RevenueCat

L'application utilise RevenueCat pour un achat Android unique à vie :

- produit Google Play : `calculatrice_premium` ;
- droit RevenueCat : `premium` ;
- offre courante : `default` ;
- forfait : `$rc_lifetime`.

Le prix n'est pas écrit dans le code. Le paywall affiche le tarif localisé
retourné par Google Play via RevenueCat.

Pendant un lancement dans Expo Go, RevenueCat est volontairement désactivé :
Expo Go ne peut pas utiliser la clé Google Play réelle pour la facturation.
Le bandeau et le paywall peuvent être prévisualisés, mais l'achat réel doit
être testé dans l'APK ou l'AAB autonome de l'application.

Avant de tester ou publier un achat réel :

1. créez dans Google Play Console le produit ponctuel
   `calculatrice_premium` au prix de base de 3,99 EUR ;
2. publiez-le au minimum sur une piste de test interne ;
3. ajoutez le compte de service Google Play dans RevenueCat ;
4. dans le catalogue RevenueCat, ouvrez le produit et désactivez
   **Consumable** pour en faire un achat non consommable ;
5. vérifiez que le produit est toujours relié au droit `premium` et au
   forfait `$rc_lifetime` de l'offre `default`.

Le statut non consommable est indispensable : sans lui, Google Play pourrait
autoriser un nouvel achat et une restauration après réinstallation ne serait
pas fiable.

## Distribution Android

Le profil `preview` dans `eas.json` décrit un APK interne installable. Utilisez
le flux de publication Android disponible dans votre environnement Expo pour
lancer la génération.