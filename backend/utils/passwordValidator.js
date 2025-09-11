const PasswordValidator = require('password-validator');


const schema = new PasswordValidator();

schema
  .is().min(8)                                    // Minimum length 8
  .is().max(50)                                   // Maximum length 50
  .has().uppercase()                              // Must have uppercase letters
  .has().lowercase()                              // Must have lowercase letters
  .has().digits(2)                                // Must have at least 2 digits
  .has().symbols()                                // Must have at least 1 special character
  .has().not().spaces();                          // Should not have spaces

module.exports = schema;
