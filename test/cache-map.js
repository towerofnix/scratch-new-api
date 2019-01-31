const t = require('tap');
const CacheMap = require('../src/util/cache-map');

t.test('get', async t => {
    const key = 'fake-key';
    const entry = {};

    let createEntryCalled = true;

    const cacheMap = new CacheMap(passedKey => {
        createEntryCalled = true;
        t.match(passedKey, key);
        return entry;
    });

    const result1 = await cacheMap.get(key);
    t.true(createEntryCalled);
    t.is(result1, entry);

    // Calling it again should reuse the same value.
    createEntryCalled = false;
    const result2 = await cacheMap.get(key);
    t.false(createEntryCalled);
    t.is(result2, result1);
});
