var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose"),
    UserSchema = new mongoose.Schema({
        username: String,
        password: String,
        role: String,
        points: Number
    });
    
UserSchema.plugin(passportLocalMongoose);
    
module.exports = mongoose.model("User", UserSchema);