//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const User = require("./models/User");
const Post = require("./models/Post");


const homeStartingContent ="IT IS DBMS PROJECT";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true})); 
app.use(express.json());
app.use(express.static("public"));

let posts = [];

app.use(session ({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/sample2DB", 
{useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);


passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/blog",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));


app.get("/", function(req, res) {
  Post.find({}).then((posts)=>{
    res.render("home", {startingContent: homeStartingContent, posts: posts, 
      aboutContent: aboutContent, contactContent: contactContent});
  });
});

app.get("/homeloggedin", function(req, res) {
  Post.find({}).then((posts)=>{
    res.render("homeloggedin", {startingContent: homeStartingContent, posts: posts, 
      aboutContent: aboutContent, contactContent: contactContent});
  });
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/blog", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/homeloggedin");
  });

app.get("/compose", function(req, res) {
  if (req.isAuthenticated()) {
      res.render("compose");
  } else {
      res.redirect("/login");
  }
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/posts/:anything", function(req, res) {

  const requestedTitle = req.params.anything;
  Post.find({title:requestedTitle}).then((post)=>{
      if (req.isAuthenticated()) 
      {
  const requestedTitle = _.lowerCase(req.params.anything);
  Post.find({title:requestedTitle}).then((post)=>{
      if (req.isAuthenticated()) 
      {
        console.log(post)
        res.render("loggedinpost", 
        {title: post[0].title, image: post[0].image, content: post[0].body, 
        comments: post[0].comments});  // change to post.comments
      } 
      else 
      {
        res.render("post", 
        {title: post[0].title, image: post[0].image, content: post[0].body, 
        comments: post[0].comments});//change to post.comments
      }
    }
  );
  });

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

// **** CREATING POST *****
app.post("/compose", function(req, res) {
  const newPost = new Post({
    title : req.body.postTitle,
    image : req.body.postImage,
    body : req.body.postBody,
    comments:[]
  });
  newPost.save((err,data)=>{
    if(err)
    {
      console.log(err);
      res.send('Post not saved');
      return err;
    }
    else
    {
      res.redirect("/homeloggedin");
    }
  })
  
});

// ******* Posting Comments ************
app.post("/posts/:anything", function(req, res) {
  const singlecomment = {
    postedcomment : req.body.postComment
  };


  let requestedTitle = req.params.anything;
  oldcomments = [];
  Post.find({title:requestedTitle}).then((post)=>{
    oldcomments = [...post[0].comments];
    //console.log(post[0].comments);
    newcomments=[]
  for(let i=0;i<oldcomments.length;i++)
  {
    let x = {postedcomment:oldcomments[i].postedcomment};
    newcomments.push(x);
  }
  newcomments.push(singlecomment);
  if (req.isAuthenticated()) 
  {
    Post.findOneAndUpdate({title:requestedTitle} ,{comments:newcomments},{returnOriginal:false},(err,result)=>{});
    res.redirect("/homeloggedin");   //change this
  } 
  else 
  {
    res.redirect("/login");
  }
});

  let requestedTitle = _.lowerCase(req.params.anything);

  posts.forEach(function(post) {
    const storedTitle = _.lowerCase(post.title);

    if(storedTitle === requestedTitle) {
      if (req.isAuthenticated()) {
        post.comment.push(singlecomment);
        res.redirect("/homeloggedin");   //change this
      } else {
        res.redirect("/login");
      }
    } 
  });
});

app.post("/register", function(req,res) {

  User.register({name: req.body.name, email: req.body.email, username: req.body.username}, req.body.password,
     function(err, user) {
      if(err) {
          console.log(err);
          res.redirect("/register");
      } else 
          passport.authenticate("local")(req, res, function() {
              res.redirect("/homeloggedin");
          });
      }
  });
});

app.post('/login',
  passport.authenticate('local', { successRedirect: '/homeloggedin',
    failureRedirect: '/login'})
);

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
