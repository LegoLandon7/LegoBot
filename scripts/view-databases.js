const db = require('./init-databases.js');
console.table(db.prepare('SELECT * FROM prefixes').all());