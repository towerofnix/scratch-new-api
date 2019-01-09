module.exports = {
    env: {
        es6: true,
        node: true
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 2018
    },

    rules: {
        'eqeqeq': ['error'],
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'no-console': ['off'],
        'no-trailing-spaces': ['error'],
        'no-var': ['error'],
        'prefer-const': ['error'],
        'quote-props': ['error', 'consistent-as-needed'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always']
    }
};
