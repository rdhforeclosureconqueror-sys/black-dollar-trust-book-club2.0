// === Black Dollar Trust Reader Pro v3.6 (Stable) ===
// Author: Pan-African Digital Learning Initiative
// Features: PDF + TXT + EPUB | Voice | TOC | Progress | Resume | Themes | Fonts

// === DOM References ===
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const bookList = document.getElementById("bookList");
const textPreview = document.getElementById("textPreview");
const pdfCanvas = document.getElementById("pdfCanvas");
const progressBar = document.getElementById("progressBar");
const continueBtn = document.getElementById("continueBtn");
const voiceSelect = document.getElementById("voiceSelect");
const readBtn = document.getElementById("readBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const tocDiv = document.getElementById("toc");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageIndicator = document.getElementById("pageIndicator");

const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const fontSelect = document.getElementById("fontSelect");
const fontSizeSlider = document.getElementById("fontSizeSlider");
const themeSelect = document.getElementById("themeSelect");

// === PDF.js Setup ===
if (window["pdfjsLib"]) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
}

// === EPUB.js Loader (ensure loaded before use) ===
let epubReady = false;
(function loadEpubLib() {
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/epub.js/0.3.88/epub.min.js";
  script.onload = () => {
    epubReady = true;
    console.log("EPUB.js loaded successfully.");
  };
  document.head.appendChild(script);
})();

// === State ===
let currentText = "";
let currentBook = "";
let pdfDoc = null;
let epubBook = null;
let currentPage = 1;
let synth = window.speechSynthesis;

// === Voices ===
function loadVoices() {
  const voices = synth.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    voiceSelect.appendChild(opt);
  });
}
function initVoices() {
  if (synth.getVoices().length === 0) {
    setTimeout(initVoices, 500);
  } else {
    loadVoices();
  }
}
initVoices();

// === File Upload ===
uploadBtn?.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please select a book file first.");

  const ext = file.name.split(".").pop().toLowerCase();
  const reader = new FileReader();

  currentBook = file.name;

  if (ext === "txt") {
    reader.onload = () => showText(reader.result, file.name);
    reader.readAsText(file);
  } else if (ext === "pdf") {
    reader.onload = () => renderPDF(reader.result, file.name);
    reader.readAsArrayBuffer(file);
  } else if (ext === "epub") {
    if (!epubReady) {
      alert("EPUB library is still loading. Please wait a moment and try again.");
      return;
    }
    renderEPUB(file);
  } else {
    alert("Unsupported file type. Upload PDF, TXT, or EPUB only.");
  }
});

// === Text Books ===
function showText(content, name) {
  bookList.textContent = `📘 Loaded: ${name}`;
  currentText = content.trim();
  textPreview.innerHTML = formatBookText(content);
  textPreview.style.display = "block";
  pdfCanvas.style.display = "none";
  generateTOC(content);

  const savedScroll = localStorage.getItem(`${name}-scroll`);
  continueBtn.style.display = savedScroll ? "block" : "none";
}

function formatBookText(text) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => `<p>${p.trim()}</p>`)
    .join("");
  return `<div class="book-page">${paragraphs}</div>`;
}

// === PDF Rendering ===
async function renderPDF(data, filename) {
  const loadingTask = pdfjsLib.getDocument({ data });
  pdfDoc = await loadingTask.promise;
  currentPage = 1;
  showPage(currentPage);
  pageIndicator.textContent = `Page 1 of ${pdfDoc.numPages}`;
}

async function showPage(num) {
  if (!pdfDoc) return;
  const page = await pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale: 1.5 });
  const ctx = pdfCanvas.getContext("2d");

  pdfCanvas.height = viewport.height;
  pdfCanvas.width = viewport.width;

  await page.render({ canvasContext: ctx, viewport }).promise;
  pdfCanvas.style.display = "block";
  textPreview.style.display = "none";
  pageIndicator.textContent = `Page ${num} of ${pdfDoc.numPages}`;
}

prevPageBtn?.addEventListener("click", () => {
  if (currentPage <= 1) return;
  showPage(--currentPage);
});
nextPageBtn?.addEventListener("click", () => {
  if (pdfDoc && currentPage < pdfDoc.numPages) showPage(++currentPage);
});

// === EPUB Rendering ===
function renderEPUB(file) {
  textPreview.textContent = "Loading EPUB...";
  epubBook = ePub(URL.createObjectURL(file));
  epubBook.ready.then(() => {
    const rendition = epubBook.renderTo("textPreview", {
      width: "100%",
      height: "80vh",
    });
    rendition.display();

    // TOC
    tocDiv.classList.remove("hidden");
    epubBook.loaded.navigation.then((nav) => {
      tocDiv.innerHTML = "<h3>Table of Contents</h3>";
      nav.toc.forEach((chapter) => {
        const item = document.createElement("div");
        item.classList.add("toc-item");
        item.textContent = chapter.label;
        item.addEventListener("click", () => rendition.display(chapter.href));
        tocDiv.appendChild(item);
      });
    });
  });
}

// === Generate TOC for TXT/PDF ===
function generateTOC(content) {
  tocDiv.innerHTML = "<h3>Table of Contents</h3>";
  tocDiv.classList.remove("hidden");
  const lines = content.split("\n").filter((l) => l.trim().length > 0);

  lines.forEach((line, index) => {
    if (line.length < 70 && /^[A-Z]/.test(line.trim())) {
      const item = document.createElement("div");
      item.classList.add("toc-item");
      item.textContent = line.slice(0, 60);
      item.addEventListener("click", () => {
        const paragraphs = textPreview.querySelectorAll("p");
        if (paragraphs[index]) {
          paragraphs[index].scrollIntoView({ behavior: "smooth" });
        }
      });
      tocDiv.appendChild(item);
    }
  });
}

// === Reading Progress ===
textPreview?.addEventListener("scroll", () => {
  const scrollTop = textPreview.scrollTop;
  const scrollHeight = textPreview.scrollHeight - textPreview.clientHeight;
  const progress = (scrollTop / scrollHeight) * 100;
  progressBar.style.width = `${progress}%`;
  if (currentBook) {
    localStorage.setItem(`${currentBook}-scroll`, scrollTop);
  }
});

continueBtn?.addEventListener("click", () => {
  const savedScroll = localStorage.getItem(`${currentBook}-scroll`);
  if (savedScroll) {
    textPreview.scrollTo({ top: parseFloat(savedScroll), behavior: "smooth" });
  }
});

// === Voice Reading ===
readBtn?.addEventListener("click", () => {
  if (!currentText) return alert("Please upload a readable file first.");
  if (synth.speaking) synth.cancel();

  const utter = new SpeechSynthesisUtterance(currentText);
  const selected = synth.getVoices().find((v) => v.name === voiceSelect.value);
  if (selected) utter.voice = selected;
  synth.speak(utter);
});
pauseBtn?.addEventListener("click", () => {
  if (synth.speaking) synth.paused ? synth.resume() : synth.pause();
});
stopBtn?.addEventListener("click", () => synth.cancel());

// === Theme & Font Controls ===
settingsBtn?.addEventListener("click", () => {
  settingsPanel.classList.toggle("hidden");
});
fontSelect?.addEventListener("change", () => {
  textPreview.style.fontFamily = fontSelect.value;
  localStorage.setItem("fontStyle", fontSelect.value);
});
fontSizeSlider?.addEventListener("input", () => {
  textPreview.style.fontSize = `${fontSizeSlider.value}px`;
  localStorage.setItem("fontSize", fontSizeSlider.value);
});
themeSelect?.addEventListener("change", () => {
  document.body.className = themeSelect.value;
  localStorage.setItem("theme", themeSelect.value);
});

// === Restore Saved Preferences ===
window.addEventListener("load", () => {
  const savedFont = localStorage.getItem("fontStyle");
  const savedSize = localStorage.getItem("fontSize");
  const savedTheme = localStorage.getItem("theme");
  if (savedFont) {
    textPreview.style.fontFamily = savedFont;
    fontSelect.value = savedFont;
  }
  if (savedSize) {
    textPreview.style.fontSize = `${savedSize}px`;
    fontSizeSlider.value = savedSize;
  }
  if (savedTheme) {
    document.body.className = savedTheme;
    themeSelect.value = savedTheme;
  }
});
