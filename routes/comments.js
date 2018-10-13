var express = require("express");
var router = express.Router({mergeParams: true});
var Question = require("../models/question");
var Comment = require("../models/comment");
var User = require("../models/user");
var middleware = require("../middleware/index");
var moment = require("moment");

//Comments New
router.get("/new", middleware.isLoggedIn, function(req, res){
    // find question by id
    Question.findById(req.params.id, function(err, question){
        if(err){
        	req.flash("error", "Oops... Something went wrong");
        } else {
             res.render("comments/new", {question: question});
        }
    });
});

//Comments Create
router.post("/", middleware.isLoggedIn, middleware.isDeleted, middleware.isSolved, function(req, res){
   //lookup question using ID
   Question.findById(req.params.id, function(err, question){
       if(err){
           req.flash("error", "Oops... Something went wrong");
           res.redirect("/questions");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               //add username and id to comments and then save
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               comment.isAccepted = false;
               comment.date = moment();
               comment.save();
               
               question.comments.push(comment);
               question.save();
               req.flash("success", "Successfully added comment");
               res.redirect('/questions/' + question._id);
           }
        });
       }
   });
});

//showing EDIT FORM
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, comment) {
        if (err){
            res.redirect("back");
        } else {
            res.render("comments/edit", {question_id: req.params.id, comment: comment}); 
        }
    });
});

//COMMENTS UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if (err){
            res.redirect("back");
            req.flash("error", "Something went wrong while updating your comment");
        } else {
            req.flash("success", "Successfully edited comment");
            res.redirect("/questions/" + req.params.id);
        }
    });
});


//COMMENTS ACCEPT
router.put("/:comment_id/accept", middleware.checkQuestionOwnership, middleware.isCommentAcceptable, function(req, res){
  Comment.findByIdAndUpdate(req.params.comment_id, {isAccepted: true}, function(err, updatedComment){
      if (err){
    	  req.flash("error", "Oops... Something went wrong :(");
          res.redirect("back");
      } else {
    	  if (!req.user._id.equals(updatedComment.author.id)) { // points given only if it isn't the questioner's own comment
    		  // found comment author's points
	    	  User.findById(updatedComment.author.id, function(err, foundUser){
	    		  if (err){
	    	            req.flash("error", "Something went wrong :(");
	    	            return;
	    	      } else {
	    	    	  // increase comment author's points
	    	    	  foundUser.points += 5;
	    	    	  foundUser.save();
	    	      }
	    	  });
    	  }
    	  req.flash("success", "Successfully accepted comment");
          res.redirect("/questions/" + req.params.id);
      }
  });
});

//COMMENTS UNDO ACCEPT
router.put("/:comment_id/unaccept", middleware.checkQuestionOwnership, middleware.isCommentUnacceptable, function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, {isAccepted: false}, function(err, updatedComment){
	    if (err){
	  	  req.flash("error", "Oops... Something went wrong :(");
	        res.redirect("back");
	    } else {
	  	  if (!req.user._id.equals(updatedComment.author.id)) { // points decreased only if it isn't the questioner's own comment
	  		  // found comment author's points
		    	  User.findById(updatedComment.author.id, function(err, foundUser){
		    		  if (err){
		    	            req.flash("error", "Something went wrong :(");
		    	            return;
		    	      } else {
		    	    	  // increase comment author's points
		    	    	  foundUser.points -= 5;
		    	    	  foundUser.save();
		    	      }
		    	  });
	  	  }
	  	  req.flash("success", "Successfully undid comment acceptance");
	        res.redirect("/questions/" + req.params.id);
	    }
	});
});


//COMMENTS UPVOTE
router.get("/:comment_id/upvote", middleware.isLoggedIn, function(req, res){
	  Comment.findById(req.params.comment_id, function(err, foundComment){
	      if (err){
	    	  req.flash("error", "Oops... Something went wrong :(");
	          res.redirect("back");
	      } else {
	    	  if (!req.user._id.equals(foundComment.author.id) && foundComment.upvoters.indexOf(req.user._id) == -1) { // user can't upvote own and already liked comment
	    		  foundComment.upvoters.push(req.user); 
	    		  
	    		  // check if user already disliked and changed opinion
	    		  var indexOfDownvoter = foundComment.downvoters.indexOf(req.user._id);
	    		  var pointsPlus = 2;
	    		  if (indexOfDownvoter != -1) {
	    			  foundComment.downvoters.splice(indexOfDownvoter, 1);
	    			  pointsPlus = 5;
	    		  }
	    		  
	    		  User.findById(foundComment.author.id, function(err, foundUser){
		    		  if (err){
		    	            req.flash("error", "Something went wrong :(");
		    	            return;
		    	      } else {
		    	    	  // increase comment author's points
		    	    	  foundUser.points += pointsPlus;
		    	    	  foundUser.save();
		    	      }
		    	  });
	    		  
	    		  foundComment.save();
	    	  }
	    	  res.redirect("/questions/" + req.params.id);
	      }
	  });
});


//COMMENTS DOWNVOTE
router.get("/:comment_id/downvote", middleware.isLoggedIn, function(req, res){
	  Comment.findById(req.params.comment_id, function(err, foundComment){
	      if (err){
	    	  req.flash("error", "Oops... Something went wrong :(");
	          res.redirect("back");
	      } else {
	    	  if (!req.user._id.equals(foundComment.author.id) && foundComment.downvoters.indexOf(req.user._id) == -1) { // user can't downvote own and already disliked comment
	    		  foundComment.downvoters.push(req.user); 
	    		  
	    		  // check if user already liked and changed opinion
	    		  var indexOfUpvoter = foundComment.upvoters.indexOf(req.user._id);
	    		  var pointsMinus = 3;
	    		  if (indexOfUpvoter != -1) {
	    			  foundComment.upvoters.splice(indexOfUpvoter, 1);
	    			  pointsMinus = 5;
	    		  }
	    		  
	    		  User.findById(foundComment.author.id, function(err, foundUser){
		    		  if (err){
		    	            req.flash("error", "Something went wrong :(");
		    	            return;
		    	      } else {
		    	    	  // decrease comment author's points
		    	    	  if (foundUser.points - pointsMinus < 0)
		    	    		  foundUser.points = 0;
		    	    	  else
		    	    		  foundUser.points -= pointsMinus;
		    	    	  foundUser.save();
		    	      }
		    	  });
	    		  
	    		  foundComment.save();
	    	  }
	    	  res.redirect("/questions/" + req.params.id);
	      }
	  });
});


//COMMENTS UN-UPVOTE
router.get("/:comment_id/unupvote", middleware.isLoggedIn, function(req, res){
	  Comment.findById(req.params.comment_id, function(err, foundComment){
	      if (err){
	    	  req.flash("error", "Oops... Something went wrong :(");
	          res.redirect("back");
	      } else {
	    	  var indexOfUpvoter = foundComment.upvoters.indexOf(req.user._id);
	    	  if (indexOfUpvoter != -1) {
	    		  foundComment.upvoters.splice(indexOfUpvoter, 1);
	    		  foundComment.save();
	    	  }
	    	  
	    	  User.findById(foundComment.author.id, function(err, foundUser){
	    		  if (err){
	    	            req.flash("error", "Something went wrong :(");
	    	            return;
	    	      } else {
	    	    	  // increase comment author's points
	    	    	  if (foundUser.points - 2 < 0)
	    	    		  foundUser.points = 0;
	    	    	  else
	    	    		  foundUser.points -= 2;
	    	    	  foundUser.save();
	    	      }
	    	  });
	    	  
	    	  res.redirect("/questions/" + req.params.id);
	      }
	  });
});

//COMMENTS UN-DOWNVOTE
router.get("/:comment_id/undownvote", middleware.isLoggedIn, function(req, res){
	  Comment.findById(req.params.comment_id, function(err, foundComment){
	      if (err){
	    	  req.flash("error", "Oops... Something went wrong :(");
	          res.redirect("back");
	      } else {
	    	  var indexOfDownvoter = foundComment.downvoters.indexOf(req.user._id);
	    	  if (indexOfDownvoter != -1) {
	    		  foundComment.downvoters.splice(indexOfDownvoter, 1);
	    		  foundComment.save();
	    	  }
	    	  
	    	  User.findById(foundComment.author.id, function(err, foundUser){
	    		  if (err){
	    	            req.flash("error", "Something went wrong :(");
	    	            return;
	    	      } else {
	    	    	  // increase comment author's points
	    	    	  foundUser.points += 2;
	    	    	  foundUser.save();
	    	      }
	    	  });
	    	  
	    	  res.redirect("/questions/" + req.params.id);
	      }
	  });
});


//COMMENTS DESTROY
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if (err){
            res.redirect("back");
        } else {
            req.flash("success", "Comment deleted");
            res.redirect("/questions/" + req.params.id);
        }
    });
});


module.exports = router;