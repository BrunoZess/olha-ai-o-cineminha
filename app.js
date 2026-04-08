
const TMDB_BEARER_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlZGIxNGRjZDE2MzJkOWExNWJiNDc4ODc1NDA5ZWZhNyIsIm5iZiI6MTc3NTMxOTAxNC4wMjQ5OTk5LCJzdWIiOiI2OWQxMzdlNmVkZDFiNDhmYTI0ZDJiODkiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.V09fRNSqQH1J8ilYIQ2SP_XUbCh32kMZWg_nW5z9dkw";
const STORAGE_KEY = "edb14dcd1632d9a15bb478875409efa7";

const watchedGrid = document.getElementById("watchedGrid");
const toWatchGrid = document.getElementById("toWatchGrid");
const searchInput = document.getElementById("searchInput");

const statTotal = document.getElementById("statTotal");
const statWatched = document.getElementById("statWatched");
const statNotWatched = document.getElementById("statNotWatched");

const openAddMovieBtn = document.getElementById("openAddMovieBtn");
const addMovieModal = document.getElementById("addMovieModal");
const closeAddMovieModal = document.getElementById("closeAddMovieModal");

const movieDetailsModal = document.getElementById("movieDetailsModal");
const closeMovieDetailsModal = document.getElementById("closeMovieDetailsModal");
const movieDetailsContent = document.getElementById("movieDetailsContent");

const movieForm = document.getElementById("movieForm");
const apiMovieTitle = document.getElementById("apiMovieTitle");
const searchApiBtn = document.getElementById("searchApiBtn");

const filmsPage = document.getElementById("filmsPage");
const tierlistPage = document.getElementById("tierlistPage");
const filmsTabBtn = document.getElementById("filmsTabBtn");
const tierlistTabBtn = document.getElementById("tierlistTabBtn");
const unrankedPool = document.getElementById("unrankedPool");

let moviesCache = [];
let editingMovieId = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function posterUrl(movie) {
  return movie.poster && movie.poster.trim()
    ? movie.poster
    : "https://placehold.co/500x750/111111/d6a84f?text=Sem+Poster";
}

function watchedLabel(watched) {
  return watched ? "Vimos" : "Não vimos";
}

function loadMovies() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMovies() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(moviesCache));
}

function nextId() {
  return moviesCache.length
    ? Math.max(...moviesCache.map((movie) => Number(movie.id) || 0)) + 1
    : 1;
}

function normalizeMovie(movie) {
  return {
    id: Number(movie.id) || Date.now(),
    title: movie.title || "",
    year: movie.year || "",
    poster: movie.poster || "",
    description: movie.description || "",
    watched: Boolean(movie.watched),
    tier: movie.tier || null,
    created_at: movie.created_at || new Date().toISOString()
  };
}

function updateStats() {
  const watched = moviesCache.filter((m) => m.watched).length;
  const notWatched = moviesCache.length - watched;

  statTotal.textContent = String(moviesCache.length);
  statWatched.textContent = String(watched);
  statNotWatched.textContent = String(notWatched);
}

function movieCard(movie) {
  return `
    <article class="movie-card">
      <div class="movie-thumb" onclick="openMovieDetails(${movie.id})">
        <img
          class="movie-poster"
          src="${posterUrl(movie)}"
          alt="Poster de ${escapeHtml(movie.title)}"
        />
        <button
          class="eye-toggle ${movie.watched ? "is-watched" : ""}"
          type="button"
          title="${movie.watched ? "Marcar como não visto" : "Marcar como visto"}"
          onclick="toggleWatched(event, ${movie.id})"
        >
          ${movie.watched ? "👁️" : "🙈"}
        </button>
      </div>

      <div class="movie-body" onclick="openMovieDetails(${movie.id})">
        <h4 class="movie-title">${escapeHtml(movie.title)}</h4>
        <div class="movie-meta">
          <span>${escapeHtml(movie.year || "Ano desconhecido")}</span>
        </div>
        <div class="badge-row">
          <span class="badge">${watchedLabel(movie.watched)}</span>
          ${movie.tier ? `<span class="badge">Tier ${escapeHtml(movie.tier)}</span>` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderMovies() {
  const term = searchInput.value.trim().toLowerCase();

  const filtered = moviesCache.filter((movie) =>
    String(movie.title || "").toLowerCase().includes(term)
  );

  const watchedMovies = filtered.filter((movie) => movie.watched);
  const otherMovies = filtered.filter((movie) => !movie.watched);

  watchedGrid.innerHTML = watchedMovies.length
    ? watchedMovies.map(movieCard).join("")
    : `<p class="empty-state">Nenhum filme visto encontrado.</p>`;

  toWatchGrid.innerHTML = otherMovies.length
    ? otherMovies.map(movieCard).join("")
    : `<p class="empty-state">Nenhum filme pendente encontrado.</p>`;

  updateStats();
}

function resetMovieForm() {
  movieForm.reset();
  editingMovieId = null;
}

function openModal(modal) {
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
}

function fillMovieForm(movie) {
  document.getElementById("movieTitle").value = movie.title || "";
  document.getElementById("movieYear").value = movie.year || "";
  document.getElementById("moviePoster").value = movie.poster || "";
  document.getElementById("movieDescription").value = movie.description || "";
  editingMovieId = movie.id;
}

function openMovieDetails(id) {
  const movie = moviesCache.find((item) => item.id === id);
  if (!movie) return;

  movieDetailsContent.innerHTML = `
    <div class="detail-layout">
      <img
        class="detail-poster"
        src="${posterUrl(movie)}"
        alt="Poster de ${escapeHtml(movie.title)}"
      />

      <div>
        <p class="eyebrow">DETALHES</p>
        <h3 class="detail-title">${escapeHtml(movie.title)}</h3>
        <p class="detail-year">${escapeHtml(movie.year || "Ano desconhecido")}</p>

        <div class="badge-row">
          <span class="badge">${watchedLabel(movie.watched)}</span>
          <span class="badge">Tier: ${movie.tier || "-"}</span>
        </div>

        <div class="detail-status">
          <button class="gold-btn" onclick="setWatched(${movie.id}, true)" type="button">👁️ Vi</button>
          <button class="soft-btn" onclick="setWatched(${movie.id}, false)" type="button">🙈 Não vi</button>
        </div>

        <div class="detail-status">
          <button class="gold-btn" onclick="setTier(${movie.id}, 'S')" type="button">Tier S</button>
          <button class="soft-btn" onclick="setTier(${movie.id}, 'A')" type="button">Tier A</button>
          <button class="soft-btn" onclick="setTier(${movie.id}, 'B')" type="button">Tier B</button>
          <button class="soft-btn" onclick="setTier(${movie.id}, 'C')" type="button">Tier C</button>
          <button class="soft-btn" onclick="setTier(${movie.id}, 'D')" type="button">Tier D</button>
          <button class="soft-btn" onclick="setTier(${movie.id}, 'F')" type="button">Tier F</button>
          <button class="soft-btn" onclick="setTier(${movie.id}, '')" type="button">Sem tier</button>
        </div>

        <p class="detail-description">${escapeHtml(movie.description || "Sem descrição ainda.")}</p>

        <div class="detail-actions">
          <button class="gold-btn" onclick="editMovie(${movie.id})" type="button">Editar</button>
          <button class="red-btn" onclick="deleteMovie(${movie.id})" type="button">Apagar</button>
        </div>
      </div>
    </div>
  `;

  openModal(movieDetailsModal);
}

function setWatched(id, watched) {
  const movie = moviesCache.find((item) => item.id === id);
  if (!movie) return;

  movie.watched = Boolean(watched);
  saveMovies();
  renderMovies();
  renderTierlist();
  openMovieDetails(id);
}

function toggleWatched(event, id) {
  event.stopPropagation();

  const movie = moviesCache.find((item) => item.id === id);
  if (!movie) return;

  movie.watched = !movie.watched;
  saveMovies();
  renderMovies();
  renderTierlist();
}

function setTier(id, tier) {
  const movie = moviesCache.find((item) => item.id === Number(id));
  if (!movie) return;

  movie.tier = tier || null;
  saveMovies();
  renderMovies();
  renderTierlist();
  openMovieDetails(Number(id));
}

function editMovie(id) {
  const movie = moviesCache.find((item) => item.id === id);
  if (!movie) return;

  fillMovieForm(movie);
  closeModal(movieDetailsModal);
  openModal(addMovieModal);
}

function deleteMovie(id) {
  const ok = window.confirm("Quer mesmo apagar esse filme?");
  if (!ok) return;

  moviesCache = moviesCache.filter((movie) => movie.id !== id);
  saveMovies();
  renderMovies();
  renderTierlist();
  closeModal(movieDetailsModal);
}

async function searchMovieFromTMDb() {
  const query = apiMovieTitle.value.trim();

  if (!query) {
    alert("Digite um filme para buscar.");
    return;
  }

  if (!TMDB_BEARER_TOKEN || TMDB_BEARER_TOKEN.includes("COLE_SEU_TOKEN_AQUI")) {
    alert("Coloque seu token do TMDb no app.js primeiro.");
    return;
  }

  try {
    searchApiBtn.disabled = true;
    searchApiBtn.textContent = "Buscando...";

    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=pt-BR`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_BEARER_TOKEN}`,
          accept: "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      alert(data.status_message || "Erro ao buscar filme.");
      return;
    }

    const movie = data.results?.[0];

    if (!movie) {
      alert("Filme não encontrado.");
      return;
    }

    document.getElementById("movieTitle").value = movie.title || "";
    document.getElementById("movieYear").value = movie.release_date
      ? movie.release_date.slice(0, 4)
      : "";
    document.getElementById("moviePoster").value = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "";
    document.getElementById("movieDescription").value = movie.overview || "";
  } catch (error) {
    console.error(error);
    alert("Erro ao buscar filme.");
  } finally {
    searchApiBtn.disabled = false;
    searchApiBtn.textContent = "Buscar";
  }
}

function showPage(page) {
  const isFilms = page === "films";

  filmsPage.classList.toggle("hidden", !isFilms);
  tierlistPage.classList.toggle("hidden", isFilms);

  filmsTabBtn.classList.toggle("active", isFilms);
  tierlistTabBtn.classList.toggle("active", !isFilms);

  if (!isFilms) {
    renderTierlist();
  }
}

function tierMovieCard(movie) {
  return `
    <div
      class="tier-movie"
      draggable="true"
      ondragstart="handleDragStart(event, ${movie.id})"
      onclick="openMovieDetails(${movie.id})"
      title="${escapeHtml(movie.title)}"
    >
      <img src="${posterUrl(movie)}" alt="Poster de ${escapeHtml(movie.title)}" />
      <p>${escapeHtml(movie.title)}</p>
    </div>
  `;
}

function renderTierlist() {
  const tiers = ["S", "A", "B", "C", "D", "F"];

  tiers.forEach((tier) => {
    const zone = document.querySelector(`.tier-dropzone[data-tier="${tier}"]`);
    if (!zone) return;

    const movies = moviesCache.filter((movie) => movie.tier === tier);
    zone.innerHTML = movies.length
      ? movies.map(tierMovieCard).join("")
      : `<p class="empty-state">Solte filmes aqui.</p>`;
  });

  const unranked = moviesCache.filter((movie) => !movie.tier);
  unrankedPool.innerHTML = unranked.length
    ? unranked.map(tierMovieCard).join("")
    : `<p class="empty-state">Todos os filmes já foram rankeados.</p>`;
}

function handleDragStart(event, movieId) {
  event.dataTransfer.setData("text/plain", String(movieId));
  event.dataTransfer.effectAllowed = "move";
}

function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

function handleDropToTier(event) {
  event.preventDefault();
  event.currentTarget.classList.remove("drag-over");

  const movieId = Number(event.dataTransfer.getData("text/plain"));
  const tier = event.currentTarget.dataset.tier;

  const movie = moviesCache.find((item) => item.id === movieId);
  if (!movie) return;

  movie.tier = tier;
  saveMovies();
  renderMovies();
  renderTierlist();
}

function handleDropToPool(event) {
  event.preventDefault();
  event.currentTarget.classList.remove("drag-over");

  const movieId = Number(event.dataTransfer.getData("text/plain"));
  const movie = moviesCache.find((item) => item.id === movieId);
  if (!movie) return;

  movie.tier = null;
  saveMovies();
  renderMovies();
  renderTierlist();
}

movieForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = document.getElementById("movieTitle").value.trim();
  const year = document.getElementById("movieYear").value.trim();
  const poster = document.getElementById("moviePoster").value.trim();
  const description = document.getElementById("movieDescription").value.trim();

  if (!title) {
    alert("Título obrigatório.");
    return;
  }

  if (editingMovieId) {
    const movie = moviesCache.find((item) => item.id === editingMovieId);
    if (!movie) return;

    movie.title = title;
    movie.year = year;
    movie.poster = poster;
    movie.description = description;
  } else {
    moviesCache.unshift({
      id: nextId(),
      title,
      year,
      poster,
      description,
      watched: false,
      tier: null,
      created_at: new Date().toISOString()
    });
  }

  saveMovies();
  renderMovies();
  renderTierlist();
  resetMovieForm();
  closeModal(addMovieModal);
});

searchInput.addEventListener("input", renderMovies);
searchApiBtn.addEventListener("click", searchMovieFromTMDb);

apiMovieTitle.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchMovieFromTMDb();
  }
});

filmsTabBtn.addEventListener("click", () => showPage("films"));
tierlistTabBtn.addEventListener("click", () => showPage("tierlist"));

openAddMovieBtn.addEventListener("click", () => {
  resetMovieForm();
  openModal(addMovieModal);
});

closeAddMovieModal.addEventListener("click", () => closeModal(addMovieModal));
closeMovieDetailsModal.addEventListener("click", () => closeModal(movieDetailsModal));

window.addEventListener("click", (event) => {
  if (event.target === addMovieModal) closeModal(addMovieModal);
  if (event.target === movieDetailsModal) closeModal(movieDetailsModal);
});

moviesCache = loadMovies().map(normalizeMovie);

if (!moviesCache.length) {
  moviesCache = [
    {
      id: 1,
      title: "Interestelar",
      year: "2014",
      poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      description: "Exploradores viajam pelo espaço em busca de um novo lar para a humanidade.",
      watched: true,
      tier: "S",
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: "Whiplash",
      year: "2014",
      poster: "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
      description: "Um jovem baterista busca perfeição sob a pressão de um professor brutal.",
      watched: false,
      tier: null,
      created_at: new Date().toISOString()
    }
  ];

  saveMovies();
}

renderMovies();
renderTierlist();

window.openMovieDetails = openMovieDetails;
window.setWatched = setWatched;
window.toggleWatched = toggleWatched;
window.setTier = setTier;
window.editMovie = editMovie;
window.deleteMovie = deleteMovie;
window.handleDragStart = handleDragStart;
window.handleDragOver = handleDragOver;
window.handleDragLeave = handleDragLeave;
window.handleDropToTier = handleDropToTier;
window.handleDropToPool = handleDropToPool;