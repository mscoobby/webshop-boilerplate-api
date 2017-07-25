const Product = require('../models/Product')

/**
 * GET /
 * Home page.
 */
module.exports = {
    index: (req, res, next) => {
        Product.find()
            .select('imagePaths title price')
            .then(products => {
                res.render('shop', {
                    title: 'Shop'
                    , products
                });
            })
            .catch(next)
    }
    , preview: (req, res, next) => {
        Product.findById(req.params.id)
            .then(product => {
                res.render('preview', {
                    title: product.title
                    , product
                })
            })
            .catch(next)
    }
}
