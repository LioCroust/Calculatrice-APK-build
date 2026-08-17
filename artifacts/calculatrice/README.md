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
pnpm --filter @workspace/calculatrice exec expo-doctor
```

## Distribution Android

Le profil `preview` dans `eas.json` décrit un APK interne installable. Utilisez
le flux de publication Android disponible dans votre environnement Expo pour
lancer la génération.