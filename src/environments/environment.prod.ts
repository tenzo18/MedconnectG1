export const environment = {
  production: true,
  apiUrl: (typeof window !== 'undefined' && (window as any).__API_URL__) 
    ? (window as any).__API_URL__ 
    : 'http://194.238.25.170:5000/api'
};
