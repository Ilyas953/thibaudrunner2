/**
 * Joue une vidéo en plein écran par-dessus le jeu, puis appelle `suite()` quand elle est finie.
 * Si le navigateur bloque la lecture automatique (avant le premier clic de la page),
 * on affiche « Clique pour commencer » et la vidéo démarre au clic.
 */
export function jouerVideo(fichier, suite) {
    const video = document.createElement("video");
    video.src = "sprites/" + encodeURIComponent(fichier);
    video.playsInline = true;
    video.style.cssText =
        "position:fixed;inset:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:1000;";
    document.body.appendChild(video);

    let fini = false;
    const terminer = () => {
        if (fini) return;
        fini = true;
        video.remove();
        bouton?.remove();
        suite();
    };

    video.addEventListener("ended", terminer);
    video.addEventListener("error", terminer); // vidéo introuvable : on ne bloque pas le jeu

    let bouton = null;
    video.play().catch(() => {
        // lecture automatique refusée → on attend un clic
        bouton = document.createElement("div");
        bouton.textContent = "Clique pour commencer";
        bouton.style.cssText =
            "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;" +
            "color:#fff;font:bold 32px sans-serif;background:rgba(0,0,0,.6);cursor:pointer;z-index:1001;";
        document.body.appendChild(bouton);
        bouton.addEventListener("click", () => {
            bouton.remove();
            bouton = null;
            video.play();
        });
    });
}
