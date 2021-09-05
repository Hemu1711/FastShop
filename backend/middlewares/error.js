const ErrorHandler = require('../utils/errorHandler');
const dotenv = require('dotenv');
dotenv.config({path: 'backend/config/config.env'})
module.exports =  (err,req,res,next) => {
    err.statusCode = err.statusCode || 500;
    // if (process.env.NODE_ENV === 'DEVELOPMENT'){
    //     res.status(err.statusCode).json({
    //         success:false,
    //         error:err,
    //         message:err.message,
    //         stack:err.stack
    //     })
    // }
    // if (process.env.NODE_ENV === 'PRODUCTION'){
    //     let error = {...err}
    //     error.message = err.message
    //     res.status(error.statusCode).json({
    //         success:false,
    //         mesg:"In PROD",
    //         message:error.message || "Internal Server Error"
    //     })
        
    // }

    //wrong mongoose id error
    let error = {...err}
    if (err.name === "CastError"){
        const message = "resourse Not Found Invalid " + err.path
        error = new ErrorHandler(message,400)
    }

    // Handling Mongoose Validation Error

    if (err.name === "ValidationError"){
        const message = Object.values(err.errors).map(value =>value.message)
        error = new ErrorHandler(message,400);
    }

    // Handling Mangoose duplicate key error
    if(err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`
        error = new ErrorHandler(message,400)
    }

    // Handling Wrong jwt Token Error

    if(err.name === 'JsonWebTokenError') {
        const message = `JSON WEB TOKEN IS  INVALID`
        error = new ErrorHandler(message,400)
    }

    // Handling JWT Token Expired Error

    if (err.name === 'TokenExpiredError'){
        const message = `JSON WEB TOKEN IS EXPIRED `
        error = new ErrorHandler(message,400)
    }

     
    res.status(err.statusCode).json({
        success:false,
        stack:err.stack,
        message:error.message || "Internal Server Error"
    })
    
}