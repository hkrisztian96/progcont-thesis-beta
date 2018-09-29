var middlewareObj = {};
var Question = require("../models/question");
var Comment = require("../models/comment");

middlewareObj.checkQuestionOwnership = function(req, res, next){
    if (req.isAuthenticated()){
        Question.findById(req.params.id, function(err, foundQuestion) {
           if (err){
               res.redirect("back");
           } else {
               if (foundQuestion.author.id.equals(req.user._id)){
                   next();
               } else {
                   req.flash("error", "You don't have permission to do that");
                   res.redirect("/questions/" + req.params.id);
               }
           }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back"); 
    }
};
    

middlewareObj.checkCommentOwnership = function(req, res, next){
    if (req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment) {
           if (err){
               req.flash("error", "Question Not Found");
               res.redirect("back");
           } else {
               if (foundComment.author.id.equals(req.user._id)){
                   next();
               } else {
                   req.flash("error", "You don't have permission to do that");
                   res.redirect("back");
               }
           }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back"); 
    }
};

middlewareObj.isLoggedIn = function(req, res, next){
    if (req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
};

middlewareObj.landingLogCheck = function(req, res, next){
    if (!req.isAuthenticated())
        return next();
    req.flash("error", "You're already logged in");
    res.redirect("/questions");
}

middlewareObj.isAdmin = function(req, res, next){
    if (req.isAuthenticated() && req.user.role === "ADMIN"){
        return next();
    }
    req.flash("error", "You don't have permission to do that");
    res.redirect("/questions");
};

middlewareObj.isDeleted = function(req, res, next){
	Question.findById(req.params.id, function(err, question){
		if (err) {
			req.flash("error", "Something went wrong :(");
			res.redirect("back");
		}
		else if (question.expiration_date == null)
			return next();
		req.flash("error", "This question is already in the QBin");
		res.redirect("back");
	});	
}

middlewareObj.isSolved = function(req, res, next){
	Question.findById(req.params.id, function(err, question){
		if (err) {
			req.flash("error", "Something went wrong :(");
			res.redirect("back");
		}
		else if (question.isSolved == false)
			return next();
		req.flash("error", "This question is already marked as solved");
		res.redirect("back");
	});	
}

middlewareObj.isCommentAccepted = function(req, res, next){
	Comment.findById(req.params.comment_id, function(err, foundComment){
		if (err) {
			req.flash("error", "Something went wrong :(");
		} else {
			if (foundComment.isAccepted == false)
				return next();
			req.flash("error", "This comment is already marked as accepted");
			res.redirect("back");
		}
	});
}

middlewareObj.isEditingOwnAccount = function(req, res, next){
	if (!req.user._id.equals(req.params.id)) {
		req.flash("error", "You are able to edit your own account only.");
		res.redirect("back");
	} else
		return next();
}

module.exports = middlewareObj;