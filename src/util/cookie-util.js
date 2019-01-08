/**
 * Class containing methods for manipulating browser cookies.
 * @hideconstructor
 */
class CookieUtil {
    /**
     * Parse a cookie string into object form.
     * @param {string} cookieString - The string to parse.
     * @returns {object} - The object representing the contained cookies.
     */
    static parse (cookieString) {
        const result = {};

        for (const cookie of cookieString.split(';')) {
            const [ name, ...rest ] = cookie.split('=');
            result[name.trim()] = decodeURI(rest.join('='));
        }

        return result;
    }
}

module.exports = CookieUtil;
