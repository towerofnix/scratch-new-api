const tap = require('tap');
const streamUtil = require('../src/util/stream-util');

tap.test('basicStreamUtil', async t => {
    const data = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        []
    ];

    const generator = streamUtil.basicStreamUtil(() => {
        return data.shift();
    });

    let counter = 0;
    for await (const x of generator) {
        counter++;
        t.is(x, counter);
    }
    t.is(counter, 9);
});

tap.test('apiStreamUtil', async t => {
    const data = [
        [{x: 'A'}, {x: 'B'}, {x: 'C'}],
        [{x: 'D'}, {x: 'E'}, {x: 'F'}],
        []
    ];

    const baseEndpoint = 'fake-endpoint';
    const pageSize = 3;

    let callCounter = 0;

    const generator = streamUtil({
        baseEndpoint,
        transformResult: result => result.x,
        pageSize,
        fetch: url => {
            const page = data[callCounter];
            t.is(url, `https://api.scratch.mit.edu/${baseEndpoint}?offset=${callCounter * pageSize}&count=${pageSize}`);
            callCounter++;

            return Promise.resolve({
                json: () => Promise.resolve(page)
            });
        }
    });

    let resultCounter = 0;
    for await (const letter of generator) {
        t.is(letter, 'ABCDEF'[resultCounter]);
        resultCounter++;
    }

    t.is(callCounter, data.length);
    t.is(resultCounter, 6);
});

tap.test('users', async t => {
    const baseEndpoint = 'fake-endpoint';
    const generator = {};

    let apiCalled = false;

    const result = streamUtil.users(baseEndpoint, {
        apiStreamUtil: (config) => {
            apiCalled = true;
            t.match(config, {baseEndpoint});
            t.is(config.transformResult({username: 'Armadillo'}), 'Armadillo');
            return generator;
        }
    });

    t.true(apiCalled);
    t.is(result, generator);
});
