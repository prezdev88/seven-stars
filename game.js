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
const stars = Array.from(
    { length: 42 },
    (_, i) => ({
        x: (i * 127 + 29) % 480,
        y: (i * 83 + 17) % 430,
        s: i % 7 === 0 ? 3 : 1,
    }),
);
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
function start() {
    if (!showingSelection) {
        showSelection();
        return;
    }
    showingSelection = false;
    reset();
    resumeRun();
}
function continueRun() {
    if (continuesLeft <= 0 || running) return;
    cancelContinueCountdown();
    continuesLeft--;
    safeStart();
    showProgress();
    resumeRun();
}
function resumeRun() {
    continueBtn.hidden = true;
    running = true;
    paused = false;
    last = 0;
    overlay.hidden = true;
    pauseBtn.hidden = false;
    pauseBtn.textContent = "Ⅱ";
    pauseBtn.setAttribute("aria-label", "Pausar juego");
    document.querySelector("#paused").hidden = true;
    requestAnimationFrame(loop);
}
document.querySelector("#welcome-play").addEventListener("click", () => {
    document.querySelector("#welcome").hidden = true;
    distance = 0;
    draw();
    overlay.hidden = false;
    showSelection();
    document.querySelector("#" + selectedCharacter + "-choice").focus();
});
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
function draw() {
    let palettes = [
        ["#281544", "#704589", "#d491b9", "#563d76", "#3c2b60"],
        ["#102c50", "#356f89", "#91d8d4", "#315c79", "#20435f"],
        ["#48254b", "#a44e70", "#ffc293", "#7e425f", "#56334f"],
        ["#172e42", "#476c66", "#c1bf83", "#42665f", "#2a4d4c"],
    ];
    let colors = palettes[(stage - 1) % palettes.length];
    let bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, colors[0]);
    bg.addColorStop(.55, colors[1]);
    bg.addColorStop(1, colors[2]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff7dc";
    ctx.beginPath();
    ctx.arc(W - 100, 135, 39, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd9f044";
    ctx.beginPath();
    ctx.arc(W - 100, 135, 52, 0, Math.PI * 2);
    ctx.fill();
    stars.forEach((s) => {
        ctx.fillStyle = "#fff8";
        ctx.fillRect(
            (s.x * W / 480 - distance * .025 + 50000) % W,
            s.y,
            s.s,
            s.s,
        );
    });
    ctx.fillStyle = colors[3];
    for (let i = -2; i < Math.ceil(W / 110) + 2; i++) {
        let x = i * 110 - (distance * .13 % 220);
        ctx.beginPath();
        ctx.moveTo(x, 500);
        ctx.lineTo(x + 75, 310 + (i % 2) * 35);
        ctx.lineTo(x + 155, 500);
        ctx.fill();
    }
    ctx.fillStyle = colors[4];
    for (let i = -2; i < Math.ceil(W / 110) + 2; i++) {
        let x = i * 110 - (distance * .25 % 220);
        ctx.beginPath();
        ctx.moveTo(x, 540);
        ctx.lineTo(x + 75, 385 + (i % 2) * 30);
        ctx.lineTo(x + 155, 540);
        ctx.fill();
    }
    let groundPalettes = [["#27463e", "#669b6e"], ["#244959", "#69a9a1"], [
        "#5b5143",
        "#a8a66c",
    ], ["#304a3f", "#80a474"]];
    let ground = groundPalettes[(stage - 1) % groundPalettes.length];
    platforms.forEach((p) => {
        ctx.fillStyle = ground[0];
        ctx.fillRect(p.x, G, p.w, H - G);
        ctx.fillStyle = ground[1];
        ctx.fillRect(p.x, G, p.w, 10);
    });
    ledges.forEach((p) => {
        ctx.fillStyle = ground[0];
        ctx.fillRect(p.x, p.y, p.w, 17);
        ctx.fillStyle = ground[1];
        ctx.fillRect(p.x, p.y, p.w, 6);
    });
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
    distance = ts * .035;
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
