module.exports.makeTestDetailFunction = function(t, doc, apiDetails) {
    return async function testDetail(expectedKey, func) {
        let getCalled = false;

        doc.getAPIDetail = key => {
            getCalled = true;
            t.is(key, expectedKey);
            return apiDetails[expectedKey];
        };

        const result = await func.call(doc);
        t.true(getCalled);
        return result;
    };
};
