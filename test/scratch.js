const t = require('tap');
const Scratch = require('../src/index');

t.test('login', async t => {
    const username = 'fake-username';
    const password = 'fake-password';
    const sessionID = 'fake-sessionID';
    const apiToken = 'fake-apiToken';
    const csrfToken = 'a'; // XXX: Hard-coded in main file!
    const loginSession = {username, sessionID, apiToken, csrfToken};

    let fetchCalled = false;
    let makeLoginSessionCalled = false;
    let fetchAPITokenCalled = false;

    const scratch = new Scratch({
        fetch: (url, config) => {
            fetchCalled = true;
            t.is(url, 'https://scratch.mit.edu/login/');
            t.match(JSON.parse(config.body), {username, password});
            return Promise.resolve({
                json: () => Promise.resolve(
                    [
                        {success: true, username}
                    ]
                ),
                headers: {
                    get: header => {
                        return {
                            'set-cookie': 'scratchsessionsid=' + sessionID
                        }[header];
                    }
                }
            });
        },

        makeLoginSession: (...args) => {
            makeLoginSessionCalled = true;
            t.match(args, [username, sessionID, apiToken, csrfToken]);
            return loginSession;
        }
    });

    scratch._fetchAPIToken = passedSessionID => {
        fetchAPITokenCalled = true;
        t.is(passedSessionID, sessionID);
        return Promise.resolve(apiToken);
    };

    const result = await scratch.login(username, password);
    t.match(result, loginSession);
    t.true(fetchCalled);
    t.true(makeLoginSessionCalled);
    t.true(fetchAPITokenCalled);
});

t.test('loginPrompt', async t => {
    const username = 'fake-username';
    const password = 'fake-password';
    const loginSession = {username}; // Not the form of an actual login session; we really just need an object.

    let promptCalled = false;
    let loginCalled = false;

    const scratch = new Scratch({
        prompt: options => {
            promptCalled = true;
            // Could use a snapshot test here but being verbose is OK since this function is unlikely to change too
            // often.
            t.match(options, [
                {name: 'username'},
                {name: 'password', hidden: true}
            ]);
            return Promise.resolve({username, password});
        }
    });

    scratch.login = (...args) => {
        loginCalled = true;
        t.match(args, [username, password]);
        return Promise.resolve(loginSession);
    };

    const result = await scratch.loginPrompt();
    t.is(result, loginSession);
    t.true(promptCalled);
    t.true(loginCalled);
});

t.test('loginOrRestore (file not present)', async t => {
    const username = 'fake-username';
    const csrfToken = 'fake-csrfToken';
    const sessionID = 'fake-sessionID';
    const apiToken = 'fake-apiToken';
    const sessionFile = 'fake-sessionFile';
    const fileContents = {username, csrfToken, sessionID};
    const loginSession = {username, csrfToken, sessionID, apiToken};

    let writeFileCalled = false;
    let readFileCalled = false;
    let loginPromptCalled = false;

    const scratch = new Scratch({
        readFile: filename => {
            readFileCalled = true;
            t.is(filename, sessionFile);
            const err = new Error();
            err.code = 'ENOENT';
            throw err;
        },
        writeFile: (filename, data) => {
            writeFileCalled = true;
            t.is(filename, sessionFile);
            t.match(JSON.parse(data), fileContents);
        }
    });

    scratch.loginPrompt = () => {
        loginPromptCalled = true;
        return Promise.resolve(loginSession);
    };

    scratch._fetchAPIToken = t.fail;

    const result = await scratch.loginOrRestore(sessionFile);
    t.is(result, loginSession);
    t.true(readFileCalled);
    t.true(writeFileCalled);
    t.true(loginPromptCalled);
});

t.test('loginOrRestore (file is present)', async t => {
    const username = 'fake-username';
    const csrfToken = 'fake-csrfToken';
    const sessionID = 'fake-sessionID';
    const apiToken = 'fake-apiToken';
    const sessionFile = 'fake-sessionFile';
    const fileContents = {username, csrfToken, sessionID};
    const loginSession = {username, csrfToken, sessionID, apiToken};

    let readFileCalled = false;
    let fetchAPITokenCalled = false;

    const scratch = new Scratch({
        readFile: filename => {
            readFileCalled = true;
            t.is(filename, sessionFile);
            return JSON.stringify(fileContents);
        },
        writeFile: t.fail
    });

    scratch._fetchAPIToken = (passedSessionID) => {
        fetchAPITokenCalled = true;
        t.is(passedSessionID, sessionID);
        return Promise.resolve(apiToken);
    };

    scratch.loginPrompt = t.fail;

    const result = await scratch.loginOrRestore(sessionFile);
    t.match(result, loginSession);
    t.true(readFileCalled);
    t.true(fetchAPITokenCalled);
});
