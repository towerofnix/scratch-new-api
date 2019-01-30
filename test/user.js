const t = require('tap');
const User = require('../src/user');

t.test('API endpoint', t => {
    const username = 'fake-username';

    const user = new User({username});

    t.is(user.getEndpoint(), 'users/' + username);
    t.done();
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

t.test('Stream functions', t => {
    const username = 'fake-username';
    const userGenerator = {};
    const projectGenerator = {};

    let passedEndpoint;

    const user = new User({
        username,
        StreamUtil: {
            userStream: baseEndpoint => {
                passedEndpoint = baseEndpoint;
                return userGenerator;
            },
            projectStream: baseEndpoint => {
                passedEndpoint = baseEndpoint;
                return projectGenerator;
            }
        }
    });

    t.is(user.getFollowing(), userGenerator);
    t.is(passedEndpoint, `users/${username}/following`);

    t.is(user.getFollowers(), userGenerator);
    t.is(passedEndpoint, `users/${username}/followers`);

    t.is(user.getSharedProjects(), projectGenerator);
    t.is(passedEndpoint, `users/${username}/projects`);

    t.done();
});
