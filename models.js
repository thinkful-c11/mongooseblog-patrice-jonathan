'use strict';

const mongoose = require('mongoose');

const blogSchema = mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String, required: true},
  author: {
    firstName: String,
    lastName: String
  },
  created: {type: Date, default: Date.now}
});

blogSchema.virtual('nameString').get(function() {
  return `$(this.firstName) $(this.lastName)`.trim()
});

blogSchema.methods.apiRepr = function(){
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.nameString,
    created: this.created
  };
};

const Post = mongoose.model('Post', blogSchema);

module.exports = {Post};
