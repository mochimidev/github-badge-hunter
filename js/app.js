/**
 * App Controller - Orchestrates user interaction, API requests, calculation, and UI updates.
 */

import { 
  fetchUserProfile, 
  fetchUserRepositories, 
  fetchMergedPullRequests, 
  rateLimitState,
  GitHubApiError 
} from './api.js';

import { 
  calculateStarstruckProgress, 
  calculatePullSharkProgress, 
  getTopStarredRepos 
} from './calculator.js';

import { 
  showLoading, 
  hideLoading, 
  showError, 
  hideError, 
  renderUserProfile, 
  renderBadges, 
  renderTopRepos, 
  renderRateLimit 
} from './ui.js';

// Local storage key for optional GitHub token
const STORAGE_KEY_TOKEN = 'gh_badge_hunter_token';

// Elements
const searchForm = document.getElementById('search-form');
const usernameInput = document.getElementById('username-input');
const btnSearch = document.getElementById('btn-search');
const alertClose = document.getElementById('alert-close');
const btnToggleToken = document.getElementById('btn-toggle-token');
const tokenBox = document.getElementById('token-box');
const inputToken = document.getElementById('input-token');
const btnSaveToken = document.getElementById('btn-save-token');
const btnClearToken = document.getElementById('btn-clear-token');
const tokenStatus = document.getElementById('token-status');
const quickTags = document.querySelectorAll('.quick-tag');

/**
 * Retrieves the stored Personal Access Token if any.
 * @returns {string|null}
 */
function getActiveToken() {
  return localStorage.getItem(STORAGE_KEY_TOKEN) || null;
}

/**
 * Main search handler.
 * @param {string} username 
 */
async function searchDeveloper(username) {
  const cleanUsername = username.trim();
  if (!cleanUsername) {
    showError('Campo requerido', 'Por favor ingresa un nombre de usuario de GitHub válido.', true);
    return;
  }

  const token = getActiveToken();

  try {
    showLoading(`Consultando datos de @${cleanUsername}...`);
    btnSearch.disabled = true;

    // Fetch user profile first (validates existence and basic info)
    const profile = await fetchUserProfile(cleanUsername, token);

    // Parallel fetch for repos and merged pull requests
    const [repos, prsResponse] = await Promise.all([
      fetchUserRepositories(cleanUsername, token),
      fetchMergedPullRequests(cleanUsername, token)
    ]);

    // Update rate limit counter in UI
    renderRateLimit(rateLimitState.remaining, rateLimitState.limit);

    // Calculate badge progress
    const starstruckData = calculateStarstruckProgress(repos);
    const pullsharkData = calculatePullSharkProgress(prsResponse.total_count);
    const topRepos = getTopStarredRepos(repos);

    // Render results
    hideLoading();
    renderUserProfile(profile);
    renderBadges(starstruckData, pullsharkData);
    renderTopRepos(topRepos);

  } catch (error) {
    hideLoading();
    renderRateLimit(rateLimitState.remaining, rateLimitState.limit);

    if (error instanceof GitHubApiError) {
      if (error.status === 404) {
        showError('Usuario no encontrado', `No se encontró ningún usuario de GitHub con el nombre "@${cleanUsername}". Verifica que esté bien escrito.`);
      } else if (error.status === 403) {
        showError('Límite de API excedido', error.message, true);
      } else {
        showError('Error de consulta', error.message);
      }
    } else {
      console.error('Error inesperado:', error);
      showError('Error inesperado', 'Ocurrió un error inesperado al procesar la información. Intenta de nuevo.');
    }
  } finally {
    btnSearch.disabled = false;
  }
}

/**
 * Initialize event listeners and application state.
 */
function init() {
  // Form submission
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    searchDeveloper(usernameInput.value);
  });

  // Quick preset buttons
  quickTags.forEach(btn => {
    btn.addEventListener('click', () => {
      const user = btn.getAttribute('data-user');
      usernameInput.value = user;
      searchDeveloper(user);
    });
  });

  // Alert close button
  if (alertClose) {
    alertClose.addEventListener('click', hideError);
  }

  // Token management UI
  const savedToken = getActiveToken();
  if (savedToken) {
    inputToken.value = savedToken;
    tokenStatus.textContent = 'Token activo cargado desde almacenamiento local.';
    tokenStatus.style.color = '#3fb950';
  }

  btnToggleToken.addEventListener('click', () => {
    tokenBox.classList.toggle('hidden');
  });

  btnSaveToken.addEventListener('click', () => {
    const val = inputToken.value.trim();
    if (val) {
      localStorage.setItem(STORAGE_KEY_TOKEN, val);
      tokenStatus.textContent = 'Token guardado con éxito. Se usará en tus próximas búsquedas.';
      tokenStatus.style.color = '#3fb950';
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      tokenStatus.textContent = 'Token eliminado.';
      tokenStatus.style.color = '#8b949e';
    }
  });

  btnClearToken.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    inputToken.value = '';
    tokenStatus.textContent = 'Token eliminado de la memoria local.';
    tokenStatus.style.color = '#8b949e';
  });
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
