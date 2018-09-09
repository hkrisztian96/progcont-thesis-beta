var express = require("express");
var router = express.Router();
var Question = require("../models/question");
var middleware = require("../middleware/index");
var moment = require("moment");

//INDEX QUESTION
router.get("/", middleware.isLoggedIn, function(req, res){
    
  // Get all questions from DB
    Question.find({isSolved: false, expiration_date: null}, function(err, allQuestions){
       if(err){
           req.flash("error", "Something went wrong :(");
           console.log(err);
       } else {
          res.render("questions/index",{questions:allQuestions});
       }
    });
});

//INDEX - QBin
router.get("/deleted", middleware.isLoggedIn, function(req, res){
 
	  // Get all questions from DB
	    Question.find({isSolved: false, expiration_date: {$ne: null}}, function(err, allQuestions){
	       if(err){
	           req.flash("error", "Something went wrong :(");
	       } else {
	    	  var qBin = [];
	    	  allQuestions.forEach(function(question) {
	    		  if (moment() > question.expiration_date)
	    			  deleteQuestion(question);
	    		  else
	    			  qBin.push(question);
	    	  }); 
	          res.render("questions/qbin",{questions:qBin});
	       }
	    });
});

//INDEX - Solved
router.get("/solved", middleware.isLoggedIn, function(req, res){

	  // Get all questions from DB
	    Question.find({isSolved: true, expiration_date: null}, function(err, allQuestions){
	       if(err){
	           req.flash("error", "Something went wrong :(");
	       } else {
	          res.render("questions/solved",{questions:allQuestions});
	       }
	    });
});

//CREATE QUESTION
router.post("/", middleware.isLoggedIn, function(req, res){
  // get data from form and add to questions array
    var questionString = req.body.questionString;
    var link = req.body.link;
    var code = req.body.code;
    var isSolved = false;
    var expiration_date = null;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newQuestion = {questionString: questionString, link: link, code: code, isSolved: isSolved, expiration_date: expiration_date,  author: author};
    // Create a new question and save to DB
    Question.create(newQuestion, function(err, newlyCreated){
        if(err){
            req.flash("error", err.message);
            console.log(err);
        } else {
            req.flash("success", "Successfully added question");
            //redirect back to questions page
            res.redirect("/questions");
        }
    });
});

//SHOW NEW
router.get("/new", middleware.isLoggedIn, function(req, res) {
   res.render("questions/new"); 
});

// SHOW - shows more info about one question
router.get("/:id", middleware.isLoggedIn, function(req, res){
    //find the question with provided ID
    Question.findById(req.params.id).populate("comments").exec(function(err, foundQuestion){
        if(err){
            req.flash("error", "Something went wrong");
        } else {
            //render show template with that question
            res.render("questions/show", {question: foundQuestion});
        }
    });
});

//EDIT question route
router.get("/:id/edit", middleware.checkQuestionOwnership,function(req, res) {
    Question.findById(req.params.id, function(err, foundQuestion){
            res.render("questions/edit", {question: foundQuestion});      
    });
});

//UPDATE question route
router.put("/:id", middleware.checkQuestionOwnership,function(req, res){
    Question.findByIdAndUpdate(req.params.id, req.body.question, function(err, updatedQuestion){
        if (err){
            res.redirect("/questions");
        } else {
            req.flash("success", "Successfully edited question");
            res.redirect("/questions/" + req.params.id);
        }
    });
});

//RESTORE question route
router.put("/deleted/:id/restore", middleware.checkQuestionOwnership,function(req, res){
  Question.findByIdAndUpdate(req.params.id, {expiration_date: null}, function(err, updatedQuestion){
      if (err){
          res.redirect("/questions");
      } else {
          req.flash("success", "Successfully restored question");
          res.redirect("/questions/" + req.params.id);
      }
  });
});

//RESTORE question route
router.put("/solved/:id/restore", middleware.checkQuestionOwnership,function(req, res){
Question.findByIdAndUpdate(req.params.id, {isSolved: false}, function(err, updatedQuestion){
    if (err){
        res.redirect("/questions");
    } else {
        req.flash("success", "Successfully restored question");
        res.redirect("/questions/" + req.params.id);
    }
});
});

// Move Question to QBin
router.delete("/:id", middleware.checkQuestionOwnership, middleware.isDeleted, function(req, res){
    Question.findByIdAndUpdate(req.params.id, {expiration_date: moment().endOf('day')}, function(err, updatedQuestion){
        if (err){
            res.redirect("/questions");
        } else {
            req.flash("success", "Deleted Question moved to QBin");
            res.redirect("/questions");
        }
    });
});

// Move Question to Solved
router.put("/:id/solved", middleware.checkQuestionOwnership, middleware.isSolved, function(req, res){
    Question.findByIdAndUpdate(req.params.id, {isSolved: true}, function(err, updatedQuestion){
        if (err){
            res.redirect("/questions");
        } else {
            req.flash("success", "Question moved to Solved");
            res.redirect("/questions");
        }
    });
});


function deleteQuestion(question) {
	   Question.findByIdAndRemove(question._id, function(err){
		      if(err){
		    	  req.flash("error", "Something went wrong :(");
		          res.redirect("/questions");
		      }
		   });
} 

module.exports = router;