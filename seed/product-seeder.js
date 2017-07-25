const mongoose = require('mongoose');
const chalk = require('chalk');

const Product = require('../models/Product')

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://127.0.0.1:27017/test', {
    useMongoClient: true
});
mongoose.connection.on('error', (err) => {
    console.error(err);
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
});

let products = [new Product({
    imagePaths: ['http://via.placeholder.com/250x200', 'http://via.placeholder.com/200x150', 'http://via.placeholder.com/350x250']
    , title: 'Product'
    , price: 9.99
    , description: 'This is awesome product'
    , sizes: [1, 2, 3, 4]
    , colors: ['black', 'gray']
}), new Product({
    imagePaths: ['http://via.placeholder.com/250x200', 'http://via.placeholder.com/200x150', 'http://via.placeholder.com/350x250']
    , title: 'Product'
    , price: 9.99
    , description: 'This is awesome product'
    , sizes: [1, 2, 3, 4]
    , colors: ['black', 'gray']
}), new Product({
    imagePaths: ['http://via.placeholder.com/250x200', 'http://via.placeholder.com/200x150', 'http://via.placeholder.com/350x250']
    , title: 'Product'
    , price: 9.99
    , description: 'This is awesome product'
    , sizes: [1, 2, 3, 4]
    , colors: ['black', 'gray']
})]

let done = 0;

for (var i = 0; i < products.length; i++) {
    products[i].save()
        .then(r => {
            done++;
            if (done === products.length) mongoose.disconnect()
        })
        .catch(error => {
            console.error('%s Error' + error, chalk.red('✗'))
        })
}
