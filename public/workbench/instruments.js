// Drawing coordinates follow the original 1672 × 941 workbench photograph.
const scope = { x: 1165, y: 382 };
const modes = ["Signal", "Pulse train", "Phase portrait", "Jellyfish"];
const photo = document.querySelector(".room");
const glassButton = document.querySelector(".tuning");
let channel = 0;
let tunedAt = -100;
let exploring = false;

export function updateTuningTarget(cx, cy, scale, available) {
  glassButton.hidden = !available;
  if (!available) return;
  const w = 348 * scale,
    h = 218 * scale;
  glassButton.style.width = w + "px";
  glassButton.style.height = h + "px";
  glassButton.style.transform =
    "translate(" + (cx - w / 2) + "px," + (cy - h / 2) + "px)";
}

export function enableTuning(getTime, redraw) {
  const terminalButton = document.querySelector(".scope-channel");
  glassButton.onclick = terminalButton.onclick = () => {
    channel = (channel + 1) % modes.length;
    tunedAt = getTime();
    for (const button of [glassButton, terminalButton])
      button.setAttribute(
        "aria-label",
        "Tune oscilloscope. Current trace: " + modes[channel],
      );
    terminalButton.querySelector(".scope-id").textContent =
      "CH " + (channel + 1);
    terminalButton.querySelector(".scope-name").textContent = modes[channel];
    redraw();
  };
  glassButton.addEventListener("pointerenter", () => {
    exploring = true;
    redraw();
  });
  glassButton.addEventListener("pointerleave", () => {
    exploring = false;
    redraw();
  });
  glassButton.addEventListener("focus", redraw);
  glassButton.addEventListener("blur", redraw);
}

function drawMeters(ctx, time, load) {
  if (!photo.complete || !photo.naturalWidth) return;
  for (const [i, pivot] of [621, 702].entries()) {
    // Reuse adjacent paper from each dial to mask the photographed resting needle.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pivot - 19, 467);
    ctx.lineTo(pivot - 15.8, 467);
    ctx.lineTo(pivot + 2, 488.6);
    ctx.lineTo(pivot - 1.1, 489);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(photo, pivot - 14, 466, 22, 25, pivot - 20, 466, 22, 25);
    ctx.restore();

    const pressure =
      load * 0.25 +
      0.23 * Math.sin(time * 0.9 + i * 0.65) +
      0.075 * Math.sin(time * 2.6 + i);
    const angle = -0.31 + pressure + 0.09 * channel;
    ctx.save();
    ctx.translate(pivot, 489);
    ctx.rotate(angle);
    ctx.shadowColor = "#55310a80";
    ctx.shadowOffsetX = 1.4;
    ctx.shadowBlur = 0.8;
    ctx.strokeStyle = "#493016";
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -26.4);
    ctx.stroke();
    ctx.restore();
  }
}

function rackLights(ctx, time, load) {
  const columns = [830, 847.5, 857.5, 866, 874, 882.5];
  const rows = [297, 307, 319, 330, 342];
  // Use the actual perforated panel as a mask and let a short read cycle climb it.
  for (let col = 0; col < columns.length; col++) {
    for (let row = 0; row < rows.length; row++) {
      const x = columns[col] - 0.14 * row,
        y = rows[row] - 0.018 * (columns[col] - 830);
      const tick = (time * 0.27 + row * 0.13 + col * 0.072) % 1;
      const dim = 0.18 + 0.57 * Math.pow(Math.sin(Math.PI * tick), 6);
      ctx.beginPath();
      ctx.ellipse(x, y, 2.4, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(38,23,11," + dim + ")";
      ctx.fill();
      if (tick < 0.29) {
        ctx.fillStyle =
          "rgba(255,202,116," + (1 - tick / 0.29) * (0.28 + load * 0.15) + ")";
        ctx.beginPath();
        ctx.ellipse(x, y, 1.15, 1.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function passingWindowLight(ctx, time) {
  const t = (time + 6) % 29;
  if (t > 11) return;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 13; i++) {
    const y = 19 + i * 24.8;
    ctx.moveTo(493, y);
    ctx.lineTo(723, y - 34);
    ctx.lineTo(723, y - 29);
    ctx.lineTo(493, y + 5);
    ctx.closePath();
  }
  ctx.clip();
  const x = 460 + t * 31;
  const light = ctx.createRadialGradient(x, 160, 0, x, 160, 146);
  light.addColorStop(0, "rgba(173,216,225,.20)");
  light.addColorStop(0.48, "rgba(119,183,201,.085)");
  light.addColorStop(1, "transparent");
  ctx.fillStyle = light;
  ctx.fillRect(486, 0, 245, 340);
  ctx.restore();
}

function jellyfish(ctx, t) {
  const x = scope.x + Math.sin(t * 0.52) * 12,
    y = scope.y - 9 + Math.cos(t * 0.94) * 5;
  const radius = 32 + 2.8 * Math.sin(t * 1.9);
  ctx.beginPath();
  ctx.moveTo(x - radius, y);
  ctx.bezierCurveTo(
    x - radius * 0.94,
    y - 40,
    x + radius * 0.94,
    y - 40,
    x + radius,
    y,
  );
  for (let i = 0; i <= 50; i++) {
    const u = i / 50;
    ctx.lineTo(x + radius * (1 - 2 * u), y + 2.5 * Math.sin(u * Math.PI * 6));
  }
  for (let j = 0; j < 6; j++) {
    const root = x - radius * 0.77 + j * radius * 0.3;
    ctx.moveTo(root, y);
    for (let i = 1; i <= 28; i++) {
      const u = i / 28;
      ctx.lineTo(
        root +
          u *
            (8 * Math.sin(u * 7 - t * 1.8 + j * 0.4) + 5 * Math.sin(u * 3 + t)),
        y + u * (27 + 8 * Math.sin(j * 2)),
      );
    }
  }
  ctx.stroke();
}

function drawTrace(ctx, time, mode) {
  ctx.beginPath();
  if (mode === 3) {
    jellyfish(ctx, time);
    return;
  }
  if (mode === 2) {
    for (let i = 0; i <= 320; i++) {
      const a = (i / 320) * Math.PI * 2;
      const x = scope.x + 110 * Math.sin(3 * a + time * 0.31),
        y = scope.y + 48 * Math.sin(2 * a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  } else {
    for (let x = 985; x <= 1351; x += 2) {
      const u = (x - 985) / 366;
      const envelope = Math.sin(Math.PI * u);
      const osc =
        mode === 1
          ? 23 * Math.tanh(6 * Math.sin(u * 34 - time * 2.3))
          : (7 + 25 * Math.pow(Math.sin(u * Math.PI * 2.15 - time * 0.65), 6)) *
            Math.sin(u * 74 - time * 4.2);
      const y = 386 - 13 * u + envelope * osc;
      if (x === 985) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

export function drawTerminalScope(ctx, time) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(width / 380, height / 122);
  ctx.translate(-scope.x, -scope.y);
  ctx.strokeStyle = "#ffcc83";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#ff9c39";
  ctx.shadowBlur = 5;
  drawTrace(ctx, time, channel);
  ctx.restore();
}

export function drawInstruments(ctx, time) {
  const load = 0.5 + 0.5 * Math.sin(time * 0.69);
  passingWindowLight(ctx, time);
  rackLights(ctx, time, load);
  drawMeters(ctx, time, load);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(998, 272);
  ctx.lineTo(1334, 250);
  ctx.quadraticCurveTo(1353, 269, 1350, 308);
  ctx.lineTo(1349, 489);
  ctx.quadraticCurveTo(1343, 505, 1324, 506);
  ctx.lineTo(996, 507);
  ctx.quadraticCurveTo(982, 498, 983, 478);
  ctx.closePath();
  ctx.clip();
  const elapsed = time - tunedAt;
  const visitor = channel === 0 && elapsed > 30 && time % 51 > 43;
  const mode = visitor ? 3 : channel;
  // Printed CRT phosphor remains faintly visible behind other channels.
  if (mode !== 0) {
    ctx.fillStyle = visitor ? "rgba(30,17,4,.85)" : "rgba(30,17,4,.91)";
    ctx.fillRect(978, 239, 383, 280);
    ctx.strokeStyle = "rgba(243,165,64,.13)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 996; x < 1350; x += 24) {
      ctx.moveTo(x, 245);
      ctx.lineTo(x - 6, 511);
    }
    for (let y = 270; y < 510; y += 24) {
      ctx.moveTo(980, y);
      ctx.lineTo(1355, y - 9);
    }
    ctx.stroke();
  }
  const sweep = 984 + ((time * 59) % 372);
  const trail = ctx.createLinearGradient(sweep - 72, 0, sweep + 3, 0);
  trail.addColorStop(0, "transparent");
  trail.addColorStop(0.94, "rgba(255,166,44,.09)");
  trail.addColorStop(1, "rgba(255,206,115,.28)");
  ctx.fillStyle = trail;
  ctx.fillRect(sweep - 72, 243, 75, 273);
  ctx.strokeStyle = mode === 0 ? "rgba(255,185,76,.58)" : "#ffc46d";
  ctx.lineWidth = mode === 0 ? 1.6 : 1.9;
  ctx.shadowColor = "#ffa139";
  ctx.shadowBlur = 6;
  drawTrace(ctx, time, mode);
  ctx.shadowBlur = 0;
  const hint = exploring || document.activeElement === glassButton;
  if (hint || channel !== 0 || elapsed < 2.5) {
    ctx.font = "13px Plex, monospace";
    ctx.fillStyle = "#ffd99d";
    ctx.fillText(
      "CH " + (channel + 1) + " / " + modes[channel].toUpperCase(),
      1008,
      465,
    );
    if (hint) {
      ctx.font = "10px Plex, monospace";
      ctx.fillStyle = "#edb97c";
      ctx.fillText("TUNE SIGNAL", 1009, 483);
    }
  }
  ctx.restore();
}
