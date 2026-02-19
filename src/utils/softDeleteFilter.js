const normalizeIsDeleted = (value) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false' || value === undefined) return false;
  return false;
};

const softDeleteClause = (isDeleted = false) => {
  if (isDeleted) {
    return { isDeleted: true };
  }

  return {
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
  };
};

const withSoftDeleteFilter = (query = {}, isDeleted = false) => {
  const normalized = normalizeIsDeleted(isDeleted);
  const clause = softDeleteClause(normalized);

  if (!query || Object.keys(query).length === 0) {
    return clause;
  }

  return {
    $and: [clause, query]
  };
};

module.exports = {
  normalizeIsDeleted,
  softDeleteClause,
  withSoftDeleteFilter
};
