// Black Dollar Trust Spades 🃏
// Offline Mode: Player + AI Bots (3 Opponents)
// Enhanced card color + visibility stack display
// © 2025 Black Dollar Trust Book Club

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("spadesCanvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 900;
  canvas.height = 600;

  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  let deck = [];
  let hands = { player: [], ai1: [], ai2: [], ai3: [] };
  let playedCards = [];

  // 🎴 Create Deck
  function createDeck() {
    deck = [];
    for (let suit of suits) {
      for (let value of values) {
        deck.push({
          suit,
          value,
          color: suit === "hearts" || suit === "diamonds" ? "red" : "black"
        });
      }
    }
  }

  // 🔀 Shuffle
  function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  // 🫱 Deal Cards
  function deal() {
    createDeck();
    shuffle(deck);
    for (let i = 0; i < 13; i++) {
      hands.player.push(deck.pop());
      hands.ai1.push(deck.pop());
      hands.ai2.push(deck.pop());
      hands.ai3.push(deck.pop());
    }
  }

  // 🧠 AI Logic (simple version)
  function aiPlay(aiHand) {
    const playable = aiHand[Math.floor(Math.random() * aiHand.length)];
    aiHand.splice(aiHand.indexOf(playable), 1);
    return playable;
  }

  // 🃏 Draw Card
  function drawCard(ctx, card, x, y) {
    ctx.fillStyle = "#222";
    ctx.strokeStyle = "gold";
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, 60, 90);
    ctx.strokeRect(x, y, 60, 90);
    ctx.fillStyle = card.color;
    ctx.font = "18px Poppins";
    ctx.fillText(card.value, x + 10, y + 25);
    ctx.fillText(getSuitSymbol(card.suit), x + 30, y + 70);
  }

  // ♠️ Suit Symbols
  function getSuitSymbol(suit) {
    switch (suit) {
      case "hearts": return "♥";
      case "diamonds": return "♦";
      case "clubs": return "♣";
      case "spades": return "♠";
    }
  }

  // 🖼️ Render Player Hand
  function renderHands() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player Hand
    let x = 200;
    for (let card of hands.player) {
      drawCard(ctx, card, x, 450);
      x += 45;
    }

    // Played Cards Stack
    renderPlayedCards(playedCards, ctx);
  }

  // 🧩 Render Played Cards (stacked)
  function renderPlayedCards(cards, ctx) {
    let offset = 0;
    cards.forEach((card, i) => {
      ctx.globalAlpha = i === cards.length - 1 ? 1 : 0.75;
      drawCard(ctx, card, 400 + offset, 250 - offset / 2);
      offset += 20;
    });
    ctx.globalAlpha = 1;
  }

  // 🎮 Player Plays Card
  canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (y >= 450 && y <= 540) {
      const cardIndex = Math.floor((x - 200) / 45);
      if (hands.player[cardIndex]) {
        const played = hands.player.splice(cardIndex, 1)[0];
        playedCards.push(played);
        aiTurns();
        renderHands();
      }
    }
  });

  // 🤖 AI Turns
  function aiTurns() {
    playedCards.push(aiPlay(hands.ai1));
    playedCards.push(aiPlay(hands.ai2));
    playedCards.push(aiPlay(hands.ai3));

    setTimeout(() => {
      playedCards = [];
      renderHands();
    }, 2000);
  }

  // 🟢 Start Game Button
  const startBtn = document.getElementById("startGame");
  startBtn.addEventListener("click", () => {
    hands = { player: [], ai1: [], ai2: [], ai3: [] };
    playedCards = [];
    deal();
    renderHands();
  });
});
