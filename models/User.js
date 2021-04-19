const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema ({
    name: String,
    email: String,
    username: String,
    password: String,
    googleId: String,
    userposts: [],
    usercomments: []
  });
  
  userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
  userSchema.plugin(findOrCreate);
  const User = new mongoose.model("User", userSchema);
  module.exports = User;