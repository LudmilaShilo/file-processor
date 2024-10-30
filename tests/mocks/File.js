const FileMock = {
  findOne: ({ name, user }) => {
    return {
      lean: () => {
        if (name === "loadedFile.txt") return "loadedFile.txt";
      },
    };
  },
};

module.exports = FileMock;
