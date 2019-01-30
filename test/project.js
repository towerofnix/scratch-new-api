const t = require('tap');
const Project = require('../src/project');

const { makeTestDetailFunction } = require('./helper/util');

t.test('API endpoint', t => {
    const id = 1;

    const project = new Project({id});

    t.is(project.getEndpoint(), 'projects/' + id);
    t.done();
});

t.test('Basic API details', async t => {
    const id = 1;
    const title = 'Our Project';
    const username = 'mres';

    const apiDetails = {
        id,
        title,
        author: {
            username
        }
    };

    const project = new Project({id});

    const testDetail = makeTestDetailFunction(t, project, apiDetails);

    t.is(await testDetail('id', project.getID), id);
    t.is(await testDetail('title', project.getTitle), title);
    t.is(await testDetail('author', project.getAuthor), username);
});
