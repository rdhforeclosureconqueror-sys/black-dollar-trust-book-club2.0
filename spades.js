/* =====================================================
   Black Dollar Trust Spades — Legacy Table
   Module 1: 3D Setup, Deck, Dealing, Player Interaction
===================================================== */

// === DOM ELEMENTS ===
const canvas = document.getElementById("spades3D");
const startBtn = document.getElementById("startGame");
const easyBtn = document.getElementById("easyMode");
const hardBtn = document.getElementById("hardMode");
const playerHandEl = document.getElementById("playerHand");

// === GAME STATE ===
let scene, camera, renderer, table, deck = [];
let playerHand = [], partnerHand = [], ai1Hand = [], ai2Hand = [];
let gameStarted = false;
let difficulty = "easy";

// === 3D INITIALIZATION ===
function init3D() {
  scene = new THREE.Scene();

  // Camera
  const aspect = canvas.clientWidth / canvas.clientHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setClearColor(0x0a0a0a);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const spot = new THREE.SpotLight(0xfacc15, 1.5);
  spot.position.set(5, 8, 5);
  scene.add(ambient, spot);

  // Table Felt
  const tableGeo = new THREE.CylinderGeometry(5, 5, 0.3, 64);
  const tableMat = new THREE.MeshStandardMaterial({
    color: 0x022b12, // deep green felt
    metalness: 0.3,
    roughness: 0.7,
  });
  table = new THREE.Mesh(tableGeo, tableMat);
  table.position.y = -0.3;
  scene.add(table);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// === DECK CREATION ===
const suits = ["♠", "♥", "♦", "♣"];
const values = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

function buildDeck() {
  deck = [];
  suits.forEach(suit => {
    values.forEach(value => {
      deck.push({ value, suit });
    });
  });
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

// === DEAL CARDS ===
function dealHands() {
  playerHand = [];
  partnerHand = [];
  ai1Hand = [];
  ai2Hand = [];
  for (let i = 0; i < 13; i++) {
    playerHand.push(deck.pop());
    partnerHand.push(deck.pop());
    ai1Hand.push(deck.pop());
    ai2Hand.push(deck.pop());
  }
  renderPlayerHand();
}

// === DISPLAY PLAYER HAND (2D UI Layer) ===
function renderPlayerHand() {
  playerHandEl.innerHTML = "";
  playerHand.forEach((card, idx) => {
    const el = document.createElement("div");
    el.className = "card";
    el.textContent = card.value + card.suit;
    el.dataset.index = idx;
    el.addEventListener("click", () => playCard(idx));
    playerHandEl.appendChild(el);
  });
}

// === CARD PLAY EVENT ===
function playCard(index) {
  if (!gameStarted) return;
  const card = playerHand[index];
  console.log("Played:", card.value + card.suit);
  playerHand.splice(index, 1);
  renderPlayerHand();

  // TEMPORARY: add floating card animation in 3D
  const geom = new THREE.PlaneGeometry(1, 1.5);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set((Math.random() - 0.5) * 4, 0.2, (Math.random() - 0.5) * 3);
  scene.add(mesh);
  setTimeout(() => scene.remove(mesh), 1000);
}

// === START GAME ===
function startGameSession() {
  console.log("Starting Spades in mode:", difficulty);
  buildDeck();
  shuffleDeck();
  dealHands();
  gameStarted = true;

  // Sound placeholder (will add Howler sounds in Module 2)
  console.log("Sound: shuffle + deal");
}

// === BUTTON EVENTS ===
easyBtn.addEventListener("click", () => {
  difficulty = "easy";
  easyBtn.classList.add("selected");
  hardBtn.classList.remove("selected");
});
hardBtn.addEventListener("click", () => {
  difficulty = "hard";
  hardBtn.classList.add("selected");
  easyBtn.classList.remove("selected");
});
startBtn.addEventListener("click", startGameSession);

// === INITIALIZE ===
window.addEventListener("load", init3D);
window.addEventListener("resize", () => {
  if (!renderer || !camera) return;
  const aspect = canvas.clientWidth / canvas.clientHeight;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
});

/* =====================================================
   Module 2: AI Logic + Personality + Sound + Bubbles
===================================================== */

// === SOUND EFFECTS ===
const sounds = {
  shuffle: new Howl({
    src: ["https://cdn.jsdelivr.net/gh/jshawl/sfx/shuffle.mp3"],
    volume: 0.5
  }),
  slap: new Howl({
    src: ["https://cdn.jsdelivr.net/gh/jshawl/sfx/card-flip.mp3"],
    volume: 0.7
  }),
  win: new Howl({
    src: ["https://cdn.jsdelivr.net/gh/jshawl/sfx/win.mp3"],
    volume: 0.5
  })
};

// === AI PERSONALITY DIALOGUE ===
const personalities = {
  partner: [
    "Let's run these books, partner!",
    "You got this, big dawg!",
    "I'm cutting hearts — stay ready!",
    "We good, trust me 😎"
  ],
  ai1: [
    "Don’t underbid now...",
    "I seen better plays at the cookout!",
    "You really gonna cut me again?",
    "Alright, alright, that was clean."
  ],
  ai2: [
    "This table too easy!",
    "I’m takin’ this book, fam!",
    "Better call security for that weak hand!",
    "That was luck, not skill 😏"
  ]
};

// === CHAT BUBBLES ===
function speakBubble(id, text) {
  const bubble = document.getElementById(id);
  if (!bubble) return;
  bubble.textContent = text;
  bubble.classList.add("show");
  setTimeout(() => bubble.classList.remove("show"), 2500);
}

// === AI TURN LOGIC ===
let currentTurn = "player";
let trick = [];

function nextTurn() {
  if (!gameStarted) return;

  switch (currentTurn) {
    case "player":
      currentTurn = "partner";
      aiPlay("partner", partnerHand, "#bubbleP2", personalities.partner);
      break;
    case "partner":
      currentTurn = "ai1";
      aiPlay("ai1", ai1Hand, "#bubbleA1", personalities.ai1);
      break;
    case "ai1":
      currentTurn = "ai2";
      aiPlay("ai2", ai2Hand, "#bubbleA2", personalities.ai2);
      break;
    case "ai2":
      currentTurn = "player";
      // Evaluate trick
      evaluateTrick();
      break;
  }
}

// === AI MOVE ===
function aiPlay(name, hand, bubbleId, phrases) {
  if (!hand.length) return;
  const randomIndex = Math.floor(Math.random() * hand.length);
  const card = hand.splice(randomIndex, 1)[0];

  trick.push({ player: name, card });
  sounds.slap.play();

  // Display chatter
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  speakBubble(bubbleId.replace("#", ""), phrase);

  // Add floating card mesh
  const geom = new THREE.PlaneGeometry(1, 1.5);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set((Math.random() - 0.5) * 3, 0.2, (Math.random() - 0.5) * 3);
  scene.add(mesh);
  setTimeout(() => scene.remove(mesh), 1500);

  // Move to next player
  setTimeout(nextTurn, 1800);
}

// === TRICK EVALUATION (simple random winner for now) ===
function evaluateTrick() {
  if (trick.length < 4) return;
  const winner = trick[Math.floor(Math.random() * trick.length)];
  console.log("Trick Winner:", winner.player);
  trick = [];

  if (winner.player === "player" || winner.player === "partner") {
    const scoreEl = document.getElementById("team1Score");
    scoreEl.textContent = parseInt(scoreEl.textContent) + 1;
  } else {
    const scoreEl = document.getElementById("team2Score");
    scoreEl.textContent = parseInt(scoreEl.textContent) + 1;
  }

  if (parseInt(document.getElementById("team1Score").textContent) >= 10) {
    sounds.win.play();
    alert("You and your partner won the table! ♠🔥");
    gameStarted = false;
  } else if (parseInt(document.getElementById("team2Score").textContent) >= 10) {
    alert("The opponents took the cookout... rematch?");
    gameStarted = false;
  } else {
    currentTurn = winner.player;
    nextTurn();
  }
}

// === OVERRIDE PLAYER CARD PLAY ===
function playCard(index) {
  if (!gameStarted) return;
  const card = playerHand[index];
  sounds.slap.play();
  console.log("Played:", card.value + card.suit);
  playerHand.splice(index, 1);
  renderPlayerHand();

  // 3D visual
  const geom = new THREE.PlaneGeometry(1, 1.5);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set((Math.random() - 0.5) * 3, 0.2, (Math.random() - 0.5) * 3);
  scene.add(mesh);
  setTimeout(() => scene.remove(mesh), 1200);

  trick.push({ player: "player", card });
  currentTurn = "partner";
  setTimeout(nextTurn, 1500);
}

// === REPLACE startGameSession() to RESET SCORES ===
function startGameSession() {
  console.log("Starting Spades in mode:", difficulty);
  buildDeck();
  shuffleDeck();
  dealHands();
  gameStarted = true;
  trick = [];
  currentTurn = "player";

  document.getElementById("team1Score").textContent = "0";
  document.getElementById("team2Score").textContent = "0";

  sounds.shuffle.play();
  console.log("Sound: shuffle + deal");
}

/* =====================================================
   Module 3: Smart AI, Real Spades Logic
===================================================== */

let spadesBroken = false;
let currentSuit = null;
let tricksPlayed = 0;
let booksTeam1 = 0;
let booksTeam2 = 0;

// === DETERMINE VALID PLAYS ===
function getValidCards(hand, leadSuit) {
  if (!leadSuit) return hand; // Any card can start
  const matching = hand.filter(c => c.suit === leadSuit);
  return matching.length ? matching : hand;
}

// === DETERMINE WINNER OF TRICK ===
function getTrickWinner(trick) {
  // Filter spades if any are played
  const spades = trick.filter(t => t.card.suit === "♠");
  if (spades.length > 0) {
    const winning = spades.reduce((a, b) =>
      values.indexOf(a.card.value) > values.indexOf(b.card.value) ? a : b
    );
    return winning.player;
  } else {
    const leadSuit = trick[0].card.suit;
    const leadCards = trick.filter(t => t.card.suit === leadSuit);
    const winning = leadCards.reduce((a, b) =>
      values.indexOf(a.card.value) > values.indexOf(b.card.value) ? a : b
    );
    return winning.player;
  }
}

// === SMART AI PLAY ===
function aiPlay(name, hand, bubbleId, phrases) {
  if (!hand.length) return;

  const validCards = getValidCards(hand, currentSuit);
  let card;

  // “Friendly” bots play fairly random
  // “Cookout” bots play higher cards if possible
  if (difficulty === "easy") {
    card = validCards[Math.floor(Math.random() * validCards.length)];
  } else {
    validCards.sort((a, b) => values.indexOf(b.value) - values.indexOf(a.value));
    card = validCards[0];
  }

  // Remove card
  const index = hand.findIndex(c => c.value === card.value && c.suit === card.suit);
  hand.splice(index, 1);
  trick.push({ player: name, card });
  sounds.slap.play();

  // Spades broken?
  if (card.suit === "♠" && !spadesBroken) spadesBroken = true;

  // Lead suit?
  if (!currentSuit) currentSuit = card.suit;

  // Personality chatter
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  speakBubble(bubbleId.replace("#", ""), phrase);

  // Visual
  const geom = new THREE.PlaneGeometry(1, 1.5);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set((Math.random() - 0.5) * 3, 0.2, (Math.random() - 0.5) * 3);
  scene.add(mesh);
  setTimeout(() => scene.remove(mesh), 1500);

  // Continue
  setTimeout(nextTurn, 1500);
}

// === PLAYER OVERRIDE ===
function playCard(index) {
  if (!gameStarted) return;
  const card = playerHand[index];
  const valid = getValidCards(playerHand, currentSuit);
  if (!valid.includes(card)) {
    bookStatus("You must follow suit!");
    return;
  }

  playerHand.splice(index, 1);
  trick.push({ player: "player", card });
  sounds.slap.play();

  // Spades broken check
  if (card.suit === "♠" && !spadesBroken) spadesBroken = true;

  if (!currentSuit) currentSuit = card.suit;

  renderPlayerHand();
  setTimeout(() => { currentTurn = "partner"; nextTurn(); }, 1200);
}

// === EVALUATE TRICK (NOW USING REAL RULES) ===
function evaluateTrick() {
  if (trick.length < 4) return;

  const winner = getTrickWinner(trick);
  const winnerTeam = (winner === "player" || winner === "partner") ? "team1" : "team2";

  if (winnerTeam === "team1") booksTeam1++;
  else booksTeam2++;

  document.getElementById("team1Score").textContent = booksTeam1;
  document.getElementById("team2Score").textContent = booksTeam2;

  tricksPlayed++;
  trick = [];
  currentSuit = null;

  // Round finished?
  if (tricksPlayed >= 13) {
    endRound();
    return;
  }

  currentTurn = winner;
  setTimeout(nextTurn, 1500);
}

// === ROUND END ===
function endRound() {
  let msg;
  if (booksTeam1 > booksTeam2) {
    sounds.win.play();
    msg = "You and your partner won that hand! ♠🔥";
  } else if (booksTeam2 > booksTeam1) {
    msg = "Family Cookout got you this time! 🧠🔥";
  } else {
    msg = "That hand was even. Tight game!";
  }

  alert(msg);

  // Reset
  booksTeam1 = booksTeam2 = tricksPlayed = 0;
  spadesBroken = false;
  currentSuit = null;

  // Redeal
  buildDeck();
  shuffleDeck();
  dealHands();
  renderPlayerHand();
  currentTurn = "player";
  gameStarted = true;
}
/* =====================================================
   Module 4: Visual Polish + Smart Memory AI
===================================================== */

// === CARD MATERIALS ===
const loader = new THREE.TextureLoader();
const cardBackTex = loader.load("https://i.imgur.com/5tYjSTQ.png"); // Pan-African pattern
const cardFrontMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const cardBackMat  = new THREE.MeshBasicMaterial({ map: cardBackTex, side: THREE.DoubleSide });

// === GOLD SHIMMER BORDER ===
const borderGeo = new THREE.TorusGeometry(5.3, 0.05, 16, 100);
const borderMat = new THREE.MeshStandardMaterial({
  color: 0xfacc15,
  emissive: 0xfacc15,
  emissiveIntensity: 0.2,
  metalness: 1.0,
  roughness: 0.2
});
const borderRing = new THREE.Mesh(borderGeo, borderMat);
borderRing.rotation.x = Math.PI / 2;
scene.add(borderRing);

// shimmer pulse
setInterval(() => {
  borderMat.emissiveIntensity = 0.15 + Math.random() * 0.25;
}, 120);

// === CAMERA MOVES ===
function smoothFocus(targetY = 5) {
  gsap.to(camera.position, { duration: 1.5, y: targetY, ease: "power2.inOut" });
}

// === AI MEMORY ===
const memory = { ai1: {}, ai2: {}, partner: {} };

function rememberCard(aiName, card) {
  if (!memory[aiName][card.suit]) memory[aiName][card.suit] = [];
  memory[aiName][card.suit].push(card.value);
}

function aiPlay(name, hand, bubbleId, phrases) {
  if (!hand.length) return;

  const validCards = getValidCards(hand, currentSuit);
  let card;

  if (difficulty === "hard") {
    // Prefer suits that are still "safe"
    const suitsLeft = validCards.filter(c =>
      !Object.keys(memory[name]).includes(c.suit)
    );
    card = suitsLeft.length
      ? suitsLeft[Math.floor(Math.random() * suitsLeft.length)]
      : validCards[0];
  } else {
    card = validCards[Math.floor(Math.random() * validCards.length)];
  }

  // Remember what was played
  rememberCard(name, card);

  // Continue as before
  const index = hand.findIndex(c => c.value === card.value && c.suit === card.suit);
  hand.splice(index, 1);
  trick.push({ player: name, card });
  sounds.slap.play();

  if (card.suit === "♠" && !spadesBroken) spadesBroken = true;
  if (!currentSuit) currentSuit = card.suit;

  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  speakBubble(bubbleId.replace("#", ""), phrase);

  const geom = new THREE.PlaneGeometry(1, 1.5);
  const mat = cardFrontMat.clone();
  mat.color.setHex(0xfacc15);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set((Math.random() - 0.5) * 3, 0.2, (Math.random() - 0.5) * 3);
  scene.add(mesh);
  setTimeout(() => scene.remove(mesh), 1500);

  setTimeout(nextTurn, 1500);
}

// === PARTNER SIGNAL (simple glow) ===
function partnerSignal() {
  const el = document.querySelector("#bubbleP2");
  el.style.textShadow = "0 0 10px #22c55e";
  setTimeout(() => (el.style.textShadow = ""), 600);
}

// Partner uses signals occasionally
function aiPartnerDecision() {
  if (Math.random() < 0.3) partnerSignal();
}

// === LEADERBOARD ===
function updateLeaderboard(result) {
  const key = "blackDollarLeaderboard";
  const data = JSON.parse(localStorage.getItem(key) || '{"wins":0,"losses":0}');
  if (result === "win") data.wins++;
  else data.losses++;
  localStorage.setItem(key, JSON.stringify(data));
  const lbl = document.getElementById("leaderboard");
  lbl.textContent = `🏆 ${data.wins} W / ${data.losses} L`;
}

// Hook into round end
function endRound() {
  let msg, result;
  if (booksTeam1 > booksTeam2) {
    sounds.win.play();
    msg = "You and your partner took the hand! ♠🔥";
    result = "win";
  } else if (booksTeam2 > booksTeam1) {
    msg = "Cookout got you this time. Rematch?";
    result = "loss";
  } else {
    msg = "Even hand!";
    result = "tie";
  }

  alert(msg);
  updateLeaderboard(result);

  booksTeam1 = booksTeam2 = tricksPlayed = 0;
  spadesBroken = false;
  currentSuit = null;
  memory.ai1 = memory.ai2 = memory.partner = {};

  buildDeck();
  shuffleDeck();
  dealHands();
  renderPlayerHand();
  currentTurn = "player";
  gameStarted = true;
  smoothFocus(5);
}
