export const MessagerieConfig = {
  // Intervalles de rafraîchissement (en millisecondes)
  REFRESH_INTERVAL: 120000, // 2 minutes pour éviter le rate limiting
  SOCKET_RECONNECT_DELAY: 2000, // 2 secondes
  SOCKET_RECONNECT_MAX_DELAY: 10000, // 10 secondes max
  SOCKET_RECONNECT_ATTEMPTS: 10,
  
  // Retry avec backoff exponentiel
  RETRY_BASE_DELAY: 1000, // 1 seconde
  RETRY_MAX_ATTEMPTS: 5,
  
  // Timeouts
  HTTP_TIMEOUT: 30000, // 30 secondes
  SOCKET_TIMEOUT: 20000, // 20 secondes
  
  // Pagination
  MESSAGES_PER_PAGE: 50,
  CONVERSATIONS_PER_PAGE: 20,
  
  // Cache
  CACHE_TTL: 300000, // 5 minutes
  
  // Messages d'erreur
  ERROR_MESSAGES: {
    RATE_LIMIT: 'Trop de requêtes. Veuillez patienter quelques instants.',
    NETWORK_ERROR: 'Problème de connexion. Vérifiez votre connexion internet.',
    SERVER_ERROR: 'Serveur temporairement indisponible. Nouvelle tentative automatique...',
    AUTH_ERROR: 'Session expirée. Veuillez vous reconnecter.',
    NOT_FOUND: 'Conversation non trouvée.',
    SOCKET_ERROR: 'Connexion temps réel indisponible. Les messages seront synchronisés automatiquement.'
  }
};