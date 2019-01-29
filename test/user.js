const t = require('tap');
const User = require('../src/user');

t.test('loadAPIDetails', async t => {
    const username = 'fake-username';
    const responseData = {username};

    let fetchCalled = false;

    const user = new User({
        username,
        fetch: url => {
            fetchCalled = true;
            t.is(url, 'https://api.scratch.mit.edu/users/' + username);
            return Promise.resolve({
                json: () => Promise.resolve(responseData)
            });
        }
    });

    await user.loadAPIDetails();
    t.true(fetchCalled);
    t.is(user.apiDetails, responseData);

    // Call a second time - should not do anything.
    fetchCalled = false;
    await user.loadAPIDetails();
    t.false(fetchCalled);
    t.is(user.apiDetails, responseData);
});

t.test('getAPIDetail', async t => {
    const passedUsername = 'fake-passed-username';
    const trueUsername = 'fake-true-username';
    const apiDetails = {username: trueUsername};

    let loadCalled = false;

    const user = new User({username: passedUsername});

    user.loadAPIDetails = () => {
        loadCalled = true;
        user.apiDetails = apiDetails;
    };

    const result = await user.getAPIDetail('username');
    t.true(loadCalled);
    t.is(result, trueUsername);
});

t.test('Basic API details', async t => {
    const id = 1;
    const username = 'fake-username';
    const scratchteam = false;
    const joined = '2000-01-01T00:00:00.000Z';
    const status = 'Hello!';
    const bio = 'Working on writing an API interface.';
    const country = 'Canada';

    const apiDetails = {
        id,
        username,
        scratchteam,
        history: {
            joined
        },
        profile: {
            status,
            bio,
            country
        }
    };

    const user = new User({username: 'fake-passed-username'});

    t.is(await testDetail('id', user.getID), id);
    t.is(await testDetail('username', user.getUsername), username);
    t.is(await testDetail('scratchteam', user.getScratchTeamStatus), scratchteam);

    const resultDate = await testDetail('history', user.getJoinDate);
    t.true(resultDate instanceof Date);
    t.is(resultDate.getTime(), new Date(joined).getTime());

    t.is(await testDetail('profile', user.getStatus), status);
    t.is(await testDetail('profile', user.getBio), bio);
    t.is(await testDetail('profile', user.getCountry), country);

    async function testDetail(expectedKey, func) {
        let getCalled = false;


        user.getAPIDetail = key => {
            getCalled = true;
            t.is(key, expectedKey);
            return apiDetails[expectedKey];
        };

        const result = await func.call(user);
        t.true(getCalled);
        return result;
    }
});
