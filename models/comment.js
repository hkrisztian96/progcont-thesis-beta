var mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
    text: String,
    date: Object,
    isAccepted: Boolean,
    upvoters: [
    	{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
         }
    ],
    downvoters: [
	    	{
	            type: mongoose.Schema.Types.ObjectId,
	            ref: "User"
	         }
     ],
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

module.exports = mongoose.model("Comment", commentSchema);