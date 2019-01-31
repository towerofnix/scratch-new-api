const t = require('tap');
const Project = require('../src/project');

const { makeTestDetailFunction } = require('./helper/util');

t.test('API endpoint', t => {
    const id = 1;

    const project = new Project({id});

    t.is(project.getEndpoint(), 'projects/' + id);
    t.done();
});

t.test('_getDate', async t => {
    const fakeDate = '2019-01-31T00:00:00.000Z';
    const history = {fakeDate};

    const project = new Project({id: 1});

    let getAPIDetailCalled = false;

    project.getAPIDetail = key => {
        getAPIDetailCalled = true;
        t.is(key, 'history');
        return Promise.resolve(history);
    };

    const result = await project._getDate('fakeDate');
    t.true(getAPIDetailCalled);
    t.true(result instanceof Date);
    t.is(result.toISOString(), fakeDate);
});

t.test('_getDate-based API details', async t => {
    const project = new Project({id: 1});

    let expectedKey;
    let calledGetDate;

    project._getDate = key => {
        calledGetDate = true;
        t.is(key, expectedKey);
        return Promise.resolve(new Date());
    };

    const testDateDetail = async (key, func) => {
        expectedKey = key;
        calledGetDate = false;
        const result = await func.call(project);
        t.true(calledGetDate);
        t.true(result instanceof Date);
    };

    await testDateDetail('created', project.getDateCreated);
    await testDateDetail('modified', project.getDateModified);
    await testDateDetail('shared', project.getDateShared);
});

t.test('Basic API details', async t => {
    const id = 1;
    const title = 'Our Project';
    const username = 'mres';
    const description = 'Apple banana.';
    const instructions = 'Space bar!';
    const stats = {views: 100, loves: 8, favorites: 6, comments: 23, remixes: 2};
    const image = 'https://example.com';

    const apiDetails = {
        id,
        title,
        description,
        instructions,
        author: {
            username
        },
        stats,
        image
    };

    const project = new Project({id});

    const testDetail = makeTestDetailFunction(t, project, apiDetails);

    t.is(await testDetail('id', project.getID), id);
    t.is(await testDetail('title', project.getTitle), title);
    t.is(await testDetail('author', project.getAuthor), username);
    t.is(await testDetail('instructions', project.getInstructions), instructions);
    t.is(await testDetail('description', project.getNotesAndCredits), description);
    t.match(await testDetail('stats', project.getStats), stats);
    t.is(await testDetail('image', project.getThumbnailURL), image);
});
