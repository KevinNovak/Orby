function clamp(input, min, max) {
    return Math.min(Math.max(input, min), max);
}

module.exports = {
    clamp,
};
