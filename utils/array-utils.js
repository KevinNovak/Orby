function paginate(items, pageSize, pageNumber) {
    // Human-readable page numbers start with 1, so reduce 1 in the first argument
    return items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
}

module.exports = {
    paginate,
};
