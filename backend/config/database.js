const mongoose = require('mongoose');
const connectDatabase = function(){
    mongoose.connect(process.env.DB_URI,{
        useNewUrlParser:true,
        useUnifiedTopology:true,
        useCreateIndex:true
    }).then(con => {
        console.log("connected successfully to "+con.connection.host);
    })
}

module.exports = connectDatabase;