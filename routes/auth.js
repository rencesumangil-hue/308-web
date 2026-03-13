const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

router.post('/register', async (req,res)=>{
    const {fullname,email,password} = req.body;
    const hashed = await bcrypt.hash(password,10);

    db.query("INSERT INTO users (fullname,email,password) VALUES (?,?,?)",
    [fullname,email,hashed],
    (err)=>{
        if(err) return res.send("Email already exists");
        res.redirect('/login.html');
    });
});

router.post('/login',(req,res)=>{
    const {email,password} = req.body;

    db.query("SELECT * FROM users WHERE email=?",[email], async (err,result)=>{
        if(result.length===0) return res.send("User not found");

        const match = await bcrypt.compare(password,result[0].password);
        if(!match) return res.send("Wrong password");

        req.session.user = result[0];

        if(result[0].role==='admin'){
            res.redirect('/admin/dashboard');
        }else{
            res.redirect('/');
        }
    });
});

router.get('/status',(req,res)=>{
    if(req.session.user){
        res.json({loggedIn:true});
    } else {
        res.json({loggedIn:false});
    }
});

router.get('/logout',(req,res)=>{
    req.session.destroy(()=>{
        res.redirect('/');
    });
});

module.exports = router;