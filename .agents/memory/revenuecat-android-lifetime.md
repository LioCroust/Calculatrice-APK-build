---
name: RevenueCat Android lifetime products
description: Limitation de l'API RevenueCat pour les achats Android permanents.
---

Un produit Android `one_time` créé par l'API RevenueCat v2 est consommable par
défaut. Le champ `one_time.is_consumable` est retourné en lecture mais refusé en
création, et le produit n'est pas modifiable par la route `PATCH`.

**Why:** RevenueCat consomme automatiquement un achat laissé dans cet état, ce
qui rend un déverrouillage à vie restaurable peu fiable.

**How to apply:** Créer et relier le produit par API, puis désactiver
manuellement **Consumable** dans le catalogue RevenueCat avant tout test ou
publication Google Play. Utiliser un SDK Android RevenueCat 7.11.0 ou plus
récent.