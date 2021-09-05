const express = require('express');
const app = express();
const cookieparser = require('cookie-parser');
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const path = require('path')
// const dotenv = require('dotenv')

if (process.env.NODE_ENV !== 'PRODUCTION') require('dotenv').config({ path: 'backend/config/config.env' })

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieparser())
app.use(fileUpload());




const errormiddleware = require('./middlewares/error')
// dotenv.config({path: 'backend/config/config.env'})
// import all the  routes
const products = require('./routes/product')
const auth = require('./routes/auth')
const order = require('./routes/order')
const payment = require('./routes/payment')
app.use('/api/v1',products)
app.use('/api/v1',auth)
app.use('/api/v1',order)
app.use('/api/v1',payment)

app.use(express.static(path.join(__dirname, '../frontend/build')))
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'))
})
//Middle ware to handle errors
app.use(errormiddleware);
module.exports = app;