// === Black Dollar Trust Reader v2.0 (PDF + TXT Only) ===

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const bookList = document.getElementById("bookList");
const pdfCanvas = document.getElementById("pdfCanvas");
const textPreview = document.getElementById("textPreview");
const progressBar = document.getElementById("progressBar");
const continueBtn = document.getElementById("continueBtn");
const voiceSelect = document.getElementById("voiceSelect");
const readBtn = document.getElementById("readBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const fontSelect = document.getElementById("fontSelect");
const fontSizeSlider = document.getElementById("fontSizeSlider");
const themeSelect = document.getElementById("themeSelect");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageIndicator = document.getElementById("pageIndicator");

let pdfDoc = null;
let currentText = "";
let currentBook = "";
let currentPage = 1;
let synth = window.speechSynthesis;

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

// === Upload File ===
uploadBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please select a book first.");

  const ext = file.name.split(".").pop().toLowerCase();
  const reader = new FileReader();
  currentBook = file.name;

  if (ext === "txt") {
    reader.onload = () => showText(reader.result, file.name);
    reader.readAsText(file);
  } else if (ext === "pdf") {
    reader.onload = () => renderPDF(reader.result, file.name);
    reader.readAsArrayBuffer(file);
  } else {
    alert("Only PDF and TXT files are supported.");
  }
});

// === Display Text ===
function showText(content, name) {
  bookList.textContent = `📘 Loaded: ${name}`;
  currentText = content;
  textPreview.innerHTML = formatBookText(content);
  textPreview.style.display = "block";
  pdfCanvas.style.display = "none";

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

// === Render PDF ===
async function renderPDF(data, filename) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

  const loadingTask = pdfjsLib.getDocument({ data });
  pdfDoc = await loadingTask.promise;
  currentPage = 1;
  showPage(currentPage);
}

async function showPage(num) {
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

prevPageBtn.addEventListener("click", () => {
  if (currentPage <= 1) return;
  showPage(--currentPage);
});

nextPageBtn.addEventListener("click", () => {
  if (pdfDoc && currentPage < pdfDoc.numPages) showPage(++currentPage);
});

// === Progress + Resume ===
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

// === Voice Reading ===
readBtn.addEventListener("click", () => {
  if (!currentText) return alert("Please upload a readable book first.");
  if (synth.speaking) synth.cancel();

  const utter = new SpeechSynthesisUtterance(currentText);
  const selected = synth.getVoices().find((v) => v.name === voiceSelect.value);
  if (selected) utter.voice = selected;
  synth.speak(utter);
});

pauseBtn.addEventListener("click", () => {
  if (synth.speaking) synth.paused ? synth.resume() : synth.pause();
});

stopBtn.addEventListener("click", () => synth.cancel());

// === Font, Size, Theme ===
fontSelect.addEventListener("change", () => {
  textPreview.style.fontFamily = fontSelect.value;
  localStorage.setItem("font", fontSelect.value);
});

fontSizeSlider.addEventListener("input", () => {
  textPreview.style.fontSize = `${fontSizeSlider.value}px`;
  localStorage.setItem("fontSize", fontSizeSlider.value);
});

themeSelect.addEventListener("change", () => {
  document.body.className = themeSelect.value;
  localStorage.setItem("theme", themeSelect.value);
});

// === Restore Preferences ===
window.addEventListener("load", () => {
  const savedFont = localStorage.getItem("font");
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
