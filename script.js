// script.js

// --- Data Handling ---
const STORAGE_KEY = 'flashcards';
function getFlashcards() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
function saveFlashcards(cards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}
function clearFlashcards() {
  localStorage.removeItem(STORAGE_KEY);
}

// --- Navigation ---
function showView(view) {
  document.getElementById('app-root').innerHTML = '';
  if (view === 'home') renderHome();
  if (view === 'create') renderCreate();
  if (view === 'practice') renderPractice();
}
window.addEventListener('DOMContentLoaded', () => showView('home'));

// --- Home Page ---
function renderHome() {
    document.getElementById('app-root').innerHTML = `
      <div class="text-center">
        <div class="mb-4">
          <!-- Simple SVG illustration -->
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" class="mb-3">
            <rect x="10" y="30" width="100" height="60" rx="10" fill="#e3f2fd" stroke="#2196f3" stroke-width="2"/>
            <rect x="25" y="45" width="70" height="30" rx="5" fill="#fff" stroke="#90caf9" stroke-width="2"/>
            <text x="60" y="65" text-anchor="middle" fill="#2196f3" font-size="18" font-family="Arial" dy=".3em">ABC</text>
          </svg>
        </div>
        <h1 class="mb-3">Flashcard Web App</h1>
        <p class="mb-4">Create, edit, and practice your own flashcards. All data is saved in your browser.</p>
        <button class="btn btn-primary m-2" onclick="showView('create')">
          <i class="bi bi-plus-circle me-1"></i> Create Flashcards
        </button>
        <button class="btn btn-success m-2" onclick="showView('practice')">
          <i class="bi bi-lightbulb me-1"></i> Practice Mode
        </button>
      </div>
    `;
  }

// --- Create Flashcards Page ---
let editIndex = null;
function renderCreate() {
  const cards = getFlashcards();
  document.getElementById('app-root').innerHTML = `
    <div class="mb-4">
      <button class="btn btn-link" onclick="showView('home')">&larr; Back</button>
      <h2>Create Flashcards</h2>
      <form id="flashcard-form" class="row g-2">
        <div class="col-md-5">
          <input type="text" class="form-control" id="question" placeholder="Question" required>
        </div>
        <div class="col-md-5">
          <input type="text" class="form-control" id="answer" placeholder="Answer" required>
        </div>
        <div class="col-md-2 d-grid">
          <button type="submit" class="btn btn-primary" id="add-btn">Add Flashcard</button>
        </div>
      </form>
      <button class="btn btn-danger btn-sm mt-3" onclick="handleClearAll()">Reset All Flashcards</button>
    </div>
    <div id="flashcard-list">
      ${cards.length === 0 ? '<p class="text-muted">No flashcards yet.</p>' : ''}
      ${cards.map((card, i) => `
        <div class="flashcard mb-3" onclick="flipCard(event, ${i})" id="card-${i}">
          <div class="flashcard-inner">
            <div class="flashcard-front">${escapeHTML(card.question)}</div>
            <div class="flashcard-back">${escapeHTML(card.answer)}</div>
          </div>
          <div class="mt-2 text-end">
            <button class="btn btn-sm btn-secondary me-1" onclick="handleEdit(${i}, event)">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="handleDelete(${i}, event)">Delete</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('flashcard-form').onsubmit = handleFormSubmit;
  if (editIndex !== null) {
    // Populate form for editing
    document.getElementById('question').value = cards[editIndex].question;
    document.getElementById('answer').value = cards[editIndex].answer;
    document.getElementById('add-btn').textContent = 'Save Changes';
  }
}
function handleFormSubmit(e) {
  e.preventDefault();
  const question = document.getElementById('question').value.trim();
  const answer = document.getElementById('answer').value.trim();
  if (!question || !answer) return;
  let cards = getFlashcards();
  if (editIndex !== null) {
    cards[editIndex] = { question, answer };
    editIndex = null;
  } else {
    cards.push({ question, answer });
  }
  saveFlashcards(cards);
  renderCreate();
}
function handleEdit(i, event) {
  event.stopPropagation();
  editIndex = i;
  renderCreate();
}
function handleDelete(i, event) {
  event.stopPropagation();
  let cards = getFlashcards();
  cards.splice(i, 1);
  saveFlashcards(cards);
  editIndex = null;
  renderCreate();
}
function handleClearAll() {
  if (confirm('Are you sure you want to delete all flashcards?')) {
    clearFlashcards();
    editIndex = null;
    renderCreate();
  }
}
function flipCard(event, i) {
  if (event.target.tagName === 'BUTTON') return; // Don't flip if clicking button
  const card = document.getElementById(`card-${i}`);
  card.classList.toggle('flipped');
}
function escapeHTML(str) {
  return str.replace(/[&<>"]|'/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// --- Practice Mode ---
let practiceIndex = 0;
let practiceOrder = [];
let isShuffled = false;
function renderPractice() {
  const cards = getFlashcards();
  if (cards.length === 0) {
    document.getElementById('app-root').innerHTML = `
      <button class="btn btn-link" onclick="showView('home')">&larr; Back</button>
      <h2>Practice Mode</h2>
      <p class="text-muted">No flashcards to practice. Please create some first.</p>
    `;
    return;
  }
  if (practiceOrder.length !== cards.length) {
    practiceOrder = cards.map((_, i) => i);
    if (isShuffled) shufflePracticeOrder();
  }
  const i = practiceOrder[practiceIndex];
  document.getElementById('app-root').innerHTML = `
    <button class="btn btn-link" onclick="showView('home')">&larr; Back</button>
    <h2>Practice Mode</h2>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <span>Card ${practiceIndex + 1} of ${cards.length}</span>
      <button class="btn btn-outline-secondary btn-sm" onclick="toggleShuffle()">
        ${isShuffled ? 'Unshuffle' : 'Shuffle'}
      </button>
    </div>
    <div class="flashcard mx-auto mb-3" style="max-width:400px;" onclick="flipPracticeCard()"
         id="practice-card">
      <div class="flashcard-inner">
        <div class="flashcard-front">${escapeHTML(cards[i].question)}</div>
        <div class="flashcard-back">${escapeHTML(cards[i].answer)}</div>
      </div>
    </div>
    <div class="d-flex justify-content-between">
      <button class="btn btn-secondary" onclick="prevPractice()">Previous</button>
      <button class="btn btn-secondary" onclick="nextPractice()">Next</button>
    </div>
  `;
  // Reset flip state
  document.getElementById('practice-card').classList.remove('flipped');
}
function flipPracticeCard() {
  document.getElementById('practice-card').classList.toggle('flipped');
}
function prevPractice() {
  const cards = getFlashcards();
  practiceIndex = (practiceIndex - 1 + cards.length) % cards.length;
  renderPractice();
}
function nextPractice() {
  const cards = getFlashcards();
  practiceIndex = (practiceIndex + 1) % cards.length;
  renderPractice();
}
function toggleShuffle() {
  isShuffled = !isShuffled;
  practiceOrder = getFlashcards().map((_, i) => i);
  if (isShuffled) shufflePracticeOrder();
  practiceIndex = 0;
  renderPractice();
}
function shufflePracticeOrder() {
  for (let i = practiceOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [practiceOrder[i], practiceOrder[j]] = [practiceOrder[j], practiceOrder[i]];
  }
}

// --- Expose navigation for inline onclick handlers ---
window.showView = showView;
window.handleEdit = handleEdit;
window.handleDelete = handleDelete;
window.handleClearAll = handleClearAll;
window.flipCard = flipCard;
window.prevPractice = prevPractice;
window.nextPractice = nextPractice;
window.flipPracticeCard = flipPracticeCard;
window.toggleShuffle = toggleShuffle;
