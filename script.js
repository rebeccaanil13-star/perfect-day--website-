(function () {
  // ---------------- DATA ----------------

  const SLOTS = [
    {
      id: "dawn",
      label: "Dawn",
      time: "6–9am",
      sky: ["#FFE3C4", "#FFB6A3"],
      icon: "🌅",
    },
    {
      id: "morning",
      label: "Morning",
      time: "9–12pm",
      sky: ["#FFE8B8", "#A8D8EA"],
      icon: "🌤️",
    },
    {
      id: "midday",
      label: "Midday",
      time: "12–3pm",
      sky: ["#8FD0F0", "#EAF6FF"],
      icon: "☀️",
    },
    {
      id: "afternoon",
      label: "Afternoon",
      time: "3–6pm",
      sky: ["#A8D8EA", "#FFD59A"],
      icon: "🌥️",
    },
    {
      id: "golden",
      label: "Golden Hour",
      time: "6–8pm",
      sky: ["#FF9A56", "#FF6B9D"],
      icon: "🌇",
    },
    {
      id: "evening",
      label: "Evening",
      time: "8–10pm",
      sky: ["#9D6B9D", "#3E2C63"],
      icon: "🌆",
    },
    {
      id: "night",
      label: "Night",
      time: "10pm–1am",
      sky: ["#241542", "#0F0A24"],
      icon: "🌌",
    },
  ];

  // tags: energy, calm, joy, social  (0-2 each)
  const ACTIVITIES = [
    {
      id: "a1",
      name: "Sunrise walk",
      emoji: "🌅",
      ideal: ["dawn"],
      tags: { energy: 1, calm: 2, joy: 1, social: 0 },
    },
    {
      id: "a2",
      name: "Slow coffee ritual",
      emoji: "☕",
      ideal: ["dawn", "morning"],
      tags: { energy: 2, calm: 1, joy: 0, social: 0 },
    },
    {
      id: "a3",
      name: "Journaling",
      emoji: "📓",
      ideal: ["dawn", "night"],
      tags: { energy: 0, calm: 2, joy: 1, social: 0 },
    },
    {
      id: "a4",
      name: "Yoga & stretch",
      emoji: "🧘",
      ideal: ["dawn", "morning"],
      tags: { energy: 1, calm: 2, joy: 0, social: 0 },
    },
    {
      id: "a5",
      name: "Farmers market",
      emoji: "🧺",
      ideal: ["morning"],
      tags: { energy: 1, calm: 0, joy: 2, social: 2 },
    },
    {
      id: "a6",
      name: "Deep work session",
      emoji: "💻",
      ideal: ["morning", "midday"],
      tags: { energy: 1, calm: 0, joy: 1, social: 0 },
    },
    {
      id: "a7",
      name: "Picnic lunch",
      emoji: "🥪",
      ideal: ["midday"],
      tags: { energy: 0, calm: 1, joy: 2, social: 1 },
    },
    {
      id: "a8",
      name: "Swim or beach",
      emoji: "🏖️",
      ideal: ["midday", "afternoon"],
      tags: { energy: 2, calm: 1, joy: 2, social: 0 },
    },
    {
      id: "a9",
      name: "Nap in the sun",
      emoji: "😴",
      ideal: ["afternoon"],
      tags: { energy: 0, calm: 2, joy: 1, social: 0 },
    },
    {
      id: "a10",
      name: "Bike ride",
      emoji: "🚲",
      ideal: ["afternoon"],
      tags: { energy: 2, calm: 0, joy: 1, social: 0 },
    },
    {
      id: "a11",
      name: "Coffee with a friend",
      emoji: "👯",
      ideal: ["afternoon"],
      tags: { energy: 0, calm: 1, joy: 1, social: 2 },
    },
    {
      id: "a12",
      name: "Watch the sunset",
      emoji: "🌇",
      ideal: ["golden"],
      tags: { energy: 0, calm: 2, joy: 2, social: 0 },
    },
    {
      id: "a13",
      name: "Rooftop dinner",
      emoji: "🍽️",
      ideal: ["golden", "evening"],
      tags: { energy: 0, calm: 1, joy: 2, social: 2 },
    },
    {
      id: "a14",
      name: "Live music & dancing",
      emoji: "🎶",
      ideal: ["evening"],
      tags: { energy: 2, calm: 0, joy: 2, social: 1 },
    },
    {
      id: "a15",
      name: "Board games",
      emoji: "🎲",
      ideal: ["evening"],
      tags: { energy: 0, calm: 0, joy: 1, social: 2 },
    },
    {
      id: "a16",
      name: "Stargazing",
      emoji: "🌌",
      ideal: ["night"],
      tags: { energy: 0, calm: 2, joy: 1, social: 0 },
    },
    {
      id: "a17",
      name: "Cozy movie night",
      emoji: "🎬",
      ideal: ["night"],
      tags: { energy: 0, calm: 1, joy: 1, social: 0 },
    },
    {
      id: "a18",
      name: "Bath & skincare",
      emoji: "🛁",
      ideal: ["night"],
      tags: { energy: 0, calm: 2, joy: 0, social: 0 },
    },
  ];

  const IDEAL_BONUS = 3;
  const COMBO_BONUS = 1;

  // ---------------- STATE ----------------

  // slotId -> activity object (or null)
  const placement = {};
  SLOTS.forEach((s) => (placement[s.id] = null));

  let selectedCardId = null; // for tap-to-place on mobile / accessibility

  // ---------------- DOM refs ----------------
  const arcRegion = document.getElementById("arcRegion");
  const sunToken = document.getElementById("sunToken");
  const arcLine = document.getElementById("arcLine");
  const deckGrid = document.getElementById("deckGrid");
  const finishBtn = document.getElementById("finishBtn");
  const resetBtn = document.getElementById("resetBtn");
  const deckHint = document.getElementById("deckHint");

  const VIEW_W = 980,
    VIEW_H = 230;

  function arcPoint(t) {
    // t in [0,1] across the arc. Arc dips like a rainbow (sun rises, peaks, sets).
    const x = 70 + t * (VIEW_W - 140);
    const y = 170 - Math.sin(t * Math.PI) * 130;
    return { x, y };
  }

  function buildArcPathD() {
    let d = "";
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const p = arcPoint(t);
      d += (i === 0 ? "M" : "L") + p.x.toFixed(1) + " " + p.y.toFixed(1) + " ";
    }
    return d;
  }

  function pctToViewBoxPct(p) {
    return {
      left: (p.x / VIEW_W) * 100 + "%",
      top: (p.y / VIEW_H) * 100 + "%",
    };
  }

  // ---------------- BUILD SLOTS ----------------

  function buildSlots() {
    SLOTS.forEach((slot, i) => {
      const t = (i + 0.5) / SLOTS.length;
      const p = arcPoint(t);
      const pos = pctToViewBoxPct(p);

      const el = document.createElement("div");
      el.className = "slot";
      el.style.left = pos.left;
      el.style.top = pos.top;
      el.dataset.slotId = slot.id;

      el.innerHTML = `
        <div class="slot-time">${slot.time}</div>
        <div class="slot-drop" tabindex="0" role="button"
             aria-label="${slot.label}, ${slot.time}. Empty. Activate to place selected card."
             data-slot="${slot.id}">
          <span class="slot-emoji">${slot.icon}</span>
          <span class="clear-x" title="Remove">✕</span>
        </div>
        <div class="slot-label">${slot.label}</div>
      `;
      arcRegion.appendChild(el);
    });
  }

  // ---------------- BUILD DECK ----------------

  function buildDeck() {
    deckGrid.innerHTML = "";
    ACTIVITIES.forEach((act) => {
      const card = document.createElement("div");
      card.className = "card";
      card.draggable = true;
      card.dataset.actId = act.id;
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      const idealLabel = act.ideal
        .map((id) => SLOTS.find((s) => s.id === id).label)
        .join(" / ");
      card.setAttribute("aria-label", `${act.name}, best ${idealLabel}`);
      card.innerHTML = `
        <span class="emoji">${act.emoji}</span>
        <div class="name">${act.name}</div>
        <div class="ideal">${idealLabel}</div>
      `;
      deckGrid.appendChild(card);
    });
  }

  // ---------------- SKY / SUN sync ----------------

  function setSky(colors, animate = true) {
    document.documentElement.style.setProperty("--sky-a", colors[0]);
    document.documentElement.style.setProperty("--sky-b", colors[1]);
  }

  function moveSunTo(slotIndexFloat) {
    const t = (slotIndexFloat + 0.5) / SLOTS.length;
    const p = arcPoint(t);
    const pos = pctToViewBoxPct(p);
    sunToken.style.left = pos.left;
    sunToken.style.top = pos.top;
  }

  function defaultSky() {
    // blend of dawn->night average, calm neutral resting sky
    setSky(["#FFE3C4", "#A8D8EA"]);
    // rest sun at dawn
    moveSunTo(0);
  }

  // ---------------- INTERACTION ----------------

  function isUsed(actId) {
    return Object.values(placement).some((a) => a && a.id === actId);
  }

  function refreshDeckStates() {
    deckGrid.querySelectorAll(".card").forEach((card) => {
      const used = isUsed(card.dataset.actId);
      card.classList.toggle("used", used);
      card.classList.toggle("selected", card.dataset.actId === selectedCardId);
    });
  }

  function refreshFinishButton() {
    const filledCount = Object.values(placement).filter(Boolean).length;
    finishBtn.disabled = filledCount < SLOTS.length;
    finishBtn.textContent =
      filledCount < SLOTS.length
        ? `Close out the day (${filledCount}/${SLOTS.length})`
        : "Close out the day";
  }

  function placeActivity(slotId, actId) {
    const act = ACTIVITIES.find((a) => a.id === actId);
    if (!act) return;
    if (isUsed(actId)) return; // already placed elsewhere

    placement[slotId] = act;
    const dropEl = arcRegion.querySelector(`.slot-drop[data-slot="${slotId}"]`);
    dropEl.classList.add("filled");
    dropEl.querySelector(".slot-emoji").textContent = act.emoji;
    dropEl.setAttribute(
      "aria-label",
      `${SLOTS.find((s) => s.id === slotId).label}. Holds ${act.name}. Activate to remove.`,
    );
    dropEl.classList.remove("pop");
    void dropEl.offsetWidth; // reflow to restart animation
    dropEl.classList.add("pop");

    selectedCardId = null;
    refreshDeckStates();
    refreshFinishButton();
  }

  function clearSlot(slotId) {
    placement[slotId] = null;
    const slot = SLOTS.find((s) => s.id === slotId);
    const dropEl = arcRegion.querySelector(`.slot-drop[data-slot="${slotId}"]`);
    dropEl.classList.remove("filled");
    dropEl.querySelector(".slot-emoji").textContent = slot.icon;
    dropEl.setAttribute(
      "aria-label",
      `${slot.label}, ${slot.time}. Empty. Activate to place selected card.`,
    );
    refreshDeckStates();
    refreshFinishButton();
  }

  function wireDeckInteractions() {
    deckGrid.addEventListener("dragstart", (e) => {
      const card = e.target.closest(".card");
      if (!card || card.classList.contains("used")) return;
      e.dataTransfer.setData("text/plain", card.dataset.actId);
      e.dataTransfer.effectAllowed = "move";
    });

    deckGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      if (!card || card.classList.contains("used")) return;
      selectedCardId =
        selectedCardId === card.dataset.actId ? null : card.dataset.actId;
      refreshDeckStates();
      deckHint.textContent = selectedCardId
        ? `Selected "${ACTIVITIES.find((a) => a.id === selectedCardId).name}" — now tap a slot on the arc.`
        : "Drag a card onto a slot on the arc — or tap a card, then tap a slot.";
    });

    deckGrid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".card");
      if (!card) return;
      e.preventDefault();
      card.click();
    });
  }

  function wireSlotInteractions() {
    arcRegion.addEventListener("dragover", (e) => {
      const drop = e.target.closest(".slot-drop");
      if (!drop) return;
      e.preventDefault();
      drop.classList.add("hovering");
      const slotIndex = SLOTS.findIndex((s) => s.id === drop.dataset.slot);
      previewSky(slotIndex);
    });

    arcRegion.addEventListener("dragleave", (e) => {
      const drop = e.target.closest(".slot-drop");
      if (drop) drop.classList.remove("hovering");
    });

    arcRegion.addEventListener("drop", (e) => {
      const drop = e.target.closest(".slot-drop");
      if (!drop) return;
      e.preventDefault();
      drop.classList.remove("hovering");
      const actId = e.dataTransfer.getData("text/plain");
      if (placement[drop.dataset.slot]) return; // slot occupied
      placeActivity(drop.dataset.slot, actId);
    });

    arcRegion.addEventListener("mouseover", (e) => {
      const drop = e.target.closest(".slot-drop");
      if (!drop) return;
      const slotIndex = SLOTS.findIndex((s) => s.id === drop.dataset.slot);
      previewSky(slotIndex);
    });

    arcRegion.addEventListener("mouseleave", () => defaultSky());

    arcRegion.addEventListener("click", (e) => {
      const clearX = e.target.closest(".clear-x");
      const drop = e.target.closest(".slot-drop");
      if (clearX && drop) {
        e.stopPropagation();
        if (placement[drop.dataset.slot]) clearSlot(drop.dataset.slot);
        return;
      }
      if (!drop) return;
      const slotId = drop.dataset.slot;
      if (placement[slotId]) {
        // tapping a filled slot with nothing selected does nothing extra (use the X)
        return;
      }
      if (selectedCardId) {
        placeActivity(slotId, selectedCardId);
      }
    });

    arcRegion.addEventListener("keydown", (e) => {
      const drop = e.target.closest(".slot-drop");
      if (!drop) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        drop.click();
      }
      const slotIndex = SLOTS.findIndex((s) => s.id === drop.dataset.slot);
      previewSky(slotIndex);
    });

    arcRegion.addEventListener("focusin", (e) => {
      const drop = e.target.closest(".slot-drop");
      if (!drop) return;
      const slotIndex = SLOTS.findIndex((s) => s.id === drop.dataset.slot);
      previewSky(slotIndex);
    });
    arcRegion.addEventListener("focusout", () => defaultSky());
  }

  function previewSky(slotIndex) {
    if (slotIndex < 0) return;
    setSky(SLOTS[slotIndex].sky);
    moveSunTo(slotIndex);
  }

  // ---------------- SCORING ----------------

  function computeResult() {
    let score = 0;
    const totals = { energy: 0, calm: 0, joy: 0, social: 0 };
    const lines = [];

    SLOTS.forEach((slot, i) => {
      const act = placement[slot.id];
      if (!act) return;
      let pts =
        act.tags.energy + act.tags.calm + act.tags.joy + act.tags.social;
      let idealHit = act.ideal.includes(slot.id);
      if (idealHit) pts += IDEAL_BONUS;

      totals.energy += act.tags.energy;
      totals.calm += act.tags.calm;
      totals.joy += act.tags.joy;
      totals.social += act.tags.social;

      lines.push({ slot, act, idealHit });
      score += pts;
    });

    // adjacency combo: consecutive slots sharing a dominant tag
    for (let i = 0; i < SLOTS.length - 1; i++) {
      const a = placement[SLOTS[i].id],
        b = placement[SLOTS[i + 1].id];
      if (!a || !b) continue;
      const sharedTag = ["energy", "calm", "joy", "social"].find(
        (tag) => a.tags[tag] >= 1 && b.tags[tag] >= 1,
      );
      if (sharedTag) score += COMBO_BONUS;
    }

    return { score, totals, lines };
  }

  function titleFor(totals) {
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const top = entries[0][0];
    const titles = {
      energy: "A Wide-Awake Day",
      calm: "A Deeply Unhurried Day",
      joy: "A Full-Hearted Day",
      social: "A Day Made of Company",
    };
    return titles[top] || "A Perfectly Balanced Day";
  }

  // ---------------- RESULT MODAL ----------------

  const veil = document.getElementById("veil");
  const resultStrip = document.getElementById("resultStrip");
  const resultTitle = document.getElementById("resultTitle");
  const resultScore = document.getElementById("resultScore");
  const meterRow = document.getElementById("meterRow");
  const recap = document.getElementById("recap");

  function showResult() {
    const { score, totals, lines } = computeResult();

    resultStrip.innerHTML = "";
    SLOTS.forEach((s) => {
      const seg = document.createElement("div");
      seg.style.background = `linear-gradient(180deg, ${s.sky[0]}, ${s.sky[1]})`;
      resultStrip.appendChild(seg);
    });

    resultTitle.textContent = titleFor(totals);
    resultScore.textContent = score;

    const maxPossiblePerMeter = SLOTS.length * 2; // rough ceiling for bar scale
    meterRow.innerHTML = "";
    [
      ["Energy", "energy"],
      ["Calm", "calm"],
      ["Joy", "joy"],
      ["Social", "social"],
    ].forEach(([label, key]) => {
      const pct = Math.min(
        100,
        Math.round((totals[key] / maxPossiblePerMeter) * 100),
      );
      const row = document.createElement("div");
      row.className = "meter";
      row.innerHTML = `<span>${label}</span><span class="track"><span class="fill" style="width:0%" data-w="${pct}"></span></span><span>${totals[key]}</span>`;
      meterRow.appendChild(row);
    });

    recap.innerHTML = lines
      .map(
        (l) =>
          `<div><b>${l.slot.time}</b>${l.act.emoji} ${l.act.name}${l.idealHit ? ' <span style="opacity:.55">— perfect timing</span>' : ""}</div>`,
      )
      .join("");

    veil.classList.add("show");
    requestAnimationFrame(() => {
      meterRow.querySelectorAll(".fill").forEach((f) => {
        f.style.width = f.dataset.w + "%";
      });
    });

    window.__lastSummary = buildShareText(score, totals, lines);
  }

  function buildShareText(score, totals, lines) {
    const header = `${titleFor(totals)} — ${score} pts\n`;
    const body = lines
      .map((l) => `${l.slot.time.padEnd(10)} ${l.act.emoji} ${l.act.name}`)
      .join("\n");
    return header + body;
  }

  document.getElementById("finishBtn").addEventListener("click", showResult);
  document.getElementById("againBtn").addEventListener("click", () => {
    veil.classList.remove("show");
    fullReset();
  });
  document.getElementById("copyBtn").addEventListener("click", async () => {
    const btn = document.getElementById("copyBtn");
    try {
      await navigator.clipboard.writeText(window.__lastSummary || "");
      btn.textContent = "Copied ✓";
    } catch (e) {
      btn.textContent = "Copy failed";
    }
    setTimeout(() => (btn.textContent = "Copy summary"), 1600);
  });

  // ---------------- RESET ----------------

  function fullReset() {
    SLOTS.forEach((s) => {
      placement[s.id] = null;
    });
    arcRegion.querySelectorAll(".slot-drop").forEach((drop) => {
      const slot = SLOTS.find((s) => s.id === drop.dataset.slot);
      drop.classList.remove("filled");
      drop.querySelector(".slot-emoji").textContent = slot.icon;
      drop.setAttribute(
        "aria-label",
        `${slot.label}, ${slot.time}. Empty. Activate to place selected card.`,
      );
    });
    selectedCardId = null;
    refreshDeckStates();
    refreshFinishButton();
    defaultSky();
  }

  resetBtn.addEventListener("click", fullReset);

  // ---------------- INIT ----------------

  arcLine.setAttribute("d", buildArcPathD());
  buildSlots();
  buildDeck();
  wireDeckInteractions();
  wireSlotInteractions();
  defaultSky();
  refreshFinishButton();
})();
