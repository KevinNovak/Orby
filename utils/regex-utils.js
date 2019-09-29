const ORB_COUNT_REGEX = /(.*)([\[\(]{1})([ ]*)([0-9,]+)(.*)/;

function containsOrbCount(input) {
    return ORB_COUNT_REGEX.test(input);
}

function extractOrbCount(input) {
    let match = ORB_COUNT_REGEX.exec(input);
    return parseInt(match[4].replace(/,/g, ''));
}

function replaceOrbCount(input, orbCount) {
    if (containsOrbCount(input)) {
        return input.replace(ORB_COUNT_REGEX, `$1$2$3${orbCount}$5`);
    }
    return input;
}

module.exports = {
    containsOrbCount,
    extractOrbCount,
    replaceOrbCount
};
