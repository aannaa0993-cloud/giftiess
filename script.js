/* GIFTY — JavaScript
   Mengatur galeri, filter, editor, preview, upload maksimal 3 foto, link lagu YouTube & Animasi Unik.
*/
(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  const templateGrid = $("#templateGrid");
  const editorModal = $("#editorModal");
  const giftForm = $("#giftForm");
  const publicView = $("#publicView");
  const toast = $("#toast");

  const templates = [
    {
      id: "love",
      title: "Love Letter",
      category: "love",
      description: "A little letter for your favorite person.",
      emoji: "💌",
      color: "#ffd6df",
      headline: "A little letter for you",
      message: "There's something about you that makes ordinary days feel special. Thank you for being you.",
      tag: "For someone special"
    },
    {
      id: "birthday",
      title: "Birthday Cake",
      category: "birthday",
      description: "Make their special day a little sweeter.",
      emoji: "🎂",
      color: "#ffe58a",
      headline: "Happy Birthday!",
      message: "Today is all about you. I hope your day is filled with little things that make you smile.",
      tag: "Birthday"
    },
    {
      id: "memory",
      title: "Memory Lane",
      category: "friends",
      description: "Keep your favorite memories in one place.",
      emoji: "📸",
      color: "#dce8d5",
      headline: "Our little memories",
      message: "Some of my favorite moments are the simplest ones, especially when you're there.",
      tag: "Our memories"
    },
    {
      id: "mixtape",
      title: "Mixtape for You",
      category: "love",
      description: "A playlist-shaped way to say what you feel.",
      emoji: "🎧",
      color: "#e6dcf7",
      headline: "Songs that remind me of you",
      message: "Every song has a little piece of a memory. Here's a few that made me think of you.",
      tag: "Press play"
    },
    {
      id: "surprise",
      title: "Surprise Box",
      category: "cute",
      description: "A tiny surprise wrapped in a digital gift.",
      emoji: "🎁",
      color: "#ffd6df",
      headline: "A little surprise!",
      message: "You deserve something nice today. So here's a little reminder that someone is thinking of you.",
      tag: "Open me"
    },
    {
      id: "bestie",
      title: "Bestie Certificate",
      category: "friends",
      description: "Official proof that they're your favorite human.",
      emoji: "🏆",
      color: "#ffe58a",
      headline: "Certified Bestie",
      message: "Awarded for being an absolute icon, making ordinary days fun, and being one of my favorite people.",
      tag: "Bestie approved"
    },
    {
      id: "universe",
      title: "My Little Universe",
      category: "cute",
      description: "A tiny universe made just for them.",
      emoji: "🌙",
      color: "#e6dcf7",
      headline: "You are your own universe",
      message: "I hope you remember how much light you bring into the little corners of this world.",
      tag: "Made of stardust"
    },
    {
      id: "sunshine",
      title: "Pocket Sunshine",
      category: "cute",
      description: "A pocket-sized reminder for a cloudy day.",
      emoji: "☀️",
      color: "#ffe58a",
      headline: "A little sunshine for you",
      message: "If today feels a little heavy, here's a small reminder that brighter moments can still find you.",
      tag: "You got this"
    }
  ];

  let selectedTemplate = templates[0];
  let selectedColor = selectedTemplate.color;
  let photosArray = []; 
  let currentPhotoIndex = 0;
  let generatedGiftLink = "";
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2600);
  }

  function encodeData(data) {
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodeData(encoded) {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function getGiftData() {
    return {
      templateId: selectedTemplate.id,
      recipient: $("#recipient")?.value.trim() || "",
      sender: $("#sender")?.value.trim() || "",
      headline: $("#headline")?.value.trim() || selectedTemplate.headline,
      message: $("#message")?.value.trim() || "",
      song: $("#song")?.value.trim() || "",
      color: selectedColor,
      photos: photosArray,
      emoji: selectedTemplate.emoji
    };
  }

  function renderTemplates(filter = "all") {
    if (!templateGrid) return;
    const filtered = filter === "all" ? templates : templates.filter((item) => item.category === filter);
    const count = $("#templateCount");
    if (count) {
      count.textContent = `${filtered.length} TEMPLATE${filtered.length === 1 ? "" : "S"}`;
    }

    if (!filtered.length) {
      templateGrid.innerHTML = '<div class="empty-state">Template tidak ditemukan.</div>';
      return;
    }

    templateGrid.innerHTML = filtered.map((item) => `
      <article class="template-card">
        <div class="template-art" style="background:${item.color}">
          <span aria-hidden="true">${item.emoji}</span>
        </div>
        <div class="template-info">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="template-bottom">
            <span class="template-tag">${item.tag}</span>
            <button type="button" data-template="${item.id}">Make yours</button>
          </div>
        </div>
      </article>
    `).join("");
  }

  $$("#filters [data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      $$("#filters [data-filter]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      renderTemplates(button.dataset.filter || "all");
    });
  });

  function setupPhotoSlider(photos, sliderEl, imgEl, dotsEl, prevBtn, nextBtn) {
    if (!photos || photos.length === 0) {
      sliderEl.hidden = true;
      return;
    }

    sliderEl.hidden = false;
    if (currentPhotoIndex >= photos.length) currentPhotoIndex = 0;

    imgEl.src = photos[currentPhotoIndex];

    if (dotsEl) {
      dotsEl.innerHTML = photos.map((_, i) => `
        <span class="dot ${i === currentPhotoIndex ? "active" : ""}" data-index="${i}"></span>
      `).join("");
    }

    if (prevBtn) prevBtn.style.display = photos.length > 1 ? "grid" : "none";
    if (nextBtn) nextBtn.style.display = photos.length > 1 ? "grid" : "none";
  }

  function updatePreview() {
    const data = getGiftData();
    const title = $("#prevTitle");
    const message = $("#prevMessage");
    const emoji = $("#prevEmoji");
    const tag = $("#prevTag");
    const sign = $("#prevSign");
    const preview = $("#livePreview");
    const count = $("#charCount");

    if (title) title.textContent = data.headline || "A little gift for you";
    if (message) message.textContent = data.message || "Your lovely message will appear here.";
    if (emoji) emoji.textContent = data.emoji;
    if (tag) tag.textContent = `For ${data.recipient || "someone special"}`;
    if (sign) {
      sign.textContent = data.sender ? `— with love, ${data.sender}` : "— with love";
    }
    if (preview) preview.style.backgroundColor = selectedColor;
    if (count) count.textContent = String($("#message")?.value.length || 0);

    setupPhotoSlider(
      photosArray,
      $("#prevSlider"),
      $("#prevPhoto"),
      $("#prevDots"),
      $("#prevBtnPrev"),
      $("#prevBtnNext")
    );
  }

  function colorToAccentValue(color) {
    const options = ["#f5c957", "#f3c7d0", "#c8d9bf", "#d9c9ef", "#f0c5a2"];
    const map = {
      "#ffe58a": "#f5c957",
      "#ffd6df": "#f3c7d0",
      "#dce8d5": "#c8d9bf",
      "#e6dcf7": "#d9c9ef"
    };
    return map[color] || (options.includes(color) ? color : "#f5c957");
  }

  function openEditor(templateId) {
    selectedTemplate = templates.find((item) => item.id === templateId) || templates[0];
    selectedColor = selectedTemplate.color;
    photosArray = [];
    currentPhotoIndex = 0;
    generatedGiftLink = "";

    if (giftForm) giftForm.reset();

    $("#recipient").value = "";
    $("#sender").value = "";
    $("#headline").value = selectedTemplate.headline;
    $("#message").value = selectedTemplate.message;
    $("#song").value = "";
    $("#accent").value = colorToAccentValue(selectedColor);

    $("#prevSlider").hidden = true;
    $("#linkResult").hidden = true;
    $("#copyLink").disabled = true;
    $("#linkStatus").textContent = "Preview akan berubah saat kamu mengisi form.";

    editorModal?.classList.add("show");
    editorModal?.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    updatePreview();
    $("#recipient")?.focus();
  }

  function closeEditor() {
    editorModal?.classList.remove("show");
    editorModal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  templateGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-template]");
    if (button) openEditor(button.dataset.template);
  });

  $("#createNav")?.addEventListener("click", () => openEditor(selectedTemplate.id));
  $("#browseBtn")?.addEventListener("click", () => $("#gallery")?.scrollIntoView({ behavior: "smooth" }));
  $("#howNav")?.addEventListener("click", () => $("#how")?.scrollIntoView({ behavior: "smooth" }));

  $("#surpriseBtn")?.addEventListener("click", () => {
    const random = templates[Math.floor(Math.random() * templates.length)];
    openEditor(random.id);
  });

  $("#closeEditor")?.addEventListener("click", closeEditor);

  editorModal?.addEventListener("click", (event) => {
    if (event.target === editorModal) closeEditor();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && editorModal?.classList.contains("show")) {
      closeEditor();
    }
  });

  ["#recipient", "#sender", "#headline", "#message", "#song"].forEach((selector) => {
    $(selector)?.addEventListener("input", updatePreview);
  });

  $("#accent")?.addEventListener("change", (event) => {
    selectedColor = event.target.value;
    updatePreview();
  });

  $("#photo")?.addEventListener("change", (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (files.length > 3) {
      showToast("Maksimal hanya bisa memilih 3 foto!");
      event.target.value = "";
      return;
    }

    photosArray = [];
    currentPhotoIndex = 0;
    let loadedCount = 0;
    let totalSize = 0;

    files.forEach((file) => {
      totalSize += file.size;
      if (!file.type.startsWith("image/")) {
        showToast("Pastikan semua file berupa gambar.");
        return;
      }
    });

    if (totalSize > 600 * 1024) {
      showToast("Total ukuran foto melebihi 600 KB. Pilih ukuran yang lebih kecil.");
      event.target.value = "";
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === "string") {
          photosArray.push(e.target.result);
        }
        loadedCount++;
        if (loadedCount === files.length) {
          updatePreview();
        }
      };
      reader.readAsDataURL(file);
    });
  });

  $("#prevBtnPrev")?.addEventListener("click", () => {
    if (photosArray.length > 0) {
      currentPhotoIndex = (currentPhotoIndex - 1 + photosArray.length) % photosArray.length;
      updatePreview();
    }
  });

  $("#prevBtnNext")?.addEventListener("click", () => {
    if (photosArray.length > 0) {
      currentPhotoIndex = (currentPhotoIndex + 1) % photosArray.length;
      updatePreview();
    }
  });

  $("#previewOpen")?.addEventListener("click", () => {
    updatePreview();
    showToast("Preview sudah diperbarui.");
  });

  function createGiftLink(data) {
    const url = new URL(window.location.href);
    url.hash = `gift=${encodeData(data)}`;
    return url.href;
  }

  giftForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = getGiftData();

    if (!data.recipient) {
      showToast("Isi nama penerima dulu.");
      $("#recipient")?.focus();
      return;
    }
    if (!data.headline) {
      showToast("Isi judul hadiah dulu.");
      $("#headline")?.focus();
      return;
    }
    if (!data.message) {
      showToast("Tulis pesan hadiah dulu.");
      $("#message")?.focus();
      return;
    }

    if (data.song) {
      try {
        const songURL = new URL(data.song);
        if (!["http:", "https:"].includes(songURL.protocol)) {
          throw new Error("Invalid URL");
        }
      } catch {
        showToast("Link lagu harus berupa URL yang valid.");
        $("#song")?.focus();
        return;
      }
    }

    generatedGiftLink = createGiftLink(data);
    $("#generatedLink").value = generatedGiftLink;
    $("#linkResult").hidden = false;
    $("#copyLink").disabled = false;
    $("#linkStatus").textContent = "Link berhasil dibuat. Salin untuk membagikannya.";
    showToast("Link hadiah berhasil dibuat.");
  });

  $("#copyLink")?.addEventListener("click", async () => {
    if (!generatedGiftLink) {
      showToast("Buat link hadiah terlebih dahulu.");
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedGiftLink);
      showToast("Link hadiah berhasil disalin.");
    } catch {
      const input = $("#generatedLink");
      input?.focus();
      input?.select();
      let copied = false;
      try { copied = document.execCommand("copy"); } catch { copied = false; }
      showToast(copied ? "Link hadiah berhasil disalin." : "Pilih dan salin link secara manual.");
    }
  });

  function triggerCustomSurpriseEffects(templateId) {
    const container = $("#floatingContainer");
    if (!container) return;
    container.innerHTML = "";

    let items = ["🎈", "✨", "💖", "🎉"];
    if (templateId === "love" || templateId === "mixtape") {
      items = ["💖", "💌", "🌹", "💘", "✨", "💋"];
    } else if (templateId === "birthday") {
      items = ["🎂", "🎈", "🎉", "🎁", "⭐", "🥳"];
    } else if (templateId === "memory" || templateId === "bestie") {
      items = ["📸", "🌟", "🏆", "💛", "✨", "🍀"];
    } else if (templateId === "universe" || templateId === "sunshine") {
      items = ["🌙", "☀️", "⭐", "✨", "🪐", "💫"];
    }

    for (let i = 0; i < 30; i++) {
      const el = document.createElement("span");
      el.className = "floating-element";
      el.textContent = items[Math.floor(Math.random() * items.length)];

      const leftPos = Math.random() * 92 + 4;
      const duration = 3 + Math.random() * 2.5;
      const delay = Math.random() * 0.7;

      el.style.left = `${leftPos}%`;
      el.style.animationDuration = `${duration}s`;
      el.style.animationDelay = `${delay}s`;

      container.appendChild(el);
    }
  }

  function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    try {
      const parsedUrl = new URL(url);
      let videoId = null;
      if (parsedUrl.hostname.includes("youtube.com")) {
        videoId = parsedUrl.searchParams.get("v");
      } else if (parsedUrl.hostname.includes("youtu.be")) {
        videoId = parsedUrl.pathname.slice(1);
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=0`;
      }
    } catch {
      return null;
    }
    return null;
  }

  function showPublicGift(data) {
    $("#mainContent").hidden = true;
    publicView.hidden = false;
    publicView.classList.add("show");

    const envelope = $("#envelopeCard");
    const replayBar = $("#replayBar");
    envelope?.classList.remove("open");
    if (replayBar) replayBar.hidden = true;

    $("#publicEmoji").textContent = data.emoji || "🎁";
    $("#publicTag").textContent = "A LITTLE SURPRISE";

    $("#publicRecipient").textContent = data.recipient
      ? `Untuk ${data.recipient}`
      : "Untuk Seseorang Spesial";

    $("#publicTitle").textContent = data.headline || "A little gift for you";
    $("#publicMessage").textContent = data.message || "";
    $("#publicSign").textContent = data.sender
      ? `— dengan hangat, ${data.sender}`
      : "— dengan hangat";

    $("#publicCard").style.backgroundColor = data.color || "#ffd6df";

    let pubPhotos = [];
    if (data.photos && Array.isArray(data.photos)) {
      pubPhotos = data.photos;
    } else if (data.photo) {
      pubPhotos = [data.photo];
    }
    let pubPhotoIndex = 0;

    const renderPubSlider = () => {
      setupPhotoSlider(
        pubPhotos,
        $("#publicSlider"),
        $("#publicPhoto"),
        $("#publicDots"),
        $("#pubBtnPrev"),
        $("#pubBtnNext")
      );
    };

    $("#pubBtnPrev")?.onclick = () => {
      if (pubPhotos.length > 0) {
        pubPhotoIndex = (pubPhotoIndex - 1 + pubPhotos.length) % pubPhotos.length;
        currentPhotoIndex = pubPhotoIndex;
        renderPubSlider();
      }
    };

    $("#pubBtnNext")?.onclick = () => {
      if (pubPhotos.length > 0) {
        pubPhotoIndex = (pubPhotoIndex + 1) % pubPhotos.length;
        currentPhotoIndex = pubPhotoIndex;
        renderPubSlider();
      }
    };

    renderPubSlider();

    const mediaPlayerBox = $("#mediaPlayerBox");
    const ytContainer = $("#youtubeContainer");
    const songLinkBtn = $("#publicSong");

    mediaPlayerBox.hidden = true;
    ytContainer.innerHTML = "";
    songLinkBtn.hidden = true;
    songLinkBtn.removeAttribute("href");

    if (data.song) {
      mediaPlayerBox.hidden = false;
      const ytEmbedUrl = getYouTubeEmbedUrl(data.song);

      if (ytEmbedUrl) {
        ytContainer.innerHTML = `
          <div class="youtube-embed-wrap">
            <iframe src="${ytEmbedUrl}" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        `;
      }

      try {
        const songURL = new URL(data.song);
        if (["https:", "http:"].includes(songURL.protocol)) {
          songLinkBtn.href = songURL.href;
          songLinkBtn.hidden = false;
        }
      } catch {}
    }

    document.title = `${data.headline || "A little gift"} — Gifty`;

    const openEnvelopeHandler = () => {
      if (!envelope.classList.contains("open")) {
        envelope.classList.add("open");
        triggerCustomSurpriseEffects(data.templateId);
        if (replayBar) replayBar.hidden = false;
      }
    };

    envelope.onclick = openEnvelopeHandler;
    envelope.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        openEnvelopeHandler();
      }
    };

    window.scrollTo(0, 0);
  }

  function checkGiftURL() {
    if (!window.location.hash.startsWith("#gift=")) return;
    try {
      const encoded = window.location.hash.slice("#gift=".length);
      const data = decodeData(encoded);
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Data hadiah tidak valid");
      }
      showPublicGift(data);
    } catch {
      showToast("Link hadiah ini tidak bisa dibuka. Pastikan link tersalin lengkap.");
    }
  }

  function returnHome() {
    publicView.classList.remove("show");
    publicView.hidden = true;
    $("#mainContent").hidden = false;
    document.title = "gifty — make someone's day";
    history.replaceState(null, "", window.location.pathname + window.location.search);
    window.scrollTo(0, 0);
  }

  $("#backHome")?.addEventListener("click", returnHome);

  $("#publicReplay")?.addEventListener("click", () => {
    const envelope = $("#envelopeCard");
    const replayBar = $("#replayBar");
    envelope?.classList.remove("open");
    if (replayBar) replayBar.hidden = true;

    setTimeout(() => {
      envelope?.classList.add("open");
      const encoded = window.location.hash.slice("#gift=".length);
      let currentTemplateId = "love";
      try {
        const data = decodeData(encoded);
        currentTemplateId = data.templateId || "love";
      } catch {}
      
      triggerCustomSurpriseEffects(currentTemplateId);
      if (replayBar) replayBar.hidden = false;
    }, 400);
  });

  renderTemplates();
  updatePreview();
  checkGiftURL();
})();
