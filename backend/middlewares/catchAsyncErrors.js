module.exports = func => function(req, res, next) {
    Promise.resolve(func(req, res, next)).catch(next);
}