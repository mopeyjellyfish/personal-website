import {
  drawInstruments,
  drawTerminalScope,
  enableTuning,
  updateTuningTarget,
} from "./instruments.js";

const select = (selector) => document.querySelector(selector);
const clamp = (n) => Math.min(1, Math.max(0, n));
const smooth = (n) => {
  const x = clamp(n);
  return x * x * (3 - 2 * x);
};
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const stage = select(".stage"),
  world = select(".world"),
  screen = select(".screen");
const landing = select(".landing"),
  grade = select(".grade"),
  reader = select(".reader");
const fileButtons = [...document.querySelectorAll("[data-file]")];
const pages = [...reader.querySelectorAll("article")];
const directory = select(".directory");
const menu = select(".files-toggle");
const motionControls = document.querySelectorAll(".motion, .terminal-motion");
let activeFile = 0,
  engaged = false,
  entering = false;
let paused = false,
  flight = null,
  returning = false;

function setMenu(open, focus = false) {
  directory.classList.toggle("open", open);
  if (open) requestAnimationFrame(renderScope);
  menu.setAttribute("aria-expanded", String(open));
  if (focus)
    (open ? fileButtons[activeFile] : menu).focus({ preventScroll: true });
}
menu.onclick = () => setMenu(!directory.classList.contains("open"), true);
reader.addEventListener("pointerdown", () => setMenu(false));
directory.addEventListener("focusout", (event) => {
  if (
    event.relatedTarget &&
    !directory.contains(event.relatedTarget) &&
    event.relatedTarget !== menu
  )
    setMenu(false);
});
function focusFile() {
  const heading = pages[activeFile].querySelector("h2");
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}
const finder = select("#file-search");
const query = select("#query");
const matches = select(".matches");
const launch = select("#launch");
const scopeCanvas = select(".scope-channel canvas");
const scopeCtx = scopeCanvas.getContext("2d");
let scopeTimer;

function renderScope() {
  clearTimeout(scopeTimer);
  if (
    !scopeCtx ||
    !engaged ||
    document.hidden ||
    !scopeCanvas.clientWidth ||
    finder.open
  )
    return;
  drawTerminalScope(scopeCtx, phase);
  if (!paused && !reduced.matches) {
    scopeTimer = setTimeout(() => {
      phase += 0.09;
      renderScope();
    }, 90);
  }
}

function filterFiles() {
  const term = query.value
    .trim()
    .toLowerCase()
    .replace(/^open\s+/, "")
    .replace(/^~\//, "");
  for (const [i, button] of Array.from(matches.children).entries()) {
    button.hidden = !(
      pages[i].dataset.path +
      " " +
      pages[i].querySelector("h2").textContent
    )
      .toLowerCase()
      .includes(term);
  }
  select(".no-matches").hidden = !!matches.querySelector(
    "button:not([hidden])",
  );
}

for (const [i, page] of pages.entries()) {
  const result = document.createElement("button");
  const filename = document.createElement("strong");
  filename.textContent = page.querySelector("h2").textContent;
  const path = document.createElement("small");
  path.textContent = "~/" + page.dataset.path;
  result.append(filename, path);
  result.onclick = () => {
    finder.close();
    goInside(i);
  };
  matches.append(result);
}
launch.onclick = () => {
  setMenu(false);
  query.value = "";
  filterFiles();
  finder.showModal();
  query.focus();
  renderScope();
};
select(".dismiss").onclick = () => finder.close();
finder.addEventListener("close", renderScope);
query.oninput = filterFiles;
finder.onkeydown = (e) => {
  const available = [...matches.querySelectorAll("button:not([hidden])")];
  if (!available.length) return;
  if (e.key === "Enter" && e.target === query) {
    e.preventDefault();
    available[0].click();
  } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const index = available.indexOf(e.target);
    const next =
      index < 0
        ? e.key === "ArrowDown"
          ? 0
          : available.length - 1
        : (index + available.length + (e.key === "ArrowDown" ? 1 : -1)) %
          available.length;
    available[next].focus();
  }
};
function openFile(index) {
  const previous = activeFile;
  activeFile = index;
  const path = pages[index].dataset.path;
  select("#path").textContent = "~/" + path;
  select("#command").textContent = "open " + path;
  pages.forEach((page, i) => {
    page.hidden = i !== index;
    page.classList.toggle(
      "revealing",
      engaged && i === index && previous !== index,
    );
  });
  fileButtons.forEach((button, i) => {
    if (i === index) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  reader.scrollTop = 0;
  setMenu(false);
}
function route(index) {
  const hash = index === null ? "" : "#" + pages[index].id;
  if (location.hash !== hash)
    history.pushState(null, "", location.pathname + location.search + hash);
}
function follow(event, index) {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey ||
    event.button > 0
  )
    return;
  event.preventDefault();
  goInside(index);
}
fileButtons.forEach(
  (button, i) => (button.onclick = (event) => follow(event, i)),
);
document.querySelectorAll(".mode").forEach((button) => {
  button.onclick = () =>
    button.setAttribute(
      "aria-pressed",
      button
        .closest("figure")
        .querySelector(".picture")
        .classList.toggle("color"),
    );
});
function toggleMotion() {
  paused = !paused;
  stage.toggleAttribute("data-paused", paused);
  renderScope();
  for (const button of motionControls) {
    button.setAttribute("aria-pressed", String(paused));
    button.querySelector("span").textContent = paused ? "▷" : "Ⅱ";
  }
  requestFrame();
}
for (const button of motionControls) button.onclick = toggleMotion;
const atmosphere = select("#atmosphere");
const ctx = atmosphere.getContext("2d");
const particles = Array.from({ length: 84 }, (_, i) => ({
  x: (i * 457.17 + 119) % 1672,
  y: (i * 313.31 + 431) % 941,
  drift: 0.18 + (i % 7) * 0.05,
  radius: 0.65 + (i % 5) * 0.24,
}));
function glow(x, y, r, c) {
  const light = ctx.createRadialGradient(x, y, 0, x, y, r);
  light.addColorStop(0, c);
  light.addColorStop(1, "transparent");
  ctx.fillStyle = light;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
}
function drawRoom(t) {
  ctx.clearRect(0, 0, 1672, 941);
  drawInstruments(ctx, t);
  glow(
    1437,
    112,
    168,
    "rgba(255,169,67," + (0.085 + 0.038 * Math.sin(t * 1.18)) + ")",
  );
  glow(
    745,
    540,
    9,
    "rgba(255,119,30," + (0.33 + 0.23 * Math.sin(t * 2.13)) + ")",
  );
  glow(
    738,
    260,
    220,
    "rgba(112,200,238," + (0.045 + 0.023 * Math.sin(t * 0.6)) + ")",
  );
  for (const p of particles) {
    const x = (p.x + t * 5 * p.drift + Math.sin(t * 0.25 + p.y) * 7) % 1672;
    const y = 941 - ((p.y + t * (3 + 5 * p.drift)) % 941);
    const alpha =
      (0.08 + 0.15 * (0.5 + 0.5 * Math.sin(p.x + t * 0.65))) *
      (x > 430 ? 1 : 0.32);
    ctx.fillStyle = "rgba(255,223,172," + alpha + ")";
    ctx.beginPath();
    ctx.arc(x, y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
let width = 0,
  height = 0,
  limit = 0,
  initialScale = 1,
  left = 0,
  top = 0,
  endScale = 1;
function measure() {
  const docked = engaged && !returning;
  width = stage.clientWidth;
  height = stage.clientHeight;
  limit = Math.max(
    1,
    document.documentElement.scrollHeight -
      document.documentElement.clientHeight,
  );
  const phone = width <= 1050 && height > width;
  initialScale = phone
    ? Math.max(width / 1672, (height * 0.755) / 941)
    : Math.max(width / 1672, height / 941);
  left = phone
    ? width * 0.57 - 1166 * initialScale
    : (width - 1672 * initialScale) / 2;
  top = phone ? -height * 0.018 : (height - 941 * initialScale) / 2;
  endScale = Math.max(width / 346, height / 225) * 1.045;
  if (docked) window.scrollTo(0, limit);
  renderScope();
  setMenu(false);
  requestFrame();
}
let frameId = 0,
  lastDraw = -Infinity,
  lastClock = -1,
  lastFrame = 0,
  phase = 0,
  px = 0,
  py = 0,
  vx = 0,
  vy = 0;
function requestFrame() {
  if (!frameId && !document.hidden) frameId = requestAnimationFrame(render);
}
function render(now) {
  frameId = 0;
  const delta = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  if (flight) {
    const fraction = clamp((now - flight.startTime) / flight.duration);
    const target = flight.inside ? limit : 0;
    window.scrollTo(
      0,
      flight.startY + (target - flight.startY) * smooth(fraction),
    );
    if (fraction === 1) flight = null;
  }
  const progress = clamp(window.scrollY / limit);
  const p = reduced.matches ? Number(progress > 0.48) : smooth(progress);
  const finished = progress >= 0.995 || (reduced.matches && p === 1);
  const show = smooth((p - 0.27) / 0.48);
  const idle = !reduced.matches && !paused && !finished;
  if (idle) phase += delta;
  vx += (px - vx) * 0.06;
  vy += (py - vy) * 0.06;
  const float = idle ? (1 - p) * (1 - p) : 0;
  const driftX = (Math.sin(phase * 0.29) * 2.8 + vx * 4) * float;
  const driftY = (Math.sin(phase * 0.39) * 1.9 + vy * 3) * float;
  const z =
    initialScale *
    Math.pow(endScale / initialScale, p) *
    (1 + float * 0.003 * (1 + Math.sin(phase * 0.34)));
  const cx = (left + 1166 * initialScale) * (1 - p) + width * 0.5 * p + driftX;
  const cy = (top + 379 * initialScale) * (1 - p) + height * 0.5 * p + driftY;
  world.style.transform =
    "matrix(" +
    z +
    ",0,0," +
    z +
    "," +
    (cx - 1166 * z) +
    "," +
    (cy - 379 * z) +
    ")";
  // The terminal occupies the photographed glass throughout the flight. Once its glass
  // passes the viewport edges, only the visible area is used for the terminal layout.
  const x = Math.max(0, cx - 173 * z),
    y = Math.max(0, cy - 112.5 * z);
  const right = Math.min(width, cx + 173 * z),
    bottom = Math.min(height, cy + 112.5 * z);
  screen.style.transform =
    "translate(" +
    x +
    "px," +
    y +
    "px) scale(" +
    Math.max(0.01, (right - x) / width) +
    "," +
    Math.max(0.01, (bottom - y) / height) +
    ")";
  screen.style.borderRadius = (1 - smooth((p - 0.7) / 0.26)) * 3 + "%";
  screen.style.opacity = show;
  // Carry the same worn metal lip from the photograph into the full-width terminal.
  // Gradually introduce the responsive inset as the camera reaches the glass.
  screen.style.setProperty("--bezel-reveal", smooth((p - 0.49) / 0.37));
  updateTuningTarget(cx, cy, z, p < 0.08);
  const fade = 1 - smooth(p / 0.28);
  landing.style.opacity = fade;
  grade.style.opacity = 1 - smooth(p / 0.62);
  landing.inert = fade < 0.02;
  landing.setAttribute("aria-hidden", String(landing.inert));
  world.style.visibility = finished ? "hidden" : "visible";
  if (engaged !== finished) {
    engaged = finished;
    renderScope();
    screen.inert = !finished;
    screen.setAttribute("aria-hidden", String(!finished));
    if (finished) {
      route(activeFile);
      if (
        entering ||
        document.activeElement === document.body ||
        landing.contains(document.activeElement)
      )
        focusFile();
    } else {
      setMenu(false);
    }
    if (!finished && screen.contains(document.activeElement))
      document.activeElement.blur();
    entering = false;
  }
  if (progress === 0 && !flight) {
    if (returning) select(".enter").focus({ preventScroll: true });
    returning = false;
    if (location.hash && pages.some((page) => "#" + page.id === location.hash))
      route(null);
  }
  if (ctx && !finished && now - lastDraw > 48) {
    drawRoom(phase);
    lastDraw = now;
  }
  if (lastClock !== Math.floor(now / 1000)) {
    select(".systembar time").textContent = new Date().toLocaleTimeString(
      "en-GB",
      { hour: "2-digit", minute: "2-digit" },
    );
    lastClock = Math.floor(now / 1000);
  }
  if (idle || flight) requestFrame();
}
function travel(inside, instant = false) {
  const target = inside ? limit : 0;
  flight = null;
  if (instant || reduced.matches || Math.abs(scrollY - target) < 1)
    window.scrollTo(0, target);
  else
    flight = {
      inside,
      startY: scrollY,
      startTime: performance.now(),
      duration: inside ? 1250 : 900,
    };
  requestFrame();
}
function goInside(index, instant = false) {
  openFile(index);
  route(index);
  returning = false;
  entering = true;
  if (engaged) focusFile();
  travel(true, instant);
}
function goOutside(instant = false) {
  entering = false;
  returning = true;
  route(null);
  travel(false, instant);
}
function restoreRoute() {
  if (finder.open) finder.close();
  const aliases = {
    work: "black-cow",
    portfolio: "black-cow",
    resume: "experience",
    about: "experience",
  };
  const hash = location.hash.slice(1);
  const index = pages.findIndex((page) => page.id === (aliases[hash] || hash));
  if (index >= 0) goInside(index, true);
  else goOutside(true);
}
document
  .querySelectorAll("[data-enter]")
  .forEach(
    (link) =>
      (link.onclick = (event) => follow(event, Number(link.dataset.enter))),
  );
select("#exit").onclick = () => goOutside();
window.addEventListener("hashchange", restoreRoute);
for (const type of ["wheel", "touchstart"]) {
  window.addEventListener(
    type,
    () => {
      if (flight) {
        flight = null;
        entering = false;
        returning = false;
      }
    },
    { passive: true },
  );
}
window.addEventListener("keydown", (e) => {
  if (finder.open || e.altKey || e.metaKey || e.ctrlKey || e.defaultPrevented)
    return;
  if (engaged && e.key === "/") {
    e.preventDefault();
    launch.click();
    return;
  }
  if (
    ["PageDown", "PageUp", "Home", "End", "ArrowDown", "ArrowUp", " "].includes(
      e.key,
    )
  )
    flight = null;
  if (e.key === "Escape" && directory.classList.contains("open")) {
    e.preventDefault();
    setMenu(false, true);
    return;
  }
  if (e.key === "Escape" && window.scrollY > 0) {
    e.preventDefault();
    goOutside();
    return;
  }
  if (engaged && /^[1-6]$/.test(e.key)) {
    e.preventDefault();
    goInside(Number(e.key) - 1);
    return;
  }
  if (
    !engaged &&
    e.key === "Enter" &&
    (document.activeElement === document.body || landing.inert)
  ) {
    e.preventDefault();
    goInside(activeFile);
  }
});
window.addEventListener(
  "pointermove",
  (e) => {
    if (e.pointerType === "mouse") {
      px = e.clientX / width - 0.5;
      py = e.clientY / height - 0.5;
    }
  },
  { passive: true },
);
window.addEventListener("resize", measure);
window.addEventListener("scroll", requestFrame, { passive: true });
reduced.addEventListener("change", requestFrame);
for (const [target, event] of [
  [document, "visibilitychange"],
  [reduced, "change"],
])
  target.addEventListener(event, renderScope);
document.addEventListener("visibilitychange", requestFrame);
setInterval(() => {
  if (engaged) requestFrame();
}, 15000);
document.documentElement.classList.add("enhanced");
history.scrollRestoration = "manual";
screen.inert = true;
screen.setAttribute("aria-hidden", "true");
enableTuning(
  () => phase,
  () => {
    renderScope();
    lastDraw = -Infinity;
    requestFrame();
  },
);
openFile(0);
measure();
if (location.hash) restoreRoute();
