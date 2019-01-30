const t = require('tap');
const Scratch = require('../src/scratch');
const CookieUtil = require('../src/util/cookie-util');

t.test('constructor (no injected dependencies)', t => {
    new Scratch();
    t.done();
});

t.test('login', async t => {
    const username = 'fake-username';
    const password = 'fake-password';
    const sessionID = 'fake-sessionID';
    const apiToken = 'fake-apiToken';
    const csrfToken = 'a'; // XXX: Hard-coded in main file!
    const loginSession = {username, sessionID, csrfToken, apiToken};

    let fetchCalled = false;
    let loginSessionCalled = false;
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

        LoginSession: function(...args) {
            loginSessionCalled = true;
            t.match(args, [username, sessionID, csrfToken, apiToken]);
            return loginSession;
        }
    });

    scratch._fetchAPIToken = passedSessionID => {
        fetchAPITokenCalled = true;
        t.is(passedSessionID, sessionID);
        return Promise.resolve(apiToken);
    };

    const result = await scratch.login(username, password);
    t.true(fetchCalled);
    t.true(loginSessionCalled);
    t.true(fetchAPITokenCalled);
    t.match(result, loginSession);
});

t.test('login (failure)', async t => {
    const username = 'fake-username';
    const password = 'fake-password';

    const scratch = new Scratch({
        fetch: () => {
            return Promise.resolve({
                json: () => Promise.resolve([
                    [
                        {success: false, msg: 'Incorrect password.'}
                    ]
                ])
            });
        }
    });

    t.rejects(() => scratch.login(username, password));
});

t.test('_fetchAPIToken', async t => {
    const sessionID = 'fake-sessionID';
    const apiToken = 'fake-apiToken';

    let fetchCalled = false;

    const scratch = new Scratch({
        fetch: (url, config) => {
            fetchCalled = true;
            t.is(url, 'https://scratch.mit.edu/session');
            t.match(CookieUtil.parse(config.headers['Cookie']), {scratchsessionsid: sessionID});
            return Promise.resolve({
                json: () => Promise.resolve(
                    {
                        user: {
                            token: apiToken
                        }
                    }
                )
            });
        }
    });

    const result = await scratch._fetchAPIToken(sessionID);
    t.true(fetchCalled);
    t.is(result, apiToken);
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
    t.true(promptCalled);
    t.true(loginCalled);
    t.is(result, loginSession);
});

t.test('loginOrRestore (file not present)', async t => {
    const username = 'fake-username';
    const sessionID = 'fake-sessionID';
    const csrfToken = 'fake-csrfToken';
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
    t.true(readFileCalled);
    t.true(writeFileCalled);
    t.true(loginPromptCalled);
    t.is(result, loginSession);
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
    let loginSessionCalled = false;

    const scratch = new Scratch({
        readFile: filename => {
            readFileCalled = true;
            t.is(filename, sessionFile);
            return JSON.stringify(fileContents);
        },
        LoginSession: function(...args) {
            loginSessionCalled = true;
            t.match(args, [username, sessionID, csrfToken, apiToken]);
            return loginSession;
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
    t.true(readFileCalled);
    t.true(loginSessionCalled);
    t.true(fetchAPITokenCalled);
    t.match(result, loginSession);
});

t.test('loginOrRestore (some other error)', async t => {
    let readFileCalled = false;

    const scratch = new Scratch({
        readFile: () => {
            readFileCalled = true;
            const err = new Error();
            err.code = 'EACCES';
            throw err;
        }
    });

    t.rejects(() => scratch.loginOrRestore('fake-sessionFile'));
    t.true(readFileCalled);
});

t.test('loginOrRestore (default file)', async t => {
    const expectedDefaultFile = '.scratchSession';

    let readFileCalled = false;

    const scratch = new Scratch({
        readFile: filename => {
            readFileCalled = true;
            t.is(filename, expectedDefaultFile);
            // Just throw an error - this is the simplest way to get out of loginOrRestore's other behavior.
            // TODO: Is there a more typical, "clean" way to stop executing a test once a certain condition has
            // been met..?
            throw new Error();
        }
    });

    t.rejects(() => scratch.loginOrRestore());
    t.true(readFileCalled);
});

t.test('getUser', async t => {
    const username = 'fake-username';
    const user = {username};

    let userCalled = true;

    const scratch = new Scratch({
        User: function(config) {
            userCalled = true;
            t.match(config, {username});
            return user;
        }
    });

    const result1 = await scratch.getUser(username);
    t.true(userCalled);
    t.is(result1, user);

    // Calling it again should reuse the same object.
    userCalled = false;
    const result2 = await scratch.getUser(username);
    t.false(userCalled);
    t.is(result2, result1);
});
