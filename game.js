const canvas = document.querySelector("#game"), ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score"),
    stageEl = document.querySelector("#stage"),
    overlay = document.querySelector("#overlay"),
    startBtn = document.querySelector("#start"),
    pauseBtn = document.querySelector("#pause"),
    continueBtn = document.querySelector("#continue"),
    progressEl = document.querySelector("#progress"),
    speedEl = document.querySelector("#speed");
const runSprite = new Image(),
    jungkook = new Image(),
    rm = new Image(),
    jhope = new Image(),
    jin = new Image(),
    suga = new Image(),
    tae = new Image(),
    misterLeeSprite = new Image(),
    bomb = new Image(),
    rival = new Image();
runSprite.src = "images/sprites/jiminie-run.png";
jungkook.src = "images/sprites/kookie-run.png";
rm.src = "images/sprites/namu-run.png";
jhope.src = "images/sprites/hobi-run.png";
jin.src = "images/sprites/jino-run.png";
suga.src = "images/sprites/yuno-run.png";
tae.src = "images/sprites/taeo-run.png";
misterLeeSprite.src = "images/sprites/mister-lee-run.png";
bomb.src = "images/sprites/army-bomb.png";
rival.src = "images/sprites/rival.png";
const scenery = new Image();
scenery.src = "images/backgrounds/starlit-valley.webp";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const previewCanvas = document.querySelector("#preview-canvas"),
    previewCtx = previewCanvas.getContext("2d");
const BOMBS_PER_STAGE = 5;
// Hidden from the roster until the secret code is entered.
const MISTER_LEE = Object.freeze({
    name: "MISTER LEE",
    portrait: "images/portraits/mister-lee-portrait.png",
    sprite: misterLeeSprite,
    runFrames: [0, 1, 3, 1],
    jumpFrame: 2,
    frames: [
        [10, 125, 490, 660],
        [490, 125, 490, 660],
        [980, 125, 440, 660],
        [1420, 125, 520, 660],
    ],
    duration: 7,
    entranceDuration: 1.8,
    exitDuration: .55,
    jumpFootOffset: 30,
});
function boyCharacter(name, portrait, sprite, first, second, fourth, jumpFootOffset) {
    return {
        name, portrait: `images/portraits/${portrait}-portrait.png`, sprite,
        frames: [first, second, [850, 100, 410, 550], fourth],
        runFrames: [0, 1, 3, 1], jumpFrame: 2, jumpFootOffset,
    };
}
const CHARACTERS = {
    rm: boyCharacter("NAMU", "namu", rm,
        [0, 130, 440, 550], [418, 130, 440, 550], [1256, 130, 440, 550], 30),
    jin: boyCharacter("JINO", "jino", jin,
        [0, 130, 440, 550], [416, 130, 440, 550], [1248, 130, 440, 550], 28),
    suga: boyCharacter("YUNO", "yuno", suga,
        [0, 130, 440, 550], [418, 130, 440, 550], [1236, 130, 440, 550], 30),
    jhope: boyCharacter("HOBI", "hobi", jhope,
        [0, 130, 440, 550], [410, 130, 440, 550], [1244, 130, 440, 550], 33),
    jimin: {
        ...boyCharacter("JIMINIE", "jiminie", runSprite,
            [0, 55, 440, 620], [423, 55, 440, 620], [1275, 55, 440, 620], 33),
        frames: [[0, 55, 440, 620], [423, 55, 440, 620],
            [850, 55, 410, 620], [1275, 55, 440, 620]],
    },
    tae: boyCharacter("TAEO", "taeo", tae,
        [0, 130, 440, 550], [414, 130, 440, 550], [1260, 130, 440, 550], 30),
    jungkook: boyCharacter("KOOKIE", "kookie", jungkook,
        [0, 130, 440, 550], [440, 130, 410, 550], [1270, 130, 410, 550], 34),
    misterlee: MISTER_LEE,
};
const BOYS = ["rm", "jin", "suga", "jhope", "jimin", "tae", "jungkook"];
function characterFrame(character, phase, airborne = false) {
    return character.frames[airborne ? character.jumpFrame
        : character.runFrames[Math.floor(phase) % character.runFrames.length]];
}
const leeEntrance = document.querySelector("#lee-entrance"),
    leeStatus = document.querySelector("#lee-status"),
    leeTime = document.querySelector("#lee-time"),
    leeMeter = document.querySelector("#lee-meter");
document.querySelector("#lee-portrait").src = MISTER_LEE.portrait;
let escort = null, audioContext = null;
let W = 480;
const H = 700, G = 560;
const wide = matchMedia("(min-width: 700px) and (pointer: fine)");
function playerStartX() {
    return Math.min(190, Math.max(75, Math.round(W * .4)));
}
function resize() {
    W = Math.max(
        1,
        Math.round(
            H * (canvas.clientWidth || 480) / (canvas.clientHeight || 700),
        ),
    );
    canvas.width = W;
    canvas.height = H;
    if (player) {
        player.x = playerStartX();
        draw();
    }
}
wide.addEventListener("change", resize);
window.addEventListener("resize", resize);
let best = 0;
try {
    best = Number(localStorage.getItem("purpleBest")) || 0;
} catch {}
document.querySelector("#best").textContent = best;
let selectedCharacter = "jimin", showingSelection = true;
let misterLeeUnlocked = false, secretSequence = "";
try {
    misterLeeUnlocked = localStorage.getItem("sevenStarsMisterLeeUnlocked") === "true";
} catch {}
function revealMisterLee() {
    document.querySelector("#misterlee-choice").hidden = !misterLeeUnlocked;
    if (misterLeeUnlocked) {
        document.querySelector("#characters").style.setProperty("--character-columns", "8");
    }
}
revealMisterLee();
let continuesLeft = 3,
    hearts = 3,
    invulnerable = 0,
    powerTime = 0,
    nextGold = 16;
let continueTimer = null, continueTicker = null;
let running = false,
    paused = false,
    last = 0,
    time = 0,
    score = 0,
    distance = 0,
    player,
    platforms,
    ledges,
    nextLedge,
    items,
    nextItem,
    pickupEffects,
    impactEffects,
    enemies,
    nextEnemy,
    stage = 1;
const tintCanvas = document.createElement("canvas");
tintCanvas.width = 490;
tintCanvas.height = 1010;
const tintCtx = tintCanvas.getContext("2d");
function updatePowerHUD() {
    const allyName = escort ? escort.character.name : "ALIADO";
    let indicator = document.querySelector("#power");
    indicator.hidden = powerTime <= 0;
    indicator.textContent = "✦ " + allyName + " · " + Math.ceil(powerTime) + "s";
    indicator.setAttribute(
        "aria-label",
        "Protección de " + allyName + ": " + Math.ceil(powerTime) + " segundos",
    );
    leeStatus.hidden = powerTime <= 0 || !escort;
    leeTime.textContent = Math.ceil(powerTime) + "s";
    leeMeter.style.transform = `scaleX(${powerTime / MISTER_LEE.duration})`;
    leeEntrance.hidden = !escort || escort.age >= MISTER_LEE.entranceDuration;
    if (escort) {
        const fade = Math.min(1, escort.age / .16,
            (MISTER_LEE.entranceDuration - escort.age) / .3);
        leeEntrance.style.opacity = Math.max(0, fade);
    }
}
function safeStart() {
    hearts = 3;
    invulnerable = 0;
    powerTime = 0;
    escort = null;
    document.querySelector("#lee-announcement").textContent = "";
    nextGold = 16;
    updatePowerHUD();
    player = { x: playerStartX(), y: G, vy: 0, grounded: true, jumps: 0 };
    platforms = [{ x: -100, w: 1000 }, { x: 990, w: 750 }, { x: 1830, w: 750 }];
    ledges = [];
    nextLedge = 400;
    pickupEffects = [];
    impactEffects = [];
    items = [];
    nextItem = 300;
    enemies = [];
    nextEnemy = 700;
}
function speedForStage(level) {
    return Math.min(360, 225 + (level - 1) * 18);
}
function showProgress() {
    const heartsEl = document.querySelector("#hearts");
    heartsEl.innerHTML = Array.from(
        { length: 3 },
        (_, i) => i < hearts ? "♥" : '<span class="empty">♥</span>',
    ).join(" ");
    heartsEl.setAttribute(
        "aria-label",
        hearts + " " + (hearts === 1 ? "corazón" : "corazones"),
    );
    document.querySelector("#lives").textContent = "↻ " + continuesLeft;
    scoreEl.textContent = score;
    progressEl.textContent = `${score % BOMBS_PER_STAGE}/${BOMBS_PER_STAGE}`;
    document.querySelector("#stage-fill").style.width =
        ((score % BOMBS_PER_STAGE) / BOMBS_PER_STAGE * 100) + "%";
    stageEl.textContent = String(1 + Math.floor(score / BOMBS_PER_STAGE))
        .padStart(2, "0");
    speedEl.textContent =
        (speedForStage(1 + Math.floor(score / BOMBS_PER_STAGE)) / 225).toFixed(
            1,
        )
            .replace(".", ",") + "×";
}
function cancelContinueCountdown() {
    if (continueTimer !== null) clearTimeout(continueTimer);
    if (continueTicker !== null) clearInterval(continueTicker);
    continueTimer = null;
    continueTicker = null;
}
function reset() {
    cancelContinueCountdown();
    continuesLeft = 3;
    score = 0;
    distance = 0;
    time = 0;
    stage = 1;
    safeStart();
    showProgress();
}
function jump() {
    if (running && !paused && player.jumps < 2) {
        player.vy = player.jumps === 0 ? -650 : -590;
        player.jumps++;
        player.grounded = false;
    }
}
function selectCharacter(name) {
    if (!Object.hasOwn(CHARACTERS, name) || (name === "misterlee" && !misterLeeUnlocked)) return;
    selectedCharacter = name;
    for (
        const id of Object.keys(CHARACTERS)
    ) {
        const choice = document.querySelector("#" + id + "-choice"),
            active = id === name;
        choice.setAttribute("aria-pressed", String(active));
        choice.querySelector("small").textContent = active
            ? "SELECCIONADO ✓"
            : "SELECCIONAR";
    }
    document.querySelector("#selected-name").textContent = CHARACTERS[name].name;
    startBtn.textContent = "¡JUGAR!";
}
function showSelection() {
    cancelContinueCountdown();
    showingSelection = true;
    secretSequence = "";
    document.querySelector("#secret-unlock").hidden = false;
    document.querySelector("#secret-unlock").open = false;
    document.querySelector("#secret-code").value = "";
    document.querySelector("#unlock-message").textContent = "";
    document.querySelector("#fighter-preview").hidden = false;
    document.querySelector("#characters").hidden = false;
    requestAnimationFrame(animatePreview);
    document.querySelector("#eyebrow").textContent = "ESCOGE TU PERSONAJE";
    document.querySelector("#title").innerHTML = "SEVEN STARS";
    document.querySelector("#description").textContent =
        "Elige tu personaje y prepárate para correr.";
    continueBtn.hidden = true;
    selectCharacter(selectedCharacter);
}
let startingRun = false;
function start() {
    if (startingRun || switchingScene) return;
    if (!showingSelection) {
        showSelection();
        return;
    }
    showingSelection = false;
    reset();
    resumeRun();
}
function continueRun() {
    if (continuesLeft <= 0 || running || startingRun) return;
    cancelContinueCountdown();
    continuesLeft--;
    safeStart();
    showProgress();
    resumeRun();
}
async function resumeRun() {
    if (startingRun || running) return;
    startingRun = true;
    prepareAudio();
    continueBtn.hidden = true;
    paused = false;
    last = 0;
    overlay.hidden = true;
    pauseBtn.hidden = true;
    document.querySelector("#paused").hidden = true;
    draw();

    const countdown = document.querySelector("#start-countdown");
    const value = document.querySelector("#countdown-value");
    countdown.hidden = false;
    countdown.focus({ preventScroll: true });
    for (const step of ["3", "2", "1", "¡GO!"]) {
        value.textContent = step;
        countdown.classList.toggle("countdown-go", step === "¡GO!");
        if (!reducedMotion.matches) {
            value.animate(
                [
                    { opacity: 0, transform: "scale(.8)" },
                    { opacity: 1, transform: "scale(1)" },
                ],
                { duration: 250, easing: "ease-out" },
            );
        }
        await new Promise((resolve) =>
            setTimeout(resolve, step === "¡GO!" ? 550 : 1000)
        );
    }
    countdown.hidden = true;
    startingRun = false;
    running = true;
    pauseBtn.hidden = false;
    pauseBtn.textContent = "Ⅱ";
    pauseBtn.setAttribute("aria-label", "Pausar juego");
    pauseBtn.focus({ preventScroll: true });
    requestAnimationFrame(loop);
}
let switchingScene = false;
async function openCharacterSelection() {
    if (switchingScene || document.querySelector("#welcome").hidden) return;
    switchingScene = true;
    const game = document.querySelector(".game");
    const curtain = document.querySelector("#scene-transition");
    game.inert = true;
    curtain.hidden = false;

    async function fade(from, to, duration) {
        if (reducedMotion.matches) {
            curtain.style.opacity = to;
            return;
        }
        const animation = curtain.animate(
            [{ opacity: from }, { opacity: to }],
            { duration, easing: "ease-in-out", fill: "forwards" },
        );
        await animation.finished;
        curtain.style.opacity = to;
        animation.cancel();
    }

    try {
        await fade(0, 1, 350);
        document.querySelector("#welcome").hidden = true;
        distance = 0;
        draw();
        overlay.hidden = false;
        showSelection();
        await fade(1, 0, 450);
    } finally {
        curtain.hidden = true;
        game.inert = false;
        switchingScene = false;
        document.querySelector("#" + selectedCharacter + "-choice").focus();
    }
}
document.querySelector("#welcome-play").addEventListener(
    "click",
    openCharacterSelection,
);
document.querySelector("#jimin-choice").addEventListener(
    "click",
    () => selectCharacter("jimin"),
);
document.querySelector("#jungkook-choice").addEventListener(
    "click",
    () => selectCharacter("jungkook"),
);
document.querySelector("#rm-choice").addEventListener(
    "click",
    () => selectCharacter("rm"),
);
document.querySelector("#jhope-choice").addEventListener(
    "click",
    () => selectCharacter("jhope"),
);
document.querySelector("#jin-choice").addEventListener(
    "click",
    () => selectCharacter("jin"),
);
document.querySelector("#suga-choice").addEventListener(
    "click",
    () => selectCharacter("suga"),
);
document.querySelector("#tae-choice").addEventListener(
    "click",
    () => selectCharacter("tae"),
);
document.querySelector("#misterlee-choice").addEventListener(
    "click", () => selectCharacter("misterlee"),
);
function selectionIsOpen() {
    return showingSelection && !overlay.hidden &&
        document.querySelector("#welcome").hidden && !switchingScene && !startingRun;
}
function unlockMisterLee() {
    if (!selectionIsOpen()) return;
    misterLeeUnlocked = true;
    try {
        localStorage.setItem("sevenStarsMisterLeeUnlocked", "true");
    } catch {}
    revealMisterLee();
    secretSequence = "";
    selectCharacter("misterlee");
    document.querySelector("#secret-unlock").open = false;
    document.querySelector("#secret-code").value = "";
    document.querySelector("#unlock-message").textContent = "✦ MISTER LEE DESBLOQUEADO";
    document.querySelector("#misterlee-choice").focus();
    prepareAudio();
    playLeeFanfare();
}
document.querySelector("#secret-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!selectionIsOpen()) return;
    const code = document.querySelector("#secret-code").value.trim().toLowerCase();
    if (code === "misterlee") unlockMisterLee();
    else document.querySelector("#unlock-message").textContent = "Código no reconocido.";
});
document.querySelector("#secret-code").addEventListener("input", (event) => {
    if (event.target.value.trim().toLowerCase() === "misterlee") unlockMisterLee();
});
startBtn.addEventListener("click", start);
continueBtn.addEventListener("click", continueRun);
canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    jump();
});
window.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, [contenteditable='true']")) return;
    if (selectionIsOpen() && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key.length === 1) {
            secretSequence = (secretSequence + e.key.toLowerCase()).slice(-9);
            if (secretSequence === "misterlee") unlockMisterLee();
        } else if (e.key === "Backspace") secretSequence = secretSequence.slice(0, -1);
        else secretSequence = "";
    }
    if (e.code === "Escape" && !e.repeat) {
        e.preventDefault();
        togglePause();
    } else if ((e.code === "Space" || e.code === "ArrowUp") && !e.repeat) {
        e.preventDefault();
        jump();
    }
});
function togglePause() {
    if (!running) return;
    paused = !paused;
    if (audioContext) {
        const action = paused ? audioContext.suspend() : audioContext.resume();
        action.catch(() => {});
    }
    pauseBtn.textContent = paused ? "▶" : "Ⅱ";
    pauseBtn.setAttribute(
        "aria-label",
        paused ? "Continuar juego" : "Pausar juego",
    );
    document.querySelector("#paused").hidden = !paused;
    if (!paused) {
        last = 0;
        requestAnimationFrame(loop);
    }
}
pauseBtn.addEventListener("click", togglePause);
document.querySelector(".game").addEventListener("pointerdown", (e) => {
    if (paused && !pauseBtn.contains(e.target)) {
        e.preventDefault();
        togglePause();
    }
});
function end() {
    document.querySelector("#fighter-preview").hidden = true;
    document.querySelector("#characters").hidden = true;
    document.querySelector("#secret-unlock").hidden = true;
    document.querySelector("#unlock-message").textContent = "";
    secretSequence = "";
    running = false;
    escort = null;
    powerTime = 0;
    updatePowerHUD();
    if (audioContext) audioContext.suspend().catch(() => {});
    pauseBtn.hidden = true;
    if (score > best) {
        best = score;
        try {
            localStorage.setItem("purpleBest", best);
        } catch {}
        document.querySelector("#best").textContent = best;
    }
    document.querySelector("#eyebrow").textContent = "¡BUENA CARRERA!";
    document.querySelector("#title").innerHTML =
        "FIN DEL<br><em>RECORRIDO</em>";
    document.querySelector("#description").textContent = continuesLeft > 0
        ? `Recogiste ${score} estrellas. Te quedan ${continuesLeft} ${
            continuesLeft === 1 ? "continuación" : "continuaciones"
        }.`
        : `Recogiste ${score} estrellas. No quedan continuaciones. Elige un personaje para empezar de nuevo.`;
    continueBtn.hidden = continuesLeft <= 0;
    startBtn.innerHTML = "EMPEZAR DE NUEVO <span>↺</span>";
    overlay.hidden = false;
    cancelContinueCountdown();
    if (continuesLeft > 0) {
        let deadline = Date.now() + 3000;
        function updateCountdown() {
            let seconds = Math.max(
                0,
                Math.ceil((deadline - Date.now()) / 1000),
            );
            continueBtn.innerHTML = `CONTINUAR <span>${seconds}</span>`;
        }
        updateCountdown();
        continueTicker = setInterval(updateCountdown, 200);
        continueTimer = setTimeout(() => {
            updateCountdown();
            continueRun();
        }, 3000);
    }
}
function prepareAudio() {
    try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        if (!audioContext) audioContext = new Audio();
        audioContext.resume().catch(() => {});
    } catch {
        // The ally works normally when the browser cannot play audio.
    }
}
function playLeeFanfare() {
    if (!audioContext || audioContext.state !== "running") return;
    const now = audioContext.currentTime;
    const notes = [
        [65.41, 0, .85, .17, "sine"],
        [196, 0, .18, .07, "triangle"],
        [261.63, .16, .22, .07, "triangle"],
        [329.63, .32, .24, .07, "triangle"],
        [392, .5, .8, .07, "triangle"],
        [523.25, .5, .8, .05, "triangle"],
    ];
    for (const [frequency, delay, duration, volume, type] of notes) {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now + delay);
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(volume, now + delay + .025);
        gain.gain.exponentialRampToValueAtTime(.001, now + delay + duration);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now + delay);
        oscillator.stop(now + delay + duration + .02);
        oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
        };
    }
}
function summonEscort() {
    powerTime = MISTER_LEE.duration;
    invulnerable = 0;
    const character = selectedCharacter === "misterlee"
        ? CHARACTERS[BOYS[Math.floor(Math.random() * BOYS.length)]]
        : MISTER_LEE;
    // Refresh a current escort rather than spawning another one.
    escort = {
        character,
        x: escort ? escort.x : player.x - 95,
        y: escort ? escort.y : Math.min(G, player.y),
        age: 0,
        exitAge: 0,
        attackTime: 0,
        defeated: 0,
    };
    document.querySelector("#lee-portrait").src = character.portrait;
    document.querySelector("#ally-name").textContent = character.name;
    document.querySelector("#ally-motto").textContent = character === MISTER_LEE
        ? "TRANQUILO. YO ME ENCARGO." : "HOY NOSOTROS TE CUIDAMOS.";
    document.querySelector("#ally-status-name").textContent = "✦ " + character.name;
    document.querySelector("#lee-announcement").textContent =
        "¡" + character.name + " al rescate! Despeja a las armys durante siete segundos.";
    playLeeFanfare();
    updatePowerHUD();
}
function updateEscort(dt) {
    if (!escort) return;
    const lee = escort;
    lee.age += dt;
    lee.attackTime = Math.max(0, lee.attackTime - dt);
    if (powerTime <= 0) {
        lee.exitAge += dt;
        lee.x += 700 * dt;
        if (lee.exitAge >= MISTER_LEE.exitDuration) escort = null;
        return;
    }
    const previousX = lee.x, previousY = lee.y;
    const targetX = Math.min(W - 42, player.x + Math.min(145, (W - player.x) * .5));
    lee.x += Math.max(-760 * dt, Math.min(760 * dt, targetX - lee.x));
    const threat = enemies.filter((enemy) =>
        enemy.x >= player.x - 30 && enemy.x < lee.x + 125 && enemy.y <= G
    ).sort((a, b) => a.x - b.x)[0];
    const targetY = threat ? Math.max(G - 190, threat.y) : G;
    lee.y += Math.max(-800 * dt, Math.min(800 * dt, targetY - lee.y));
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        // Swept bounds catch enemies crossed by his entrance dash, too.
        if (enemy.x >= Math.min(previousX, lee.x) - 52 &&
            enemy.x <= Math.max(previousX, lee.x) + 62 &&
            enemy.y >= Math.min(previousY, lee.y) - 110 &&
            enemy.y <= Math.max(previousY, lee.y) + 110) {
            impactEffects.push({ x: enemy.x, y: enemy.y - 45, age: 0 });
            enemies.splice(i, 1);
            lee.attackTime = .24;
            lee.defeated++;
        }
    }
    document.querySelector("#lee-cleared").textContent =
        lee.defeated === 1 ? "1 ARMY FUERA" : lee.defeated + " ARMYS FUERA";
}
function update(dt) {
    time += dt;
    invulnerable = Math.max(0, invulnerable - dt);
    powerTime = Math.max(0, powerTime - dt);
    nextGold -= dt;
    stage = 1 + Math.floor(score / BOMBS_PER_STAGE);
    let speed = speedForStage(stage);
    distance += speed * dt;
    stageEl.textContent = String(stage).padStart(2, "0");
    platforms.forEach((p) => p.x -= speed * dt);
    while (platforms[0].x + platforms[0].w < 0) platforms.shift();
    let tail = platforms.at(-1);
    while (tail.x + tail.w < W + 500) {
        let gap = 80 + Math.random() * 45;
        tail = { x: tail.x + tail.w + gap, w: 650 + Math.random() * 300 };
        platforms.push(tail);
    }
    ledges.forEach((ledge) => ledge.x -= speed * dt);
    ledges = ledges.filter((ledge) => ledge.x + ledge.w > 0);
    nextLedge -= speed * dt;
    if (nextLedge <= 0) {
        let x = W + 60, y = G - 120;
        ledges.push({ x, y, w: 150 });
        if (Math.random() < .5) {
            items.push({
                x: x + 75,
                y: y - 50,
                t: Math.random() * 6,
                hueOffset: Math.random() * 360,
            });
        }
        nextLedge = 700 + Math.random() * 250;
    }
    if (stage >= 2) {
        nextEnemy -= speed * dt;
        if (nextEnemy <= 0) {
            let x = W + 50;
            let ground = platforms.find((p) =>
                x > p.x + 95 && x < p.x + p.w - 95
            );
            if (ground) {
                enemies.push({ x, y: G, vy: 0, platform: ground });
                nextEnemy = Math.max(240, 500 - (stage - 2) * 28);
            } else nextEnemy = 60;
        }
    }
    enemies.forEach((enemy) => {
        enemy.previousY = enemy.y;
        enemy.x -= (speed + 115) * dt;
        if (enemy.platform && enemy.x <= enemy.platform.x + 35) {
            enemy.platform = null;
            enemy.vy = -620;
        }
        if (!enemy.platform) {
            let oldY = enemy.y;
            enemy.vy += 930 * dt;
            enemy.y += enemy.vy * dt;
            if (enemy.vy >= 0 && oldY <= G && enemy.y >= G) {
                let landing = platforms.find((p) =>
                    enemy.x > p.x && enemy.x < p.x + p.w
                );
                if (landing) {
                    enemy.y = G;
                    enemy.vy = 0;
                    enemy.platform = landing;
                }
            }
        }
    });
    enemies = enemies.filter((enemy) => enemy.x > -60 && enemy.y < H + 100);
    impactEffects.forEach((effect) => {
        effect.x -= speed * dt;
        effect.age += dt;
    });
    impactEffects = impactEffects.filter((effect) => effect.age < .6);
    pickupEffects.forEach((effect) => {
        effect.x -= speed * dt;
        effect.age += dt;
    });
    pickupEffects = pickupEffects.filter((effect) => effect.age < .8);
    nextItem -= speed * dt;
    if (nextItem <= 0) {
        let x = W + 50;
        let platform = platforms.find((p) =>
            x > p.x + 30 && x < p.x + p.w - 30
        );
        if (platform) {
            let gold = nextGold <= 0;
            items.push({
                x,
                y: G - 75 - Math.random() * 85,
                t: Math.random() * 6,
                hueOffset: Math.random() * 360,
                gold,
            });
            if (gold) nextGold = 18;
        }
        nextItem = 300 + Math.random() * 140;
    }
    items.forEach((i) => {
        i.x -= speed * dt;
        i.t += dt;
    });
    items = items.filter((i) => i.x > -60);
    let old = player.y, wasGrounded = player.grounded;
    player.vy += 1550 * dt;
    player.y += player.vy * dt;
    player.grounded = false;
    if (player.vy >= 0) {
        let ledge = ledges.find((p) =>
            old <= p.y && player.y >= p.y && player.x + 15 > p.x &&
            player.x - 15 < p.x + p.w
        );
        if (ledge) {
            player.y = ledge.y;
            player.vy = 0;
            player.grounded = true;
            player.jumps = 0;
        }
    }
    if (
        !player.grounded && player.vy >= 0 && old <= G && player.y >= G &&
        platforms.some((p) => player.x + 15 > p.x && player.x - 15 < p.x + p.w)
    ) {
        player.y = G;
        player.vy = 0;
        player.grounded = true;
        player.jumps = 0;
    }
    if (wasGrounded && !player.grounded && player.jumps === 0) player.jumps = 1;
    // Collect first so a golden pickup protects the player in this same frame.
    for (let i = items.length - 1; i >= 0; i--) {
        let it = items[i];
        if (
            Math.abs(it.x - player.x) < 30 &&
            Math.abs(it.y - (player.y - 65)) < 49
        ) {
            items.splice(i, 1);
            score++;
            if (it.gold) summonEscort();
            pickupEffects.push({ x: it.x, y: it.y, value: score, age: 0 });
            showProgress();
        }
    }
    updateEscort(dt);
    updatePowerHUD();
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i], top = enemy.y - 70, bottom = enemy.y - 8;
        const jumpFootOffset = CHARACTERS[selectedCharacter].jumpFootOffset;
        const footOffset = player.grounded ? 2 : jumpFootOffset,
            foot = player.y - footOffset;
        if (
            Math.abs(enemy.x - player.x) < 22 && foot > top &&
            foot - 88 < bottom
        ) {
            if (powerTime > 0) {
                impactEffects.push({ x: enemy.x, y: enemy.y - 45, age: 0 });
                enemies.splice(i, 1);
            } else if (foot <= top + 38) {
                if (!wasGrounded && player.vy - enemy.vy >= 0) {
                    enemies.splice(i, 1);
                    player.y = top + jumpFootOffset;
                    player.vy = -400;
                    player.grounded = false;
                    player.jumps = 1;
                }
            } else if (invulnerable <= 0) {
                hearts--;
                showProgress();
                if (hearts <= 0) {
                    end();
                    return;
                }
                invulnerable = 1.5;
            }
        }
    }
    if (player.y > H + 100) end();
}
// The world moves at different speeds to give the valley depth.
function drawScenery() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#151333");
    sky.addColorStop(1, "#68608c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    if (scenery.complete && scenery.naturalWidth) {
        ctx.imageSmoothingEnabled = true;
        const scale =
            Math.max(W / scenery.naturalWidth, H / scenery.naturalHeight) *
            1.08;
        const width = scenery.naturalWidth * scale;
        const height = scenery.naturalHeight * scale;
        // Drift gently left and stop at the image edge, without reversing direction.
        const offset = reducedMotion.matches
            ? 0
            : Math.min(distance * .008, (width - W) / 2);
        ctx.drawImage(
            scenery,
            -(width - W) / 2 - offset,
            -(height - H) * .45,
            width,
            height,
        );
    }
    const washes = ["#29154c14", "#10455b26", "#76374726", "#285c4d26"];
    ctx.fillStyle = washes[(stage - 1) % washes.length];
    ctx.fillRect(0, 0, W, H);

    // Small lights float above the path, independent of collectible stars.
    ctx.save();
    for (let i = 0; i < 25; i++) {
        const x = ((i * 157 - distance * .12) % (W + 80) + W + 80) % (W + 80) -
            40;
        const drift = reducedMotion.matches
            ? 0
            : Math.sin(distance / 180 + i * 2) * 10;
        const y = 225 + (i * 73) % 310 + drift;
        ctx.globalAlpha = .2 + (Math.sin(i + distance / 150) + 1) * .2;
        ctx.fillStyle = i % 3 ? "#e8d59c" : "#9ae6da";
        ctx.beginPath();
        ctx.arc(x, y, i % 4 === 0 ? 2 : 1, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawPlatform(platform, y, floating = false) {
    const height = floating ? 25 : H - y;
    const earth = ctx.createLinearGradient(0, y, 0, y + height);
    earth.addColorStop(0, "#38324c");
    earth.addColorStop(.22, "#26243b");
    earth.addColorStop(1, "#17172c");
    ctx.fillStyle = earth;
    ctx.fillRect(platform.x, y, platform.w, height);
    ctx.fillStyle = "#877397";
    ctx.fillRect(platform.x, y, platform.w, 4);
    ctx.fillStyle = "#b9a3c2";
    ctx.fillRect(platform.x, y, platform.w, 1);
    ctx.fillStyle = "#51435e";
    ctx.fillRect(platform.x, y + 4, platform.w, 7);

    // Clipped stones and grasses remain attached to their platform as it scrolls.
    ctx.save();
    ctx.beginPath();
    ctx.rect(platform.x, y - 8, platform.w, height + 8);
    ctx.clip();
    for (let offset = 12; offset < platform.w; offset += 31) {
        const x = platform.x + offset;
        ctx.fillStyle = offset % 2 ? "#635069" : "#463b55";
        ctx.fillRect(x, y + 17 + (offset % 17), 9, 3);
        ctx.strokeStyle = "#9380a1";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 3, y - 5);
        ctx.moveTo(x, y);
        ctx.lineTo(x + 2, y - 7);
        ctx.stroke();
    }
    ctx.restore();
}

function drawEscort() {
    if (!escort) return;
    const lee = escort, character = lee.character, sprite = character.sprite;
    const onGround = Math.abs(lee.y - G) < 8 && platforms.some((p) =>
        lee.x >= p.x && lee.x <= p.x + p.w
    );
    const fade = Math.max(0, 1 - lee.exitAge / MISTER_LEE.exitDuration);
    ctx.save();
    ctx.globalAlpha = fade;
    // A light bridge keeps the escort moving over gaps in the path.
    ctx.strokeStyle = "#ffe2a0";
    ctx.shadowColor = "#ffc33d";
    ctx.shadowBlur = 16;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(lee.x, lee.y, 39, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (!reducedMotion.matches) {
        for (let i = 5; i >= 1; i--) {
            ctx.globalAlpha = fade * (1 - i / 6) * .3;
            ctx.strokeStyle = i % 2 ? "#ffdb73" : "#fff3ce";
            const trail = (lee.age * 140 + i * 17) % 75;
            ctx.beginPath();
            ctx.moveTo(lee.x - 28 - trail, lee.y - 20 - i * 17);
            ctx.lineTo(lee.x - 75 - trail, lee.y - 20 - i * 17);
            ctx.stroke();
        }
    }
    ctx.globalAlpha = fade;
    if (sprite.complete && sprite.naturalWidth) {
        const rect = characterFrame(character, lee.age * 11, !onGround);
        const height = 148, width = height * rect[2] / rect[3];
        const bob = onGround && !reducedMotion.matches ? Math.sin(lee.age * 22) * 2 : 0;
        ctx.imageSmoothingEnabled = false;
        ctx.shadowBlur = lee.attackTime > 0 ? 26 : 12;
        ctx.drawImage(sprite, ...rect,
            lee.x - width / 2, lee.y - height + bob, width, height);
    }
    if (lee.attackTime > 0) {
        const swing = 1 - lee.attackTime / .24;
        ctx.globalAlpha = fade * (1 - swing);
        ctx.lineWidth = 7 * (1 - swing) + 2;
        ctx.strokeStyle = "#fff6cd";
        ctx.beginPath();
        ctx.arc(lee.x + 20, lee.y - 65, 32 + swing * 32, -.9, 1.2);
        ctx.stroke();
    }
    ctx.shadowBlur = 5;
    ctx.globalAlpha = fade;
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffedb4";
    ctx.fillText(character.name, lee.x, lee.y - 158);
    ctx.restore();
}
function drawLeeEntrance() {
    if (!escort || reducedMotion.matches) return;
    const age = escort.age;
    if (age >= MISTER_LEE.entranceDuration) return;
    ctx.save();
    // One warm flash and expanding shockwave, without strobing.
    if (age < .45) {
        ctx.fillStyle = `rgba(255, 225, 157, ${.28 * (1 - age / .45)})`;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = `rgba(255, 227, 165, ${1 - age / .45})`;
        ctx.lineWidth = 6 * (1 - age / .45);
        ctx.beginPath();
        ctx.arc(player.x, player.y - 65, 30 + age * 1000, 0, Math.PI * 2);
        ctx.stroke();
    }
    const opacity = Math.min(1, age / .15,
        (MISTER_LEE.entranceDuration - age) / .4);
    ctx.fillStyle = `rgba(9, 6, 19, ${opacity * .65})`;
    ctx.fillRect(0, 0, W, 17);
    ctx.fillRect(0, H - 17, W, 17);
    ctx.strokeStyle = `rgba(255, 220, 143, ${opacity * .45})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
        const y = 170 + (i * 43) % 340;
        const x = ((i * 127 - age * 650) % (W + 180) + W + 180) % (W + 180);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 70, y - 14);
        ctx.stroke();
    }
    ctx.restore();
}

function draw() {
    drawScenery();
    ctx.save();
    if (escort && escort.age < .35 && !reducedMotion.matches) {
        const strength = (1 - escort.age / .35) * 4;
        ctx.translate(Math.sin(escort.age * 75) * strength,
            Math.cos(escort.age * 60) * strength * .5);
    }
    platforms.forEach((platform) => drawPlatform(platform, G));
    ledges.forEach((platform) => drawPlatform(platform, platform.y, true));

    if (document.querySelector("#welcome").hidden && player.grounded) {
        ctx.save();
        ctx.fillStyle = "#08071955";
        ctx.beginPath();
        ctx.ellipse(player.x, player.y - 1, 30, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        if (running && !reducedMotion.matches) {
            for (let i = 0; i < 5; i++) {
                const phase = (distance / 90 + i / 5) % 1;
                ctx.globalAlpha = (1 - phase) * .3;
                ctx.fillStyle = "#d5c2d9";
                ctx.beginPath();
                ctx.arc(
                    player.x - 18 - phase * 45,
                    player.y - 6 - phase * 12,
                    2 + phase * 4,
                    0,
                    Math.PI * 2,
                );
                ctx.fill();
            }
        }
        ctx.restore();
    }
    enemies.forEach((enemy) => {
        if (rival.complete && rival.naturalWidth) {
            let frames = [0, 355, 1040, 355];
            let frame = frames[Math.floor(distance / 25) % frames.length];
            ctx.save();
            ctx.translate(enemy.x, enemy.y - 84);
            ctx.scale(-1, 1);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(rival, frame, 140, 355, 490, -30, 0, 60, 84);
            ctx.restore();
        }
    });
    drawEscort();
    items.forEach((it) => {
        ctx.save();
        ctx.translate(it.x, it.y + Math.sin(it.t * 3) * 4);
        let hue = it.gold ? 45 : (time * 95 + it.hueOffset) % 360;
        ctx.shadowColor = it.gold ? "#ffd72e" : `hsl(${hue} 100% 70%)`;
        ctx.shadowBlur = it.gold ? 26 : 15;
        if (it.gold) {
            ctx.strokeStyle = "#fff3a2";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -9, 30 + Math.sin(time * 6) * 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.font = "bold 16px system-ui";
            ctx.fillStyle = "#fff3a2";
            ctx.fillText("✦", 21, -32);
        }
        if (bomb.complete && bomb.naturalWidth) {
            tintCtx.clearRect(0, 0, 490, 1010);
            tintCtx.globalCompositeOperation = "source-over";
            tintCtx.globalAlpha = 1;
            tintCtx.drawImage(bomb, 260, 160, 490, 1010, 0, 0, 490, 1010);
            tintCtx.globalCompositeOperation = "source-atop";
            tintCtx.globalAlpha = .65;
            tintCtx.fillStyle = `hsl(${hue} 100% 55%)`;
            tintCtx.beginPath();
            tintCtx.ellipse(245, 255, 220, 208, 0, 0, Math.PI * 2);
            tintCtx.fill();
            tintCtx.globalAlpha = 1;
            tintCtx.globalCompositeOperation = "source-over";
            ctx.drawImage(tintCanvas, -15, -29, 30, 58);
        }
        ctx.restore();
    });
    impactEffects.forEach((effect) => {
        ctx.save();
        const progress = effect.age / .6;
        ctx.globalAlpha = 1 - progress;
        ctx.translate(effect.x, effect.y);
        ctx.strokeStyle = "#fff0a4";
        ctx.lineWidth = 4 * (1 - progress) + 1;
        ctx.shadowColor = "#ffd52d";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, 12 + progress * 35, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
            let angle = i * Math.PI / 4, radius = 15 + progress * 40;
            ctx.fillStyle = i % 2 ? "#fff7c0" : "#ffc94a";
            ctx.fillRect(
                Math.cos(angle) * radius - 3,
                Math.sin(angle) * radius - 3,
                6,
                6,
            );
        }
        ctx.restore();
    });
    pickupEffects.forEach((effect) => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, (.8 - effect.age) * 3);
        ctx.font = "bold 25px system-ui";
        ctx.textAlign = "center";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#241036";
        ctx.fillStyle = "#fff3b5";
        let y = effect.y - 15 - effect.age * 35;
        ctx.strokeText(String(effect.value), effect.x, y);
        ctx.fillText(String(effect.value), effect.x, y);
        ctx.restore();
    });
    if (!document.querySelector("#welcome").hidden) {
        ctx.restore();
        return;
    }
    const character = CHARACTERS[selectedCharacter], source = character.sprite;
    const rect = characterFrame(character, distance / 25, !player.grounded);
    if (source.complete && source.naturalWidth) {
        ctx.imageSmoothingEnabled = false;
        let spriteHeight = 130, spriteWidth = spriteHeight * rect[2] / rect[3];
        let verticalOffset = 0;
        ctx.save();
        if (powerTime > 0) {
            ctx.shadowColor = "#ffe34d";
            ctx.shadowBlur = 25;
            ctx.globalAlpha = .8 + Math.sin(time * 15) * .2;
        } else if (
            invulnerable > 0 && Math.floor(invulnerable * 10) % 2 === 0
        ) {
            ctx.globalAlpha = .35;
        }
        ctx.drawImage(
            source,
            ...rect,
            player.x - spriteWidth / 2,
            player.y - spriteHeight + verticalOffset,
            spriteWidth,
            spriteHeight,
        );
        ctx.restore();
    }
    if (powerTime > 0) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "bold 24px system-ui";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#523000";
        ctx.fillStyle = "#fff29b";
        ctx.shadowColor = "#ffce2e";
        ctx.shadowBlur = 12;
        let y = player.y - 150;
        ctx.strokeText("✦ " + Math.ceil(powerTime), player.x, y);
        ctx.fillText("✦ " + Math.ceil(powerTime), player.x, y);
        ctx.restore();
    }
    ctx.restore();
    drawLeeEntrance();
}

function animateWelcome(ts) {
    if (document.querySelector("#welcome").hidden) return;
    distance = reducedMotion.matches ? 0 : ts * .035;
    draw();
    requestAnimationFrame(animateWelcome);
}
function animatePreview(ts) {
    if (!showingSelection || overlay.hidden) return;
    const character = CHARACTERS[selectedCharacter], source = character.sprite;
    const rect = characterFrame(character, ts / 140);
    previewCtx.clearRect(0, 0, 220, 140);
    if (source.complete && source.naturalWidth) {
        let h = 130, w = h * rect[2] / rect[3];
        previewCtx.imageSmoothingEnabled = false;
        previewCtx.drawImage(source, ...rect, (220 - w) / 2, 140 - h, w, h);
    }
    requestAnimationFrame(animatePreview);
}
function loop(ts) {
    if (!running || paused) return;
    let dt = last ? Math.min((ts - last) / 1000, .033) : 0;
    last = ts;
    update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
}
reset();
resize();
scenery.onload = draw;
runSprite.onload = draw;
jungkook.onload = draw;
rm.onload = draw;
jhope.onload = draw;
jin.onload = draw;
suga.onload = draw;
tae.onload = draw;
misterLeeSprite.onload = draw;
bomb.onload = draw;
rival.onload = draw;
draw();
requestAnimationFrame(animateWelcome);
