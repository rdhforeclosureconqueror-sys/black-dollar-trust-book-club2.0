// === Black Dollar Trust Reader v3.5 (PDF + TXT, Full Voice + Chapters) ===

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
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageIndicator = document.getElementById("pageIndicator");
const fontSelect = document.getElementById("fontSelect");
const fontSizeSlider = document.getElementById("fontSizeSlider");
const themeSelect = document.getElementById("themeSelect");
const bookTitle = document.getElementById("bookTitle");

let pdfDoc = null;
let currentText = "";
let currentBook = "";
let currentPage = 1;
let synth = window.speechSynthesis;
let pdfTextPerPage = [];

// === Voices ===
function loadVoices() {
  const voices = synth.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    voiceSelect.appendChild(opt);
  });
}
function initVoices() {
  if (synth.getVoices().length === 0) {
    setTimeout(initVoices, 500);
  } else loadVoices();
}
initVoices();

// === Upload Book ===
uploadBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please select a book first.");

  const ext = file.name.split(".").pop().toLowerCase();
  const reader = new FileReader();
  currentBook = file.name.replace(/\.[^/.]+$/, "");
  bookTitle.textContent = `📖 ${currentBook}`;

  if (ext === "txt") {
    reader.onload = () => showText(reader.result, file.name);
    reader.readAsText(file);
  } else if (ext === "pdf") {
    reader.onload = () => loadAndRenderPDF(reader.result, file.name);
    reader.readAsArrayBuffer(file);
  } else {
    alert("Only PDF and TXT supported.");
  }
});

// === TXT Render ===
function showText(content, name) {
  bookList.textContent = `📘 Loaded: ${name}`;
  currentText = content;
  textPreview.innerHTML = formatBookText(content);
  pdfCanvas.style.display = "none";
  textPreview.style.display = "block";
}

// === PDF Render + Text Extraction ===
async function loadAndRenderPDF(data, filename) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

  const loadingTask = pdfjsLib.getDocument({ data });
  pdfDoc = await loadingTask.promise;
  currentPage = 1;
  pdfTextPerPage = [];
  bookList.textContent = `📗 Loaded PDF: ${filename}`;

  // Extract text from all pages for reading aloud
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(" ");
    pdfTextPerPage.push(text);
  }

  currentText = pdfTextPerPage.join("\n\n");
  showPage(currentPage);
}

async function showPage(num) {
  if (!pdfDoc) return;
  const page = await pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale: 1.4 });
  const ctx = pdfCanvas.getContext("2d");

  pdfCanvas.height = viewport.height;
  pdfCanvas.width = viewport.width;

  await page.render({ canvasContext: ctx, viewport }).promise;
  textPreview.innerHTML = `<p>${pdfTextPerPage[num - 1]}</p>`;
  pageIndicator.textContent = `Page ${num} of ${pdfDoc.numPages}`;

  pdfCanvas.style.display = "block";
  textPreview.style.display = "block";
}

prevPageBtn.addEventListener("click", () => {
  if (currentPage <= 1) return;
  showPage(--currentPage);
});
nextPageBtn.addEventListener("click", () => {
  if (pdfDoc && currentPage < pdfDoc.numPages) showPage(++currentPage);
});

// === Voice Reading (Improved + Page-Aware) ===
readBtn.addEventListener("click", async () => {
  if (!pdfDoc && (!currentText || currentText.trim() === "")) {
    alert("Please upload a readable PDF or TXT book first.");
    return;
  }

  if (synth.speaking) synth.cancel();

  // Make sure voices are ready
  let voices = synth.getVoices();
  if (voices.length === 0) {
    await new Promise((res) => {
      speechSynthesis.onvoiceschanged = () => {
        voices = synth.getVoices();
        res();
      };
    });
  }

  // Get text for current page (for PDF) or all (for TXT)
  let textToRead = "";
  if (pdfDoc) {
    textToRead = pdfTextPerPage[currentPage - 1] || "";
  } else {
    textToRead = currentText;
  }

  if (!textToRead || textToRead.trim() === "") {
    alert("This page has no readable text.");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(textToRead);
  const selected = voices.find((v) => v.name === voiceSelect.value);
  if (selected) utterance.voice = selected;

  utterance.onstart = () => console.log("🎧 Reading started...");
  utterance.onend = () => console.log("✅ Finished reading.");
  utterance.onerror = (err) => console.error("Speech error:", err);

  synth.speak(utterance);
});

pauseBtn.addEventListener("click", () => {
  if (synth.speaking) {
    synth.paused ? synth.resume() : synth.pause();
  }
});

stopBtn.addEventListener("click", () => {
  synth.cancel();
  console.log("🛑 Reading stopped.");
});

// === Font, Size, Theme ===
fontSelect.addEventListener("change", () => {
  textPreview.style.fontFamily = fontSelect.value;
});
fontSizeSlider.addEventListener("input", () => {
  textPreview.style.fontSize = `${fontSizeSlider.value}px`;
});
themeSelect.addEventListener("change", () => {
  document.body.className = themeSelect.value;
});
