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
let currentUtterance;
const synth = window.speechSynthesis;

// Populate voices
function populateVoices() {
  voiceSelect.innerHTML = '';
  const voices = synth.getVoices();
  voices.forEach(v => {
    const option = document.createElement('option');
    option.textContent = `${v.name} (${v.lang})`;
    voiceSelect.appendChild(option);
  });
}

populateVoices();
synth.onvoiceschanged = populateVoices;

// Handle uploads
uploadBtn.onclick = () => {
  const files = fileInput.files;
  if (!files.length) return alert('Please select a file.');

  Array.from(files).forEach(file => {
    const li = document.createElement('li');
    li.textContent = file.name;
    bookList.appendChild(li);

    const reader = new FileReader();

    if (file.name.endsWith('.txt')) {
      reader.onload = e => {
        currentText = e.target.result;
        textPreview.textContent = currentText.substring(0, 1000) + '...';
      };
      reader.readAsText(file);

    } else if (file.name.endsWith('.pdf')) {
      reader.onload = e => {
        const pdfData = new Uint8Array(e.target.result);
        pdfjsLib.getDocument({ data: pdfData }).promise.then(pdf => {
          pdf.getPage(1).then(page => {
            const viewport = page.getViewport({ scale: 1.5 });
            const ctx = pdfCanvas.getContext('2d');
            pdfCanvas.height = viewport.height;
            pdfCanvas.width = viewport.width;
            page.render({ canvasContext: ctx, viewport: viewport });
          });
        });
      };
      reader.readAsArrayBuffer(file);

    } else if (file.name.endsWith('.epub')) {
      reader.onload = e => {
        const book = ePub(e.target.result);
        book.ready.then(() => {
          book.loaded.spine.then(spine => {
            spine.each(item => {
              item.render().then(section => {
                currentText = section.output;
                textPreview.innerHTML = section.output.substring(0, 1000) + '...';
              });
            });
          });
        });
      };
      reader.readAsArrayBuffer(file);
    }
  });
};

// Voice controls
readBtn.onclick = () => {
  if (!currentText) return;
  if (synth.speaking) synth.cancel();

  currentUtterance = new SpeechSynthesisUtterance(currentText);
  const selectedVoice = voiceSelect.value;
  const voices = synth.getVoices();
  const voice = voices.find(v => `${v.name} (${v.lang})` === selectedVoice);
  if (voice) currentUtterance.voice = voice;

  synth.speak(currentUtterance);
};

pauseBtn.onclick = () => synth.pause();
stopBtn.onclick = () => synth.cancel();
