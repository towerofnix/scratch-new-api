const t = require('tap');
const APIDocument = require('../src/util/api-document');

t.test('loadAPIDetails', async t => {
    const endpoint = 'fake-endpoint';
    const responseData = {};

    let fetchCalled = false;

    const doc = new APIDocument({}, {
        fetch: url => {
            fetchCalled = true;
            t.is(url, 'https://api.scratch.mit.edu/' + endpoint);
            return Promise.resolve({
                json: () => Promise.resolve(responseData)
            });
        }
    });

    doc.getEndpoint = () => endpoint;

    await doc.loadAPIDetails();
    t.true(fetchCalled);
    t.is(doc.apiDetails, responseData);

    // Call a second time - should not do anything.
    fetchCalled = false;
    await doc.loadAPIDetails();
    t.false(fetchCalled);
    t.is(doc.apiDetails, responseData);
});

t.test('loadAPIDetails (no endpoint)', async t => {
    const doc = new APIDocument({}, {
        fetch: () => {
            throw new Error('fetch should not be called');
        }
    });

    t.throws(() => doc.getEndpoint());
    await t.rejects(() => doc.loadAPIDetails());
});

t.test('getAPIDetail', async t => {
    const animal = 'armadillo';
    const apiDetails = {animal};

    let loadCalled = false;

    const doc = new APIDocument();

    doc.loadAPIDetails = () => {
        loadCalled = true;
        doc.apiDetails = apiDetails;
    };

    const result = await doc.getAPIDetail('animal');
    t.true(loadCalled);
    t.is(result, animal);
});

t.test('getAPIDetail - details initially present', async t => {
    const animal = 'armadillo';
    const fruit = 'orange';
    const initialDetails = {animal};
    const fullDetails = {animal, fruit};

    const doc = new APIDocument(initialDetails);

    doc.loadAPIDetails = () => {
        throw new Error('loadAPIDetails should not be called');
    };

    const result1 = await doc.getAPIDetail('animal');
    t.is(result1, animal);

    // Calling with a new property SHOULD call loadAPIDetails though.

    let loadCalled = false;

    doc.loadAPIDetails = () => {
        loadCalled = true;
        doc.apiDetails = fullDetails;
    };

    const result2 = await doc.getAPIDetail('fruit');
    t.true(loadCalled);
    t.is(result2, fruit);
});
