const products = require('../models/products');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const APIFeatures = require('../utils/apiFeatures')
const cloudinary = require('cloudinary')

const ErrorHandler = require('../utils/errorHandler');

// Get all products (Admin)  =>   /api/v1/admin/products
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {

    const product = await Products.find();

    res.status(200).json({
        success: true,
        product
    })

})

// Create new products  /api/v1/product/new
exports.newProduct = catchAsyncErrors(async function(req,res,next){
    let images = []
    if (typeof req.body.images === 'string') {
        images.push(req.body.images)
    } else {
        images = req.body.images
    }

    let imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: 'products'
        });

        imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url
        })
    }

    req.body.images = imagesLinks
    req.body.user = req.user.id;
    const product = await products.create(req.body)

    res.status(201).json({
        success: true,
        product
    })
})

exports.getProducts = catchAsyncErrors(async function (req,res,next){
    const resPerPage = 8;
    const productCount = await products.countDocuments();
    const apiFeatures = new APIFeatures(products.find(),req.query)
                                .search()
                                .filter()
                                
    let product = await apiFeatures.query;
    let filteredProductsCount = product.length;
    apiFeatures.pagination(resPerPage);
    product = await apiFeatures.query;
    
    res.status(200).json({
        sucess: true,
        productCount,
        resPerPage,
        filteredProductsCount,
        product
    })
})

// Get Single Product Details  /api/v1/products/:id

exports.getSingleProduct = catchAsyncErrors(async function (req, res, next){
    const product = await products.findById(req.params.id);

    if (! product) {
        return next(new ErrorHandler("Product not found",404))
    }
    res.status(200).json({
        sucess: true,
        product
    })
})

// Update the product  api/v1/products/id

exports.updateProduct = catchAsyncErrors(async function(req,res,next){
    let product = await products.findById(req.params.id);
    if (! product) {
        //  res.status(404).json({
        //     sucess: false,
        //     message: 'Product not found'
        return next(new ErrorHandler("Product not found",404))
        // })
        
    }
    product = await products.findOneAndUpdate(req.params.id,req.body,{
        new: true,
        runValidators:true,
        useFindAndModify:false,
    });
    res.status(200).json({
        success: true,
        product
    })
})

// Delete product /api/v1/admin/products/:id 

exports.deleteProduct = catchAsyncErrors(async function (req, res,next) {
    const product = await products.findById(req.params.id);
    if (!product) {
        // res.status(404).json({
        //     sucess: false,
        //     message: 'Product not found'
        // })
        return next(new ErrorHandler("Product not found",404))
        
    }
    await product.remove();
    res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
    })
})
// Create new review   =>   /api/v1/review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {

    const { rating, comment, productId } = req.body;

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment
    }

    const product = await products.findById(productId);

    const isReviewed = product.reviews.find(
        r => r.user.toString() === req.user._id.toString()
    )

    if (isReviewed) {
        product.reviews.forEach(review => {
            if (review.user.toString() === req.user._id.toString()) {
                review.comment = comment;
                review.rating = rating;
            }
        })

    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length
    }

    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true
    })

})
// Get Product Reviews   =>   /api/v1/reviews
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
    const product = await products.findById(req.query.id);

    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
})
// Delete Product Review   =>   /api/v1/reviews
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {

    const product = await products.findById(req.query.productId);

    const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());

    const numOfReviews = reviews.length;

    const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length

    await products.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })
})