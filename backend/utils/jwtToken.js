// Create and save the token in cookies.

const sendToken = function(user,statusCode,res){

    // Create jwt token
    const token = user.getJwtTokens();

    // options for cookies
    const options = { expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000),httpOnly: true}
    res.status(statusCode).cookie('token',token,options).json({
        success: true,
        token,
        user
    })
}

module.exports = sendToken;