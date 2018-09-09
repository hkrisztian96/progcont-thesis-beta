var express = require("express");
var router = express.Router({mergeParams: true});
var Question = require("../models/question");
var Comment = require("../models/comment");
var middleware = require("../middleware/index");
var moment = require("moment");

//Comments New
router.get("/new", middleware.isLoggedIn, function(req, res){
    // find question by id
    Question.findById(req.params.id, function(err, question){
        if(err){
            console.log(err);
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
           console.log(err);
           res.redirect("/questions");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               //add username and id to comments and then save
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
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
        } else {
            req.flash("success", "Successfully edited comment");
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