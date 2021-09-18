let pegjs = require('pegjs');
let code = require('./parser.peg.js');

module.exports = pegjs.generate(code, {
    allowedStartRules: ['document', 'style']
});