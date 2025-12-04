// ================================
// Reader Logic for PDF / TXT / EPUB
// ================================
const bookInput = document.getElementById("bookInput");
const uploadBtn = document.getElementById("uploadBtn");
const bookList = document.getElementById("bookList");
const bookPreview = document.getElementById("bookPreview");
const readBtn = document.getElementById("readBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const voiceSelect = document.getElementById("voiceSelect");

let synth = window.speechSynthesis;
let currentUtterance = null;
let currentText = "";

// Load voices
function populateVoices() {
  const voices = synth.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    voiceSelect.appendChild(opt);
  });
}
populateVoices();
if (speechSynthesis.onvoiceschanged !== undefined)
  speechSynthesis.onvoiceschanged = populateVoices;

// Handle upload
uploadBtn.onclick = () => {
  const files = bookInput.files;
  if (!files.length) return alert("Please choose a file.");

  bookList.innerHTML = "";
  [...files].forEach(file => {
    const item = document.createElement("div");
    item.className = "book-item";
    item.textContent = file.name;
    item.onclick = () => loadBook(file);
    bookList.appendChild(item);
  });
};

// Load book
function loadBook(file) {
  const reader = new FileReader();

  if (file.name.endsWith(".txt")) {
    reader.onload = e => {
      currentText = e.target.result;
      bookPreview.textContent = currentText.slice(0, 2000);
    };
    reader.readAsText(file);
  } else if (file.name.endsWith(".pdf")) {
    reader.onload = async e => {
      const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(it => it.str).join(" ") + "\n";
      }
      currentText = text;
      bookPreview.textContent = text.slice(0, 2000);
    };
    reader.readAsArrayBuffer(file);
  } else if (file.name.endsWith(".epub")) {
    reader.onload = e => {
      const book = ePub(e.target.result);
      book.ready.then(() => {
        book.loaded.metadata.then(meta => {
          bookPreview.textContent = `Title: ${meta.title}\nAuthor: ${meta.creator}`;
        });
      });
    };
    reader.readAsArrayBuffer(file);
  }
}

// Voice controls
readBtn.onclick = () => {
  if (!currentText) return;
  if (synth.speaking) synth.cancel();
  currentUtterance = new SpeechSynthesisUtterance(currentText);
  currentUtterance.voice = synth
    .getVoices()
    .find(v => v.name === voiceSelect.value);
  synth.speak(currentUtterance);
};

pauseBtn.onclick = () => synth.pause();
stopBtn.onclick = () => synth.cancel();

// Navigate to game
document.getElementById("playSpadesBtn").onclick = () => {
  window.location.href = "spades/spades.html";
};
