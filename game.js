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
    bomb = new Image(),
    rival = new Image();
runSprite.src = "images/sprites/jiminie-run.png";
jungkook.src = "images/sprites/kookie-run.png";
rm.src = "images/sprites/namu-run.png";
jhope.src = "images/sprites/hobi-run.png";
jin.src = "images/sprites/jino-run.png";
suga.src = "images/sprites/yuno-run.png";
tae.src = "images/sprites/taeo-run.png";
bomb.src = "images/sprites/army-bomb.png";
rival.src = "images/sprites/rival.png";
const scenery = new Image();
scenery.src = "images/backgrounds/starlit-valley.webp";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const previewCanvas = document.querySelector("#preview-canvas"),
    previewCtx = previewCanvas.getContext("2d");
const BOMBS_PER_STAGE = 5;
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
    let indicator = document.querySelector("#power");
    indicator.hidden = powerTime <= 0;
    indicator.textContent = "✦ " + Math.ceil(powerTime);
    indicator.setAttribute(
        "aria-label",
        "Invencibilidad: " + Math.ceil(powerTime) + " segundos",
    );
}
function safeStart() {
    hearts = 3;
    invulnerable = 0;
    powerTime = 0;
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
    selectedCharacter = name;
    for (
        const id of ["jimin", "jungkook", "rm", "jhope", "jin", "suga", "tae"]
    ) {
        const choice = document.querySelector("#" + id + "-choice"),
            active = id === name;
        choice.setAttribute("aria-pressed", String(active));
        choice.querySelector("small").textContent = active
            ? "SELECCIONADO ✓"
            : "SELECCIONAR";
    }
    document.querySelector("#selected-name").textContent = {
        jimin: "JIMINIE",
        jungkook: "KOOKIE",
        rm: "NAMU",
        jhope: "HOBI",
        jin: "JINO",
        suga: "YUNO",
        tae: "TAEO",
    }[name];
    startBtn.textContent = "¡JUGAR!";
}
function showSelection() {
    cancelContinueCountdown();
    showingSelection = true;
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
startBtn.addEventListener("click", start);
continueBtn.addEventListener("click", continueRun);
canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    jump();
});
window.addEventListener("keydown", (e) => {
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
    running = false;
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
function update(dt) {
    time += dt;
    invulnerable = Math.max(0, invulnerable - dt);
    powerTime = Math.max(0, powerTime - dt);
    nextGold -= dt;
    updatePowerHUD();
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
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i], top = enemy.y - 70, bottom = enemy.y - 8;
        const jumpFootOffset = {
            jimin: 33,
            jungkook: 34,
            rm: 30,
            jhope: 33,
            jin: 28,
            suga: 30,
            tae: 30,
        }[selectedCharacter];
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
    for (let i = items.length - 1; i >= 0; i--) {
        let it = items[i];
        if (
            Math.abs(it.x - player.x) < 30 &&
            Math.abs(it.y - (player.y - 65)) < 49
        ) {
            items.splice(i, 1);
            score++;
            if (it.gold) {
                powerTime = 7;
                invulnerable = 0;
                updatePowerHUD();
            }
            pickupEffects.push({ x: it.x, y: it.y, value: score, age: 0 });
            showProgress();
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

function draw() {
    drawScenery();
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
    if (!document.querySelector("#welcome").hidden) return;
    let runFrames = [
        [0, 55, 440, 620],
        [423, 55, 440, 620],
        [1275, 55, 440, 620],
        [423, 55, 440, 620],
    ];
    let rect, source;
    if (selectedCharacter === "tae") {
        source = tae;
        let frames = [[0, 130, 440, 550], [414, 130, 440, 550], [
            1260,
            130,
            440,
            550,
        ], [414, 130, 440, 550]];
        rect = player.grounded
            ? frames[Math.floor(distance / 25) % frames.length]
            : [850, 100, 410, 550];
    } else if (selectedCharacter === "suga") {
        source = suga;
        let frames = [[0, 130, 440, 550], [418, 130, 440, 550], [
            1236,
            130,
            440,
            550,
        ], [418, 130, 440, 550]];
        rect = player.grounded
            ? frames[Math.floor(distance / 25) % frames.length]
            : [850, 100, 410, 550];
    } else if (selectedCharacter === "jin") {
        source = jin;
        let frames = [[0, 130, 440, 550], [416, 130, 440, 550], [
            1248,
            130,
            440,
            550,
        ], [416, 130, 440, 550]];
        rect = player.grounded
            ? frames[Math.floor(distance / 25) % frames.length]
            : [850, 100, 410, 550];
    } else if (selectedCharacter === "jhope") {
        source = jhope;
        let frames = [[0, 130, 440, 550], [410, 130, 440, 550], [
            1244,
            130,
            440,
            550,
        ], [410, 130, 440, 550]];
        rect = player.grounded
            ? frames[Math.floor(distance / 25) % frames.length]
            : [850, 100, 410, 550];
    } else if (selectedCharacter === "rm") {
        source = rm;
        let rmFrames = [[0, 130, 440, 550], [418, 130, 440, 550], [
            1256,
            130,
            440,
            550,
        ], [418, 130, 440, 550]];
        rect = player.grounded
            ? rmFrames[Math.floor(distance / 25) % rmFrames.length]
            : [850, 100, 410, 550];
    } else if (selectedCharacter === "jungkook") {
        source = jungkook;
        let jkFrames = [[0, 130, 440, 550], [440, 130, 410, 550], [
            1270,
            130,
            410,
            550,
        ], [440, 130, 410, 550]];
        rect = player.grounded
            ? jkFrames[Math.floor(distance / 25) % jkFrames.length]
            : [850, 100, 410, 550];
    } else {
        source = runSprite;
        rect = player.grounded
            ? runFrames[Math.floor(distance / 25) % runFrames.length]
            : [850, 55, 410, 620];
    }
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
}

function animateWelcome(ts) {
    if (document.querySelector("#welcome").hidden) return;
    distance = reducedMotion.matches ? 0 : ts * .035;
    draw();
    requestAnimationFrame(animateWelcome);
}
function animatePreview(ts) {
    if (!showingSelection || overlay.hidden) return;
    let i = Math.floor(ts / 140) % 4, source, frames;
    if (selectedCharacter === "tae") {
        source = tae;
        frames = [[0, 130, 440, 550], [414, 130, 440, 550], [
            1260,
            130,
            440,
            550,
        ], [
            414,
            130,
            440,
            550,
        ]];
    } else if (selectedCharacter === "suga") {
        source = suga;
        frames = [[0, 130, 440, 550], [418, 130, 440, 550], [
            1236,
            130,
            440,
            550,
        ], [
            418,
            130,
            440,
            550,
        ]];
    } else if (selectedCharacter === "jin") {
        source = jin;
        frames = [[0, 130, 440, 550], [416, 130, 440, 550], [
            1248,
            130,
            440,
            550,
        ], [
            416,
            130,
            440,
            550,
        ]];
    } else if (selectedCharacter === "jhope") {
        source = jhope;
        frames = [[0, 130, 440, 550], [410, 130, 440, 550], [
            1244,
            130,
            440,
            550,
        ], [
            410,
            130,
            440,
            550,
        ]];
    } else if (selectedCharacter === "jungkook") {
        source = jungkook;
        frames = [[0, 130, 440, 550], [440, 130, 410, 550], [
            1270,
            130,
            410,
            550,
        ], [
            440,
            130,
            410,
            550,
        ]];
    } else {
        source = selectedCharacter === "rm" ? rm : runSprite;
        frames = selectedCharacter === "rm"
            ? [
                [0, 130, 440, 550],
                [418, 130, 440, 550],
                [1256, 130, 440, 550],
                [
                    418,
                    130,
                    440,
                    550,
                ],
            ]
            : [[0, 55, 440, 620], [423, 55, 440, 620], [1275, 55, 440, 620], [
                423,
                55,
                440,
                620,
            ]];
    }
    previewCtx.clearRect(0, 0, 220, 140);
    if (source.complete && source.naturalWidth) {
        let rect = frames[i], h = 130, w = h * rect[2] / rect[3];
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
bomb.onload = draw;
rival.onload = draw;
draw();
requestAnimationFrame(animateWelcome);
