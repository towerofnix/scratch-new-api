// Suspicious of imminent node-fetch?
// Run tap with these arguments:
// --node-arg=-r --node-arg=./test/helper/fetch-hack.js
// (Or npm run test:fetch.)

/* eslint no-console: 0 */

const Module = require('module');

const verbose = true;

let fetchWasCalled = false;
let fetchRequireCounter = 0;

const originalRequire = Module.prototype.require;
Module.prototype.require = function(...args) {
    const result = originalRequire.apply(this, args);

    if (args[0] === 'node-fetch') {
        fetchRequireCounter++;
        return function() {
            fetchWasCalled = true;
            throw new Error('Unit tests should never call node-fetch!');
        };
    }

    return result;
};

process.on('exit', () => {
    if (verbose) {
        console.log('Fetch was required this many times:', fetchRequireCounter);
        console.log('(That is normal. It means we intercepted that many fetch functions.)');
    }
    if (fetchWasCalled) {
        console.log(
            '\x1b[31;1mFetch was called! This is a problem.\x1b[0;31m' +
            ' You should investigate the stack trace to find out why fetch was called.\x1b[0m'
        );
    } else {
        if (verbose) {
            console.log('\x1b[32mFetch was not called. Success!\x1b[0m');
        }
    }
});
