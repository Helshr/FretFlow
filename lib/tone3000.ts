const AUTH_URL = 'https://www.tone3000.com/api/v1/oauth/authorize';
const TOKEN_URL = 'https://www.tone3000.com/api/v1/oauth/token';

export const toneRedirectUri = () => `${window.location.origin}/tone/callback`;

function clientId() {
  const value = process.env.NEXT_PUBLIC_TONE3000_CLIENT_ID;
  if (!value) throw new Error('Missing NEXT_PUBLIC_TONE3000_CLIENT_ID');
  return value;
}

function randomToken(bytes = 32) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return btoa(String.fromCharCode(...data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function challenge(verifier: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function startToneSelection() {
  const verifier = randomToken(48);
  const state = randomToken(24);
  sessionStorage.setItem('t3k_code_verifier', verifier);
  sessionStorage.setItem('t3k_state', state);
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: toneRedirectUri(),
    response_type: 'code',
    code_challenge: await challenge(verifier),
    code_challenge_method: 'S256',
    state,
    prompt: 'select_tone',
    format: 'nam',
    architecture: '2',
    preview: 'true',
    menubar: 'true',
  });
  // 外部 OAuth 授权跳转（Tone3000），非站内页面，无需 router/redirect
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`${AUTH_URL}?${params}`);
}

export async function completeToneAuthorization(code: string, state: string) {
  if (state !== sessionStorage.getItem('t3k_state')) throw new Error('Tone3000 OAuth state mismatch');
  const verifier = sessionStorage.getItem('t3k_code_verifier');
  if (!verifier) throw new Error('Tone3000 PKCE verifier is missing');
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: toneRedirectUri(),
      client_id: clientId(),
    }),
  });
  if (!response.ok) throw new Error(`Tone3000 token exchange failed (${response.status})`);
  const token = await response.json();
  sessionStorage.setItem('t3k_access_token', token.access_token);
  if (token.refresh_token) sessionStorage.setItem('t3k_refresh_token', token.refresh_token);
  sessionStorage.removeItem('t3k_code_verifier');
  sessionStorage.removeItem('t3k_state');
  return token.access_token as string;
}

export function getToneToken() {
  return typeof window === 'undefined' ? null : sessionStorage.getItem('t3k_access_token');
}

export async function toneFetch(path: string) {
  const token = getToneToken();
  if (!token) throw new Error('Connect Tone3000 first');
  const response = await fetch(`https://www.tone3000.com/api/v1/${path}`, {
    headers: {Authorization: `Bearer ${token}`},
  });
  if (!response.ok) throw new Error(`Tone3000 request failed (${response.status})`);
  return response.json();
}

export async function downloadToneModel(url: string) {
  const token = getToneToken();
  if (!token) throw new Error('Connect Tone3000 first');
  const response = await fetch(url, {headers: {Authorization: `Bearer ${token}`} });
  if (!response.ok) throw new Error(`Model download failed (${response.status})`);
  return response.blob();
}
