var mongoose = require("mongoose");

var questionSchema = new mongoose.Schema({
   title: String,
   link: String,
   questionString: String,
   isSolved: Boolean,
   expiration_date: Date,
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ]
});

module.exports = mongoose.model("Question", questionSchema);