const _fetch = require('node-fetch');

const _basicStreamUtil = async function*(fetchNextPage) {
    let results = [];
    do {
        results = await fetchNextPage();
        for (const item of results) {
            yield item;
        }
    } while (results.length);
};

const _apiStreamUtil = function({
    baseEndpoint,
    transformResult,
    pageSize = 40,
    fetch = _fetch,
    basicStreamUtil = _basicStreamUtil
}) {
    let offset = 0;
    return basicStreamUtil(() => {
        const curOffset = offset;
        offset += pageSize;
        return fetch(`https://api.scratch.mit.edu/${baseEndpoint}?offset=${curOffset}&count=${pageSize}`)
            .then(response => response.json())
            .then(results => results.map(transformResult));
    });
};

module.exports = _apiStreamUtil;
module.exports.basicStreamUtil = _basicStreamUtil;

module.exports.users = function(baseEndpoint, {
    apiStreamUtil = _apiStreamUtil
} = {}) {
    return apiStreamUtil({
        baseEndpoint,
        transformResult: result => result.username
    });
};
