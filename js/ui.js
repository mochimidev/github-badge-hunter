/**
 * UI Module - Handles DOM rendering, UI updates, error alerts, and progress animations.
 */

// Cache DOM Elements
const elements = {
  resultsContainer: document.getElementById('results-container'),
  profileCard: document.getElementById('user-profile-card'),
  loadingSpinner: document.getElementById('loading-spinner'),
  loadingText: document.getElementById('loading-text'),
  alertBanner: document.getElementById('alert-banner'),
  alertTitle: document.getElementById('alert-title'),
  alertMessage: document.getElementById('alert-message'),
  rateRemaining: document.getElementById('rate-remaining'),
  rateLimit: document.getElementById('rate-limit'),

  // Starstruck card elements
  cardStarstruck: document.getElementById('card-starstruck'),
  starstruckPill: document.getElementById('starstruck-status-pill'),
  starstruckPercent: document.getElementById('starstruck-percent'),
  starstruckBar: document.getElementById('starstruck-bar'),
  starstruckCurrent: document.getElementById('starstruck-current'),
  starstruckTarget: document.getElementById('starstruck-target'),
  starstruckTip: document.getElementById('starstruck-tip'),

  // Pull Shark card elements
  cardPullshark: document.getElementById('card-pullshark'),
  pullsharkPill: document.getElementById('pullshark-status-pill'),
  pullsharkPercent: document.getElementById('pullshark-percent'),
  pullsharkBar: document.getElementById('pullshark-bar'),
  pullsharkCurrent: document.getElementById('pullshark-current'),
  pullsharkTarget: document.getElementById('pullshark-target'),
  pullsharkTip: document.getElementById('pullshark-tip'),

  // Repositories list
  topReposList: document.getElementById('top-repos-list'),
};

/**
 * Show error or warning banner.
 * @param {string} title 
 * @param {string} message 
 * @param {boolean} isWarning 
 */
export function showError(title, message, isWarning = false) {
  elements.alertTitle.textContent = title;
  elements.alertMessage.textContent = message;

  if (isWarning) {
    elements.alertBanner.classList.add('warning');
  } else {
    elements.alertBanner.classList.remove('warning');
  }

  elements.alertBanner.classList.remove('hidden');
}

/**
 * Hide alert banner.
 */
export function hideError() {
  elements.alertBanner.classList.add('hidden');
}

/**
 * Display loading state.
 * @param {string} text 
 */
export function showLoading(text = 'Consultando la API de GitHub...') {
  hideError();
  elements.loadingText.textContent = text;
  elements.loadingSpinner.classList.remove('hidden');
  elements.resultsContainer.classList.add('hidden');
}

/**
 * Hide loading state.
 */
export function hideLoading() {
  elements.loadingSpinner.classList.add('hidden');
}

/**
 * Updates API rate limit display indicator.
 * @param {number|null} remaining 
 * @param {number|null} limit 
 */
export function renderRateLimit(remaining, limit) {
  if (remaining !== null && elements.rateRemaining) {
    elements.rateRemaining.textContent = remaining;
  }
  if (limit !== null && elements.rateLimit) {
    elements.rateLimit.textContent = limit;
  }
}

/**
 * Renders the GitHub user profile card.
 * @param {object} profile 
 */
export function renderUserProfile(profile) {
  const name = profile.name || profile.login;
  const bio = profile.bio ? `<p class="profile-bio">${escapeHTML(profile.bio)}</p>` : '';
  const location = profile.location ? `<span>📍 ${escapeHTML(profile.location)}</span>` : '';
  const company = profile.company ? `<span>🏢 ${escapeHTML(profile.company)}</span>` : '';

  elements.profileCard.innerHTML = `
    <div class="profile-avatar-wrapper">
      <img src="${profile.avatar_url}" alt="${profile.login}" class="profile-avatar" />
    </div>
    <div class="profile-info">
      <div class="profile-names">
        <h2 class="profile-name">${escapeHTML(name)}</h2>
        <a href="${profile.html_url}" target="_blank" rel="noopener noreferrer" class="profile-username">
          @${escapeHTML(profile.login)} ↗
        </a>
      </div>
      ${bio}
      <div class="profile-meta-row">
        <div class="profile-stat-badge">
          <span>📦 Repos Públicos:</span> <strong>${profile.public_repos}</strong>
        </div>
        <div class="profile-stat-badge">
          <span>👥 Seguidores:</span> <strong>${profile.followers}</strong>
        </div>
        ${location}
        ${company}
      </div>
    </div>
  `;
}

/**
 * Renders the calculated progress and unlock state for both badges.
 * @param {object} starstruckData 
 * @param {object} pullsharkData 
 */
export function renderBadges(starstruckData, pullsharkData) {
  // Render Starstruck
  elements.starstruckCurrent.textContent = starstruckData.current;
  elements.starstruckTarget.textContent = starstruckData.target;
  elements.starstruckPercent.textContent = `${starstruckData.percentage}%`;
  elements.starstruckBar.style.width = `${starstruckData.clampedPercentage}%`;
  elements.starstruckTip.textContent = starstruckData.statusText;

  if (starstruckData.isUnlocked) {
    elements.cardStarstruck.classList.add('unlocked');
    elements.starstruckPill.className = 'status-pill unlocked';
    elements.starstruckPill.textContent = 'Desbloqueado';
    elements.starstruckTip.classList.add('achieved');
  } else {
    elements.cardStarstruck.classList.remove('unlocked');
    elements.starstruckPill.className = 'status-pill locked';
    elements.starstruckPill.textContent = 'Bloqueado';
    elements.starstruckTip.classList.remove('achieved');
  }

  // Render Pull Shark
  elements.pullsharkCurrent.textContent = pullsharkData.current;
  elements.pullsharkTarget.textContent = pullsharkData.target;
  elements.pullsharkPercent.textContent = `${pullsharkData.percentage}%`;
  elements.pullsharkBar.style.width = `${pullsharkData.clampedPercentage}%`;
  elements.pullsharkTip.textContent = pullsharkData.statusText;

  if (pullsharkData.isUnlocked) {
    elements.cardPullshark.classList.add('unlocked');
    elements.pullsharkPill.className = 'status-pill unlocked';
    elements.pullsharkPill.textContent = 'Desbloqueado';
    elements.pullsharkTip.classList.add('achieved');
  } else {
    elements.cardPullshark.classList.remove('unlocked');
    elements.pullsharkPill.className = 'status-pill locked';
    elements.pullsharkPill.textContent = 'Bloqueado';
    elements.pullsharkTip.classList.remove('achieved');
  }

  elements.resultsContainer.classList.remove('hidden');
}

/**
 * Renders the list of top starred repositories contributing to Starstruck.
 * @param {Array} topRepos 
 */
export function renderTopRepos(topRepos = []) {
  if (!topRepos || topRepos.length === 0) {
    elements.topReposList.innerHTML = `<p class="no-repos-msg">Este usuario no tiene repositorios con estrellas públicas aún.</p>`;
    return;
  }

  const itemsHTML = topRepos.map(repo => `
    <div class="repo-item">
      <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-name" title="${repo.name}">
        <span>📁 ${escapeHTML(repo.name)}</span>
      </a>
      <span class="repo-stars">⭐ ${repo.stargazers_count}</span>
    </div>
  `).join('');

  elements.topReposList.innerHTML = itemsHTML;
}

/**
 * Basic HTML escaping utility for sanitizing user inputs.
 * @param {string} str 
 * @returns {string}
 */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
