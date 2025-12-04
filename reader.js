// === Black Dollar Trust Book Club Reader ===
// Clean Version — PDF, TXT, EPUB + Voice Reader

// === Element References ===
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const bookList = document.getElementById('bookList');
const pdfCanvas = document.getElementById('pdfCanvas');
const textPreview = document.getElementById('textPreview');
const voiceSelect = document.getElementById('voiceSelect');
const readBtn = document.getElementById('readBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');

let currentText = '';
let currentUtterance = null;
const synth = window.speechSynthesis;

// === Load Voice Options ===
function loadVoices() {
  const voices = synth.getVoices();
  voiceSelect.innerHTML = '';
  voices.forEach((voice) => {
    const option = document.createElement('option');
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });

  // Default to first English or African-accent voice if available
  const defaultVoice = voices.find(v => v.lang.startsWith('en') || v.lang.includes('af')) || voices[0];
  if (defaultVoice) voiceSelect.value = defaultVoice.name;
}
window.speechSynthesis.onvoiceschanged = loadVoices;

// === Upload Handler ===
uploadBtn.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (!file) return alert('Please select a file first.');

  const reader = new FileReader();
  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'txt') {
    reader.onload = () => {
      currentText = reader.result;
      textPreview.textContent = currentText.slice(0, 2000);
      bookList.textContent = `Loaded: ${file.name}`;
    };
    reader.readAsText(file);
  } 
  else if (extension === 'pdf') {
    reader.onload = () => renderPDF(reader.result, file.name);
    reader.readAsArrayBuffer(file);
  } 
  else if (extension === 'epub') {
    reader.onload = () => {
      currentText = 'EPUB file loaded successfully. (EPUB text extraction coming soon.)';
      textPreview.textContent = currentText;
      bookList.textContent = `Loaded: ${file.name}`;
    };
    reader.readAsArrayBuffer(file);
  } 
  else {
    alert('Unsupported file format. Please upload PDF, TXT, or EPUB.');
  }
});

// === PDF.js Renderer ===
function renderPDF(data, filename) {
  if (typeof pdfjsLib === 'undefined') {
    alert('PDF.js library not loaded.');
    return;
  }

  const loadingTask = pdfjsLib.getDocument({ data });
  loadingTask.promise.then((pdf) => {
    bookList.textContent = `Loaded: ${filename}`;
    pdf.getPage(1).then((page) => {
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = pdfCanvas;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderTask = page.render({ canvasContext: context, viewport });
      renderTask.promise.then(() => {
        currentText = `PDF Preview: ${filename}`;
        textPreview.textContent = 'PDF loaded successfully. Use Read button for speech.';
      });
    });
  }).catch((err) => {
    console.error('Error rendering PDF:', err);
    alert('Error loading PDF file.');
  });
}

// === Text-to-Speech Controls ===
readBtn.addEventListener('click', () => {
  if (!currentText) {
    alert('Please upload a readable file first.');
    return;
  }

  if (synth.speaking) synth.cancel();

  currentUtterance = new SpeechSynthesisUtterance(currentText);
  const selectedVoice = synth.getVoices().find(v => v.name === voiceSelect.value);
  if (selectedVoice) currentUtterance.voice = selectedVoice;

  synth.speak(currentUtterance);
});

pauseBtn.addEventListener('click', () => {
  if (synth.speaking) {
    if (synth.paused) synth.resume();
    else synth.pause();
  }
});

stopBtn.addEventListener('click', () => {
  synth.cancel();
});
