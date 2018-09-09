var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var middleware = require("../middleware/index");
var Question = require("../models/question");
var moment = require("moment");

//root route
router.get("/", middleware.landingLogCheck,function(req, res){
    res.render("landing");
});

//handling login logic
router.post("/", function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { 
        req.flash("error", err.message);
        console.log(err);
        return res.redirect("/");
    }
    if (!user) { 
        req.flash("error", "Wrong username or password");
        return res.redirect("/");
    }
    req.logIn(user, function(err) {
      if (err) { 
        req.flash("error", err.message);
        console.log(err);
        return res.redirect("/");
      }
      return res.redirect('/questions');
    });
  })(req, res, next);
});


//show register form
router.get("/register", function(req, res) {
    res.render("register");
});

//handle sign up logic
router.post("/register", function(req, res) {
   User.register(new User({username: req.body.username, role: "USER", points: 0}), req.body.password, function(err, user){
       if (err){
           req.flash("error", err.message);
           console.log(err);
           return res.redirect("/register");
       }
       req.flash("success", "Successful Registration");
       res.redirect("/");
   }); 
});

//logout route
router.get("/logout", function(req, res) {
   req.logout();
   req.flash("success", "Logged You Out");
   res.redirect("/");
});

//show roles page
router.get("/roles", middleware.isAdmin, function(req, res){
	User.find({}, function(err, allUsers) {
		if (err)
			req.flash("error", "Something went wrong");
		res.render("roles", {users: allUsers});
	});
});


//change user role
router.put("/roles/:id", middleware.isAdmin, function(req, res) {
	User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser){
		if (err) {
			req.flash("error", "Something went wrong");
			return res.redirect("/roles");
		} 
		req.flash("success", "Successfully changed roles");
		res.redirect("/roles");
	});
});

module.exports = router;