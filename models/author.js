var mongoose = require('mongoose');
const {DateTime} = require("luxon");

var Schema = mongoose.Schema;

var AuthorSchema = new Schema(
  {
    first_name: {type: String, required: true, maxLength: 100},
    family_name: {type: String, required: true, maxLength: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
  }
);

// Virtual for author's full name
AuthorSchema
.virtual('name')
.get(function () {
  return this.family_name + ', ' + this.first_name;
});

// Virtual for author's date_of_birth
AuthorSchema
.virtual('birth')
.get(function () {
    let birth_string = '';

    if(this.date_of_birth) birth_string = DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_SHORT);

    return birth_string;
})  

// Virtual for author's date_of_death
AuthorSchema
.virtual('death')
.get(function () {
  let death_string = '';

  if(this.date_of_death) death_string = DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_SHORT);

  return death_string;
})


// Virtual for author's lifespan
AuthorSchema
.virtual('lifespan')
.get(function () {
  let lifeTime_string = '';

  if (this.date_of_birth) lifeTime_string = DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_SHORT);

  lifeTime_string += ' - ';

  if (this.date_of_death) lifeTime_string += DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_SHORT);

  return lifeTime_string;

});

// Virtual for author's URL
AuthorSchema
.virtual('url')
.get(function () {
  return '/catalog/author/' + this._id;
});

//Export model
module.exports = mongoose.model('Author', AuthorSchema);

