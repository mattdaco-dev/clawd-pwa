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
Le bouton rond en haut à gauche ouvre le menu : Live (les vraies sessions), Démo (des sessions
inventées, sans Claude Code) et Galerie (toutes les animations regroupées par activité). La Démo a
sa propre barre de réglages : décor, disposition, taille des pixels, heure, météo, saison, un
bouton pour régénérer le décor, et la liste des sessions. On y ajoute ou ferme des Clawd et des
sous-agents, on les laisse suivre le scénario en boucle ou on force leur état et leur activité, et
on déclenche une erreur d'outil. « Tout au hasard » tire une configuration complète (sauf la taille des pixels), « Réinitialiser »
revient aux réglages du menu et aux trois sessions du scénario. Le même menu
porte les réglages, gardés dans le navigateur :

- Décor : aucun ou open space (la plage viendra ensuite).
- Disposition, avec un décor : « Salles » (une pièce par session, la page défile quand il y en a
  trop) ou « Open space partagé » (un seul bureau, tout le monde partage les postes). Les salles
  forment le plan d'un étage : murs partagés, tailles un peu différentes, bords irréguliers,
  couloirs sous certaines salles (parfois derrière une baie vitrée), passages de tailles variées
  entre voisines et entrée du bâtiment en bas. Les Clawd restent dans leur salle.
- Taille des pixels : de 1 à 6 px, décor compris. Les subagents ont un pixel de moins (à 1 px, la
  même taille).

L'open space suit les vraies heures de lever et de coucher du soleil à Luxembourg, calculées pour le
jour (`public/sun.js`) : lumière rosée au lever, ciel orangé au coucher, nuit étoilée dans les
fenêtres et lampes allumées la nuit. La nuit, un Clawd qui travaille allume sa lumière : lampe de
bureau ou rétroéclairage de l'écran selon le bureau, lampe sur pied près de la bibliothèque et du
tableau blanc. Elle s'éteint quand il s'en va. Une fois la nuit tombée, les Clawd au repos
s'endorment au bout de 30 s au lieu de 2 minutes. Pour voir la nuit en plein jour, ouvrir
`/?heure=22` ; la Démo a des boutons Lever, Jour, Coucher et Nuit réglés sur les heures du jour.

Les fenêtres montrent la météo du moment à Luxembourg (Open-Meteo, sans clé, rafraîchie toutes les
30 min) : nuages, brouillard, pluie, neige, orage avec éclairs. Pour en forcer une :
`/?meteo=pluie` (ou `soleil`, `nuages`, `brouillard`, `neige`, `orage`). Coordonnées dans
`public/weather.js`. En octobre, Halloween : guirlande de fanions et de chauves-souris, toiles
d'araignée, fantôme suspendu, chaudron, citrouilles qui s'allument la nuit. De décembre à
l'Épiphanie, Noël : guirlande lumineuse, couronne sur la porte, chaussettes, neige sur les rebords
des fenêtres, poinsettias et sapin clignotant. À Pâques (des dix jours avant le dimanche jusqu'à
l'Emaischen) : guirlande pastel, œufs suspendus, chasse aux œufs, panier, lapin en chocolat et
lapins de toutes les couleurs qui sautillent. À Halloween, des araignées descendent du plafond ou
courent au sol et un petit fantôme traverse parfois la pièce ; à Noël, un train tourne autour du sapin.
Pendant la Schueberfouer (20 jours à partir du vendredi le plus proche du 24 août) : ampoules de
fête foraine sous des fanions aux couleurs du drapeau, affiche de la grande roue, ballons, nounours.
Environ deux Clawd sur cinq se déguisent selon la saison : chapeau de sorcière, cornes, fantôme,
momie ; bonnet de Père Noël ou d'elfe, bois de renne, pull de Noël ; oreilles de lapin, poussin,
couronne de fleurs ; chapeau de fête, canotier, ballon. `/?saison=paques` (ou `fouer`,
`halloween`, `noel`) pour les voir hors saison, ou le menu de la Démo.

Un outil qui échoue (`PostToolUseFailure`, hors annulation) fait sursauter son Clawd sous une croix
rouge. Après 10 min de travail d'affilée, un Clawd au clavier bâille et s'étire de temps en temps, et
toutes les 30 min il part prendre un café. Pendant une compaction du contexte (`PreCompact` à
`PostCompact`), il passe ses notes à la broyeuse.

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
- `public/weather.js` : la météo affichée aux fenêtres.
- `public/demo.js` : les sessions inventées de la Démo et sa barre de réglages.
- `public/seasons.js` : les décorations de saison ; `public/costumes.js` : les déguisements.
- `public/sun.js` : lever et coucher du soleil ; `public/pixels.js` : les sprites du décor.
- `public/decor.js` : le registre des décors ; un décor fournit le fond, une zone par session avec ses
  postes, les meubles triés en profondeur avec les Clawd et un calque redessiné à chaque image.
- `public/office.js` : le décor open space (salles ou bureau partagé, aménagement tiré au hasard par
  session) et ses postes : bureau
  pour taper, bibliothèque et globe pour chercher et le web, tableau blanc pour réfléchir, avant-scène
  pour attendre un input, coin café (comptoir avec machine, on y boit un café), radio, tapis de jeu
  et poufs pour la sieste. Deux Clawd au repos dans la même zone se retrouvent parfois sur un tapis
  pour une passe de ballon ou un duel à l'épée, devant une radio pour danser, ou au comptoir pour
  discuter tasse en main, chacun son tour avec une bulle (`BallGame`, `SwordDuel`, `DanceDuo`,
  `CoffeeChat` dans `live.js`). Un troisième vient parfois regarder les jeux et applaudit à la fin,
  jamais les discussions. Un Clawd qui finit son travail tape dans la main d'un
  voisin au repos (`HighFive`), et un subagent terminé apporte son rapport à son agent principal.
