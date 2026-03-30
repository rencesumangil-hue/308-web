const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db'); // 🔥 Firestore
const axios = require('axios');
const admin = require('firebase-admin'); // 🔥 ADD

/* REGISTER */
router.post('/register', async (req,res)=>{

  const {fullname,email,password} = req.body;

  const regex = /^(?=.*[A-Z])(?=.*[\W_]).{7,}$/;

  if(!regex.test(password)){
    return res.redirect('/register.html?error=weak');
  }

  try{

    // 🔥 CREATE SA FIREBASE AUTH
    const userRecord = await admin.auth().createUser({
      email,
      password
    });

    const uid = userRecord.uid;

    // 🔥 HASH (KEEP MO OLD SYSTEM STYLE)
    const hashed = await bcrypt.hash(password,10);

    // 🔥 SAVE SA FIRESTORE
    await db.collection("users").doc(uid).set({
      fullname,
      email,
      password: hashed,
      role: "client",
      created_at: new Date()
    });

    res.redirect('/login.html?success=created');

  }catch(err){
    console.log(err);
    return res.redirect('/register.html?error=exists');
  }

});

/* LOGIN */
router.post('/login', async (req,res)=>{

  const {email,password, "g-recaptcha-response": captcha} = req.body;

  /*/ 🔥 CAPTCHA (UNCHANGED)
  if(!captcha){
    return res.redirect('/login.html?error=captcha');
  }

  try{
    const verify = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params:{
          secret:"6LfHXJksAAAAAMxdNfCzboIlYd0kBrLDyY0JxusO",
          response:captcha
        }
      }
    );

    if(!verify.data.success){
      return res.redirect('/login.html?error=captcha');
    }

  }catch(err){
    return res.redirect('/login.html?error=captcha');
  }*/

  try{

    // 🔥 CHECK SA FIREBASE AUTH
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;

    // 🔥 KUHA SA FIRESTORE
    const doc = await db.collection("users").doc(uid).get();

    if(!doc.exists){
      return res.redirect('/login.html?error=notfound');
    }

    const user = doc.data();

    // 🔥 PASSWORD CHECK (GAMIT OLD HASH MO)
    const match = await bcrypt.compare(password,user.password);

    if(!match){
      return res.redirect('/login.html?error=wrong');
    }

    req.session.user = {
      id: uid,
      email: user.email,
      fullname: user.fullname,
      role: user.role
    };

    if(user.role === "admin"){
      res.redirect('/admin/dashboard');
    }else{
      res.redirect('/');
    }

  }catch(err){
    console.log(err);
    return res.redirect('/login.html?error=notfound');
  }

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

/* CHECK EMAIL */
router.post('/check-email', async (req,res)=>{
  const {email} = req.body;

  const snapshot = await db.collection("users")
    .where("email","==",email)
    .get();

  if(snapshot.empty){
    return res.redirect('/forgot.html?error=notfound');
  }

  res.redirect(`/reset.html?email=${email}`);
});

/* RESET PASSWORD */
router.post('/reset-password', async (req,res)=>{
  const {email,password} = req.body;

  const hashed = await bcrypt.hash(password,10);

  const snapshot = await db.collection("users")
    .where("email","==",email)
    .get();

  if(snapshot.empty){
    return res.send("User not found");
  }

  const docId = snapshot.docs[0].id;

  await db.collection("users").doc(docId).update({
    password: hashed
  });

  res.redirect('/login.html?success=reset');
});

module.exports = router;