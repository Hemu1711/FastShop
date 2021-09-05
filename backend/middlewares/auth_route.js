
// checkes if user is authenticated or not

const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const user = require("../models/user")

exports.isAuthenticatedUser = catchAsyncErrors(async function (req, res,next) {

    const token = req.cookies.token;
    // console.log(token);
    if (!token){
        return next(new ErrorHandler("Login First To access This Product",401))
    }

    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    req.user = await user.findById(decoded.id);
    next()
})

// handling users roles

exports.authorizeRoles = function (...roles) {

  return function (req, res,next) {
      if(!roles.includes(req.user.role)){
          return next(
          new ErrorHandler('ROLE'+ req.user.role+'is not allowed to access',403))
      }
      next();

  }  
} 