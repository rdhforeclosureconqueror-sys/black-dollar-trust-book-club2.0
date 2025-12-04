// === Black Dollar Trust Reader 3.0 ===
// Complete Reading Engine (Voice + Progress + Navigation + Cover + TOC)

const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const bookList = document.getElementById('bookList');
const textPreview = document.getElementById('textPreview');
const pdfCanvas = document.getElementById('pdfCanvas');
const progressBar = document.getElementById('progressBar');
const continueBtn = document.getElementById('continueBtn');
const voiceSelect = document.getElementById('voiceSelect');
const readBtn = document.getElementById('readBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const pageIndicator = document.getElementById('pageIndicator');
const nextPageBtn = document.getElementById('nextPageBtn');
const prevPageBtn = document.getElementById('prevPageBtn');

let currentText = '';
let currentBook = '';
let pdfDoc = null;
let currentPageNum = 1;
let totalPages = 0;
let synth = window.speechSynthesis;

// === Initialize Voices ===
function loadVoices() {
  const voices = synth.getVoices();
  voiceSelect.innerHTML = '';
  voices.forEach(v => {
    const opt = document.createElement('option');
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
uploadBtn.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (!file) return alert('Please select a book.');

  const reader = new FileReader();
  const ext = file.name.split('.').pop().toLowerCase();
  currentBook = file.name;

  if (ext === 'txt') {
    reader.onload = () => showText(reader.result, file.name);
    reader.readAsText(file);
  } else if (ext === 'pdf') {
    reader.onload = () => renderPDFText(reader.result, file.name);
    reader.readAsArrayBuffer(file);
  } else {
    alert('Only PDF or TXT supported for now.');
  }
});

// === Show Text Content ===
function showText(content, name) {
  bookList.textContent = `📘 Loaded: ${name}`;
  currentText = content;
  textPreview.innerHTML = formatBookText(content);
  pdfCanvas.style.display = 'none';

  // Add simple cover/title page
  const title = name.replace(/\.[^/.]+$/, '');
  const coverHTML = `
    <div class="book-cover">
      <h1>${title}</h1>
      <p>by Unknown Author</p>
    </div>`;
  textPreview.insertAdjacentHTML('afterbegin', coverHTML);

  // Table of contents (detect "Chapter" headings)
  const toc = generateTableOfContents(content);
  if (toc.length) {
    const tocHTML = `
      <div class="toc">
        <h3>📜 Table of Contents</h3>
        ${toc.map(t => `<div class="toc-item">${t.title}</div>`).join('')}
      </div>`;
    textPreview.insertAdjacentHTML('afterbegin', tocHTML);
  }

  // Restore progress
  const savedScroll = localStorage.getItem(`${name}-scroll`);
  continueBtn.style.display = savedScroll ? 'block' : 'none';
}

// === Format Text ===
function formatBookText(text) {
  const paragraphs = text.split(/\n\s*\n/).map(p => `<p>${p.trim()}</p>`).join('');
  return `<div class="book-page">${paragraphs}</div>`;
}

// === Generate Table of Contents ===
function generateTableOfContents(text) {
  const toc = [];
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (/^chapter\s+\d+/i.test(line) || /^CHAPTER\s+[IVXLC\d]+/.test(line)) {
      toc.push({ title: line.trim(), index: i });
    }
  });
  return toc;
}

// === PDF Text Extraction with Pagination ===
async function renderPDFText(data, filename) {
  textPreview.textContent = 'Extracting PDF text...';
  const loadingTask = pdfjsLib.getDocument({ data });
  pdfDoc = await loadingTask.promise;
  totalPages = pdfDoc.numPages;
  currentPageNum = 1;
  await renderPDFPage(currentPageNum);
  bookList.textContent = `📘 Loaded: ${filename}`;
}

// === Render Single PDF Page ===
async function renderPDFPage(num) {
  const page = await pdfDoc.getPage(num);
  const content = await page.getTextContent();
  const pageText = content.items.map(item => item.str).join(' ');
  textPreview.innerHTML = formatBookText(pageText);
  pageIndicator.textContent = `Page ${num} of ${totalPages}`;
}

// === Page Navigation ===
nextPageBtn?.addEventListener('click', async () => {
  if (currentPageNum < totalPages) {
    currentPageNum++;
    await renderPDFPage(currentPageNum);
  }
});

prevPageBtn?.addEventListener('click', async () => {
  if (currentPageNum > 1) {
    currentPageNum--;
    await renderPDFPage(currentPageNum);
  }
});

// === Track Progress ===
textPreview.addEventListener('scroll', () => {
  const scrollTop = textPreview.scrollTop;
  const scrollHeight = textPreview.scrollHeight - textPreview.clientHeight;
  const progress = (scrollTop / scrollHeight) * 100;

  progressBar.style.width = `${progress}%`;

  if (currentBook) {
    localStorage.setItem(`${currentBook}-scroll`, scrollTop);
  }
});

// === Continue Reading ===
continueBtn.addEventListener('click', () => {
  const savedScroll = localStorage.getItem(`${currentBook}-scroll`);
  if (savedScroll) {
    textPreview.scrollTo({ top: parseFloat(savedScroll), behavior: 'smooth' });
  }
});

// === Voice Controls ===
readBtn.onclick = () => {
  if (!currentText) return alert('Please upload a readable file first.');
  if (synth.speaking) synth.cancel();

  const utterance = new SpeechSynthesisUtterance(currentText);
  const selected = synth.getVoices().find(v => v.name === voiceSelect.value);
  if (selected) utterance.voice = selected;
  synth.speak(utterance);
};

pauseBtn.onclick = () =>
  synth.speaking && (synth.paused ? synth.resume() : synth.pause());

stopBtn.onclick = () => synth.cancel();
