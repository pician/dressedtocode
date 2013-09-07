var express = require('express');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var Facebook = require('facebook-node-sdk');

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
  friends: [{ type: mongoose.Schema.ObjectId, ref: 'Friend' }]
}));

var Friend = mongoose.model('Friend', new mongoose.Schema({
  fbId: String,
  name: String,
  sweaterKnitsTees: String,
  shirtsAndBlouses: String,
  denim: String,
  suitingAndBlazers: String,
  bra: String,
  panties: String,
  outerwear: String
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
    callbackURL: "http://shoplook.com:3000/auth/facebook/callback"
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
            gender: profile._json.gender
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

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/', failureRedirect: '/'
}));

app.get('/login', function(req, res) {
 res.redirect('/');
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/', function (req, res) {
  res.render('index', { user: req.user });
});

app.get('/friends', ensureAuthenticated, function(req, res) {
  req.facebook.api('/me/friends', function(err, friendList) {
    res.render('friends', { friends: friendList.data });
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
