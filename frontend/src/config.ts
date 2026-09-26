const url = process.env.EXPO_PUBLIC_API_URL;
if (!url) {
  console.warn('EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env, set it, restart with -c.');
}

/** Base URL of the Spring Boot server. Never put secrets in EXPO_PUBLIC_* vars. */
export const API_URL = (url ?? 'http://localhost:8080').replace(/\/$/, '');
