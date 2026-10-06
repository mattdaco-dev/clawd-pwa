# clawd-pwa

PWA locale qui affiche un Clawd par agent Claude Code :

- le Clawd du main, taille et couleur d'origine ;
- un Clawd plus petit et plus clair par subagent.

Chaque Clawd reflète l'état de son agent : il tape au clavier quand il travaille, agite un drapeau
quand il attend un input, se balade et joue quand il n'a rien à faire.

Les états viennent des hooks de Claude Code, envoyés à un petit serveur local qui les diffuse en SSE.

## Lancer

```sh
npm start                          # serveur sur http://localhost:4777
python3 scripts/install-hooks.py   # branche le hook dans ~/.claude/settings.json (sauvegarde avant écriture)
python3 scripts/install-hooks.py --uninstall
```

Ouvrir http://localhost:4777 dans Chrome, puis « Installer l'application » pour en faire une PWA.
La case « Démo » de la vue Live joue un scénario sans Claude Code ; la vue Galerie montre toutes
les animations regroupées par activité.

Le hook garde une copie brute de chaque payload dans `logs/events.jsonl` (5 Mo max, `CLAWD_LOG=0`
pour couper). Il ne bloque jamais Claude : sortie vide, code 0, envoi au serveur détaché.

## Organisation

- `hooks/clawd-hook.sh` : hook Claude Code, transmet le payload au serveur.
- `server.js` : traduit les événements en état par agent (`working`, `waiting`, `idle`) et le diffuse en SSE.
- `public/sprites.js` : toutes les animations, en grilles de pixels composées par code.
- `public/live.js`, `public/gallery.js` : les deux vues.
