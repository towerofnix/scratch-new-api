const APIDocument = require('./util/api-document');

/**
 * Object containing information about project community stats.
 * @typedef {object} Project~ProjectStats
 * @property {number} views - Number of views (unique users who have clicked the green flag to start the project).
 * @property {number} loves - Number of love-its.
 * @property {number} favorites - Number of favorites.
 * @property {number} comments - Number of comments left on the project.
 * @property {number} remixes - Number of shared remixes.
 */

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

    /**
     * Gets the project's "Instructions" content.
     * @returns {string}
     */
    async getInstructions() {
        return this.getAPIDetail('instructions');
    }

    /**
     * Gets the project's "Notes and Credits" content.
     * @returns {string}
     */
    async getNotesAndCredits() {
        return this.getAPIDetail('description');
    }

    /**
     * Gets the project's various stats - number of love-its, comments, etc.
     * @returns {Project~ProjectStats}
     */
    async getStats() {
        const { views, loves, favorites, comments, remixes } = await this.getAPIDetail('stats');
        return {views, loves, favorites, comments, remixes};
    }

    /**
     * Gets the URL to be used as the thumbnail for the project.
     * @returns {string}
     */
    async getThumbnailURL() {
        return this.getAPIDetail('image');
    }

    /**
     * Gets the date/time when the project was created.
     * @returns {Date}
     */
    async getCreateDate() {
        return this._getDate('created');
    }

    /**
     * Gets the date/time when the project was last modified.
     * @returns {Date}
     */
    async getModifyDate() {
        return this._getDate('modified');
    }

    /**
     * Gets the date/time when the project was shared.
     * @returns {Date}
     */
    async getShareDate() {
        return this._getDate('shared');
    }

    /**
     * Helper function to retrieve a date related to the project.
     * @param {string} key - Property to get from history API detail.
     * @returns {Date}
     * @private
     */
    async _getDate(key) {
        const history = await this.getAPIDetail('history');
        return new Date(history[key]);
    }
}

module.exports = Project;
