// view-databases.js -> View database contents
// Landon Lego
// Last updated 2/6/2026

const db = require('./init-databases.js');
console.table(db.prepare('SELECT * FROM prefixes').all());