const _fetch = require('node-fetch');

/**
 * Class containing methods for fetching streams of data and yielding results through a generator. Particularly
 * powerful when used alongside JavaScript's "for await (const result of generator)" loop syntax.
 * @hideconstructor
 */
class StreamUtil {
    /**
     * Basic stream helper function. Takes a function which resolves to the next page of data. If the data is empty,
     * the generator stops; otherwise, it yields each item one by one.
     * @param {function} fetchNextPage - The function to fetch the next page of data.
     * @async
     * @generator
     * @yields {any}
     */
    static basicStream(fetchNextPage) {
        // The coverage tool that tap uses doesn't support, uh, static async generator class methods.
        // So we define this helper function inside the (ordinary static) method to get around it.
        async function *basicStreamHelper() {
            let results = [];
            do {
                results = await fetchNextPage();
                for (const item of results) {
                    yield item;
                }
            } while (results.length);
        }

        return basicStreamHelper();
    }

    /**
     * Fetch data from the Scratch API. Automatically deals with Scratch API's "pagination". Takes a variety of
     * customization options.
     * @param {object}    config - Configuration.
     * @param {string}    config.baseEndpoint - Base string to use in fetch URL.
     * @param {?function} [config.transformResult] - Function to transform API results into output format.
     * @param {number}    [config.pageSize=40] - Number of results to request from Scratch API.
     * @param {function}  [config.fetch] - Function to use for fetching data.
     * @param {function}  [config.basicStream] - Function to use in place of basicStream.
     * @async
     * @generator
     * @yields {any}
     */
    static apiStream({
        baseEndpoint,
        transformResult = null,
        pageSize = 40,
        fetch = _fetch,
        basicStream = StreamUtil.basicStream
    }) {
        let offset = 0;
        return basicStream(() => {
            const curOffset = offset;
            offset += pageSize;
            return fetch(`https://api.scratch.mit.edu/${baseEndpoint}?offset=${curOffset}&limit=${pageSize}`)
                .then(response => response.json())
                .then(results => transformResult ? results.map(transformResult) : results);
        });
    }

    /**
     * Fetch a stream of usernames from the Scratch API.
     * @param {string} baseEndpoint - Base string to use in fetch URL.
     * @param {object} [config] - Configuration.
     * @param {function} [config.apiStream] - Function to use in place of apiStream.
     * @async
     * @generator
     * @yields {object} (TODO: Typedef? Format is {username}.)
     */
    static userStream(baseEndpoint, {
        apiStream = StreamUtil.apiStream
    } = {}) {
        return apiStream({
            baseEndpoint
        });
    }

    /**
     * Fetch a stream of project IDs and names from the Scratch API.
     * @param {string} baseEndpoint - Base string to use in fetch URL.
     * @param {object} [config] - Configuration.
     * @param {function} [config.apiStream] - Function to use in place of apiStream.
     * @async
     * @generator
     * @yields {object} (TODO: Typedef? Format is {id, title}.)
     */
    static projectStream(baseEndpoint, {
        apiStream = StreamUtil.apiStream
    } = {}) {
        return apiStream({
            baseEndpoint
        });
    }
}

module.exports = StreamUtil;
