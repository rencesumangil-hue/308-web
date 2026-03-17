const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

/* REGISTER */
router.post('/register', async (req,res)=>{

  const {fullname,email,password} = req.body;

  const hashed = await bcrypt.hash(password,10);

  db.query(
    "INSERT INTO users (fullname,email,password) VALUES (?,?,?)",
    [fullname,email,hashed],
    (err)=>{

      if(err){

        if(err.code === 'ER_DUP_ENTRY'){
          return res.json({
          success:false,
          message:"Email already exists"
        });
      }

      console.log(err);
      return res.json({
        success:false,
        message:"Database error"
      });
    }

      return res.json({
      success:true
      });

    }
  );

});

/* LOGIN */
router.post('/login', async (req,res)=>{

try{

const {email,password} = req.body;

db.query(
"SELECT * FROM users WHERE email=?",
[email],
async (err,result)=>{

if(err){
console.log("DB ERROR:", err);
return res.json({
success:false,
message:"Server error"
});
}

if(!result || result.length === 0){
return res.json({
success:false,
message:"User not found"
});
}

const user = result[0];

// ✅ SAFETY CHECK
if(!user.password){
return res.json({
success:false,
message:"Invalid account"
});
}

let match = false;

try{
match = await bcrypt.compare(password,user.password);
}catch(e){
console.log("BCRYPT ERROR:", e);
return res.json({
success:false,
message:"Server error"
});
}

if(!match){
return res.json({
success:false,
message:"Wrong password"
});
}

req.session.user = {
id:user.id,
email:user.email,
role:user.role
};

if(user.role === "admin"){
return res.json({
success:true,
redirect:"/admin/dashboard"
});
}else{
return res.json({
success:true,
redirect:"/"
});
}

});

}catch(e){
console.log("LOGIN CRASH:", e);
return res.json({
success:false,
message:"Server error"
});
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

module.exports = router;