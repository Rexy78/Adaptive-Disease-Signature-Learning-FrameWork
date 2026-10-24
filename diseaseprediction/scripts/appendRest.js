const fs = require('fs');

const closeString = `\`;\n`;
fs.appendFileSync('./src/data/nhanesData.ts', closeString, 'utf8');
console.log('Finished closing NHANES string');
