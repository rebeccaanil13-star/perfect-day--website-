(function () {
  const SINGLE_CATS = ["outerwear", "top", "bottom", "shoes"];
  const CAT_LABEL = {
    outerwear: "Outerwear",
    top: "Top",
    bottom: "Bottom",
    shoes: "Shoes",
    accessory: "Accessory",
  };
  const TAB_LABEL = {
    today: "Today's Look",
    wardrobe: "Wardrobe",
    saved: "Saved Outfits",
  };

  let items = [];
  let outfits = [];
  let carouselIndex = { outerwear: 0, top: 0, bottom: 0, shoes: 0 };
  let selectedAccessories = new Set();
  let wardrobeFilter = "all";
  let activeTab = "today";
  let pendingImage = null;
  let toastTimer = null;
  let cameraStream = null;
  let facingMode = "environment";

  // ---------- storage ----------
  async function loadAll() {
    try {
      const r = await window.storage.get("closet:items", false);
      items = r && r.value ? JSON.parse(r.value) : [];
    } catch (e) {
      items = [];
    }
    try {
      const r = await window.storage.get("closet:outfits", false);
      outfits = r && r.value ? JSON.parse(r.value) : [];
    } catch (e) {
      outfits = [];
    }
    renderAll();
  }
  async function persistItems() {
    try {
      await window.storage.set("closet:items", JSON.stringify(items), false);
    } catch (e) {
      console.error("save items failed", e);
    }
  }
  async function persistOutfits() {
    try {
      await window.storage.set(
        "closet:outfits",
        JSON.stringify(outfits),
        false,
      );
    } catch (e) {
      console.error("save outfits failed", e);
    }
  }

  function escapeHtml(s) {
    return (s || "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }
  function categoryItems(cat) {
    return items.filter((i) => i.category === cat);
  }

  function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  // ---------- tabs ----------
  document.querySelectorAll(".tabbtn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  function switchTab(tab) {
    activeTab = tab;
    document
      .querySelectorAll(".tabbtn")
      .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    document
      .querySelectorAll(".tabview")
      .forEach((v) => v.classList.remove("active"));
    document.getElementById("tab-" + tab).classList.add("active");
    document.getElementById("tab-label").textContent = TAB_LABEL[tab];
    if (tab === "today") renderToday();
    if (tab === "wardrobe") renderWardrobe();
    if (tab === "saved") renderSaved();
  }

  function renderAll() {
    renderToday();
    renderChips();
    renderWardrobe();
    renderSaved();
  }

  // ---------- TODAY'S LOOK ----------
  function clampIndices() {
    SINGLE_CATS.forEach((cat) => {
      const n = categoryItems(cat).length;
      if (n === 0) {
        carouselIndex[cat] = 0;
        return;
      }
      carouselIndex[cat] = ((carouselIndex[cat] % n) + n) % n;
    });
  }

  function renderToday() {
    clampIndices();
    const wrap = document.getElementById("carousel-panels");
    wrap.innerHTML = SINGLE_CATS.map((cat) => {
      const list = categoryItems(cat);
      const item = list.length ? list[carouselIndex[cat]] : null;
      const disabled = list.length <= 1 ? "disabled" : "";
      return `
      <div class="cat-panel">
        <div class="cat-tab">${CAT_LABEL[cat].toUpperCase()}</div>
        <div class="cat-row">
          <button class="arrow-btn" data-cat="${cat}" data-dir="-1" ${disabled}>◀</button>
          <div class="cat-display">
            ${
              item
                ? `<img src="${item.image}" alt="${escapeHtml(item.name)}"><span class="item-caption">${escapeHtml(item.name)}</span>`
                : `<div class="cat-empty"><b>No ${CAT_LABEL[cat].toLowerCase()} yet</b>Add one from the Wardrobe tab</div>`
            }
          </div>
          <button class="arrow-btn" data-cat="${cat}" data-dir="1" ${disabled}>▶</button>
        </div>
      </div>`;
    }).join("");

    wrap.querySelectorAll(".arrow-btn").forEach((b) => {
      b.addEventListener("click", () => {
        const cat = b.dataset.cat,
          dir = parseInt(b.dataset.dir, 10);
        const n = categoryItems(cat).length;
        if (n === 0) return;
        carouselIndex[cat] = (((carouselIndex[cat] + dir) % n) + n) % n;
        renderToday();
      });
    });

    // accessories
    const accList = categoryItems("accessory");
    const accPanel = document.getElementById("acc-panel");
    if (accList.length === 0) {
      accPanel.innerHTML = `<div class="acc-empty">No accessories yet — add some from the Wardrobe tab</div>`;
    } else {
      accPanel.innerHTML = accList
        .map(
          (a) => `
        <div class="acc-icon ${selectedAccessories.has(a.id) ? "active" : ""}" data-id="${a.id}" title="${escapeHtml(a.name)}">
          <img src="${a.image}" alt="${escapeHtml(a.name)}">
        </div>`,
        )
        .join("");
      accPanel.querySelectorAll(".acc-icon").forEach((el) => {
        el.addEventListener("click", () => {
          const id = el.dataset.id;
          if (selectedAccessories.has(id)) selectedAccessories.delete(id);
          else selectedAccessories.add(id);
          renderToday();
        });
      });
    }

    // look counter
    const counts = {};
    SINGLE_CATS.forEach(
      (c) => (counts[c] = Math.max(1, categoryItems(c).length)),
    );
    const total = counts.outerwear * counts.top * counts.bottom * counts.shoes;
    let linear = carouselIndex.outerwear;
    linear = linear * counts.top + carouselIndex.top;
    linear = linear * counts.bottom + carouselIndex.bottom;
    linear = linear * counts.shoes + carouselIndex.shoes;
    document.getElementById("look-counter").textContent =
      `Look ${linear + 1} of ${total}`;
  }

  document.getElementById("btn-shuffle").addEventListener("click", () => {
    SINGLE_CATS.forEach((cat) => {
      const n = categoryItems(cat).length;
      if (n > 0) carouselIndex[cat] = Math.floor(Math.random() * n);
    });
    const accList = categoryItems("accessory");
    selectedAccessories = new Set();
    if (accList.length) {
      const pickCount = Math.floor(
        Math.random() * Math.min(3, accList.length + 1),
      );
      const shuffled = [...accList].sort(() => Math.random() - 0.5);
      shuffled
        .slice(0, pickCount)
        .forEach((a) => selectedAccessories.add(a.id));
    }
    renderToday();
  });

  function currentSlots() {
    const slots = {};
    SINGLE_CATS.forEach((cat) => {
      const list = categoryItems(cat);
      slots[cat] = list.length ? list[carouselIndex[cat]].id : null;
    });
    return { slots, accessories: [...selectedAccessories] };
  }

  function hasAnyPiece() {
    const { slots, accessories } = currentSlots();
    return Object.values(slots).some(Boolean) || accessories.length > 0;
  }

  async function saveLook(name) {
    const { slots, accessories } = currentSlots();
    const outfit = {
      id: "look_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      name,
      slots,
      accessories,
      createdAt: Date.now(),
    };
    outfits.unshift(outfit);
    await persistOutfits();
    renderSaved();
  }

  const saveForm = document.getElementById("save-form");
  document.getElementById("btn-save-look").addEventListener("click", () => {
    if (!hasAnyPiece()) {
      showToast("Add some pieces first");
      return;
    }
    saveForm.style.display = "flex";
    document.getElementById("save-name-input").focus();
  });
  document.getElementById("save-cancel").addEventListener("click", () => {
    saveForm.style.display = "none";
    document.getElementById("save-name-input").value = "";
  });
  document
    .getElementById("save-confirm")
    .addEventListener("click", async () => {
      const input = document.getElementById("save-name-input");
      const name = input.value.trim() || "Untitled Look";
      await saveLook(name);
      input.value = "";
      saveForm.style.display = "none";
      showToast("Look saved!");
    });
  document.getElementById("btn-wear").addEventListener("click", async () => {
    if (!hasAnyPiece()) {
      showToast("Add some pieces first");
      return;
    }
    const dateStr = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    await saveLook("Worn – " + dateStr);
    showToast("Wearing it today!");
  });

  // ---------- WARDROBE ----------
  function renderChips() {
    const chips = document.getElementById("chips");
    const cats = ["all", "outerwear", "top", "bottom", "shoes", "accessory"];
    chips.innerHTML = cats
      .map(
        (c) =>
          `<button class="chip ${c === wardrobeFilter ? "active" : ""}" data-cat="${c}">${c === "all" ? "All" : CAT_LABEL[c]}</button>`,
      )
      .join("");
    chips.querySelectorAll(".chip").forEach((ch) => {
      ch.addEventListener("click", () => {
        wardrobeFilter = ch.dataset.cat;
        renderChips();
        renderWardrobe();
      });
    });
  }

  function renderWardrobe() {
    const grid = document.getElementById("wardrobe-grid");
    const filtered =
      wardrobeFilter === "all"
        ? items
        : items.filter((i) => i.category === wardrobeFilter);
    let html = `<div class="add-tile" id="add-tile"><span class="plus">+</span>Add Piece</div>`;
    if (items.length === 0) {
      html += `<div class="empty-msg"><b>Your wardrobe is empty.</b>Add your first piece to build looks.</div>`;
    } else if (filtered.length === 0) {
      html += `<div class="empty-msg"><b>Nothing here yet.</b>Try another category.</div>`;
    } else {
      html += filtered
        .map(
          (item) => `
        <div class="item-card">
          <button class="item-del" data-id="${item.id}" aria-label="Remove ${escapeHtml(item.name)}">✕</button>
          <img src="${item.image}" alt="${escapeHtml(item.name)}">
          <div class="item-info">
            <div class="name">${escapeHtml(item.name)}</div>
            <div class="cat"><span class="swatch" style="background:${item.color}"></span>${CAT_LABEL[item.category]}</div>
          </div>
        </div>`,
        )
        .join("");
    }
    grid.innerHTML = html;
    document.getElementById("add-tile").addEventListener("click", openAddModal);
    grid.querySelectorAll(".item-del").forEach((b) => {
      b.addEventListener("click", () => deleteItem(b.dataset.id));
    });
  }

  async function deleteItem(id) {
    items = items.filter((i) => i.id !== id);
    selectedAccessories.delete(id);
    await persistItems();
    renderWardrobe();
    renderToday();
  }

  // ---------- ADD MODAL ----------
  const backdrop = document.getElementById("add-backdrop");
  const fileInput = document.getElementById("file-input");
  const uploadZone = document.getElementById("upload-zone");
  const uploadPreview = document.getElementById("upload-preview");
  const uploadPlaceholder = document.getElementById("upload-placeholder");
  const confirmAdd = document.getElementById("confirm-add");
  const itemNameInput = document.getElementById("item-name");

  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read failed"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("decode failed"));
        img.onload = () => {
          const maxDim = 480;
          let w = img.width,
            h = img.height;
          if (w > h && w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const sourceRow = document.getElementById("source-row");
  const cameraBox = document.getElementById("camera-box");
  const cameraVideo = document.getElementById("camera-video");
  const cameraError = document.getElementById("camera-error");

  function openAddModal() {
    pendingImage = null;
    fileInput.value = "";
    uploadPreview.style.display = "none";
    uploadPlaceholder.style.display = "block";
    uploadPlaceholder.textContent = "No photo yet";
    itemNameInput.value = "";
    document.getElementById("item-category").value = "top";
    document.getElementById("item-color").value = "#6e6a3f";
    stopCamera();
    sourceRow.style.display = "flex";
    cameraBox.style.display = "none";
    checkAddValid();
    backdrop.classList.add("open");
  }
  function closeAddModal() {
    stopCamera();
    backdrop.classList.remove("open");
  }
  document
    .getElementById("cancel-add")
    .addEventListener("click", closeAddModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeAddModal();
  });
  document
    .getElementById("btn-choose-file")
    .addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      pendingImage = await resizeImage(file);
      uploadPreview.src = pendingImage;
      uploadPreview.style.display = "block";
      uploadPlaceholder.style.display = "none";
    } catch (e) {
      uploadPlaceholder.textContent =
        "Could not read that image — try another.";
    }
    checkAddValid();
  });
  itemNameInput.addEventListener("input", checkAddValid);
  function checkAddValid() {
    confirmAdd.disabled = !(
      pendingImage && itemNameInput.value.trim().length > 0
    );
  }

  // ---------- camera capture ----------
  async function startCamera() {
    cameraError.style.display = "none";
    sourceRow.style.display = "none";
    cameraBox.style.display = "block";
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      cameraVideo.srcObject = cameraStream;
    } catch (e) {
      cameraError.textContent =
        "Could not access the camera — check your browser permissions, or choose a photo instead.";
      cameraError.style.display = "block";
    }
  }
  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      cameraStream = null;
    }
    cameraVideo.srcObject = null;
  }
  document
    .getElementById("btn-open-camera")
    .addEventListener("click", startCamera);
  document.getElementById("btn-cancel-camera").addEventListener("click", () => {
    stopCamera();
    cameraBox.style.display = "none";
    sourceRow.style.display = "flex";
  });
  document.getElementById("btn-switch-camera").addEventListener("click", () => {
    facingMode = facingMode === "environment" ? "user" : "environment";
    stopCamera();
    startCamera();
  });
  document.getElementById("btn-capture").addEventListener("click", () => {
    if (!cameraVideo.videoWidth) return;
    const maxDim = 480;
    let w = cameraVideo.videoWidth,
      h = cameraVideo.videoHeight;
    if (w > h && w > maxDim) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else if (h > maxDim) {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(cameraVideo, 0, 0, w, h);
    pendingImage = canvas.toDataURL("image/jpeg", 0.72);
    uploadPreview.src = pendingImage;
    uploadPreview.style.display = "block";
    uploadPlaceholder.style.display = "none";
    stopCamera();
    cameraBox.style.display = "none";
    sourceRow.style.display = "flex";
    checkAddValid();
  });
  confirmAdd.addEventListener("click", async () => {
    const item = {
      id: "item_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      name: itemNameInput.value.trim(),
      category: document.getElementById("item-category").value,
      color: document.getElementById("item-color").value,
      image: pendingImage,
      createdAt: Date.now(),
    };
    items.unshift(item);
    await persistItems();
    closeAddModal();
    renderWardrobe();
    renderToday();
  });

  // ---------- SAVED OUTFITS ----------
  function renderSaved() {
    const grid = document.getElementById("saved-grid");
    if (outfits.length === 0) {
      grid.innerHTML = `<div class="empty-msg"><b>No looks saved yet.</b>Build one in Today's Look and save it.</div>`;
      return;
    }
    grid.innerHTML = outfits
      .map((o) => {
        const pieceIds = [
          o.slots.outerwear,
          o.slots.top,
          o.slots.bottom,
          o.slots.shoes,
          ...(o.accessories || []),
        ].filter(Boolean);
        const pieces = pieceIds
          .map((id) => items.find((i) => i.id === id))
          .filter(Boolean);
        const thumbs =
          pieces
            .map((p) => `<img src="${p.image}" alt="${escapeHtml(p.name)}">`)
            .join("") ||
          '<span style="font-size:14px;color:var(--ink-soft)">Pieces removed</span>';
        const dateStr = new Date(o.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return `<div class="look-card">
        <h4>${escapeHtml(o.name)}</h4>
        <div class="look-thumbs">${thumbs}</div>
        <div class="look-date">${dateStr}</div>
        <div class="look-actions">
          <button class="rbtn load-look" data-id="${o.id}">Load</button>
          <button class="rbtn del-look" data-id="${o.id}">Delete</button>
        </div>
      </div>`;
      })
      .join("");
    grid.querySelectorAll(".load-look").forEach((b) => {
      b.addEventListener("click", () => {
        const o = outfits.find((x) => x.id === b.dataset.id);
        if (!o) return;
        SINGLE_CATS.forEach((cat) => {
          const list = categoryItems(cat);
          const id = o.slots[cat];
          const idx = id ? list.findIndex((i) => i.id === id) : -1;
          carouselIndex[cat] = idx >= 0 ? idx : 0;
        });
        selectedAccessories = new Set(o.accessories || []);
        switchTab("today");
        showToast("Look loaded");
      });
    });
    grid.querySelectorAll(".del-look").forEach((b) => {
      b.addEventListener("click", async () => {
        outfits = outfits.filter((x) => x.id !== b.dataset.id);
        await persistOutfits();
        renderSaved();
      });
    });
  }

  loadAll();
})();
