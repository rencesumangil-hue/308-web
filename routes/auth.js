const express = require('express');
const router = express.Router();
const db = require('../config/db');

/* REGISTER */
router.post('/register',(req,res)=>{

const {fullname,email,password} = req.body;

db.query(
"INSERT INTO users (fullname,email,password) VALUES (?,?,?)",
[fullname,email,password],
(err)=>{

if(err){
console.log(err);
return res.json({
success:false,
message:"Email already exists"
});
}

return res.json({
success:true
});

}
);

});


/* LOGIN */
router.post('/login',(req,res)=>{

const {email,password} = req.body;

db.query(
"SELECT * FROM users WHERE email=?",
[email],
(err,result)=>{

if(err){
console.log("LOGIN DB ERROR:", err);
return res.json({
success:false,
message:"Database error"
});
}

if(!result || result.length === 0){
return res.json({
success:false,
message:"User not found"
});
}

const user = result[0];

// ✅ PLAIN TEXT CHECK
if(password !== user.password){
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


module.exports = router;