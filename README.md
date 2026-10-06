# clawd-pwa

PWA locale qui affiche un Clawd par agent Claude Code :

- le Clawd du main, taille et couleur d'origine ;
- un Clawd plus petit et plus clair par subagent.

Chaque Clawd reflète l'état de son agent : il tape au clavier quand il travaille, agite un drapeau
quand il attend un input, se balade et joue quand il n'a rien à faire.

Les états viennent des hooks de Claude Code, envoyés à un petit serveur local qui les diffuse en SSE.
