const product = require('../models/products');
const dotenv = require('dotenv');
const connectDatabase = require('../config/database');

const products = require('../data/product.json');
dotenv.config({ path: 'backend/config/config.env'});

connectDatabase();

const seedProducts = async function(){
    try {
        await product.deleteMany();
        console.log("Products successfully deleted");

        await product.insertMany(products);
        console.log("All Products are added successfully");
        process.exit();
    }
    catch(error){
        console.log(error.message);
        process.exit();
    }
}
seedProducts();

