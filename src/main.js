import kaplay from "kaplay";

const tile = 16; // une case = 16 × 16 pixels
const maps = 64; // la map fait 64 × 64 cases = 1024 × 1024 pixels

const k = kaplay({
    width: maps * tile,
    height: maps * tile,
    stretch: true, // la map s'adapte à la taille de la fenêtre
    letterbox: true, // sans être déformée
    background: [40, 38, 48],
});

k.loadRoot("./");
k.loadSprite("perso", "sprites/thibaudrunner-personnage.png");
k.loadSprite("garde", "sprites/thibaud.jpeg");
k.loadSprite("tesla", "sprites/images.jpeg");

// ─── Petits outils ───

/** Centre (en pixels) de la case (x, y). */
function centre(x, y) {
    return k.vec2(x * tile + tile / 2, y * tile + tile / 2);
}

/** Un mur : rectangle gris solide. x, y, largeur, hauteur sont en CASES. */
function mur(x, y, largeur, hauteur) {
    if (largeur <= 0 || hauteur <= 0) return; // rien à dessiner
    k.add([
        k.rect(largeur * tile, hauteur * tile),
        k.pos(x * tile, y * tile),
        k.color(100, 100, 110),
        k.area(),
        k.body({ isStatic: true }),
        "mur",
    ]);
}

/** Un mur, mais avec un trou d'une case là où il y a la porte. */
function murAvecTrou(x, y, largeur, hauteur, porte) {
    const [px, py] = porte;
    const porteDansCeMur = px >= x && px < x + largeur && py >= y && py < y + hauteur;

    if (!porteDansCeMur) {
        mur(x, y, largeur, hauteur);
    } else if (hauteur === 1) {
        // mur horizontal : un morceau à gauche de la porte, un à droite
        mur(x, y, px - x, 1);
        mur(px + 1, y, x + largeur - px - 1, 1);
    } else {
        // mur vertical : un morceau au-dessus de la porte, un en dessous
        mur(x, y, 1, py - y);
        mur(x, py + 1, 1, y + hauteur - py - 1);
    }
}

// ─── Les salles ───
// Pour chaque salle : sa taille, la case de sa porte, la case de sa clé.
const salles = [
    { n: 4, porte: [33, 31], cle: [32, 32] }, // porte à droite
    { n: 8, porte: [31, 35], cle: [29, 29] }, // porte en bas
    { n: 16, porte: [24, 32], cle: [37, 26] }, // porte à gauche
    { n: 32, porte: [40, 16], cle: [44, 44] }, // porte en haut
    { n: 64, porte: [63, 20], cle: [5, 58], sortie: true }, // porte à droite = la sortie
];

for (const salle of salles) {
    const n = salle.n;
    const d = (maps - n) / 2; // première case de la salle (4 → 30, 8 → 28, ..., 64 → 0)
    const f = d + n - 1; // dernière case de la salle (4 → 33, 8 → 35, ..., 64 → 63)

    // les 4 murs
    murAvecTrou(d, d, n, 1, salle.porte); // haut
    murAvecTrou(d, f, n, 1, salle.porte); // bas
    murAvecTrou(d, d + 1, 1, n - 2, salle.porte); // gauche
    murAvecTrou(f, d + 1, 1, n - 2, salle.porte); // droite

    // la porte : carré marron solide, dans le trou du mur
    const [px, py] = salle.porte;
    k.add([
        k.rect(tile, tile),
        k.pos(px * tile, py * tile),
        k.color(120, 78, 40),
        k.area(),
        k.body({ isStatic: true }),
        "porte",
        salle.sortie ? "sortie" : "porte-normale",
    ]);

    // la clé : rond jaune, on peut passer dessus
    const [cx, cy] = salle.cle;
    k.add([k.circle(4), k.pos(centre(cx, cy)), k.color(250, 205, 60), k.area(), "cle"]);
}

// ─── Les gardes ───
// Un garde fait des allers-retours entre la case (x1, y1) et la case (x2, y2).
// rayon = rayon de vision en pixels : si on entre dedans, on est repéré.
function garde(x1, y1, x2, y2, vitesse, rayon = 32) {
    const a = centre(x1, y1);
    const b = centre(x2, y2);
    let cible = b;

    const g = k.add([
        k.sprite("garde", { width: 14, height: 14 }),
        k.pos(a),
        k.anchor("center"),
        k.area({ scale: 0.85 }),
        k.z(2),
        "garde",
        { rayon },
    ]);

    // la zone de vision : un disque rouge transparent qui suit le garde
    const zone = k.add([k.circle(rayon), k.pos(a), k.color(255, 60, 60), k.opacity(0.2), k.z(1)]);
    g.onDestroy(() => zone.destroy());

    g.onUpdate(() => {
        g.moveTo(cible, vitesse);
        zone.pos = g.pos;
        zone.opacity = enTesla ? 0 : 0.2; // en Tesla, les gardes ne voient plus rien
        if (g.pos.dist(cible) < 1) cible = cible === a ? b : a; // arrivé → demi-tour
    });
}

garde(26, 37, 37, 37, 40, 22); // salle 16 : en bas (couloir étroit → petit rayon)
garde(37, 29, 37, 37, 35, 22); // salle 16 : à droite
garde(18, 20, 18, 44, 50); // salle 32 : à gauche
garde(20, 45, 44, 45, 50); // salle 32 : en bas, juste sous la clé
garde(43, 20, 43, 40, 55); // salle 32 : à droite
garde(20, 20, 44, 20, 55); // salle 32 : en haut
garde(3, 10, 60, 10, 60); // salle 64 : en haut
garde(10, 52, 54, 52, 60); // salle 64 : en bas
garde(55, 5, 55, 58, 60);
garde(54, 10, 55, 58, 60);
garde(8, 15, 8, 50, 70); // salle 64 : à gauche
garde(2, 30, 14, 30, 50); // salle 64 : à gauche, en travers
garde(20, 58, 45, 58, 70); // salle 64 : tout en bas
garde(49, 25, 61, 25, 50); // salle 64 : à droite, près de la sortie

const totalGardes = k.get("garde").length;

// ─── La Tesla Model Y : cachée dans le dernier niveau (salle 64) ───
const tesla = k.add([
    k.sprite("tesla", { width: 20, height: 20 }),
    k.pos(centre(5, 5)), // tout en haut à gauche, derrière la ligne du garde
    k.anchor("center"),
    k.area({ scale: 0.6 }),
    "tesla",
]);
// petite animation pour qu'on la remarque
tesla.onUpdate(() => {
    tesla.scale = k.vec2(1 + Math.sin(k.time() * 4) * 0.08);
});

// ─── Le personnage ───
let depart = centre(31, 31); // là où on revient si un garde nous touche
let cles = 0; // nombre de clés en poche
let gagne = false;
let enTesla = false; // true quand on a trouvé la Tesla

const player = k.add([
    k.sprite("perso", { width: 12, height: 12 }),
    k.pos(depart),
    k.anchor("center"),
    k.area({ scale: 0.8 }),
    k.body(),
    k.z(10),
]);

// Toucher une clé : on la ramasse
player.onCollide("cle", (cle) => {
    cle.destroy();
    cles++;
});

// Toucher la Tesla : le personnage devient la Tesla Model Y
player.onCollide("tesla", (t) => {
    t.destroy();
    enTesla = true;
    player.use(k.sprite("tesla", { width: 20, height: 20 }));
    player.area.scale = k.vec2(0.6); // on ne remet pas area() : body() en a besoin (sinon crash)
    message("Tesla Model Y ! Écrase tous les gardes !");
});

// Toucher une porte : elle s'ouvre si on a une clé
player.onCollide("porte", (porte) => {
    // la sortie reste fermée tant qu'il reste des gardes
    if (porte.is("sortie") && k.get("garde").length > 0) {
        message(enTesla ? "Il reste des gardes à écraser !" : "Trouve la Tesla et écrase les gardes !");
        return;
    }
    if (cles === 0) return;
    cles--;
    depart = porte.pos.add(tile / 2, tile / 2); // on reviendra ici si on se fait attraper
    porte.destroy();
});

// Toucher un garde : en Tesla on l'écrase, sinon retour à la dernière porte ouverte
player.onCollide("garde", (g) => {
    if (enTesla) {
        g.destroy();
        k.shake(3);
        if (k.get("garde").length === 0) message("Tous les gardes sont KO ! File à la sortie !");
        return;
    }
    attrape();
});

// Repéré ou touché : retour à la dernière porte ouverte
function attrape() {
    player.pos = depart.clone();
    k.shake(5);
}

// ─── Texte en haut à gauche (fixed = ne bouge pas avec la caméra) ───
const info = k.add([k.text("", { size: 32 }), k.pos(20, 20), k.fixed(), k.z(100)]);

// Message temporaire au centre de l'écran
let bulle = null;
function message(texte) {
    if (bulle) bulle.destroy();
    bulle = k.add([
        k.text(texte, { size: 40, width: k.width() - 80, align: "center" }),
        k.pos(k.width() / 2, k.height() / 4),
        k.anchor("center"),
        k.color(255, 230, 120),
        k.fixed(),
        k.z(100),
        k.lifespan(2.5, { fade: 0.5 }),
        k.opacity(1),
    ]);
}

// ─── Déplacement + caméra : une seule fonction, appelée à chaque image ───
const vitesse = 80; // pixels par seconde à pied
const vitesseTesla = 170; // pixels par seconde en Tesla

k.onUpdate(() => {
    let dx = 0;
    let dy = 0;

    // on regarde quelles touches sont enfoncées MAINTENANT
    if (k.isKeyDown("left") || k.isKeyDown("q")) dx = -1;
    if (k.isKeyDown("right") || k.isKeyDown("d")) dx = 1;
    if (k.isKeyDown("up") || k.isKeyDown("z")) dy = -1;
    if (k.isKeyDown("down") || k.isKeyDown("s")) dy = 1;

    // aucune touche → dx = 0 et dy = 0 → le personnage ne bouge pas
    const v = enTesla ? vitesseTesla : vitesse;
    player.move(dx * v, dy * v);

    // entrer dans le rayon d'un garde = repéré (sauf en Tesla)
    if (!enTesla) {
        for (const g of k.get("garde")) {
            if (player.pos.dist(g.pos) < g.rayon) {
                attrape();
                message("Repéré !");
                break;
            }
        }
    }
    if (dx !== 0) player.flipX = dx < 0; // regarde dans le sens de la marche

    // la caméra est toujours pile sur le personnage
    k.setCamPos(player.pos);

    const restants = k.get("garde").length;
    info.text = "Clés : " + cles + "   Gardes : " + restants + "/" + totalGardes;

    // sorti de la map par la droite = évadé
    if (!gagne && player.pos.x > maps * tile && k.get("garde").length === 0) {
        gagne = true;
        k.add([
            k.text("Tu es libre !", { size: 64 }),
            k.pos(k.width() / 2, k.height() / 2),
            k.anchor("center"),
            k.color(120, 220, 140),
            k.fixed(),
            k.z(100),
        ]);
        // après 10 secondes, on recharge la page = la partie recommence à zéro
        k.wait(10, () => location.reload());
    }
});

k.setCamScale(3); // zoom ×3 : on voit environ 21 cases de large
