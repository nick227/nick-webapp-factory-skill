const fs = require('fs');

const files = [
  'c:/wamp64/www/nick-webapp-factory-skill/references/documentation-phase.md',
  'c:/wamp64/www/nick-webapp-factory-skill/references/admin-pipeline.md'
];

files.forEach(f => {
  let text = fs.readFileSync(f, 'utf8');
  text = text.replace(/â€”/g, '—');
  text = text.replace(/â†’/g, '→');
  text = text.replace(/â€œ/g, '"');
  text = text.replace(/â€/g, '"');
  fs.writeFileSync(f, text, 'utf8');
});
console.log('Encoding fixed.');
