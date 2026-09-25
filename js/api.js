/**
 * API Module - Handles GitHub REST API requests with rate limit and error handling.
 */

const BASE_URL = 'https://api.github.com';

/**
 * Custom error class for GitHub API responses.
 */
export class GitHubApiError extends Error {
  constructor(message, status, resetTime = null) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.resetTime = resetTime;
  }
}

/**
 * Builds HTTP headers, attaching token if provided.
 * @param {string|null} token
 * @returns {HeadersInit}
 */
function getHeaders(token = null) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token && token.trim()) {
    headers['Authorization'] = `token ${token.trim()}`;
  }
  return headers;
}

/**
 * Tracks rate limit info from response headers.
 */
export const rateLimitState = {
  remaining: null,
  limit: null,
  reset: null,
};

/**
 * Updates rate limit metadata from response.
 * @param {Response} response 
 */
function updateRateLimitInfo(response) {
  const remaining = response.headers.get('x-ratelimit-remaining');
  const limit = response.headers.get('x-ratelimit-limit');
  const reset = response.headers.get('x-ratelimit-reset');

  if (remaining !== null) rateLimitState.remaining = parseInt(remaining, 10);
  if (limit !== null) rateLimitState.limit = parseInt(limit, 10);
  if (reset !== null) rateLimitState.reset = parseInt(reset, 10);
}

/**
 * Helper to perform fetch and handle HTTP errors gracefully.
 * @param {string} endpoint 
 * @param {string|null} token 
 * @returns {Promise<any>}
 */
async function fetchFromGitHub(endpoint, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  let response;

  try {
    response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(token),
    });
  } catch (networkError) {
    throw new GitHubApiError('No se pudo conectar con la API de GitHub. Revisa tu conexión a internet.', 0);
  }

  updateRateLimitInfo(response);

  if (!response.ok) {
    if (response.status === 404) {
      throw new GitHubApiError('El usuario especificado no existe en GitHub.', 404);
    }
    if (response.status === 403) {
      const resetDate = rateLimitState.reset ? new Date(rateLimitState.reset * 1000).toLocaleTimeString() : 'más tarde';
      throw new GitHubApiError(
        `Se ha excedido el límite de peticiones (rate limit) de la API pública de GitHub. Intenta de nuevo a las ${resetDate} o añade un Token Personal en la barra superior.`,
        403,
        rateLimitState.reset
      );
    }
    if (response.status === 401) {
      throw new GitHubApiError('El Personal Access Token proporcionado no es válido o ha expirado.', 401);
    }

    const errorBody = await response.json().catch(() => ({}));
    throw new GitHubApiError(
      errorBody.message || `Error en la solicitud a GitHub (Código ${response.status}).`,
      response.status
    );
  }

  return response.json();
}

/**
 * Fetches GitHub user profile data.
 * @param {string} username 
 * @param {string|null} token 
 * @returns {Promise<object>}
 */
export async function fetchUserProfile(username, token = null) {
  const sanitizedUser = encodeURIComponent(username.trim());
  return fetchFromGitHub(`/users/${sanitizedUser}`, token);
}

/**
 * Fetches all public repositories for a user (paginating up to 100 repos per page).
 * @param {string} username 
 * @param {string|null} token 
 * @returns {Promise<Array>}
 */
export async function fetchUserRepositories(username, token = null) {
  const sanitizedUser = encodeURIComponent(username.trim());
  // Fetch up to 100 repositories owned by this user
  return fetchFromGitHub(`/users/${sanitizedUser}/repos?per_page=100&type=owner&sort=updated`, token);
}

/**
 * Fetches merged pull requests created by the user.
 * Pull Shark requires merged PRs.
 * GitHub Search API allows querying PRs by author and state.
 * @param {string} username 
 * @param {string|null} token 
 * @returns {Promise<{ total_count: number, items: Array }>}
 */
export async function fetchMergedPullRequests(username, token = null) {
  const sanitizedUser = encodeURIComponent(username.trim());
  const query = encodeURIComponent(`type:pr author:${sanitizedUser} is:merged`);
  return fetchFromGitHub(`/search/issues?q=${query}&per_page=10`, token);
}
