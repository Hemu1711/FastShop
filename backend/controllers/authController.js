const User = require('../models/user');

const ErrorHandler = require('../utils/errorHandler');

const catchAsync = require('../middlewares/catchAsyncErrors')

const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const { send } = require('process');
const cloudinary = require('cloudinary');

// Register a User in DB => /api/v1/register

exports.registerUser = catchAsync(async function(req, res, next) {

    const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: 'avatars',
        width: 150,
        crop: "scale"
    })

    const { name, email, password } = req.body;

    const user = await User.create({
        name,
        email,
        password,
        avatar:{
            public_id: result.public_id,
            url: result.secure_url
        }
    })
    sendToken(user,200,res);
})

// login User  -- api/v1/login

exports.loginUser = catchAsync(async function(req, res, next) {
  
   const  { email, password } = req.body

   // checks if email and password are entered by User
   if (!email || !password){
       return next(new  ErrorHandler('Please enter Email and Password',400))
   }

   //Finding User in database

   const user = await User.findOne({ email }).select('+password')

   if (!user){
       return next(new ErrorHandler('Email or password Invalid',401));
   }

   const isPasswordMatched = await user.comparePassword(password)

   if(!isPasswordMatched){
    return next(new ErrorHandler('Email or password Invalid',401));
   }

   const token = user.getJwtTokens(); 
    // res.status(201).json({
    //     sucess: true,
    //     token
    // })
    sendToken(user,200,res);
    
})

// Forgot password  --> api/v1/password/forgot

exports.forgotPassword = catchAsync(async function(req, res, next) {
    const user = await User.findOne({ email: req.body.email});

    if(!user){
        return next(new ErrorHandler('User not found with this email address',404));
    }

    //get reset token

    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create Reset Password Url 
//req.protocol}://${req.get('host')/api/v1
    const resetUrl = `${req.protocol}://${req.get('host')}/password/reset/${resetToken}`;

    const message = `Your password reset token is as follows:\n\n ${resetUrl}\n\n If you Have not Requested
    this then please ignore`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Shopit Password reset token',
            message
        })

        res.status(200).json({
            success: true,
            message:'Email sent to'+user.email+' successfully'
        })
        
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler(error.message,404));
    }
})

// Forgot password  --> api/v1/password/reset/:token

exports.ResetPassword = catchAsync(async function(req, res, next) {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken
    })
    
    if(!user) {
        return next(new Error('Password token is invalid or has been expired',400))
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new Error('Password Does not match',400))
    }
    // setup new Password 

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user,200,res);

})

// Get currently logged in user details  --> /api/v1/me
exports.getUserProfile = catchAsync(async function(req, res, next) {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        sucess: true,
        user
    })
})

// Update Or Change password
exports.updatePassword = catchAsync(async function(req, res, next) {
    const user = await User.findById(req.user.id).select('+password')

    // check previous password
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if(!isMatched) {
        return next(new ErrorHandler('Invalid Password',400))
    }
    user.password = req.body.password
    await user.save()

    sendToken(user,200,res)
})

// Update User Profile --> /api/v1/me/update

exports.updateProfile = catchAsync(async function(req, res, next) {
    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    // Update avatar --> TODO
    // Update avatar
    if (req.body.avatar !== '') {
        const user = await User.findById(req.user.id)

        const image_id = user.avatar.public_id;
        const res = await cloudinary.v2.uploader.destroy(image_id);

        const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'avatars',
            width: 150,
            crop: "scale"
        })

        newUserData.avatar = {
            public_id: result.public_id,
            url: result.secure_url
        }
    }


    const user = await User.findByIdAndUpdate(req.user.id,newUserData,{
        new:true,
        runValidators: true,
        useFindAndModify:false
    })

    res.status(200).json({
        success: true,

    })
})



// logout a user -- api/v1/logout

exports.logout = catchAsync(async function(req, res, next) {
    res.cookie('token',null,{
        expires: new Date(Date.now()),
        httpOnly: true
    })
    res.status(200).json({
        success: true,
        messgage:'logged out sucessfully'
    })
})



// Admin Routes

// Get All users  --> /api/v1/admin/users

exports.allUsers = catchAsync(async function(req, res, next) {
    const users = await User.find();

    res.status(200).json({
        success: true,
        users
    })
})

// Get User Details --> /api/v1/admin/user/:id

exports.getUserDetails = catchAsync(async function(req, res, next) {
    const user = await User.findById(req.params.id);
    if(!user){
        return next(new ErrorHandler('User does not found with id ' + req.params.id));
    }
    res.status(200).json({
        success:true,
        user
    })
})

// update user => /api/v1/admin/user/:id
exports.updateUser = catchAsync(async function(req, res, next) {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role:req.body.role
    }

    const user = await User.findByIdAndUpdate(req.params.id,newUserData,{
        new:true,
        runValidators: true,
        useFindAndModify:false
    })

    res.status(200).json({
        success: true,

    })
})

// Delete user   =>   /api/v1/admin/user/:id
exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    // // Remove avatar from cloudinary
    // const image_id = user.avatar.public_id;
    // await cloudinary.v2.uploader.destroy(image_id);

    await user.remove();

    res.status(200).json({
        success: true,
    })
})


