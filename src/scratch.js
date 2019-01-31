const fs = require('fs');
const util = require('util');
const prompt = require('prompt');

const _fetch = require('node-fetch');
const _prompt = util.promisify(prompt.get);
const _readFile = util.promisify(fs.readFile);
const _writeFile = util.promisify(fs.writeFile);

const CookieUtil = require('./util/cookie-util');
const _CacheMap = require('./util/cache-map');
const _LoginSession = require('./login-session');
const _Project = require('./project');
const _User = require('./user');

/**
 * Top-level class containing methods for interacting with the Scratch API.
 */
class Scratch {
    /**
     * Create the Scratch instance. Note that all parameters are optional: Unless you're writing code in an
     * intentionally-controlled environment (i.e. unit tests), you can typically just start using the library
     * with the code 'new Scratch()'. (The same applies in most cases: If a function in a configuration object
     * parameter is optional, you probably don't need to worry about it - just let it use the default value.)
     * @param {object} [config] - Configuration.
     * @param {function} [config.fetch] - Function to use for fetching data.
     * @param {function} [config.prompt] - Function to use for prompting input from the user.
     * @param {function} [config.readFile] - Function to use for reading a file.
     * @param {function} [config.writeFile] - Function to use for writing a file.
     * @param {function} [config.CacheMap] - Class to use as a CacheMap.
     * @param {function} [config.LoginSession] - Class to use as a LoginSession.
     * @param {function} [config.Project] - Class to use as a Project.
     * @param {function} [config.User] - Class to use as a User.
     */
    constructor({
        fetch = _fetch,
        prompt = _prompt,
        readFile = _readFile,
        writeFile = _writeFile,
        CacheMap = _CacheMap,
        LoginSession = _LoginSession,
        Project = _Project,
        User = _User
    } = {}) {
        this.fetch = fetch;
        this.prompt = prompt;
        this.readFile = readFile;
        this.writeFile = writeFile;
        this.LoginSession = LoginSession;

        /**
         * Mapping of usernames to {@link User} objects for use by {@link Scratch#getUser}.
         * @type {Map<string,User>}
         * @private
         */
        this._userMap = new CacheMap((_, initialDetails) => new User(initialDetails));

        /**
         * Mapping of IDs to {@link Project} objects for use by {@link Scratch#getProject}.
         * @type {Map<string,Project>}
         * @private
         */
        this._projectMap = new CacheMap((_, initialDetails) => new Project(initialDetails));
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

        return new this.LoginSession(username, sessionID,  csrfToken, apiToken);
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
     * @param {string} [sessionFile=.scratchSession] - The file to save/restore the session from.
     * @returns {LoginSession}
     */
    async loginOrRestore (sessionFile='.scratchSession') {
        try {
            const { username, sessionID, csrfToken } = JSON.parse(await this.readFile(sessionFile));
            const apiToken = await this._fetchAPIToken(sessionID);
            return new this.LoginSession(username, sessionID, csrfToken, apiToken);
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

    /**
     * Gets the user object that corresponds to the given username, creating it if not already present.
     * @example scratch.getUser({username: 'mres'})
     * @example scratch.getUser(await project.getAuthor())
     * @param {object} initialDetails - Initially known API details.
     * @param {string} initialDetails.username - The username. Not case-sensitive.
     * @returns {User}
     */
    getUser(initialDetails) {
        const { username } = initialDetails;
        return this._userMap.get(username.toLowerCase(), initialDetails);
    }

    /**
     * Gets the project object that corresponds to the given ID, creating it if not already present.
     * @example scratch.getProject({id: 276660597})
     * @example scratch.getProject(await user.getFeaturedProject())
     * @param {object} initialDetails
     * @param {number} initialDetails.id - The project ID.
     * @returns {Project}
     */
    getProject(initialDetails) {
        const { id } = initialDetails;
        return this._projectMap.get(parseInt(id), initialDetails);
    }
}

Scratch.LoginSession = _LoginSession;
Scratch.Project = _Project;
Scratch.User = _User;

module.exports = Scratch;
