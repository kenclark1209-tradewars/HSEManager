// Static smoke checks; run: node source/test_app.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');
const here = __dirname;
const html = fs.readFileSync(path.join(here, '..', 'index.html'), 'utf8');
const m = html.match(/<script id="app-data" type="application\\/json">([\\s\\S]*?)<\\/script>/);
assert(m, 'App data not found in offline HTML');
const data = JSON.parse(m[1]);
assert.equal(data.tasks.length, 35, 'Procedure count');
assert(data.sources.length >= 20, 'Legal source count');
assert(data.templates.length >= 10, 'Template count');
assert(data.tasks.every(t => Array.isArray(t.steps) && t.steps.length > 0), 'Every task needs steps');
const scripts = [...html.matchAll(/<script>([\\s\\S]*?)<\\/script>/g)];
assert(scripts.length, 'Application script not found');
scripts.forEach(x => new vm.Script(x[1]));
console.log('PASS', data.tasks.length, 'procedures,', data.sources.length, 'sources');
