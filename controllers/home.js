/**
 * GET /
 * Home page.
 */
exports.index = (req, res, next) => {
  res.render('home', {
    title: 'Home'
  });
};
