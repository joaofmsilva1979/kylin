# Ky-Lin — Site de vote setlist

Site statique (HTML/CSS/JS, aucun serveur nécessaire). Chaque musicien renseigne son
prénom, écoute un extrait de chaque chanson, et choisit exactement 8 titres. En cliquant
sur "Valider mon vote", une page GitHub "Nouvelle Issue" pré-remplie s'ouvre dans un
nouvel onglet ; il ne reste qu'à cliquer sur "Submit new issue" pour envoyer le vote.
Tous les votes apparaissent ensuite dans l'onglet **Issues** du repo GitHub.

## Structure du dossier

```
site_vote/
├── index.html      page principale
├── style.css       mise en forme
├── app.js          logique (sélection, limite à 8, envoi du vote)
├── config.js       à modifier avant mise en ligne (voir ci-dessous)
├── songs.js        liste des 42 chansons + titres affichés
└── audio/          extraits mp3 (et wav quand disponible) de chaque chanson
```

## Mise en route (obligatoire avant de partager le lien)

1. Crée un repo GitHub (public ou privé, peu importe — juste pour recevoir les Issues).
2. Ouvre `config.js` et remplace :
   ```js
   const GITHUB_REPO = "TON-COMPTE/TON-REPO";
   ```
   par ton repo, par exemple `"joaosilva/ky-lin-vote"`.
3. Mets le dossier `site_vote/` en ligne, par exemple avec **GitHub Pages** :
   - pousse ce dossier dans le repo (ou dans un repo dédié à l'hébergement du site)
   - Settings → Pages → choisis la branche/dossier à publier
   - le site sera accessible via une URL du type `https://ton-compte.github.io/ton-repo/`
4. Chaque musicien qui vote doit avoir un compte GitHub gratuit (nécessaire pour
   soumettre l'Issue). S'il n'en a pas, il peut en créer un en 30 secondes sur
   github.com.

## Consulter les votes

Onglet **Issues** du repo GitHub → chaque Issue = un vote, avec le prénom en titre et
la liste des 8 chansons dans le corps du message. Le label `vote` est appliqué
automatiquement pour les filtrer facilement (crée ce label dans le repo si besoin,
sinon GitHub l'ignore silencieusement).

## Tester en local avant de mettre en ligne

Sans configurer `config.js`, cliquer sur "Valider" affiche une alerte expliquant que le
repo n'est pas configuré — pratique pour tester l'interface (sélection, limite à 8,
lecture audio) avant la mise en ligne définitive.

Pour lancer en local : ouvrir `index.html` directement dans un navigateur, ou lancer un
petit serveur local depuis ce dossier (`python3 -m http.server`) puis aller sur
`http://localhost:8000`.

## Titres avec plusieurs noms

Certaines chansons ont changé de nom au fil du temps (souvent entre l'ancienne version et
son remaster 2026). Les deux noms sont affichés entre parenthèses pour que tout le monde
s'y retrouve, par exemple : **Balboa (On My Way)**, **Let It Die (Ternaire)**,
**The Ripper (Trinaire / Triliaire)**, **Modern Times (Johnny Rules)**.

## Remarques sur les fichiers audio

- Certains titres (`Over`, `Xmas Tree`, `I Will Find`, `Breath`) n'existent que sous
  forme de prise voix seule / instrumentale isolée dans les archives — ce sont les
  meilleurs extraits disponibles, mais ce ne sont pas des mixes finaux.
- Quand un fichier wav existe en plus du mp3 (versions album/EP), il a aussi été copié
  dans `audio/` pour archivage, mais seul le mp3 est utilisé dans le lecteur du site
  (plus léger, chargement plus rapide).
