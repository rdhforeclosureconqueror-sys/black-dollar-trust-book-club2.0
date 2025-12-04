// === Black Dollar Trust Reader Pro v3.0 ===
// Author: Pan-African Development Edition

// DOM Elements
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

// PDF.js Config
if (window["pdfjsLib"]) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
}

// EPUB.js Script Loader
const epubScript = document.createElement("script");
epubScript.src = "https://cdnjs.cloudflare.com/ajax/libs/epub.js/0.3.88/epub.min.js";
document.head.appendChild(epubScript);

// Core Variables
let currentText = "";
let currentBook = "";
let pdfDoc = null;
let currentPage = 1;
let synth = window.speechSynthesis;
let bookType = "";
let epubBook = null;

// === Load Voices ===
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

// === Upload Book ===
uploadBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please select a book file to upload.");

  const ext = file.name.split(".").pop().toLowerCase();
  const reader = new FileReader();
  currentBook = file.name;
  bookType = ext;

  if (ext === "txt") {
    reader.onload = () => showText(reader.result, file.name);
    reader.readAsText(file);
  } else if (ext === "pdf") {
    reader.onload = () => renderPDFText(reader.result, file.name);
    reader.readAsArrayBuffer(file);
  } else if (ext === "epub") {
    renderEPUB(file);
  } else {
    alert("Unsupported file type. Please upload a PDF, TXT, or EPUB file.");
  }
});

// === Show Text (for TXT or PDF extracted text) ===
function showText(content, name) {
  bookList.textContent = `📘 Loaded: ${name}`;
  currentText = content.trim();
  textPreview.innerHTML = formatBookText(content);
  textPreview.style.display = "block";
  pdfCanvas.style.display = "none";

  // Generate Table of Contents (headings detection)
  generateTOC(content);

  const savedScroll = localStorage.getItem(`${name}-scroll`);
  continueBtn.style.display = savedScroll ? "block" : "none";
}

// === Format Text into Paragraphs ===
function formatBookText(text) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => `<p>${p.trim()}</p>`)
    .join("");
  return `<div class="book-page">${paragraphs}</div>`;
}

// === PDF Handling ===
async function renderPDFText(data, filename) {
  textPreview.textContent = "Extracting PDF text...";
  const loadingTask = pdfjsLib.getDocument({ data });
  pdfDoc = await loadingTask.promise;

  let allText = "";
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    allText += "\n\n" + pageText;
  }

  showText(allText, filename);
  pdfCanvas.style.display = "none";
  textPreview.style.display = "block";
  pageIndicator.textContent = `Page 1 of ${pdfDoc.numPages}`;
}

// === EPUB Handling ===
function renderEPUB(file) {
  textPreview.textContent = "Loading EPUB...";
  const book = ePub(URL.createObjectURL(file));
  epubBook = book;

  book.ready
    .then(() => {
      tocDiv.classList.remove("hidden");
      tocDiv.innerHTML = "<h3>Table of Contents</h3>";

      book.loaded.navigation.then((nav) => {
        nav.toc.forEach((chapter) => {
          const item = document.createElement("div");
          item.classList.add("toc-item");
          item.textContent = chapter.label;
          item.addEventListener("click", () => {
            book.rendition.display(chapter.href);
          });
          tocDiv.appendChild(item);
        });
      });

      const rendition = book.renderTo("textPreview", {
        width: "100%",
        height: "80vh",
      });
      rendition.display();

      currentBook = file.name;
      localStorage.setItem("currentBookType", "epub");
    })
    .catch((err) => console.error("EPUB load error:", err));
}

// === Table of Contents Generator (for TXT/PDF) ===
function generateTOC(content) {
  tocDiv.innerHTML = "<h3>Table of Contents</h3>";
  tocDiv.classList.remove("hidden");
  const lines = content.split("\n").filter((line) => line.trim().length > 0);

  lines.forEach((line, index) => {
    if (line.length < 60 && /[A-Z]/.test(line[0])) {
      const item = document.createElement("div");
      item.classList.add("toc-item");
      item.textContent = line.slice(0, 50);
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

// === Reading Progress Tracking ===
textPreview.addEventListener("scroll", () => {
  const scrollTop = textPreview.scrollTop;
  const scrollHeight = textPreview.scrollHeight - textPreview.clientHeight;
  const progress = (scrollTop / scrollHeight) * 100;
  progressBar.style.width = `${progress}%`;
  if (currentBook) {
    localStorage.setItem(`${currentBook}-scroll`, scrollTop);
  }
});

continueBtn.addEventListener("click", () => {
  const savedScroll = localStorage.getItem(`${currentBook}-scroll`);
  if (savedScroll) {
    textPreview.scrollTo({ top: parseFloat(savedScroll), behavior: "smooth" });
  }
});

// === Voice Controls ===
readBtn.onclick = () => {
  if (!currentText) return alert("Please upload a readable file first.");
  if (synth.speaking) synth.cancel();

  const utterance = new SpeechSynthesisUtterance(currentText);
  const selected = synth.getVoices().find((v) => v.name === voiceSelect.value);
  if (selected) utterance.voice = selected;
  synth.speak(utterance);
};
pauseBtn.onclick = () =>
  synth.speaking && (synth.paused ? synth.resume() : synth.pause());
stopBtn.onclick = () => synth.cancel();

// === Page Navigation for PDFs ===
async function showPage(num) {
  if (!pdfDoc) return;
  const page = await pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale: 1.5 });
  const ctx = pdfCanvas.getContext("2d");

  pdfCanvas.height = viewport.height;
  pdfCanvas.width = viewport.width;
  await page.render({ canvasContext: ctx, viewport }).promise;

  pageIndicator.textContent = `Page ${num} of ${pdfDoc.numPages}`;
  currentPage = num;
}
prevPageBtn.addEventListener("click", () => {
  if (currentPage <= 1) return;
  showPage(--currentPage);
});
nextPageBtn.addEventListener("click", () => {
  if (currentPage >= pdfDoc.numPages) return;
  showPage(++currentPage);
});

// === Settings Controls (Themes, Fonts, Sizes) ===
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const fontSelect = document.getElementById("fontSelect");
const fontSizeSlider = document.getElementById("fontSizeSlider");
const themeSelect = document.getElementById("themeSelect");

settingsBtn.addEventListener("click", () => {
  settingsPanel.classList.toggle("hidden");
});
fontSelect.addEventListener("change", () => {
  textPreview.style.fontFamily = fontSelect.value;
  localStorage.setItem("fontStyle", fontSelect.value);
});
fontSizeSlider.addEventListener("input", () => {
  textPreview.style.fontSize = `${fontSizeSlider.value}px`;
  localStorage.setItem("fontSize", fontSizeSlider.value);
});
themeSelect.addEventListener("change", () => {
  document.body.className = themeSelect.value;
  localStorage.setItem("theme", themeSelect.value);
});
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
