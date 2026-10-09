# clawd-pwa

Un petit bureau en pixel art où chaque agent Claude Code est représenté par un Clawd, la mascotte
de Claude Code. Le Clawd tape au clavier quand son agent travaille, lève un drapeau quand il attend
ta réponse, et se balade, joue ou fait la sieste quand il n'a rien à faire.

<p align="center">
  <img src="docs/aucun-decor.png" width="512" height="512" alt="Trois Clawd tapent au clavier à leur bureau ; deux subagents plus petits et plus clairs attendent une réponse, l'un en agitant un drapeau à damier, l'autre sous un point d'exclamation">
</p>

Ci-dessus, la version la plus simple : un bureau par session (`démo`, `api`, `web`). Les trois
agents principaux travaillent ; les petits Clawd plus clairs sont des subagents qui attendent une
réponse, l'un avec son drapeau, l'autre avec sa bulle.

Tout tourne en local : un hook Claude Code, un mini serveur Node sans dépendance et une PWA à
installer depuis Chrome. Le hook ne ralentit pas tes prompts et ne coûte aucun token (détails plus
bas).

## Ce que tu vois

- **Un Clawd par session** Claude Code ouverte, nommé d'après le dossier de lancement (renommable
  depuis sa fiche). Les subagents apparaissent comme des Clawd plus petits et plus clairs, à côté de
  leur agent principal.
- **L'activité réelle de l'agent** : il tape au clavier pour une édition ou une commande, consulte
  la bibliothèque pour une lecture ou une recherche, le globe pour le web, le tableau blanc quand il
  réfléchit ou planifie. Il agite un drapeau quand il attend une permission ou une réponse, sursaute
  sous une croix rouge quand un outil échoue, fête un commit et réagit aux tests verts ou rouges.
  Pendant une compaction du contexte, il passe ses notes à la broyeuse.
- **La vie de bureau entre deux tâches** : café au comptoir (et discussion à deux), passe de ballon,
  duel à l'épée, danse devant la radio, sieste sur un pouf, high five quand un collègue termine. Un
  chat se promène, dort sur les bibliothèques et vient tenir compagnie à celui qui attend.
- **Un décor vivant** : salles en plan d'étage ou open space partagé, extérieur (ville, village,
  campagne, bord de mer ou vaisseau spatial), vraies heures de lever et de coucher du soleil, météo
  du moment aux fenêtres, saisons et fêtes (Halloween, Noël, Pâques, fêtes nationales, plus
  quelques traditions luxembourgeoises comme la Schueberfouer ou le Buergbrennen), avec décorations
  et déguisements.
- **Ce qui t'attend** : le titre de l'onglet et le badge de l'icône comptent les agents qui
  attendent un input. En option, une notification système quand un agent se met à attendre et que
  la PWA n'est pas au premier plan.

Et à partir de là, beaucoup de choses se personnalisent : décor complet, extérieur, taille des
pixels, saison… (voir [Utilisation](#utilisation)).

![Le bureau complet en automne : deux salles décorées pour Halloween dans un village, un Clawd déguisé en fantôme prend un café](docs/decor.png)

Un clic sur un Clawd ouvre sa fiche : dossier, état, outil en cours, depuis quand, subagents,
dernière erreur.

## Comment ça marche

```
Claude Code ──hook──> hooks/clawd-hook.sh ──POST /event──> server.js ──SSE──> PWA (canvas)
                       (en arrière-plan)                    127.0.0.1:4777
```

1. Claude Code déclenche des [hooks](https://docs.claude.com/en/docs/claude-code/hooks) à chaque
   étape d'une session : `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`,
   `PostToolUseFailure`, `PermissionRequest`, `Notification`, `Stop`, `SubagentStart`,
   `SubagentStop`, `PreCompact`, `PostCompact`, `SessionEnd`.
2. `hooks/clawd-hook.sh` reçoit le payload JSON de l'événement sur son entrée standard et l'envoie
   au serveur local avec `curl`.
3. `server.js` traduit ces événements en un état par agent (`working`, `waiting`, `idle`, avec
   l'activité et l'outil en cours) et diffuse un instantané à la PWA en Server-Sent Events.
4. La PWA dessine la scène sur un canvas. Tous les sprites sont des grilles de pixels dessinées dans
   le code (`public/sprites.js`), aucune image n'est chargée.

### Pas de ralentissement

Le hook est déclaré `async` dans `settings.json` : Claude Code le lance et continue sans attendre
sa fin. Le script lui-même rend la main en une dizaine de millisecondes, parce que l'envoi au
serveur part en arrière-plan avec ses flux fermés et un délai maximal d'une seconde. Si le serveur
est arrêté, lent ou absent, rien ne change côté Claude Code : `curl` échoue en silence et le hook
sort toujours avec le code 0.

### Pas de tokens en plus

Les tokens viennent de ce que le modèle lit. Or un hook n'ajoute rien au contexte tant qu'il
n'écrit rien sur sa sortie standard, et celui-ci n'écrit rien : sortie vide, code 0. Le modèle ne
sait même pas que la PWA existe. Le serveur et la PWA n'appellent aucune API de Claude, ils se
contentent d'afficher ce que les hooks leur transmettent.

### Ce qui sort de ta machine

Rien qui concerne tes sessions. Le serveur écoute uniquement sur `127.0.0.1`, et les payloads (qui
contiennent tes prompts et les entrées d'outils en clair) ne sont jamais écrits sur disque, sauf si
tu actives le journal de débogage (`CLAWD_LOG=1`, voir plus bas). La seule requête externe est
celle de la météo : la PWA interroge [Open-Meteo](https://open-meteo.com) (sans clé) toutes les
30 minutes avec les coordonnées de `public/weather.js`.

## Installation

Prérequis : macOS ou Linux, [Node.js](https://nodejs.org) 18 ou plus récent, `curl`, Python 3 pour
les scripts d'installation, et Chrome (ou un navigateur Chromium) pour la PWA. Aucune dépendance npm.

```sh
git clone https://github.com/mattdaco-dev/clawd-pwa.git
cd clawd-pwa
```

### 1. Lancer le serveur

Sur macOS, en service qui démarre à l'ouverture de session et redémarre s'il tombe :

```sh
python3 scripts/install-service.py
```

Le script écrit le chemin absolu de `node` dans un agent launchd (`~/Library/LaunchAgents/local.clawd-pwa.plist`),
parce que launchd ne voit pas nvm. Relance-le après un changement de version de Node. Le journal du
serveur est dans `logs/server.log`.

Sur Linux, ou pour essayer sans service :

```sh
npm start
```

Le port par défaut est 4777, modifiable avec `CLAWD_PORT` (à définir aussi dans l'environnement de
Claude Code pour que le hook suive).

### 2. Brancher le hook

```sh
python3 scripts/install-hooks.py
```

Le script ajoute le hook à `~/.claude/settings.json` pour tous les événements listés plus haut,
sans toucher à tes autres hooks. Il sauvegarde d'abord le fichier
(`settings.json.bak-clawd-<date>`) et peut être relancé sans créer de doublon. Les sessions déjà
ouvertes prennent le hook en compte sans redémarrage.

### 3. Installer la PWA

Ouvre <http://localhost:4777> dans Chrome, puis « Installer l'application » dans la barre
d'adresse (ou le menu ⋮ > Caster, enregistrer et partager > Installer la page en tant
qu'application). Lance une session Claude Code : son Clawd arrive.

### Désinstaller

```sh
python3 scripts/install-hooks.py --uninstall
python3 scripts/install-service.py --uninstall
```

Puis désinstalle la PWA depuis Chrome.

## Utilisation

Le bouton rond en haut à gauche ouvre le menu :

- **Live** : tes vraies sessions.
- **Démo** : trois sessions inventées qui suivent un scénario en boucle, sans Claude Code. Sa barre
  permet de tout essayer : décor, disposition, extérieur, taille des pixels, heure, météo, saison,
  ajout de Clawd et de subagents, état forcé, erreur d'outil, tirage au hasard.
- **Galerie** : toutes les animations, regroupées par activité.
- **Détacher le Live** : la scène passe dans une fenêtre Picture-in-Picture qui reste au-dessus des
  autres et descend jusqu'à 240 px de large, pratique pour la garder dans un coin de l'écran.

Les réglages du menu sont gardés dans le navigateur :

- **Décor** : « Aucun » (les Clawd seuls, avec en option un bureau chacun) ou « Avec » (le bureau
  complet).
- **Disposition** : une salle par session, en plan d'étage avec couloirs et passages, ou un open
  space partagé où tout le monde se partage les postes.
- **Extérieur** : un monde différent chaque jour, ou un monde fixe, ou aucun.
- **Taille des pixels** : de 1 à 6.
- **Notifications** quand un agent attend.

### Paramètres d'URL

Pour voir le décor dans d'autres conditions sans attendre :

| Paramètre | Valeurs |
| --- | --- |
| `?heure=` | une heure de 0 à 23, par exemple `?heure=22` pour la nuit |
| `?meteo=` | `soleil`, `nuages`, `brouillard`, `pluie`, `neige`, `orage` |
| `?saison=` | `printemps`, `ete`, `automne`, `hiver`, `halloween`, `noel`, `paques`, `nouvel-an`, `fouer`, `fuesend`, `buergbrennen`, `kleeschen`, `fete-lu`, `fete-fr`, `fete-be`, `fete-de` |

### Ta ville

La météo, le lever et le coucher du soleil sont calculés pour Luxembourg. Pour ta ville, change
`LAT` et `LON` dans `public/weather.js`.

### Journal de débogage

Avec `CLAWD_LOG=1` dans l'environnement de Claude Code, le hook garde une copie brute de chaque
payload dans `logs/events.jsonl` (5 Mo maximum, puis rotation). Désactivé par défaut, puisque ces
payloads contiennent tes prompts en clair.

## Organisation du code

| Fichier | Rôle |
| --- | --- |
| `hooks/clawd-hook.sh` | Le hook : transmet le payload au serveur, en arrière-plan. |
| `server.js` | Traduit les événements en état par agent et le diffuse en SSE. Sert aussi la PWA. |
| `scripts/install-hooks.py` | Branche ou retire le hook dans `~/.claude/settings.json`. |
| `scripts/install-service.py` | Installe ou retire le service launchd (macOS). |
| `public/app.js` | Menu, réglages, vues, notifications, fenêtre Picture-in-Picture. |
| `public/live.js` | La scène : comportement des Clawd, jeux à plusieurs, fiche d'un agent. |
| `public/sprites.js` | Toutes les animations des Clawd, en grilles de pixels. |
| `public/office.js` | Le décor intérieur : salles, open space, meubles, postes de travail. |
| `public/outdoors.js` | Les extérieurs. |
| `public/seasons.js`, `public/costumes.js` | Décorations de saison, fêtes et déguisements. |
| `public/sun.js`, `public/weather.js` | Lever et coucher du soleil, météo. |
| `public/cat.js` | Le chat. |
| `public/demo.js` | Les sessions inventées de la Démo et sa barre de réglages. |

## Crédits

Projet de fan, non officiel et sans lien avec Anthropic. Clawd et Claude Code appartiennent à
Anthropic ; les sprites de ce dépôt sont redessinés à la main en pixel art.

## Licence

Code sous licence [MIT](LICENSE). Elle couvre le code et les sprites redessinés de ce dépôt, pas le
personnage de Clawd ni les marques d'Anthropic.
