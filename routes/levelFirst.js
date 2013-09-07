
/*
 * GET first level page.
 */

exports.index = function(req, res){
  res.render('levelFirst', { title: 'Filter First' });
};
