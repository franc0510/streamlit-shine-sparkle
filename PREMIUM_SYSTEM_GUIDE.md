# Guide du Système Premium/Free

## 🎯 Vue d'ensemble

Votre application utilise maintenant un système d'abonnement premium avec Stripe qui limite l'accès aux matchs :
- **FREE** : Accès à 1 seul match
- **PREMIUM** : Accès illimité à tous les matchs

## 🏗️ Architecture

### Tables Supabase

1. **`profiles`** : Stocke les informations utilisateur
   - Créée automatiquement lors de l'inscription
   - Liée à `auth.users` via `user_id`

2. **`premium_users`** : Pour les accès premium manuels
   - Permet d'accorder le statut premium sans passer par Stripe

### Contexts

1. **`AuthContext`** : Gère l'authentification
   - `user` : Utilisateur connecté
   - `session` : Session Supabase
   - `loading` : État de chargement

2. **`SubscriptionContext`** : Gère le statut premium
   - `isPremium` : Boolean indiquant si l'utilisateur est premium
   - `subscriptionStatus` : Détails de l'abonnement
   - `refreshSubscription()` : Rafraîchir le statut depuis Stripe

### Hooks personnalisés

**`useMatchAccess`** : Gère l'accès aux matchs
```tsx
const {
  viewedCount,      // Nombre de matchs consultés
  freeLimit,        // Limite gratuite (1)
  canViewMatch,     // Fonction pour vérifier l'accès
  markMatchAsViewed,// Marquer un match comme vu
  isPremium         // Statut premium
} = useMatchAccess();
```

## 📦 Composants

### 1. PremiumGate

Wrapper pour limiter l'accès au contenu :

```tsx
import { PremiumGate } from "@/components/PremiumGate";

<PremiumGate 
  freeLimit={1}
  currentCount={viewedCount}
  featureName="matchs"
>
  <YourProtectedContent />
</PremiumGate>
```

### 2. SubscriptionStatus

Affiche le statut d'abonnement et permet de gérer l'abonnement :

```tsx
import { SubscriptionStatus } from "@/components/SubscriptionStatus";

<SubscriptionStatus />
```

## 🔧 Utilisation dans vos pages

### Page de liste de matchs (Index, CS2, Dota2)

```tsx
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumGate } from "@/components/PremiumGate";

const MyPage = () => {
  const { isPremium } = useSubscription();

  return (
    <div>
      {/* Afficher tous les matchs mais limiter l'interaction */}
      {matches.map((match, index) => (
        <div key={index}>
          {/* Premier match toujours accessible */}
          {index === 0 || isPremium ? (
            <MatchCard match={match} />
          ) : (
            // Matchs suivants verrouillés pour FREE users
            <LockedMatchCard match={match} />
          )}
        </div>
      ))}
    </div>
  );
};
```

### Page de détails d'un match (MatchDetails)

```tsx
import { useMatchAccess } from "@/hooks/useMatchAccess";
import { PremiumGate } from "@/components/PremiumGate";

const MatchDetails = () => {
  const { matchId } = useParams();
  const { canViewMatch, markMatchAsViewed, viewedCount } = useMatchAccess();

  useEffect(() => {
    // Marquer le match comme vu si accès autorisé
    if (canViewMatch(matchId)) {
      markMatchAsViewed(matchId);
    }
  }, [matchId]);

  return (
    <PremiumGate
      freeLimit={1}
      currentCount={viewedCount}
      featureName="matchs"
    >
      {/* Contenu du match */}
      <MatchDetailContent />
    </PremiumGate>
  );
};
```

## 💳 Intégration Stripe

### Edge Functions existantes

1. **`check-subscription`** : Vérifie le statut d'abonnement
   - Appelé automatiquement par `SubscriptionContext`
   - Vérifie d'abord `premium_users`, puis Stripe

2. **`customer-portal`** : Ouvre le portail client Stripe
   - Permet aux users de gérer leur abonnement

### Fonctions utilitaires

```tsx
import { 
  createCheckoutSession,  // Créer une session de paiement
  openCustomerPortal      // Ouvrir le portail client
} from "@/lib/subscription";

// Rediriger vers le paiement
const handleUpgrade = async () => {
  const url = await createCheckoutSession(user.email);
  if (url) window.open(url, "_blank");
};

// Gérer l'abonnement
const handleManage = async () => {
  const url = await openCustomerPortal();
  if (url) window.open(url, "_blank");
};
```

## 🔒 Sécurité

### Row Level Security (RLS)

Toutes les tables ont des politiques RLS :
- Users ne peuvent voir/modifier que leurs propres données
- Les politiques empêchent les accès non autorisés

### Vérification côté client ET serveur

1. **Côté client** : `useSubscription` et `useMatchAccess` pour l'UX
2. **Côté serveur** : `check-subscription` vérifie dans Stripe

**Important** : Ne jamais se fier uniquement au côté client pour la sécurité !

## 🎨 Personnalisation

### Modifier la limite gratuite

Dans `src/hooks/useMatchAccess.ts` :
```tsx
const FREE_MATCH_LIMIT = 1; // Changer ici
```

### Ajouter des tiers d'abonnement

1. Créer de nouveaux produits dans Stripe
2. Mettre à jour `PREMIUM_PRODUCT_ID` dans `src/lib/subscription.ts`
3. Adapter la logique dans `check-subscription`

## 📊 Monitoring

### Logs disponibles

Tous les composants loggent dans la console :
- `[AuthProvider]` : Changements d'auth
- `[SubscriptionContext]` : Vérifications d'abonnement
- `[checkSubscription]` : Appels à Stripe

### Debugging

```tsx
// Réinitialiser le compteur de matchs vus (dev uniquement)
const { resetViewedMatches } = useMatchAccess();
resetViewedMatches();
```

## 🚀 Prochaines étapes

1. **Créer la table `matches`** : Pour stocker vos matchs esport
2. **Implémenter l'import CSV** : Pour charger vos matchs quotidiennement
3. **Ajouter l'authentification** : Pages login/signup si pas déjà fait
4. **Configurer Stripe** : Produits et prix pour votre offre Premium

## 📝 Notes importantes

- Le statut premium est vérifié toutes les 15 secondes
- Les matchs vus sont stockés en localStorage (24h)
- Les users premium ont TOUJOURS accès, peu importe le compteur
- La table `profiles` se crée automatiquement à l'inscription
