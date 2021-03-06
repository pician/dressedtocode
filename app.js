var express = require('express');
var filter = require('./routes/filter')
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var Facebook = require('facebook-node-sdk');
var async = require('async');

var app = express();

// Connect to MongoDB
mongoose.connect('mongodb://sahat:shoplook@ds043368.mongolab.com:43368/shoplook', function(err) {
  if (err) {
    console.error('Error connecting to database');
    process.exit();
  } else {
    console.info('Database connection established');
  }
});

// User model
var User = mongoose.model('User', new mongoose.Schema({
  fbId: { type: String, index: { unique: true } },
  accessToken: String,
  displayName: String,
  first_name: String,
  last_name: String,
  username: String,
  link: String,
  gender: String,
  friends: [String], // string array of fbIds
  items: [{ type: mongoose.Schema.ObjectId, ref: 'Item' }]
}));

var Item = mongoose.model('Item', new mongoose.Schema({
  userId: { type: mongoose.Schema.ObjectId, ref: 'User' },
  brandName: String,
  categoryName: String,
  size: String,
  color: String
}));

passport.serializeUser(function(user, done) {
  done(null, user.fbId);
});

passport.deserializeUser(function(fbId, done) {
  User.findOne({ 'fbId': fbId }, function(err, user) {
    done(err, user);
  });
});

// Facebook Strategy Configuration
passport.use(new FacebookStrategy({
    clientID: '159067527627361',
    clientSecret: '41fba018b8986895be495d74922fae7e',
    //callbackURL: "http://shoplook.com:3000/auth/facebook/callback"
    callbackURL: "http://dressedtocode.herokuapp.com/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      User.findOne({ 'fbId': profile.id }, function(err, existingUser) {
        if(existingUser) {
          console.log('User: ' + existingUser.displayName + ' found and logged in!');
          done(null, existingUser);
        } else {
          console.log(accessToken);
          console.log(profile);
          var newUser = new User({
            fbId: profile.id,
            accessToken: accessToken,
            displayName: profile.displayName,
            first_name: profile._json.first_name,
            last_name: profile._json.last_name,
            username: profile._json.username,
            link: profile._json.link,
            gender: profile._json.gender,
            friends: populate(profile._json.friends.id)
          });
          newUser.save(function(err) {
            if(err) return err;
            console.log('New user: ' + newUser.displayName + ' created and logged in!');
            done(null, newUser);
          });
        }
      });
    });
  }
));

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(Facebook.middleware({ appId: '159067527627361', secret: '41fba018b8986895be495d74922fae7e' }));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/filter', filter.index);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/home', failureRedirect: '/'
}));


app.get('/', function (req, res) {
    if (req.user) {
      res.redirect('/home');
    } else {
      res.render('index', { user: req.user });
    }
});

app.get('/home', Facebook.loginRequired(), function (req, res) {
    var friends = [];
    req.facebook.api('/me/friends', function(err, friendList) {
      console.log(friendList);
      async.forEach(friendList.data, function(item, cb) {
        req.facebook.api('/' + item.id, function(err, friend) {
          friends.push(friend);
          cb();
        });
      }, function(err) {
         res.render('home', { friends: friends });
      });
    });
});

app.get('/user/:id', Facebook.loginRequired(), function (req, res) {
  req.facebook.api('/' + req.params.id, function(err, profile) {
    res.render('profile', { profile: profile });
  });
});

app.get('/login', function(req, res) {
 res.redirect('/');
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});



app.get('/filter_friends', Facebook.loginRequired(), function(req, res) {
  var friends = { women: [], men: [] };
  var gender = req.query.gender;
  console.log(gender);

  req.facebook.api('/me/friends?fields=gender,name', function(err, friendList) {
    async.forEach(friendList.data, function(item, cb) {
      req.facebook.api('/' + item.id, function(err, friend) {
        if(friend.gender == "female") {
          friends.women.push(friend);
        } else {
          friends.men.push(friend);
        }
        cb();
      });
    }, function(err) {
       if (gender === 'Women') {
         console.log('women')
         res.render('friends', { friends: friends.women });
       } else {
         console.log('men')
         res.render('friends', { friends: friends.men })
       }
    });
  });
});



app.get('/friends', Facebook.loginRequired(), function(req, res) {
  var friends = [];
  req.facebook.api('/me/friends', function(err, friendList) {
    async.forEach(friendList.data, function(item, cb) {
      req.facebook.api('/' + item.id, function(err, friend) {
        friends.push(friend);
        cb();
      });
    }, function(err) {
       res.render('friends', { friends: friends });
    });
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
