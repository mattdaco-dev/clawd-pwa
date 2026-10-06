# clawd-pwa

PWA locale qui affiche un Clawd par agent Claude Code :

- le Clawd du main, taille et couleur d'origine ;
- un Clawd plus petit et plus clair par subagent.

Chaque Clawd reflète l'état de son agent : il tape au clavier quand il travaille, agite un drapeau
quand il attend un input, se balade et joue quand il n'a rien à faire.

Les états viennent des hooks de Claude Code, envoyés à un petit serveur local qui les diffuse en SSE.

## Lancer

```sh
python3 scripts/install-service.py   # serveur en agent launchd : démarre au login, relancé s'il tombe
python3 scripts/install-hooks.py     # branche le hook dans ~/.claude/settings.json (sauvegarde avant écriture)
```

Les deux scripts acceptent `--uninstall`. Pour lancer le serveur à la main à la place : `npm start`.

Le service écrit le chemin absolu de `node` dans le plist (launchd ne voit pas nvm) : relancer
`install-service.py` après un changement de version de Node. Journal du serveur : `logs/server.log`.

Ouvrir http://localhost:4777 dans Chrome, puis « Installer l'application » pour en faire une PWA.
Le bouton rond en haut à gauche ouvre le menu : Live (les vraies sessions), Démo (un scénario en
boucle sans Claude Code) et Galerie (toutes les animations regroupées par activité). Le même menu
porte les réglages, gardés dans le navigateur :

- Décor : aucun ou open space (la plage viendra ensuite).
- Disposition, avec un décor : « Salles » (une pièce de taille fixe par session, en grille ; la page
  défile quand il y en a trop) ou « Open space partagé » (un seul bureau, tout le monde partage les
  postes).
- Taille des pixels : de 3 à 6 px, décor compris. Les subagents ont toujours un pixel de moins.

L'open space suit l'heure locale : ciel orangé au coucher du soleil, nuit étoilée dans les fenêtres
et lampes allumées de 21 h à 6 h. Après 20 h, les Clawd au repos s'endorment au bout de 30 s au lieu
de 2 minutes. Pour voir la nuit en plein jour, ouvrir `/?heure=22`.

Le titre de l'onglet et l'icône de la PWA installée affichent le nombre d'agents qui attendent un
input.

Avec `CLAWD_LOG=1`, le hook garde une copie brute de chaque payload dans `logs/events.jsonl`
(5 Mo max). Coupé par défaut : les payloads contiennent les prompts et les entrées d'outils en
clair. Le hook est déclaré `async`, il ne bloque jamais Claude : sortie vide, code 0.

## Organisation

- `hooks/clawd-hook.sh` : hook Claude Code, transmet le payload au serveur.
- `server.js` : traduit les événements en état par agent (`working`, `waiting`, `idle`) et le diffuse en SSE.
- `public/sprites.js` : toutes les animations, en grilles de pixels composées par code.
- `public/live.js` : la scène plein écran (vues Live et Démo), `public/gallery.js` : la galerie.
- `public/decor.js` : le registre des décors ; un décor fournit le fond, une zone par session avec ses
  postes, les meubles triés en profondeur avec les Clawd et un calque redessiné à chaque image.
- `public/office.js` : le décor open space (salles ou bureau partagé, aménagement tiré au hasard par
  session) et ses postes : bureau
  pour taper, bibliothèque et globe pour chercher et le web, tableau blanc pour réfléchir, avant-scène
  pour attendre un input, café, radio, tapis de jeu et poufs pour la sieste. Deux Clawd au repos dans
  la même zone se retrouvent parfois sur un tapis pour une passe de ballon ou un duel à l'épée, ou
  devant une radio pour danser (`BallGame`, `SwordDuel`, `DanceDuo` dans `live.js`). Un troisième
  vient parfois regarder et applaudit à la fin. Un Clawd qui finit son travail tape dans la main d'un
  voisin au repos (`HighFive`), et un subagent terminé apporte son rapport à son agent principal.
