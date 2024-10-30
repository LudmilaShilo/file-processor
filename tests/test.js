const constants = require("../constants");
const Redis = require("../redis");

console.log(`${constants.status.pending}`);

Redis.put(`test`, constants.status.pending);

(async () => {
  const value = await Redis.get(`test`);
  console.log(`${value}`);
})();
