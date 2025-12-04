// Black Dollar Trust Spades: Cookout Crew Edition 💬
// Adds personality, taunts, and banter from AI opponents

document.addEventListener("DOMContentLoaded", () => {
 window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("spadesCanvas");
  const ctx = canvas.getContext("2d");

  const status = document.getElementById("status");
  const startBtn = document.getElementById("startGame");

  canvas.width = 900;
  canvas.height = 600;

  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  let deck = [];
  let hands = { player: [], ai1: [], ai2: [], ai3: [] };
  let playedCards = [];
  let aiPersonalities = [
    {
      name: "Uncle Tony",
      mood: "Playful",
      phrases: [
        "Boy, you sure you know how to play this game?",
        "Mmm, that was a bold move.",
        "You must be new to the table.",
        "Heh, I taught your cousin how to play this!"
      ]
    },
    {
      name: "Auntie Rose",
      mood: "Confident",
      phrases: [
        "Baby, I been running this table since the 80s.",
        "Don't play with me — I got books to win.",
        "Mmm-hmm, that’s a bad play, sugar.",
        "You might as well put that card back in your hand!"
      ]
    },
    {
      name: "Cousin Dre",
      mood: "Cocky",
      phrases: [
        "You can’t stop greatness.",
        "This is what I do!",
        "Y’all better pack it up after this hand.",
        "Easy money, easy books."
      ]
    }
  ];

  // Create deck
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

  // Shuffle
  function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  // Deal hands
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

  // Draw card
  function drawCard(ctx, card, x, y) {
    ctx.fillStyle = "#1a1a1a";
    ctx.strokeStyle = "gold";
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, 60, 90);
    ctx.strokeRect(x, y, 60, 90);
    ctx.fillStyle = card.color;
    ctx.font = "18px Poppins";
    ctx.fillText(card.value, x + 10, y + 25);
    ctx.fillText(getSuitSymbol(card.suit), x + 30, y + 70);
  }

  function getSuitSymbol(suit) {
    switch (suit) {
      case "hearts": return "♥";
      case "diamonds": return "♦";
      case "clubs": return "♣";
      case "spades": return "♠";
    }
  }

  function renderHands() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player Hand
    let x = 200;
    for (let card of hands.player) {
      drawCard(ctx, card, x, 450);
      x += 45;
    }

    renderPlayedCards(playedCards, ctx);
  }

  function renderPlayedCards(cards, ctx) {
    let offset = 0;
    cards.forEach((card, i) => {
      ctx.globalAlpha = i === cards.length - 1 ? 1 : 0.75;
      drawCard(ctx, card, 400 + offset, 250 - offset / 2);
      offset += 20;
    });
    ctx.globalAlpha = 1;
  }

  // 🎤 AI Play with Banter
  function aiPlay(aiHand, aiIndex) {
    const playable = aiHand[Math.floor(Math.random() * aiHand.length)];
    aiHand.splice(aiHand.indexOf(playable), 1);
    const ai = aiPersonalities[aiIndex];
    const line = ai.phrases[Math.floor(Math.random() * ai.phrases.length)];

    showStatus(`${ai.name}: "${line}"`);
    return playable;
  }

  // Show text overlay
  function showStatus(text) {
    status.textContent = text;
    status.style.opacity = 1;
    setTimeout(() => (status.style.opacity = 0.7), 2500);
  }

  // Player clicks card
  canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (y >= 450 && y <= 540) {
      const cardIndex = Math.floor((x - 200) / 45);
      if (hands.player[cardIndex]) {
        const played = hands.player.splice(cardIndex, 1)[0];
        playedCards.push(played);
        renderHands();
        showStatus("You played " + played.value + " of " + played.suit);
        setTimeout(aiTurns, 1000);
      }
    }
  });

  // AI turns
  function aiTurns() {
    playedCards.push(aiPlay(hands.ai1, 0));
    renderHands();
    setTimeout(() => {
      playedCards.push(aiPlay(hands.ai2, 1));
      renderHands();
    }, 1000);
    setTimeout(() => {
      playedCards.push(aiPlay(hands.ai3, 2));
      renderHands();
    }, 2000);
    setTimeout(() => {
      playedCards = [];
      renderHands();
      showStatus("New round begins!");
    }, 4000);
  }

  startBtn.addEventListener("click", () => {
    hands = { player: [], ai1: [], ai2: [], ai3: [] };
    playedCards = [];
    deal();
    renderHands();
    showStatus("Game started! Good luck at the table.");
  });
});
