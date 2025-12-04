// === Black Dollar Trust Reader 2.1 ===
// Reading Progress + Resume

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

let currentText = '';
let currentBook = '';
let pdfDoc = null;
let synth = window.speechSynthesis;

// === Load Voices ===
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
window.speechSynthesis.onvoiceschanged = loadVoices;

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

// === Show Text ===
function showText(content, name) {
  bookList.textContent = `📘 Loaded: ${name}`;
  currentText = content;
  textPreview.innerHTML = formatBookText(content);
  pdfCanvas.style.display = 'none';

  // Restore saved position if available
  const savedScroll = localStorage.getItem(`${name}-scroll`);
  if (savedScroll) {
    continueBtn.style.display = 'block';
  } else {
    continueBtn.style.display = 'none';
  }
}

// === Format Book Text ===
function formatBookText(text) {
  const paragraphs = text.split(/\n\s*\n/).map(p => `<p>${p.trim()}</p>`).join('');
  return `<div class="book-page">${paragraphs}</div>`;
}

// === PDF Text Extraction ===
async function renderPDFText(data, filename) {
  textPreview.textContent = 'Extracting PDF text...';
  const loadingTask = pdfjsLib.getDocument({ data });
  pdfDoc = await loadingTask.promise;

  let allText = '';
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    allText += '\n\n' + pageText;
  }

  showText(allText, filename);
}

// === Track Progress ===
textPreview.addEventListener('scroll', () => {
  const scrollTop = textPreview.scrollTop;
  const scrollHeight = textPreview.scrollHeight - textPreview.clientHeight;
  const progress = (scrollTop / scrollHeight) * 100;

  progressBar.style.width = `${progress}%`;

  // Save progress
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
  if (!currentText) return alert('Please upload a readable file.');
  if (synth.speaking) synth.cancel();

  const utterance = new SpeechSynthesisUtterance(currentText);
  const selected = synth.getVoices().find(v => v.name === voiceSelect.value);
  if (selected) utterance.voice = selected;
  synth.speak(utterance);
};

pauseBtn.onclick = () => synth.speaking && (synth.paused ? synth.resume() : synth.pause());
stopBtn.onclick = () => synth.cancel();
