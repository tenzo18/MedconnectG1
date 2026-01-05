export const environment = {
  production: true,
  apiUrl: (typeof window !== 'undefined' && (window as any).__API_URL__) 
    ? (window as any).__API_URL__ 
    : (typeof process !== 'undefined' && process.env?.['API_URL']) 
    ? process.env['API_URL']
    : 'http://194.238.25.170:5000/api'
};
