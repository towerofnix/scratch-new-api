const _fetch = require('node-fetch');

/**
 * Basic class representing any individual "document" that can be fetched from the Scratch API.
 */
class APIDocument {
    /**
     * @param {object} [config] - Configuration.
     * @param {function} [config.fetch] - Function to use for fetching data.
     */
    constructor({
        fetch = _fetch
    } = {}) {
        this.fetch = fetch;

        /**
         * Data about the document fetched from the API by {@link APIDocument#loadAPIDetails}.
         * @type {object?}
         */
        this.apiDetails = null;
    }

    /**
     * Function to get the Scratch API endpoint that refers to this document.
     * Should be overridden by subclasses. Used in {@link APIDocument#loadAPIDetails}.
     * @returns {string} - 'users/mres' for example.
     */
    getEndpoint() {
        throw new Error('Not implemented');
    }

    /**
     * If not already present, fetch the API details of the document from the API. Usually doesn't need to be called
     * manually; prefer to use a more specific function instead, like {@link User#getUsername}.
     */
    async loadAPIDetails() {
        if (!this.apiDetails) {
            const response = await this.fetch('https://api.scratch.mit.edu/' + this.getEndpoint());

            // TODO: Deal with error codes, ala 404.

            const apiDetails = await response.json();
            this.apiDetails = apiDetails;
        }
    }

    /**
     * Get a specific detail (JSON data property) from the API, [loading]{@link APIDocument#loadAPIDetails}
     * if necessary.
     * @returns {any}
     */
    async getAPIDetail(key) {
        await this.loadAPIDetails();
        return this.apiDetails[key];
    }
}

module.exports = APIDocument;
