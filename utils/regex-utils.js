const ORB_COUNT_REGEX = /(.*)([\[\(\{]{1})([^-0-9,]*)([-]?\d{1,3}(?:,\d{3}|\d+)*(?:\.\d+)?)(([^-0-9,]*)([+][^-0-9,]*)([-]?\d{1,3}(?:,\d{3}|\d+)*(?:\.\d+)?))?(.*)([\]\)\}]{1})(.*)/;

function containsOrbs(input) {
    return ORB_COUNT_REGEX.test(input);
}

function extractClaimedOrbs(input) {
    let match = ORB_COUNT_REGEX.exec(input);
    if (match && match[4]) {
        return parseInt(match[4].replace(/,/g, ''));
    }
}

function extractUnclaimedOrbs(input) {
    let match = ORB_COUNT_REGEX.exec(input);
    if (match && match[8]) {
        return parseInt(match[8].replace(/,/g, ''));
    }
}

function extractTotalOrbs(input) {
    let claimedOrbs = extractClaimedOrbs(input);
    if (!claimedOrbs) {
        return;
    }

    let totalOrbs = claimedOrbs;

    let unclaimedOrbs = extractUnclaimedOrbs(input);
    if (unclaimedOrbs) {
        totalOrbs += unclaimedOrbs;
    }

    return totalOrbs;
}

function replaceClaimedOrbs(input, claimedOrbs) {
    let oldClaimedOrbs = extractClaimedOrbs(input);
    if (oldClaimedOrbs == null) {
        return input;
    }

    return input.replace(ORB_COUNT_REGEX, `$1$2$3${claimedOrbs}$6$7$8$9$10$11`);
}

function replaceUnclaimedOrbs(input, unclaimedOrbs) {
    let oldUnclaimedOrbs = extractUnclaimedOrbs(input);
    if (oldUnclaimedOrbs == null) {
        return input;
    }

    return input.replace(ORB_COUNT_REGEX, `$1$2$3$4$6$7${unclaimedOrbs}$9$10$11`);
}

function addUnclaimedOrbs(input, unclaimedOrbs) {
    return input.replace(ORB_COUNT_REGEX, `$1$2$3$4$6+${unclaimedOrbs}$9$10$11`);
}

function removeUnclaimedOrbs(input) {
    return input.replace(ORB_COUNT_REGEX, `$1$2$3$4$6$9$10$11`);
}

module.exports = {
    containsOrbs,
    extractClaimedOrbs,
    extractUnclaimedOrbs,
    extractTotalOrbs,
    replaceClaimedOrbs,
    replaceUnclaimedOrbs,
    addUnclaimedOrbs,
    removeUnclaimedOrbs
};
