const fs = require('fs');
const path = require('path');

// Chemin vers le fichier index.html généré
const indexPath = path.join(__dirname, 'dist/web-admin/browser/index.html');

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Remplacer {{API_URL}} par la variable d'environnement
  const apiUrl = process.env.API_URL || 'http://194.238.25.170:5000/api';
  content = content.replace('{{API_URL}}', apiUrl);
  
  fs.writeFileSync(indexPath, content);
  console.log('✅ Variable API_URL injectée:', apiUrl);
} else {
  console.log('❌ Fichier index.html non trouvé');
}