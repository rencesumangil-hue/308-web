const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');

/* ============================= */
/* MULTER UPLOAD CONFIG */
/* ============================= */

const storage = multer.diskStorage({
destination:(req,file,cb)=>{
cb(null,'public/uploads/');
},
filename:(req,file,cb)=>{
cb(null,Date.now()+"-"+file.originalname);
}
});

const upload = multer({storage});

/* ============================= */
/* CHECK LOGIN BEFORE BOOKING */
/* ============================= */

router.get('/check',(req,res)=>{
if(!req.session.user){
return res.redirect('/login.html');
}

res.redirect('/booking.html');
});

/* ============================= */
/* GET USER BOOKINGS */
/* ============================= */

router.get('/my',(req,res)=>{

if(!req.session.user){
return res.json([]);
}

db.query(
"SELECT * FROM bookings WHERE user_id=? ORDER BY booking_date DESC",
[req.session.user.id],
(err,result)=>{

if(err){
console.log(err);
return res.json([]);
}

res.json(result);

});

});

/* ============================= */
/* CREATE BOOKING */
/* ============================= */

router.post('/create', upload.fields([
{name:'tattoo_reference'},
{name:'proof_of_payment'}
]), (req,res)=>{

if(!req.session.user){
return res.redirect('/login.html');
}

const user_id = req.session.user.id;
const {booking_date, booking_time, mobile_number, tattoo_area} = req.body;

const tattoo = req.files?.tattoo_reference?.[0]?.filename;
const proof = req.files?.proof_of_payment?.[0]?.filename;

/* ============================= */
/* CHECK DAILY LIMIT (MAX 6) */
/* ============================= */

db.query(
"SELECT COUNT(*) as total FROM bookings WHERE booking_date=? AND status!='Denied'",
[booking_date],
(err,result)=>{

if(err){
console.log(err);
return res.json({success:false});
}

if(result[0].total >= 6){
return res.json({
success:false,
message:"This date is already fully booked. Please choose another date."
});
}

/* ============================= */
/* CHECK SAME TIME SLOT (MAX 2) */
/* ============================= */

db.query(
"SELECT COUNT(*) as total FROM bookings WHERE booking_date=? AND booking_time=? AND status!='Denied'",
[booking_date,booking_time],
(err,result2)=>{

if(err){
console.log(err);
return res.json({success:false});
}

if(result2[0].total >= 2){
return res.json({
success:false,
message:"This time slot is already full."
});
}

/* ============================= */
/* INSERT BOOKING */
/* ============================= */

db.query(
`INSERT INTO bookings
(user_id,booking_date,booking_time,tattoo_reference,proof_of_payment,mobile_number,tattoo_area,status)
VALUES (?,?,?,?,?,?,?,?)`,
[user_id,booking_date,booking_time,tattoo,proof,mobile_number,tattoo_area,"Pending"],
(err)=>{

if(err){
console.log(err);
return res.json({success:false});
}

res.json({success:true});

});

});

});

});


/* DELETE BOOKING */


router.delete('/delete/:id',(req,res)=>{

if(!req.session.user){
return res.json({success:false});
}

const id = req.params.id;

db.query(
"DELETE FROM bookings WHERE id=?",
[id],
(err)=>{

if(err){
console.log(err);
return res.json({success:false});
}

res.json({success:true});

});

});




/* TOTAL BOOKINGS PER DATE */

router.get('/count/:date',(req,res)=>{

const date = req.params.date;

db.query(
"SELECT COUNT(*) as total FROM bookings WHERE booking_date=? AND status!='Denied'",
[date],
(err,result)=>{

if(err){
console.log(err);
return res.json({total:0});
}

res.json({total:result[0].total});

});

});

/* GET BOOKING TIMES FOR DATE */

router.get('/date-info/:date',(req,res)=>{

const date = req.params.date;

db.query(
`SELECT booking_time, users.fullname
FROM bookings
JOIN users ON bookings.user_id = users.id
WHERE booking_date=? AND status='Accepted'`,
[date],
(err,result)=>{

if(err){
console.log(err);
return res.json([]);
}

res.json(result);

});

});


router.get('/all',(req,res)=>{

db.query(
"SELECT * FROM bookings WHERE status='Accepted'",
(err,result)=>{

if(err){
console.log(err);
return res.json([]);
}


const fixed = result.map(r=>({
...r,
booking_date: new Date(r.booking_date).toLocaleDateString('en-CA')
}));

res.json(fixed);

});

});

function openGcash(){
    document.getElementById("gcashModal").style.display="flex";
}

function closeGcash(){
    document.getElementById("gcashModal").style.display="none";
}

module.exports = router;