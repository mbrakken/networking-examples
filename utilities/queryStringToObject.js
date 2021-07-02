// doesn't handle complicated queries (arrays, objects, nested queries, etc)
module.exports = function queryStringToObject(query) {
  return query.split('&').reduce((obj, part) => {
    const [key, value] = part.split('=');

    obj[decodeURIComponent(key)] = decodeURIComponent(value);

    return obj;
  }, {});
};
