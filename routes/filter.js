
/*
 * GET filter page.
 */

exports.index = function(req, res){
  var filter = req.query.filter;

  var allData = {
    gender: [
      {title: 'Women', css: 'double bg-red'},
      {title: 'Men', css: 'double bg-blue'}
    ],

    women: [
    // sort friends by gender
    ],

    men: [
    // sort friends by gender
    ],

    brands: [
      {title: 'Gap',  filter: 'department', css: 'bg-red'},
      {title: 'Zara',  filter: 'department', css: 'bg-blue'},
      {title: 'Apple',  filter: 'department', css: 'bg-grey'},
      {title: 'Gucci',  filter: 'department', css: 'bg-green'},
      {title: 'Nike',  filter: 'department', css: 'bg-purple'},
      {title: 'H&M',  filter: 'department', css: 'bg-yellow'}
    ],

    department: [
      {title: 'Tops', filter: 'size', css: 'bg-red'},
      {title: 'Jeans', filter: 'size', css: 'bg-blue'},
      {title: 'Shoes', filter: 'size', css: 'bg-grey'},
      {title: 'Outerwear', filter: 'size', css: 'bg-green'},
      {title: 'Dresses', filter: 'size', css: 'bg-purple'},
      {title: 'Accessories', filter: 'size', css: 'bg-yellow'}
    ],

    size: [
      {title: 'X-Small', filter: 'gender', css: 'bg-red'},
      {title: 'Small', filter: 'gender', css: 'bg-blue'},
      {title: 'Medium', filter: 'gender', css: 'bg-grey'},
      {title: 'Large', filter: 'gender', css: 'bg-green'},
      {title: 'X-Large', filter: 'gender', css: 'bg-purple'},
      {title: '0-50', filter: 'gender', css: 'bg-yellow'}
    ]
  };

  var name = JSON.stringify(filter).capitalize();

  var pageData = {title: name, categories: allData[filter]};

  res.render('filter', pageData);
};
