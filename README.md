# Ky-Lin — Site de vote setlist

Site statique (HTML/CSS/JS), **zéro compte requis pour voter**. Chaque musicien choisit
qui il est dans la liste, écoute un extrait de chaque chanson, coche exactement
**10 titres**, clique sur "Valider mon vote" — c'est tout. Le vote s'enregistre
automatiquement et le classement en haut de la page se met à jour tout seul (toutes les
20 secondes).

## Comment ça marche techniquement

Un petit Google Sheet fait office de base de données, piloté par un script Google Apps
Script qui expose deux fonctions :
- le site **envoie** un vote → le script l'ajoute (ou remplace l'ancien vote de la même
  personne) dans le Sheet
- le site **lit** le classement → le script renvoie tous les votes en JSON

Rien de tout ça n'est visible ni accessible aux votants — ils voient juste la page, ils
votent, point.

## Mise en route (une seule fois, ~5 minutes)

### 1. Crée le Google Sheet

- Va sur [sheets.google.com](https://sheets.google.com) → Nouveau classeur vide.
- Donne-lui un nom, par exemple "Ky-Lin — Votes".

### 2. Ouvre l'éditeur de script

- Dans le Sheet : menu **Extensions → Apps Script**.
- Une nouvelle fenêtre s'ouvre avec un éditeur de code, un fichier `Code.gs` vide.

### 3. Colle le script

- Ouvre le fichier [`apps-script-backend.gs.txt`](apps-script-backend.gs.txt) (dans ce
  même dossier), copie tout son contenu.
- Colle-le dans `Code.gs` à la place du code par défaut (`function myFunction() {}`).
- `Cmd + S` (ou l'icône disquette) pour enregistrer.

### 4. Déploie le script comme "application web"

- En haut à droite : bouton **Déployer** → **Nouveau déploiement**.
- Clique sur l'icône ⚙️ à côté de "Sélectionner le type" → coche **Application Web**.
- Renseigne :
  - **Exécuter en tant que** : Moi (ton compte)
  - **Qui a accès** : **Tout le monde** (important — sinon le site ne pourra pas
    contacter le script)
- Clique **Déployer**.
- La première fois, Google demande d'autoriser le script → **Autoriser** → choisis ton
  compte → si un écran "Google n'a pas validé cette application" apparaît, clique
  **Paramètres avancés** puis **Accéder à [nom du projet] (non sécurisé)** — c'est ton
  propre script, c'est normal qu'il ne soit pas "vérifié" par Google.
- Une URL apparaît, du genre `https://script.google.com/macros/s/AKfycb.../exec` →
  **copie-la**.

### 5. Renseigne l'URL dans le site

Ouvre [`sheet-config.js`](sheet-config.js) et remplace :
```js
const SHEET_API_URL = "COLLE-TON-URL-ICI";
```
par l'URL copiée à l'étape précédente.

### 6. Mets le site en ligne

Pousse le dossier `site_vote/` sur GitHub Pages (comme avant) — plus rien à configurer
côté GitHub, il n'y a plus de repo à renseigner pour les votes.

## Si tu modifies le script plus tard

Après toute modification du code dans l'éditeur Apps Script, il faut **redéployer** :
Déployer → Gérer les déploiements → icône crayon sur le déploiement existant → Nouvelle
version → Déployer. (L'URL reste la même, pas besoin de la changer dans `sheet-config.js`.)

## Consulter les votes bruts

Ouvre le Google Sheet directement : une ligne par personne (Timestamp, Prénom, Songs).
Pratique pour vérifier ou corriger un vote à la main si besoin.

## Tester en local

Sans configurer `sheet-config.js`, valider un vote affiche automatiquement le repli
WhatsApp/copier-coller — pratique pour tester l'interface (sélection, limite à 10,
lecture audio) avant la mise en route du Sheet.

**Important** : n'ouvre pas `index.html` en double-cliquant dessus (`file://`) — ça ne
charge pas correctement les scripts depuis ce dossier Google Drive. Lance plutôt un
petit serveur local depuis ce dossier :
```
cd site_vote
python3 -m http.server 8000
```
puis va sur `http://localhost:8000` dans le navigateur. Ou encore plus simple : pousse
directement sur GitHub Pages et teste la vraie URL en ligne.

## Titres avec plusieurs noms

Certaines chansons ont changé de nom au fil du temps (souvent entre l'ancienne version et
son remaster 2026). Les deux noms sont affichés entre parenthèses pour que tout le monde
s'y retrouve, par exemple : **Balboa (On My Way)**, **Let It Die (Ternaire)**,
**The Ripper (Trinaire / Triliaire)**, **Modern Times (Johnny Rules)**.

## Chansons à deux versions (ancienne / IA)

7 titres ont à la fois une version originale et un remaster IA 2026 : **A Thousand And
Three Stars**, **Balboa**, **Dead And Gone**, **Let It Die**, **The Ripper** (ces 5
depuis l'EP 2010-2011), **Too Bad** (depuis `Mp3voix/toobad.mp3`) et **It's You**
(depuis `Ky-Lin songs/OWN FAILURE.mp3`). Pour celles-ci, deux lecteurs distincts
s'affichent ("Nouvelle version (IA)" et "Ancienne version") — un seul vote compte pour
la chanson dans son ensemble, indépendamment de la version écoutée.

### Cas non traités en double version (à trancher si besoin)

D'autres titres ont un nom alternatif entre parenthèses mais **une seule vraie version
audio complète** est disponible actuellement :
- **Into The Night (Goodie)** : une ancienne version existe (`Goodie Goodie.mp3`) mais
  elle se trouve hors du dossier `2026_stuff` — à réintégrer si tu veux l'ajouter en
  double version.
- **Upside Down (Enemies)**, **Hear Them Falling (Message)**,
  **Modern Times (Johnny Rules)**, **Everytime** : seule une prise voix seule /
  instrumentale isolée existe comme "ancienne version" (pas un vrai mix complet) — pas
  utilisée ici par souci de comparaison équitable, mais dis-le-moi si tu préfères
  quand même l'avoir en second lecteur.

## Titres retirés (compositions personnelles)

11 titres qui venaient des dossiers `Versions_IA/Morceaux David Ky-lin ready` et
`Versions_IA/Demo maison 2008 et 2009 Gérald Dav` ont été retirés car ce sont des
compositions personnelles (pas d'anciennes chansons Ky-Lin) : Dance With Me, Welcome,
Too Late, Sunset-Love, Don't Pull Me In, Say My Name, Sun That Turns To Grey, Walking On
Your Shoulders, From The Shell, Music, Broken Past.

## Remarques sur les fichiers audio

- Certains titres (`Over`, `I Will Find`, `Breath`) n'existent que sous forme de prise
  voix seule / instrumentale isolée dans les archives — ce sont les meilleurs extraits
  disponibles, mais ce ne sont pas des mixes finaux.
