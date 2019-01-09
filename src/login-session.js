/**
 * Representation of a login session to the Scratch website.
 */
class LoginSession {
    /**
     * @param {string} username - The session's username.
     * @param {string} sessionID - The session ID cookie, used for authorization under some API endpoints.
     * @param {string} csrfToken - The session's CSRF token, used for access to some API endpoints.
     * @param {string} apiToken - The session's API token, used as authorization on https://api.scratch.mit.edu.
     */
    constructor(username, sessionID, csrfToken, apiToken) {
        /**
         * Username of the logged in user.
         * @type {string}
         */
        this.username = username;

        /**
         * Session ID, used for authorization under some API endpoints.
         * @type {string}
         */
        this.sessionID = sessionID;

        /**
         * CSRF token, used for access to some API endpoints.
         * @type {string}
         */
        this.csrfToken = csrfToken;

        /**
         * API token, used for authorization on https://api.scratch.mit.edu.
         * @type {string}
         */
        this.apiToken = apiToken;
    }
}

module.exports = LoginSession;
