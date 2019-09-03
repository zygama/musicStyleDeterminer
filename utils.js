// Return in an array all indexes of the string 'find' found in sring 'str'
const getAllIndexes = (str, find) => {
  const regex = new RegExp(find, "g");
  let result = null;
  const indices = [];
  while ((result = regex.exec(str))) {
    indices.push(result.index);
  }
  return indices;
};

module.exports = {
  getAllIndexes
};