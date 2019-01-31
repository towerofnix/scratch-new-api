/**
 * Class for keeping track of a mapping from keys to values, creating new entries using a given function when a key
 * that hasn't yet been recorded is requested.
 */
class CacheMap {
    /**
     * @param {function} createEntryFunc - Function for creating an entry.
     */
    constructor(createEntryFunc) {
        this._createEntryFunc = createEntryFunc;
        this._map = new Map();
    }

    /**
     * Get an entry in the map. If there is no such entry, the createEntryFunc parameter passed in the constructor is
     * called, and its result is recorded in the map and then returned.
     * @param {any} key - Key to use for referring to the entry.
     */
    get(key) {
        if (this._map.has(key)) {
            return this._map.get(key);
        } else {
            const entry = this._createEntryFunc(key);
            this._map.set(key, entry);
            return entry;
        }
    }
}

module.exports = CacheMap;
