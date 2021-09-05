const app = require('./app');
// const dotenv = require('dotenv')
const cloudinary = require('cloudinary')

// Handling uncaugth exceptions

process.on('uncaughtException', function(err){
    console.log("Error: " + err.message);
    console.log("shutting down server");
        process.exit(1);
})

const connectDB = require('./config/database')
// Setting up config file
if (process.env.NODE_ENV !== 'PRODUCTION') require('dotenv').config({ path: 'backend/config/config.env' })

// connecting to database 

connectDB();
const server = app.listen(process.env.PORT,function() {
    console.log("server started on port" + process.env.PORT+" in " + process.env.NODE_ENV + "mode");
})

// setting up the cloudinary

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

// Handle Unhandled promise rejection

process.on('unhandledRejection',err=> {
    console.log("Error:" + err.message);
    console.log("shutting down server");
    server.close(()=>{
        process.exit(1);
    });
})