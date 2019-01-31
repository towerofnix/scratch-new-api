const APIDocument = require('./util/api-document');

const _StreamUtil = require('./util/stream-util');

/**
 * Class representing a Scratch website user.
 */
class User extends APIDocument {
    /**
     * @param {object} initialDetails - Initially known API details.
     * @param {object} initialDetails.username - The user's username.
     * @param {object} [config] - Configuration.
     * @param {function} [config.StreamUtil] - Class to use in place of StreamUtil.
     */
    constructor(initialDetails, config = {}) {
        super(initialDetails, config);

        const {
            StreamUtil = _StreamUtil
        } = config;

        this.StreamUtil = StreamUtil;

        /**
         * Username to be used for fetching API details regarding the user.
         * @type {string}
         * @private
         */
        this._username = initialDetails.username;

        // Delete the username from the initial details - the passed username (and the one used for fetching data from
        // the API) is case-insensitive, but in order to return an accurate value, the correct letter-case can be
        // guaranteed by always initially fetching the username from the API.
        delete this.apiDetails.username;
    }

    getEndpoint() {
        return 'users/' + this._username;
    }

    /**
     * Gets the user's ID.
     * @returns {number}
     */
    async getID() {
        return this.getAPIDetail('id');
    }

    /**
     * Gets the user's username.
     * @returns {string}
     */
    async getUsername() {
        return this.getAPIDetail('username');
    }

    /**
     * Gets whether the user is part of the Scratch Team or not.
     * @returns {boolean}
     */
    async getScratchTeamStatus() {
        return this.getAPIDetail('scratchteam');
    }

    /**
     * Gets the date/time when the user joined Scratch.
     * @returns {Date}
     */
    async getDateJoined() {
        const history = await this.getAPIDetail('history');
        return new Date(history.joined);
    }

    /**
     * Gets the user's status ("what I'm working on").
     * @returns {string}
     */
    async getStatus() {
        const profile = await this.getAPIDetail('profile');
        return profile.status;
    }

    /**
     * Gets the user's bio ("about me").
     * @returns {string}
     */
    async getBio() {
        const profile = await this.getAPIDetail('profile');
        return profile.bio;
    }

    /**
     * Gets the user's country.
     * @returns {string}
     */
    async getCountry() {
        const profile = await this.getAPIDetail('profile');
        return profile.country;
    }

    /**
     * Gets the usernames of those the user is following. Yields from newest to oldest.
     * @async
     * @generator
     * @yields {string}
     */
    getFollowing() {
        return this.StreamUtil.userStream(`users/${this._username}/following`);
    }

    /**
     * Gets the usernames of those that follow the user. Yields from newest to oldest.
     * @async
     * @generator
     * @yields {string}
     */
    getFollowers() {
        return this.StreamUtil.userStream(`users/${this._username}/followers`);
    }

    /**
     * Gets the projects that have been created and shared by the user.
     * Due to a limitation in the Scratch API, yields from oldest to newest.
     * @async
     * @generator
     * @yields {object}
     */
    getSharedProjects() {
        return this.StreamUtil.projectStream(`users/${this._username}/projects`);
    }
}

module.exports = User;
