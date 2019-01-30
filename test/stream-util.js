const tap = require('tap');
const StreamUtil = require('../src/util/stream-util');

tap.test('basicStream', async t => {
    const data = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        []
    ];

    const generator = StreamUtil.basicStream(() => {
        return data.shift();
    });

    let counter = 0;
    for await (const x of generator) {
        counter++;
        t.is(x, counter);
    }
    t.is(counter, 9);
});

tap.test('apiStream', async t => {
    const data = [
        [{x: 'A'}, {x: 'B'}, {x: 'C'}],
        [{x: 'D'}, {x: 'E'}, {x: 'F'}],
        []
    ];

    const baseEndpoint = 'fake-endpoint';
    const pageSize = 3;

    let callCounter = 0;

    const generator = StreamUtil.apiStream({
        baseEndpoint,
        transformResult: result => result.x,
        pageSize,
        fetch: url => {
            const page = data[callCounter];
            t.is(url, `https://api.scratch.mit.edu/${baseEndpoint}?offset=${callCounter * pageSize}&limit=${pageSize}`);
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

tap.test('userStream', async t => {
    const baseEndpoint = 'fake-endpoint';
    const generator = {};

    let apiCalled = false;

    const result = StreamUtil.userStream(baseEndpoint, {
        apiStream: (config) => {
            apiCalled = true;
            t.match(config, {baseEndpoint});
            t.match(config.transformResult({username: 'Armadillo'}), {username: 'Armadillo'});
            return generator;
        }
    });

    t.true(apiCalled);
    t.is(result, generator);
});

tap.test('projectStream', async t => {
    const baseEndpoint = 'fake-endpoint';
    const generator = {};

    let apiCalled = false;

    const result = StreamUtil.projectStream(baseEndpoint, {
        apiStream: (config) => {
            apiCalled = true;
            t.match(config, {baseEndpoint});
            t.match(config.transformResult({id: 123, title: 'Apple'}), {id: 123, title: 'Apple'});
            return generator;
        }
    });

    t.true(apiCalled);
    t.is(result, generator);
});
