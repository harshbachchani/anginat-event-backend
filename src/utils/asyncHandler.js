const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};
let x = "0908874738";
x = x.toString();
if (x.at(0) === "0") {
  console.log("Hii");
  const y = x.substring(1, x.length);
  console.log(y);
}
export { asyncHandler };
