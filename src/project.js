const APIDocument = require('./util/api-document');

/**
 * Class representing a Scratch project.
 */
class Project extends APIDocument {
    /**
     * @param {object} config - Configuration.
     * @param {number} config.id - The project's ID.
     */
    constructor(config) {
        super(config);

        /**
         * ID to be used for fetching API details regarding the project.
         * @type {number}
         * @private
         */
        this._id = config.id;
    }

    getEndpoint() {
        return 'projects/' + this._id;
    }

    /**
     * Gets the project's ID.
     * @returns {number}
     */
    async getID() {
        return this.getAPIDetail('id');
    }

    /**
     * Gets the project's title.
     * @returns {string}
     */
    async getTitle() {
        return this.getAPIDetail('title');
    }

    /**
     * Gets the username of the project's author.
     * @returns {string}
     */
    async getAuthor() {
        return this.getAPIDetail('author').username;
    }
}

module.exports = Project;
