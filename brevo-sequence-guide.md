# Séquence Guide 9 Erreurs — Brevo Automation

## Nom de l'automation : "Séquence Guide 9 Erreurs"

## Déclencheur
- Contact ajouté à la liste **#15** (Guide Offert)
- ⚠️ Si tu utilises la liste #2 (Smart Capture), crée une automation séparée avec le même déclencheur sur #2

---

## EMAIL 1 — Délai : 0 minute (envoi immédiat)

**Objet :** Ton guide est là 🎯 + le truc que personne ne te dit

**Corps :**

Bonjour {{contact.PRENOM}},

Ton guide "Les 9 erreurs qui sabotent ta transformation" est disponible ici :
→ https://www.ornellafitcoaching.com/guide-offert.html

Mais avant que tu le lises, je veux te dire un truc honnête :

Connaître les erreurs, c'est bien.
Les éviter SEULE, c'est là que 90% des femmes échouent.

Pas parce qu'elles manquent de volonté.
Parce qu'elles manquent d'une méthode ET de quelqu'un qui les tient.

Je t'explique comment j'aide mes clientes à éviter exactement ces erreurs dans mon prochain email.

À demain,
Ornella 🔥

P.S. Si tu as des questions, réponds directement à cet email — je lis tout.

---

## EMAIL 2 — Délai : 2 jours après inscription

**Objet :** Louise a perdu 9 cm. Voici comment.

**Corps :**

Bonjour {{contact.PRENOM}},

Louise avait tout essayé.
Salle de sport. Régimes. Applis de fitness.

Résultat après 2 ans : aucun changement visible.

En 4 mois avec moi : −9 cm de tour de taille, −5 kg, un dos redessiné.

La différence ? Pas la motivation. Pas les heures passées à s'entraîner.
Un programme construit pour SON corps. Et quelqu'un qui s'assurait qu'elle avançait chaque semaine.

→ Tu veux voir sa transformation complète ?
https://www.ornellafitcoaching.com/transformations.html

Si tu te reconnais dans son histoire, on devrait se parler.

→ Écris-moi sur WhatsApp en 1 clic :
https://wa.me/33756834626?text=Bonjour%20Ornella%20!%20J%27ai%20lu%20le%20guide%20et%20je%20veux%20en%20savoir%20plus%20sur%20ton%20coaching.

Sans pression. Juste un échange pour voir si je peux t'aider.

Ornella 🔥

---

## EMAIL 3 — Délai : 4 jours après inscription

**Objet :** C'est maintenant ou jamais (et je le pense vraiment)

**Corps :**

Bonjour {{contact.PRENOM}},

Dans 3 mois, tu peux être une femme différente.

Pas parfaite. Pas transformée comme dans une pub.
Mais enfin elle-même. Avec de l'énergie. Fière de ce qu'elle voit dans le miroir.

Ou tu peux être exactement là où tu es aujourd'hui.

Je ne vends pas de rêve. Je construis des programmes sur-mesure pour des femmes réelles, avec des vies réelles.

Mon accompagnement le plus accessible : 79€ pour un programme 8 semaines 100% construit pour toi.
→ https://www.ornellafitcoaching.com/offres.html

Ou si tu veux qu'on en parle d'abord — bilan offert, sans engagement :
→ https://wa.me/33756834626?text=Bonjour%20Ornella%20!%20Je%20veux%20faire%20mon%20bilan%20personnalis%C3%A9%20offert.

C'est toi qui choisis.

Ornella 🔥

P.S. Je prends 3 nouvelles clientes ce mois-ci. Si tu attends, je ne pourrai peut-être plus.

---

## Comment créer l'automation dans Brevo

### Étape 1 — Créer l'automation
1. Va sur **app.brevo.com** → menu **Automations**
2. Clique **Créer une automation** → choisis **Séquence d'emails**
3. Nomme-la : `Séquence Guide 9 Erreurs`

### Étape 2 — Configurer le déclencheur
1. Déclencheur : **"Contact ajouté à une liste"**
2. Sélectionne la liste **#15 — Guide Offert**
3. (Optionnel) Répète avec liste #2 si tu veux couvrir la Smart Capture aussi

### Étape 3 — Ajouter les 3 emails

**Email 1**
- Délai : **0 minute** (immédiatement)
- Crée un nouvel email dans l'éditeur Brevo
- Objet : `Ton guide est là 🎯 + le truc que personne ne te dit`
- Colle le corps ci-dessus
- Expéditeur : `ornellafit.coaching@gmail.com` — Nom : `Ornella`

**Email 2**
- Délai : **2 jours** après le déclencheur
- Objet : `Louise a perdu 9 cm. Voici comment.`
- Colle le corps ci-dessus

**Email 3**
- Délai : **4 jours** après le déclencheur
- Objet : `C'est maintenant ou jamais (et je le pense vraiment)`
- Colle le corps ci-dessus

### Étape 4 — Activer
1. Clique **Enregistrer** puis **Activer l'automation**
2. Vérifie que le statut passe à **Actif**

### Étape 5 — Tester
1. Ajoute ton email perso manuellement à la liste #15 dans Brevo
2. Email 1 doit arriver dans les minutes qui suivent
3. Vérifie que `{{contact.PRENOM}}` est bien remplacé par ton prénom

---

## Note importante
- Lien du guide : https://www.ornellafitcoaching.com/guide-offert.html (déjà intégré dans l'Email 1)
- L'Automation #1 existante (liste #5) peut être désactivée si tu as migré vers #15
