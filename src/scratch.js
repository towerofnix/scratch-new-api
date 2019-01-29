const fs = require('fs');
const util = require('util');
const prompt = require('prompt');

const _fetch = require('node-fetch');
const _prompt = util.promisify(prompt.get);
const _readFile = util.promisify(fs.readFile);
const _writeFile = util.promisify(fs.writeFile);

const CookieUtil = require('./util/cookie-util');
const LoginSession = require('./login-session');

/**
 * Class containing methods for interacting with the Scratch API.
 */
class Scratch {
    /**
     * Create the Scratch instance.
     * @param {object} [config] - Configuration.
     * @param {function} [config.fetch] - Function to use for fetching data.
     * @param {function} [config.prompt] - Function to use for prompting input from the user.
     * @param {function} [config.readFile] - Function to use for reading a file.
     * @param {function} [config.writeFile] - Function to use for writing a file.
     * @param {function} [config.makeLoginSession] - Function to construct a LoginSession.
     */
    constructor({
        fetch = _fetch,
        prompt = _prompt,
        readFile = _readFile,
        writeFile = _writeFile,
        makeLoginSession = (...args) => new LoginSession(...args)
    } = {}) {
        this.fetch = fetch;
        this.makeLoginSession = makeLoginSession;
        this.prompt = prompt;
        this.readFile = readFile;
        this.writeFile = writeFile;
    }

    /**
     * Log into the Scratch website and API.
     * @param {string} username - The name of the user to log in as.
     * @param {string} password - The password to log in with.
     * @returns {LoginSession}
     */
    async login(username, password) {
        const response = await this.fetch('https://scratch.mit.edu/login/', {
            method: 'POST',
            body: JSON.stringify({username, password}),
            headers: {
                'Cookie': 'scratchcsrftoken=a',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': 'a',
                'Referer': 'https://scratch.mit.edu'
            }
        });

        const [ result ] = await response.json();

        if (!result.success) {
            throw new Error(result.msg);
        }

        username = result.username;

        const { scratchsessionsid: sessionID } = CookieUtil.parse(response.headers.get('set-cookie'));

        // A simple fake CSRF token actually works.
        const csrfToken = 'a';

        const apiToken = await this._fetchAPIToken(sessionID);

        return this.makeLoginSession(username, sessionID,  csrfToken, apiToken);
    }

    /**
     * Fetch the API token for a login session, given its session ID cookie value.
     * @private
     * @param {string} sessionID - The session's session ID.
     * @returns {string} - The session's API token.
     */
    async _fetchAPIToken(sessionID) {
        const { user: { token: apiToken } } = await this.fetch('https://scratch.mit.edu/session', {
            headers: {
                'Cookie': `scratchsessionsid=${sessionID}`,
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).then(res => res.json());

        return apiToken;
    }

    /**
     * Show a command-line prompt to log into Scratch.
     * @returns {LoginSession}
     */
    async loginPrompt () {
        const { username, password } = await this.prompt([
            {name: 'username'},
            {name: 'password', hidden: true}
        ]);
        return this.login(username, password);
    }

    /**
     * Log into Scratch. If a session file is present, attempt to restore the session from it.
     * @param {string} [sessionFile=.scratchSession] - the file to save/restore the session from
     * @returns {LoginSession}
     */
    async loginOrRestore (sessionFile='.scratchSession') {
        try {
            const { username, sessionID, csrfToken } = JSON.parse(await this.readFile(sessionFile));
            const apiToken = await this._fetchAPIToken(sessionID);
            return this.makeLoginSession(username, sessionID, csrfToken, apiToken);
        } catch (error) {
            if (error.code === 'ENOENT') {
                const userSession = await this.loginPrompt();
                await this.writeFile(sessionFile, JSON.stringify(userSession));
                return userSession;
            } else {
                throw error;
            }
        }
    }
}

Scratch.LoginSession = LoginSession;

module.exports = Scratch;