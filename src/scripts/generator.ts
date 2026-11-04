import {
  WORD_COUNTS,
  MAX_PEOPLE,
  MAX_PLACES,
  MAX_PP_PLACES,
  MAX_SEEDS,
  backupDoc,
  defaultConfig,
  instructionsDoc,
  newSeed,
  passphraseDoc,
  type Config,
  type WordCount,
} from "../lib/documents";

type DocKey = "instructions" | "backup" | "passphrase";

const DOC_TITLES: Record<DocKey, string> = {
  instructions: "Instrucciones de recuperación para mis herederos",
  backup: "Hojas de backup de frases semilla",
  passphrase: "Hojas de passphrase",
};

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

export function initGenerator() {
  // In memory only: nothing is stored or sent.
  const cfg: Config = defaultConfig();
  let current: DocKey = "instructions";

  const placesEl = $("#places");
  const seedsEl = $("#seeds");
  const peopleEl = $("#people");
  const placesHintEl = $("#places-hint");
  const ppPlacesBoxEl = $("#pp-places-box");
  const ppPlacesEl = $("#pp-places");
  const tabsEl = $("#tabs");
  const previewEl = $("#preview");
  const wrapEl = $("#preview-wrap");
  const summaryEl = $("#summary");
  const rabbyEl = $<HTMLInputElement>("#opt-rabby");
  const exchEl = $<HTMLInputElement>("#opt-exchanges");

  const removeIcon = `<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

  /* ---------------- Form rendering ---------------- */

  // Each location keeps a copy of every seed: copies per seed = locations.
  // Passphrases go in their own locations, each of which also keeps a copy of all of them.
  const anyPp = () => cfg.seeds.some((s) => s.passphrase);

  function renderPlaces() {
    placesEl.innerHTML = stepper("places", 0, cfg.places, 1, MAX_PLACES, "Número de lugares");
    const n = cfg.seeds.length;
    const total = cfg.places * n;
    placesHintEl.textContent =
      cfg.places === 1
        ? `Se imprime${total === 1 ? " 1 hoja" : `n ${total} hojas`}, todas para el mismo lugar.`
        : `Se imprimen ${total} hojas: ${n === 1 ? "una" : n} para cada lugar.`;
    ppPlacesBoxEl.hidden = !anyPp();
    ppPlacesEl.innerHTML = stepper("pp-places", 0, cfg.ppPlaces, 1, MAX_PP_PLACES, "Número de lugares para passphrases");
  }

  function stepper(action: string, i: number, value: number, min: number, max: number, label: string) {
    return `<span class="stepper" role="group" aria-label="${label}">
      <button type="button" data-action="${action}" data-i="${i}" data-d="-1" ${value <= min ? "disabled" : ""} aria-label="Una menos">−</button>
      <output aria-live="polite">${value}</output>
      <button type="button" data-action="${action}" data-i="${i}" data-d="1" ${value >= max ? "disabled" : ""} aria-label="Una más">+</button>
    </span>`;
  }

  function renderSeeds() {
    seedsEl.innerHTML = cfg.seeds
      .map(
        (s, i) => `
        <div class="card">
          <div class="flex items-center justify-between gap-3 px-4 pt-3">
            <h3 class="font-bold">Frase semilla n.º ${i + 1}</h3>
            ${
              cfg.seeds.length > 1
                ? `<button type="button" class="icon-btn" data-action="remove-seed" data-i="${i}" aria-label="Quitar frase semilla ${i + 1}" title="Quitar">${removeIcon}</button>`
                : ""
            }
          </div>
          <div class="row flex-wrap" role="radiogroup" aria-labelledby="seed-${i}-words-label">
            <span id="seed-${i}-words-label" class="row-label">Palabras</span>
            <span class="seg">
              ${WORD_COUNTS.map(
                (n) => `<label><input type="radio" class="sr-only" id="seed-${i}-w${n}" name="seed-${i}-words" value="${n}" data-seed="${i}" data-field="words" ${n === s.words ? "checked" : ""} /><span>${n}</span></label>`,
              ).join("")}
            </span>
          </div>
          <label class="row cursor-pointer">
            <span class="row-text">
              <span class="row-label">Usa passphrase</span>
              <span class="row-help">Una contraseña extra añadida a la semilla. Si no sabes qué es, déjalo desactivado.</span>
            </span>
            <input type="checkbox" role="switch" class="switch" id="seed-${i}-pp" data-seed="${i}" data-field="passphrase" ${s.passphrase ? "checked" : ""} />
          </label>
        </div>`,
      )
      .join("");
    $<HTMLButtonElement>('[data-action="add-seed"]').disabled = cfg.seeds.length >= MAX_SEEDS;
  }

  function renderPeople() {
    peopleEl.innerHTML = stepper("people", 0, cfg.people, 0, MAX_PEOPLE, "Número de personas de confianza");
  }

  /* ---------------- Preview ---------------- */

  const docs = (): Record<DocKey, string> => ({
    instructions: instructionsDoc(cfg),
    backup: backupDoc(cfg),
    passphrase: passphraseDoc(cfg),
  });

  const sheetCount = () => cfg.places * cfg.seeds.length;
  const ppCount = () => (anyPp() ? cfg.ppPlaces * cfg.seeds.filter((s) => s.passphrase).length : 0);

  function renderTabs() {
    const pp = ppCount();
    if (!pp && current === "passphrase") current = "backup";
    const tabs: [DocKey, string][] = [
      ["instructions", "Instrucciones"],
      ["backup", `Hojas de backup (${sheetCount()})`],
    ];
    if (pp) tabs.push(["passphrase", `Passphrases (${pp})`]);
    tabsEl.innerHTML = tabs
      .map(
        ([k, label]) =>
          `<button type="button" role="tab" class="tab" data-tab="${k}" aria-selected="${k === current}" tabindex="${k === current ? 0 : -1}">${label}</button>`,
      )
      .join("");
  }

  function renderPreview() {
    previewEl.innerHTML = docs()[current].replaceAll('class="doc-page', 'class="paper-shadow doc-page');
    const n = previewEl.querySelectorAll(".doc-page.sheet").length;
    const sum: Record<DocKey, string> = {
      instructions: "Documento de varias páginas. Guárdalo lejos de las hojas de backup.",
      backup: `${n} páginas: una de uso y ${n - 1} hojas, una por cada copia.`,
      passphrase: `${n} páginas: una de uso y ${n - 1} hojas de passphrase.`,
    };
    summaryEl.textContent = sum[current];
    fit();
  }

  function fit() {
    const avail = wrapEl.clientWidth - parseFloat(getComputedStyle(wrapEl).paddingLeft) * 2;
    const z = Math.min(1, avail / 794);
    previewEl.style.setProperty("zoom", String(z));
  }
  new ResizeObserver(fit).observe(wrapEl);

  function refresh(form = false) {
    if (form) {
      renderPlaces();
      renderSeeds();
      renderPeople();
    }
    renderTabs();
    renderPreview();
  }

  /* ---------------- Events ---------------- */

  document.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-action], [data-tab]");
    if (!t) return;

    if (t.dataset.tab) {
      current = t.dataset.tab as DocKey;
      renderTabs();
      renderPreview();
      wrapEl.scrollTop = 0;
      return;
    }

    const i = Number(t.dataset.i);
    const d = Number(t.dataset.d);
    switch (t.dataset.action) {
      case "places":
        cfg.places = Math.max(1, Math.min(MAX_PLACES, cfg.places + d));
        break;
      case "pp-places":
        cfg.ppPlaces = Math.max(1, Math.min(MAX_PP_PLACES, cfg.ppPlaces + d));
        break;
      case "add-seed":
        cfg.seeds.push(newSeed());
        refresh(true);
        document.getElementById(`seed-${cfg.seeds.length - 1}-w24`)?.focus();
        return;
      case "remove-seed":
        cfg.seeds.splice(i, 1);
        break;
      case "people":
        cfg.people = Math.max(0, Math.min(MAX_PEOPLE, cfg.people + d));
        break;
      default:
        return;
    }
    refresh(true);
  });

  document.addEventListener("change", (e) => {
    const el = e.target as HTMLInputElement & HTMLSelectElement;
    if (el === rabbyEl) cfg.rabby = el.checked;
    else if (el === exchEl) cfg.exchanges = el.checked;
    else if (el.dataset.seed !== undefined) {
      const s = cfg.seeds[Number(el.dataset.seed)];
      if (el.dataset.field === "words") s.words = Number(el.value) as WordCount;
      else if (el.dataset.field === "passphrase") s.passphrase = el.checked;
      else return;
      // Structural changes: re-render the card and return focus to the same control.
      const id = el.id;
      refresh(true);
      if (id) document.getElementById(id)?.focus();
      return;
    } else return;
    renderPreview();
  });

  // Left/right arrow keys move between tabs
  tabsEl.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const tabs = [...tabsEl.querySelectorAll<HTMLButtonElement>("[data-tab]")];
    const idx = tabs.findIndex((t) => t.dataset.tab === current);
    const next = tabs[(idx + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    current = next.dataset.tab as DocKey;
    renderTabs();
    renderPreview();
    tabsEl.querySelector<HTMLButtonElement>(`[data-tab="${current}"]`)?.focus();
  });

  /* ---------------- Printing ---------------- */

  const printRoot = $("#print-root");
  const originalTitle = document.title;
  $("#print").addEventListener("click", () => {
    printRoot.innerHTML = docs()[current];
    document.title = DOC_TITLES[current]; // suggested PDF file name
    window.print();
  });
  window.addEventListener("afterprint", () => {
    printRoot.innerHTML = "";
    document.title = originalTitle;
  });

  refresh(true);
}
