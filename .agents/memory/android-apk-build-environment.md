---
name: Android APK build environment
description: Contraintes persistantes du runner pour produire un APK Expo signé.
---

Les builds Android natifs doivent utiliser Java 17, Android SDK 35/36 et Build Tools 35.0.0 ou 36.0.0. Les caches Android et Gradle doivent rester sur le volume `workspace`, car le home du runner peut atteindre son quota alors que le volume de travail dispose encore d’espace.

**Why:** Une compilation Expo SDK 57 avec React Native et les modules C++ natifs consomme plusieurs gigaoctets et compile plusieurs architectures. Le quota du home et le temps limité du runner peuvent interrompre un build autrement valide.

**How to apply:** Pour un APK Preview installable sur les appareils Android modernes, cibler `arm64-v8a` et valider la signature Release ainsi que la permission Google Play Billing dans le manifeste final.