const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { throws } = require('assert');

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'please enter user name'],
        maxLength:[30,'Your Name cannot exceed 30 characters']
    },
    email:{
        type:String,
        required:[true,'please enter email'],
        unique:true,
        validate:[validator.isEmail,'Please Enter a valid Email Address']
    },
    password:{
        type:String,
        required:[true,'please enter password'],
        minlength:[6,'Your Password must be at least 6 characters long'],
        select:false
    },
    avatar:{
        public_id: {
            type:String,
            required:true
        },
        url:{
            type:String,
            required:true
        }
    },
    role:{
        type:String,
        default:'user'
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    resetPasswordToken:String,
    resetPasswordExpire:Date
})

// Encrypting password before Saving

userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        next();
    }
    this.password = await bcrypt.hash(this.password,10)
})

// Compare User Password 
userSchema.methods.comparePassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password)
}

// Return/generate  JSON web token 
userSchema.methods.getJwtTokens = function() {
    return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_TIME
    });
}

// Generate Password Recovery Token
userSchema.methods.getResetPasswordToken = function(){
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    // Hash and set to resetPasswordToken
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // set token expire time

    this.resetPasswordExpire = Date.now() + 30*60*1000; 
    return resetToken;
}

module.exports = mongoose.model('User',userSchema);