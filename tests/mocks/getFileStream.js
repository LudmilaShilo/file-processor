const getFileStreamMock = ({ userId, fileName, task }) => {
  return {
    pipe: (res) => {},
  };
};

module.exports = getFileStreamMock;
