const searchApiBtn = document.getElementById("searchApiBtn");
const apiMovieTitle = document.getElementById("apiMovieTitle");

const TMDB_API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlZGIxNGRjZDE2MzJkOWExNWJiNDc4ODc1NDA5ZWZhNyIsIm5iZiI6MTc3NTMxOTAxNC4wMjQ5OTk5LCJzdWIiOiI2OWQxMzdlNmVkZDFiNDhmYTI0ZDJiODkiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.V09fRNSqQH1J8ilYIQ2SP_XUbCh32kMZWg_nW5z9dkw";

const searchInput = document.getElementById("searchInput");
const moviesGrid = document.getElementById("moviesGrid");

const openAddMovieBtn = document.getElementById("openAddMovieBtn");
const addMovieModal = document.getElementById("addMovieModal");
const closeAddMovieModal = document.getElementById("closeAddMovieModal");

const movieDetailsModal = document.getElementById("movieDetailsModal");
const closeMovieDetailsModal = document.getElementById("closeMovieDetailsModal");
const movieDetailsContent = document.getElementById("movieDetailsContent");

const movieForm = document.getElementById("movieForm");

const STORAGE_KEY = "cineclub_movies_v1";

let moviesCache = [];
let editingMovieId = null;

function loadMovies() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveMovies() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(moviesCache));
}

function nextId() {
  return moviesCache.length
    ? Math.max(...moviesCache.map((m) => m.id)) + 1
    : 1;
}

function renderMovies(search = "") {
  const filtered = moviesCache.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  moviesGrid.innerHTML = filtered
    .map(
      (movie) => `
    <div class="movie-card" onclick="openMovieDetails(${movie.id})">
      <img src="${movie.poster || ""}" />
      <h3>${movie.title}</h3>
      <p>⭐ ${movie.rating ?? "-"}</p>
    </div>
  `
    )
    .join("");
}

function openMovieDetails(id) {
  const movie = moviesCache.find((m) => m.id === id);

  movieDetailsContent.innerHTML = `
    <h2>${movie.title}</h2>
    <img src="${movie.poster}" style="width:200px" />
    <p>${movie.description}</p>

    <select id="ratingSelect">
      <option value="">Nota</option>
      ${[...Array(10)].map((_, i) => `<option value="${i + 1}">${i + 1}</option>`)}
    </select>

    <button onclick="saveRating(${id})">Salvar nota</button>
    <button onclick="deleteMovie(${id})">Apagar</button>
  `;

  movieDetailsModal.classList.remove("hidden");
}

function saveRating(id) {
  const rating = Number(document.getElementById("ratingSelect").value);
  const movie = moviesCache.find((m) => m.id === id);
  movie.rating = rating;
  saveMovies();
  renderMovies();
}

function deleteMovie(id) {
  moviesCache = moviesCache.filter((m) => m.id !== id);
  saveMovies();
  renderMovies();
  movieDetailsModal.classList.add("hidden");
}

movieForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const movie = {
    id: nextId(),
    title: document.getElementById("movieTitle").value,
    year: document.getElementById("movieYear").value,
    poster: document.getElementById("moviePoster").value,
    description: document.getElementById("movieDescription").value,
    rating: null
  };

  moviesCache.push(movie);
  saveMovies();
  renderMovies();
  addMovieModal.classList.add("hidden");
});

searchInput.addEventListener("input", () => {
  renderMovies(searchInput.value);
});

openAddMovieBtn.onclick = () => addMovieModal.classList.remove("hidden");
closeAddMovieModal.onclick = () => addMovieModal.classList.add("hidden");
closeMovieDetailsModal.onclick = () => movieDetailsModal.classList.add("hidden");


// 🔥 FUNÇÃO TMDB
async function searchMovieFromTMDb() {
  const query = apiMovieTitle.value.trim();

  if (!query) {
    return alert("Digite um filme");
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`
    );

    const data = await res.json();
    const movie = data.results[0];

    if (!movie) {
      return alert("Filme não encontrado");
    }

    document.getElementById("movieTitle").value = movie.title;
    document.getElementById("movieYear").value = movie.release_date?.slice(0, 4) || "";
    document.getElementById("moviePoster").value = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "";
    document.getElementById("movieDescription").value = movie.overview || "";

  } catch (err) {
    console.error(err);
    alert("Erro ao buscar filme");
  }
}

// conecta botão
if (searchApiBtn) {
  searchApiBtn.addEventListener("click", searchMovieFromTMDb);
}


// INIT
moviesCache = loadMovies();
renderMovies();
