const t = require('tap');
const LoginSession = require('../src/login-session');

t.test('constructor', t => {
    const username = 'fake-username';
    const sessionID = 'fake-sessionID';
    const csrfToken = 'fake-csrfToken';
    const apiToken = 'fake-apiToken';

    const loginSession = new LoginSession(username, sessionID, csrfToken, apiToken);
    t.is(loginSession.username, username);
    t.is(loginSession.sessionID, sessionID);
    t.is(loginSession.csrfToken, csrfToken);
    t.is(loginSession.apiToken, apiToken);
    t.done();
});
