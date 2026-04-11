const SUPABASE_URL = "https://xtmtpcvhyzingglsjdku.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0bXRwY3ZoeXppbmdnbHNqZGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzA4NjUsImV4cCI6MjA5MTI0Njg2NX0.X08UNlRPFOeI6JWM-XQlJaushroAVVPM5ojg88Pvbv4";
const TMDB_BEARER_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlZGIxNGRjZDE2MzJkOWExNWJiNDc4ODc1NDA5ZWZhNyIsIm5iZiI6MTc3NTMxOTAxNC4wMjQ5OTk5LCJzdWIiOiI2OWQxMzdlNmVkZDFiNDhmYTI0ZDJiODkiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.V09fRNSqQH1J8ilYIQ2SP_XUbCh32kMZWg_nW5z9dkw";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// AUTH
const authPage = document.getElementById("authPage");
const appShell = document.getElementById("appShell");
const authUsername = document.getElementById("authUsername");
const authPassword = document.getElementById("authPassword");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authMessage = document.getElementById("authMessage");

// SIDEBAR / PERFIL
const sidebarAvatar = document.getElementById("sidebarAvatar");
const sidebarUsername = document.getElementById("sidebarUsername");
const sidebarEmailLike = document.getElementById("sidebarEmailLike");
const profilePreviewAvatar = document.getElementById("profilePreviewAvatar");
const profileUsername = document.getElementById("profileUsername");
const profileAvatarUrl = document.getElementById("profileAvatarUrl");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const profileMessage = document.getElementById("profileMessage");

// FILMES
const sortSelect = document.getElementById("sortSelect");
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

// PÁGINAS
const filmsPage = document.getElementById("filmsPage");
const tierlistPage = document.getElementById("tierlistPage");
const friendsPage = document.getElementById("friendsPage");
const profilePage = document.getElementById("profilePage");

const filmsTabBtn = document.getElementById("filmsTabBtn");
const tierlistTabBtn = document.getElementById("tierlistTabBtn");
const friendsTabBtn = document.getElementById("friendsTabBtn");
const profileTabBtn = document.getElementById("profileTabBtn");
const unrankedPool = document.getElementById("unrankedPool");

// AMIGOS
const friendsGrid = document.getElementById("friendsGrid");
const friendLikesGrid = document.getElementById("friendLikesGrid");
const friendLikesTitle = document.getElementById("friendLikesTitle");

// CACHE
let moviesCache = [];
let ratingsCache = [];
let likesCache = [];
let profilesCache = [];
let currentUser = null;
let currentProfile = null;
let editingMovieId = null;

// HELPERS
function fakeEmailFromUsername(username) {
  return `${String(username).trim().toLowerCase()}@gdc.local`;
}

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

function avatarUrl(profile) {
  return profile?.avatar_url?.trim()
    ? profile.avatar_url
    : "./logo.png";
}

function watchedLabel(watched) {
  return watched ? "Vimos" : "Não vimos";
}

function showAuthMessage(msg) {
  authMessage.textContent = msg || "";
}

function showProfileMessage(msg) {
  profileMessage.textContent = msg || "";
}

function averageRatingForMovie(movieId) {
  const ratings = ratingsCache.filter((item) => item.movie_id === movieId);
  if (!ratings.length) return null;
  const total = ratings.reduce((sum, item) => sum + Number(item.rating || 0), 0);
  return (total / ratings.length).toFixed(1);
}

function totalLikesForMovie(movieId) {
  return likesCache.filter((item) => item.movie_id === movieId).length;
}

function myRatingForMovie(movieId) {
  if (!currentUser) return null;
  const rating = ratingsCache.find(
    (item) => item.movie_id === movieId && item.user_id === currentUser.id
  );
  return rating ? Number(rating.rating).toFixed(1) : null;
}

function iLikedMovie(movieId) {
  if (!currentUser) return false;
  return likesCache.some(
    (item) => item.movie_id === movieId && item.user_id === currentUser.id
  );
}

function getProfileByUserId(userId) {
  return profilesCache.find((item) => item.id === userId) || null;
}

function usernameByUserId(userId) {
  return getProfileByUserId(userId)?.username || "Usuário";
}

function updateStats() {
  const watched = moviesCache.filter((m) => m.watched).length;
  const notWatched = moviesCache.length - watched;

  statTotal.textContent = String(moviesCache.length);
  statWatched.textContent = String(watched);
  statNotWatched.textContent = String(notWatched);
}

function openModal(modal) {
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
}

function resetMovieForm() {
  movieForm.reset();
  editingMovieId = null;
}

function fillMovieForm(movie) {
  document.getElementById("movieTitle").value = movie.title || "";
  document.getElementById("movieYear").value = movie.year || "";
  document.getElementById("moviePoster").value = movie.poster || "";
  document.getElementById("movieDescription").value = movie.description || "";
  document.getElementById("movieTmdbRating").value = movie.tmdb_rating || "";
  editingMovieId = movie.id;
}

// AUTH
async function ensureProfile(userId, username) {
  const { data: existingProfile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error(profileError);
    throw profileError;
  }

  if (existingProfile) {
    return existingProfile;
  }

  const payload = {
    id: userId,
    username: username.trim(),
    avatar_url: ""
  };

  const { data: created, error: insertError } = await supabaseClient
    .from("profiles")
    .insert(payload)
    .select()
    .single();

  if (insertError) {
    console.error(insertError);
    throw insertError;
  }

  return created;
}

async function handleAuth() {
  const username = authUsername.value.trim();
  const password = authPassword.value.trim();

  if (!username || !password) {
    showAuthMessage("Preenche usuário e senha.");
    return;
  }

  const email = fakeEmailFromUsername(username);

  // 🔹 tenta login primeiro
  const { data: loginData, error: loginError } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (!loginError) {
    showAuthMessage("");
    await bootstrapApp();
    return;
  }

  // 🔹 se falhar, cria conta
  const { data: signUpData, error: signUpError } =
    await supabaseClient.auth.signUp({
      email,
      password
    });

  if (signUpError) {
    showAuthMessage(signUpError.message);
    return;
  }

  const user = signUpData.user;
  if (user) {
    await ensureProfile(user.id, username);
  }

  showAuthMessage("Conta criada e logado!");
  await bootstrapApp();
}

async function signOut() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  currentProfile = null;
  authPage.classList.remove("hidden");
  appShell.classList.add("hidden");
}

async function getCurrentUser() {
  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  currentUser = user || null;
  return currentUser;
}

async function loadCurrentProfile() {
  if (!currentUser) return null;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  currentProfile = data || null;
  return currentProfile;
}

function renderCurrentProfileUI() {
  if (!currentProfile) return;

  sidebarAvatar.src = avatarUrl(currentProfile);
  sidebarUsername.textContent = currentProfile.username || "Usuário";
  sidebarEmailLike.textContent = `@${currentProfile.username || "usuario"}`;

  profilePreviewAvatar.src = avatarUrl(currentProfile);
  profileUsername.value = currentProfile.username || "";
  profileAvatarUrl.value = currentProfile.avatar_url || "";
}

async function saveMyProfile() {
  if (!currentUser || !currentProfile) return;

  const newUsername = profileUsername.value.trim();
  const newAvatarUrl = profileAvatarUrl.value.trim();

  if (!newUsername) {
    showProfileMessage("Escolhe um nome de usuário.");
    return;
  }

  const { data, error } = await supabaseClient
    .from("profiles")
    .update({
      username: newUsername,
      avatar_url: newAvatarUrl
    })
    .eq("id", currentUser.id)
    .select()
    .single();

  if (error) {
    console.error(error);
    showProfileMessage(error.message || "Erro ao salvar perfil.");
    return;
  }

  currentProfile = data;
  renderCurrentProfileUI();
  await fetchProfiles();
  showProfileMessage("Perfil salvo.");
}

// FETCH
async function fetchProfiles() {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  profilesCache = Array.isArray(data) ? data : [];
}

async function fetchMovies() {
  const { data, error } = await supabaseClient
    .from("movies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    alert("Erro ao carregar filmes.");
    return;
  }

  moviesCache = Array.isArray(data) ? data : [];
}

async function fetchRatings() {
  const { data, error } = await supabaseClient
    .from("movie_ratings")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  ratingsCache = Array.isArray(data) ? data : [];
}

async function fetchLikes() {
  const { data, error } = await supabaseClient
    .from("movie_likes")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  likesCache = Array.isArray(data) ? data : [];
}

async function fetchAllData() {
  await Promise.all([
    fetchProfiles(),
    fetchMovies(),
    fetchRatings(),
    fetchLikes()
  ]);

  renderMovies();
  renderTierlist();
  renderFriends();
}

// MOVIES
function movieCard(movie) {
  const avg = averageRatingForMovie(movie.id);
  const mine = myRatingForMovie(movie.id);
  const likes = totalLikesForMovie(movie.id);

  return `
    <article class="movie-card">
      <div class="movie-thumb" onclick="openMovieDetails(${movie.id})">
        <img class="movie-poster" src="${posterUrl(movie)}" alt="Poster de ${escapeHtml(movie.title)}" />
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
          <span class="tmdb-chip">TMDb ${escapeHtml(movie.tmdb_rating || "-")}</span>
        </div>

        <div class="badge-row">
          <span class="badge">${watchedLabel(movie.watched)}</span>
          ${movie.tier ? `<span class="badge">Tier ${escapeHtml(movie.tier)}</span>` : ""}
          <span class="badge">Média: ${avg ?? "-"}</span>
          <span class="badge">Sua nota: ${mine ?? "-"}</span>
          <span class="badge">Curtidas: ${likes}</span>
        </div>
      </div>
    </article>
  `;
}

function renderMovies() {
  const term = searchInput.value.trim().toLowerCase();
  const sortValue = sortSelect ? sortSelect.value : "default";

  const filtered = moviesCache.filter((movie) =>
    String(movie.title || "").toLowerCase().includes(term)
  );

 filtered.sort((a, b) => {
  switch (sortValue) {
    case "az":
      return (a.title || "").localeCompare(b.title || "");

    case "za":
      return (b.title || "").localeCompare(a.title || "");

    case "new":
      return Number(b.year || 0) - Number(a.year || 0);

    case "old":
      return Number(a.year || 0) - Number(b.year || 0);

    case "watched":
      return Number(b.watched) - Number(a.watched);

      case "liked":
  return totalLikesForMovie(b.id) - totalLikesForMovie(a.id);

case "bestRated":
  return (averageRatingForMovie(b.id) || 0) - (averageRatingForMovie(a.id) || 0);

    default:
      return 0;
  }
});

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

function openMovieDetails(id) {
  const movie = moviesCache.find((item) => item.id === id);
  if (!movie) return;

  const avg = averageRatingForMovie(movie.id);
  const mine = myRatingForMovie(movie.id);
  const liked = iLikedMovie(movie.id);
  const likes = totalLikesForMovie(movie.id);

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
          ${movie.tmdb_rating ? `<span class="badge">TMDb: ${escapeHtml(movie.tmdb_rating)}</span>` : ""}
          <span class="badge">Média: ${avg ?? "-"}</span>
          <span class="badge">Sua nota: ${mine ?? "-"}</span>
          <span class="badge">Curtidas: ${likes}</span>
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

        <div class="detail-status">
          <input id="ratingInput" type="number" min="0" max="10" step="0.5" placeholder="Sua nota (0 a 10)" value="${mine ?? ""}" />
          <button class="gold-btn" onclick="saveRating(${movie.id})" type="button">Salvar nota</button>
          <button class="${liked ? "gold-btn" : "soft-btn"}" onclick="toggleLike(${movie.id})" type="button">
            ${liked ? "★ Curtido" : "☆ Curtir"}
          </button>
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

async function setWatched(id, watched) {
  const { error } = await supabaseClient
    .from("movies")
    .update({ watched: Boolean(watched) })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Erro ao atualizar filme.");
    return;
  }

  await fetchAllData();
  openMovieDetails(id);
}

async function toggleWatched(event, id) {
  event.stopPropagation();

  const movie = moviesCache.find((item) => item.id === id);
  if (!movie) return;

  const { error } = await supabaseClient
    .from("movies")
    .update({ watched: !movie.watched })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Erro ao atualizar filme.");
    return;
  }

  await fetchAllData();
}

async function setTier(id, tier) {
  const { error } = await supabaseClient
    .from("movies")
    .update({ tier: tier || null })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Erro ao atualizar tier.");
    return;
  }

  await fetchAllData();
  openMovieDetails(id);
}

async function saveRating(movieId) {
  if (!currentUser) return;

  const ratingInput = document.getElementById("ratingInput");
  const value = Number(ratingInput.value);

  if (Number.isNaN(value) || value < 0 || value > 10) {
    alert("A nota precisa estar entre 0 e 10.");
    return;
  }

  const existing = ratingsCache.find(
    (item) => item.movie_id === movieId && item.user_id === currentUser.id
  );

  if (existing) {
    const { error } = await supabaseClient
      .from("movie_ratings")
      .update({ rating: value })
      .eq("id", existing.id);

    if (error) {
      console.error(error);
      alert("Erro ao salvar nota.");
      return;
    }
  } else {
    const { error } = await supabaseClient
      .from("movie_ratings")
      .insert({
        movie_id: movieId,
        user_id: currentUser.id,
        rating: value
      });

    if (error) {
      console.error(error);
      alert("Erro ao salvar nota.");
      return;
    }
  }

  await fetchAllData();
  openMovieDetails(movieId);
}

async function toggleLike(movieId) {
  if (!currentUser) return;

  const existing = likesCache.find(
    (item) => item.movie_id === movieId && item.user_id === currentUser.id
  );

  if (existing) {
    const { error } = await supabaseClient
      .from("movie_likes")
      .delete()
      .eq("id", existing.id);

    if (error) {
      console.error(error);
      alert("Erro ao remover curtida.");
      return;
    }
  } else {
    const { error } = await supabaseClient
      .from("movie_likes")
      .insert({
        movie_id: movieId,
        user_id: currentUser.id
      });

    if (error) {
      console.error(error);
      alert("Erro ao curtir filme.");
      return;
    }
  }

  await fetchAllData();
  openMovieDetails(movieId);
}

function editMovie(id) {
  const movie = moviesCache.find((item) => item.id === id);
  if (!movie) return;

  fillMovieForm(movie);
  closeModal(movieDetailsModal);
  openModal(addMovieModal);
}

async function deleteMovie(id) {
  const ok = window.confirm("Quer mesmo apagar esse filme?");
  if (!ok) return;

  const { error } = await supabaseClient
    .from("movies")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Erro ao apagar filme.");
    return;
  }

  await fetchAllData();
  closeModal(movieDetailsModal);
}

async function searchMovieFromTMDb() {
  const query = apiMovieTitle.value.trim();

  if (!query) {
    alert("Digite um filme para buscar.");
    return;
  }

  if (!TMDB_BEARER_TOKEN || TMDB_BEARER_TOKEN.includes("COLE_SEU_TOKEN_TMDB_AQUI")) {
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
    document.getElementById("movieTmdbRating").value = movie.vote_average
      ? Number(movie.vote_average).toFixed(1)
      : "";
  } catch (error) {
    console.error(error);
    alert("Erro ao buscar filme.");
  } finally {
    searchApiBtn.disabled = false;
    searchApiBtn.textContent = "Buscar";
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
      : "";
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
  event.dataTransfer.dropEffect = "move";
  event.currentTarget.classList.add("drag-over");
}

function handleDragLeave(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;

  const isOutside =
    x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;

  if (isOutside) {
    event.currentTarget.classList.remove("drag-over");
  }
}

async function handleDropToTier(event) {
  event.preventDefault();
  event.currentTarget.classList.remove("drag-over");

  const movieId = Number(event.dataTransfer.getData("text/plain"));
  const tier = event.currentTarget.dataset.tier;

  const movie = moviesCache.find((item) => item.id === movieId);
  if (!movie) return;

  const oldTier = movie.tier;
  movie.tier = tier;
  renderTierlist();
  renderMovies();

  const { error } = await supabaseClient
    .from("movies")
    .update({ tier })
    .eq("id", movieId);

  if (error) {
    console.error(error);
    movie.tier = oldTier;
    renderTierlist();
    renderMovies();
    alert("Erro ao mover filme.");
  }
}

async function handleDropToPool(event) {
  event.preventDefault();
  event.currentTarget.classList.remove("drag-over");

  const movieId = Number(event.dataTransfer.getData("text/plain"));

  const movie = moviesCache.find((item) => item.id === movieId);
  if (!movie) return;

  const oldTier = movie.tier;
  movie.tier = null;
  renderTierlist();
  renderMovies();

  const { error } = await supabaseClient
    .from("movies")
    .update({ tier: null })
    .eq("id", movieId);

  if (error) {
    console.error(error);
    movie.tier = oldTier;
    renderTierlist();
    renderMovies();
    alert("Erro ao mover filme.");
  }
}

function friendCard(profile) {
  return `
    <article class="movie-card" onclick="showFriendLikes('${profile.id}')">
      <div class="movie-thumb">
        <img class="movie-poster" src="${avatarUrl(profile)}" alt="Avatar de ${escapeHtml(profile.username)}" />
      </div>
      <div class="movie-body">
        <h4 class="movie-title">${escapeHtml(profile.username)}</h4>
        <div class="badge-row">
          <span class="badge">@${escapeHtml(profile.username)}</span>
        </div>
      </div>
    </article>
  `;
}

function renderFriends() {
  const otherProfiles = profilesCache.filter((profile) => profile.id !== currentUser?.id);

  friendsGrid.innerHTML = otherProfiles.length
    ? otherProfiles.map(friendCard).join("")
    : `<p class="empty-state">Nenhum amigo encontrado ainda.</p>`;

  friendLikesGrid.innerHTML = `<p class="empty-state">Clique em um amigo para ver os filmes que ele curtiu.</p>`;
  friendLikesTitle.textContent = "Curtidas dos amigos";
}

function showFriendLikes(userId) {
  const profile = getProfileByUserId(userId);
  if (!profile) return;

  const likedMovieIds = likesCache
    .filter((item) => item.user_id === userId)
    .map((item) => item.movie_id);

  const likedMovies = moviesCache.filter((movie) => likedMovieIds.includes(movie.id));

  friendLikesTitle.textContent = `Filmes curtidos por ${profile.username}`;

  friendLikesGrid.innerHTML = likedMovies.length
    ? likedMovies.map(movieCard).join("")
    : `<p class="empty-state">${escapeHtml(profile.username)} ainda não curtiu nenhum filme.</p>`;
}

function showPage(page) {
  const isFilms = page === "films";
  const isTierlist = page === "tierlist";
  const isFriends = page === "friends";
  const isProfile = page === "profile";

  filmsPage.classList.toggle("hidden", !isFilms);
  tierlistPage.classList.toggle("hidden", !isTierlist);
  friendsPage.classList.toggle("hidden", !isFriends);
  profilePage.classList.toggle("hidden", !isProfile);

  filmsTabBtn.classList.toggle("active", isFilms);
  tierlistTabBtn.classList.toggle("active", isTierlist);
  friendsTabBtn.classList.toggle("active", isFriends);
  profileTabBtn.classList.toggle("active", isProfile);

  if (isTierlist) renderTierlist();
  if (isFriends) renderFriends();
}

movieForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = document.getElementById("movieTitle").value.trim();
  const year = document.getElementById("movieYear").value.trim();
  const poster = document.getElementById("moviePoster").value.trim();
  const description = document.getElementById("movieDescription").value.trim();
  const tmdbRating = document.getElementById("movieTmdbRating").value || null;

  if (!title) {
    alert("Título obrigatório.");
    return;
  }

  if (editingMovieId) {
    const { error } = await supabaseClient
      .from("movies")
      .update({
        title,
        year,
        poster,
        description,
        tmdb_rating: tmdbRating
      })
      .eq("id", editingMovieId);

    if (error) {
      console.error(error);
      alert("Erro ao editar filme.");
      return;
    }
  } else {
    const { error } = await supabaseClient
      .from("movies")
      .insert([
        {
          title,
          year,
          poster,
          description,
          watched: false,
          tier: null,
          tmdb_rating: tmdbRating
        }
      ]);

    if (error) {
      console.error(error);
      alert("Erro ao adicionar filme.");
      return;
    }
  }

  await fetchAllData();
  resetMovieForm();
  closeModal(addMovieModal);
});

async function bootstrapApp() {
  await getCurrentUser();

  if (!currentUser) {
    authPage.classList.remove("hidden");
    appShell.classList.add("hidden");
    return;
  }

  await loadCurrentProfile();
  await fetchAllData();

  renderCurrentProfileUI();
  authPage.classList.add("hidden");
  appShell.classList.remove("hidden");
  showPage("films");
}

async function checkSession() {
  await getCurrentUser();

  if (currentUser) {
    await bootstrapApp();
  } else {
    authPage.classList.remove("hidden");
    appShell.classList.add("hidden");
  }
}

searchInput.addEventListener("input", renderMovies);
sortSelect.addEventListener("change", renderMovies);
searchApiBtn.addEventListener("click", searchMovieFromTMDb);

apiMovieTitle.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchMovieFromTMDb();
  }
});

filmsTabBtn.addEventListener("click", () => showPage("films"));
tierlistTabBtn.addEventListener("click", () => showPage("tierlist"));
friendsTabBtn.addEventListener("click", () => showPage("friends"));
profileTabBtn.addEventListener("click", () => showPage("profile"));

openAddMovieBtn.addEventListener("click", () => {
  resetMovieForm();
  openModal(addMovieModal);
});

closeAddMovieModal.addEventListener("click", () => closeModal(addMovieModal));
closeMovieDetailsModal.addEventListener("click", () => closeModal(movieDetailsModal));
loginBtn.addEventListener("click", handleAuth);
loginBtn.addEventListener("click", handleAuth);

if (registerBtn) {
  registerBtn.addEventListener("click", handleAuth);
}
logoutBtn.addEventListener("click", signOut);
saveProfileBtn.addEventListener("click", saveMyProfile);

profileAvatarUrl.addEventListener("input", () => {
  profilePreviewAvatar.src = profileAvatarUrl.value.trim() || avatarUrl(currentProfile);
});

window.addEventListener("click", (event) => {
  if (event.target === addMovieModal) closeModal(addMovieModal);
  if (event.target === movieDetailsModal) closeModal(movieDetailsModal);
});

supabaseClient.auth.onAuthStateChange(async () => {
  await checkSession();
});

checkSession();

window.openMovieDetails = openMovieDetails;
window.setWatched = setWatched;
window.toggleWatched = toggleWatched;
window.setTier = setTier;
window.saveRating = saveRating;
window.toggleLike = toggleLike;
window.editMovie = editMovie;
window.deleteMovie = deleteMovie;
window.handleDragStart = handleDragStart;
window.handleDragOver = handleDragOver;
window.handleDragLeave = handleDragLeave;
window.handleDropToTier = handleDropToTier;
window.handleDropToPool = handleDropToPool;
window.showFriendLikes = showFriendLikes;