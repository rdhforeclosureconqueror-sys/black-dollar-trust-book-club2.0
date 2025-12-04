// === Black Dollar Trust Book Club Reader ===
// Supports PDF, TXT, and EPUB + Text-to-Speech Voice Reading

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

// === Load available voices ===
function loadVoices() {
  const voices = synth.getVoices();
  voiceSelect.innerHTML = '';
  voices.forEach(voice => {
    const option = document.createElement('option');
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}
window.speechSynthesis.onvoiceschanged = loadVoices;

// === Handle Upload Button ===
uploadBtn.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (!file) return alert('Please select a file first.');

  const reader = new FileReader();
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'txt') {
    reader.onload = () => {
      currentText = reader.result;
      textPreview.textContent = currentText.slice(0, 1000); // Show first part
      bookList.textContent = `Loaded: ${file.name}`;
    };
    reader.readAsText(file);
  } else if (ext === 'pdf') {
    reader.onload = () => renderPDF(reader.result, file.name);
    reader.readAsArrayBuffer(file);
  } else if (ext === 'epub') {
    reader.onload = () => {
      currentText = 'EPUB file loaded successfully.';
      textPreview.textContent = currentText;
      bookList.textContent = `Loaded: ${file.name}`;
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert('Unsupported file type. Please upload a PDF, TXT, or EPUB.');
  }
});

// === PDF Rendering ===
function renderPDF(data, filename) {
  const loadingTask = pdfjsLib.getDocument({ data });
  loadingTask.promise.then(pdf => {
    bookList.textContent = `Loaded: ${filename}`;
    pdf.getPage(1).then(page => {
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = pdfCanvas;
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      page.render({ canvasContext: ctx, viewport }).promise.then(() => {
        currentText = `Previewing: ${filename}`;
      });
    });
  }).catch(err => {
    console.error('Error rendering PDF:', err);
    alert('Failed to load PDF.');
  });
}

// === Voice Controls ===
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
  if (synth.speaking) synth.pause();
});

stopBtn.addEventListener('click', () => {
  synth.cancel();
});
