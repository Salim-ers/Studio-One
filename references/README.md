# Références — ce que tu veux que Studio One génère

Dépose ici tes exemples pour que je calque le style, le rythme et le niveau
« wow » de tes vidéos. Plus tu es précis, plus le résultat sera vendeur.

## Structure

| Dossier | Ce qu'on y met | Pourquoi c'est utile |
|---|---|---|
| `inspiration/` | Vidéos de démo / pubs SaaS que tu trouves excellentes (fichiers courts ou fichier `liens.md` avec des URLs YouTube/Vimeo) | Définit la barre : rythme, transitions, effets, ton |
| `produit/` | Captures d'écran de ton SaaS (auto ou manuelles) | Ce qui sera réellement montré et animé dans la vidéo |
| `marque/` | Logo (PNG/SVG), palette de couleurs, polices, ton de voix | Pour que la vidéo respecte ton identité |
| `scripts-exemples/` | Exemples de voix off / accroches que tu aimes (texte) | Calibrer le style d'écriture du script |

## Capturer automatiquement ton SaaS

Un script se connecte à ton application et capture les écrans clés dans
`produit/`, prêts à être animés dans la vidéo :

```bash
cp capture.config.example.json capture.config.json   # puis édite-le
# identifiants via l'environnement (recommandé, PowerShell) :
$env:CAPTURE_EMAIL="toi@exemple.com"; $env:CAPTURE_PASSWORD="ton-mdp"
npm run capture                 # login automatique
npm run capture -- --manual     # login à la main (2FA, Google…)
```

Dans `capture.config.json` : `baseUrl` (l'URL de ton SaaS), les sélecteurs de
login et la liste des `pages` à capturer. Le fichier et les captures produites
restent **privés** (ignorés par git). Ensuite, glisse ces images dans l'étape
« Assets » du tunnel de création.

## Comment m'aider à viser juste

Pour chaque vidéo d'inspiration, ajoute une ligne dans `inspiration/liens.md` :
- **le lien**
- **ce que tu aimes précisément** : « les transitions rapides à 0:05 »,
  « le compteur animé », « la musique qui monte », « le zoom sur l'écran »…

Pour la marque, si tu as une charte, dépose-la ; sinon indique juste :
- couleurs (codes hex), police souhaitée, et 3 adjectifs (ex. « premium,
  dynamique, tech »).

## Notes techniques

- Les **vidéos lourdes** (>25 Mo) : préfère un lien dans `liens.md` plutôt
  que de committer le fichier, pour garder le dépôt léger.
- Les **captures produit** en pleine résolution donnent le meilleur rendu.
  Masque les données sensibles (emails, noms de clients réels).
