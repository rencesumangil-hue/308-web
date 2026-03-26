const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const axios = require('axios');

/* REGISTER */
router.post('/register', async (req,res)=>{

  const {fullname,email,password} = req.body;

  
  const regex = /^(?=.*[A-Z])(?=.*[\W_]).{7,}$/;

  if(!regex.test(password)){
    return res.redirect('/register.html?error=weak');
  }

  const hashed = await bcrypt.hash(password,10);

  db.query(
    "INSERT INTO users (fullname,email,password) VALUES (?,?,?)",
    [fullname,email,hashed],
    (err)=>{

      if(err){
        console.log(err);
        return res.redirect('/register.html?error=exists');
      }

      res.redirect('/login.html?success=created');

    }
  );

});

/* LOGIN */
router.post('/login', async (req,res)=>{

  const {email,password, "g-recaptcha-response": captcha} = req.body;

  // 🔥 CAPTCHA CHECK
  if(!captcha){
    return res.redirect('/login.html?error=captcha');
  }

  try{
    const verify = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params:{
          secret:"6LfHXJksAAAAAIf9Q21oSyJiNQYK6ajFV1eQq6BR", // secret key
          response:captcha
        }
      }
    );

    if(!verify.data.success){
      return res.redirect('/login.html?error=captcha');
    }

  }catch(err){
    return res.redirect('/login.html?error=captcha');
  }

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err,result)=>{

      if(err){
      console.log("LOGIN DB ERROR:", err);
      return res.status(500).send("Database error");
      }

      if(!result || result.length === 0){
        return res.redirect('/login.html?error=notfound');
      }

      const user = result[0];

      const match = await bcrypt.compare(password,user.password);

      if(!match){
        return res.redirect('/login.html?error=wrong');
      }

      req.session.user = {
        id:user.id,
        email:user.email,
        role:user.role
      };

      if(user.role === "admin"){
        res.redirect('/admin/dashboard');
      }else{
        res.redirect('/');
      }

    }
  );

});

/* CHECK LOGIN STATUS */
router.get('/status',(req,res)=>{
  if(req.session.user){
    res.json({loggedIn:true});
  }else{
    res.json({loggedIn:false});
  }
});

/* LOGOUT */
router.get('/logout',(req,res)=>{
  req.session.destroy(()=>{
    res.redirect('/');
  });
});

router.post('/check-email', (req,res)=>{
  const {email} = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    (err,result)=>{

      if(!result || result.length === 0){
        return res.redirect('/forgot.html?error=notfound');
      }

      // 👉 ipapasa natin email sa next page
      res.redirect(`/reset.html?email=${email}`);
    }
  );
});


router.post('/reset-password', async (req,res)=>{
  const {email,password} = req.body;

  const hashed = await bcrypt.hash(password,10);

  db.query(
    "UPDATE users SET password=? WHERE email=?",
    [hashed,email],
    (err)=>{
      if(err){
        console.log(err);
        return res.send("Error updating password");
      }

      res.redirect('/login.html?success=reset');
    }
  );
});

module.exports = router;