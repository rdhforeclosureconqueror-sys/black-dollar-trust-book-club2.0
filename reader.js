document.addEventListener("DOMContentLoaded", () => {
  const bookInput = document.getElementById("bookInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const bookPreview = document.getElementById("bookPreview");
  const voiceSelect = document.getElementById("voiceSelect");
  const readBtn = document.getElementById("readBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const stopBtn = document.getElementById("stopBtn");

  let synth = window.speechSynthesis;
  let currentUtterance = null;
  let currentText = "";

  // ✅ Voice Initialization
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
  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined)
    speechSynthesis.onvoiceschanged = loadVoices;

  // ✅ File Upload
  uploadBtn.onclick = () => {
    const file = bookInput.files[0];
    if (!file) return alert("Please select a file first.");

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
          book.section(0).render().then(output => {
            currentText = output;
            bookPreview.textContent = output.slice(0, 2000);
          });
        });
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Unsupported file type.");
    }
  };

  // ✅ Voice Controls
  readBtn.onclick = () => {
    if (!currentText) return alert("Please upload a book first.");
    if (synth.speaking) synth.cancel();

    currentUtterance = new SpeechSynthesisUtterance(currentText);
    currentUtterance.voice = synth.getVoices().find(v => v.name === voiceSelect.value);
    synth.speak(currentUtterance);
  };

  pauseBtn.onclick = () => synth.pause();
  stopBtn.onclick = () => synth.cancel();
});
