const _fetch = require('node-fetch');

/**
 * Basic class representing any individual "document" that can be fetched from the Scratch API.
 */
class APIDocument {
    // TODO: We should be able to pass a variety of initial data. For example, when a project is listed in the
    // user's shared projects endpoint, it comes with most of the data that composes a full project object.
    // Rather than relying on an additional fetch, we should use those details when possible. This only raises
    // a question of how we want to implement the getProject() (and getUser(), etc) methods on the Scratch class.
    // We will need to be able to pass all details; we'd still use, for example, the project ID as the key.
    // And, the first time that project ID is gotten, the CacheMap will be updated with the data passed.
    // But suppose, on a later call, different property values are passed - for example, if a project has been
    // "loved" since it was initially put into the CacheMap. Should the project object stored in CacheMap be
    // updated with these new values? I'm thinking *probably*; I'm just not 100% certain yet. Is there merit to
    // keeping project API documents basically immutable? Maybe, but probably not worth the benefits of being
    // updated automatically (or even the confusion/semi-mutable results of manually updating the details).
    // [This is what I decided to do, yeah. Keeping the comment around for future reference.]

    /**
     * @param {object} [initialDetails] - Initially known API details.
     * @param {object} [config] - Configuration.
     * @param {function} [config.fetch] - Function to use for fetching data.
     */
    constructor(initialDetails = {}, {
        fetch = _fetch
    } = {}) {
        this.fetch = fetch;

        /**
         * Data about the document fetched from the API by {@link APIDocument#loadAPIDetails}.
         * @type {object?}
         */
        this.apiDetails = initialDetails;

        /**
         * Flag telling whether the full document has been fetched from the API and stored in apiDetails
         * (i.e. the content specified in {@link APIDocument#getEndpoint}.
         */
        this.hasFetchedFullDetails = false;
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
        if (!this.hasFetchedFullDetails) {
            const response = await this.fetch('https://api.scratch.mit.edu/' + this.getEndpoint());

            // TODO: Deal with error codes, ala 404.

            const apiDetails = await response.json();
            this.apiDetails = apiDetails;

            this.hasFetchedFullDetails = true;
        }
    }

    /**
     * Get a specific detail (JSON data property) from the API, [loading]{@link APIDocument#loadAPIDetails}
     * if necessary.
     * @returns {any}
     */
    async getAPIDetail(key) {
        if (!(key in this.apiDetails)) {
            await this.loadAPIDetails();
        }

        return this.apiDetails[key];
    }
}

module.exports = APIDocument;
