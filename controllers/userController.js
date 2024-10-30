exports.startSession = (req, res, next) => {
  console.log("body", req.body); // undefined
  res.status(200).json({
    status: "success",
    data: req.body,
  });
};
