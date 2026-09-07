---
name: Expo Go SDK alignment
description: Version Expo Go utilisée pour tester Calculatrice.
---

Calculatrice doit rester alignée sur Expo SDK 57 afin d'être testée avec
l'Expo Go SDK 57 installé sur le téléphone. Ne pas proposer de revenir à Expo
Go SDK 54, car cela remplacerait la version utilisée par les autres projets.

**Why:** Expo Go ne peut pas ouvrir un projet avec un SDK différent de celui
qu'il embarque.

**How to apply:** Toute future mise à jour Expo de Calculatrice doit préserver
la compatibilité SDK 57 ou passer directement à une application autonome. Avec
SDK 57, `expo-navigation-bar` règle surtout le style au runtime ; les couleurs
des barres et le fond natif doivent aussi être configurés au niveau Expo.