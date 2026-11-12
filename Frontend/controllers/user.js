
 const User = require('../models/user');




  exports.signup = (req, res, next) => {
   console.log(req.body.email)
         
        const user = new User({
           email: req.body.email,
           });
         user.save()
           .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
         .catch(error => {
  console.error("SIGNUP SAVE ERROR:", error);
  res.status(400).json({ error: error.message || error });
});
       
      
   };

