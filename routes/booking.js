const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');

const storage = multer.diskStorage({
destination:(req,file,cb)=>{
cb(null,'public/uploads/');
},
filename:(req,file,cb)=>{
cb(null,Date.now()+"-"+file.originalname);
}
});

const upload = multer({storage});

/* CHECK LOGIN */
router.get('/check',(req,res)=>{
if(!req.session.user){
return res.redirect('/login.html');
}
res.redirect('/booking.html');
});

/* GET USER BOOKINGS */
router.get('/my', async (req,res)=>{

if(!req.session.user){
return res.json([]);
}

try{

const snapshot = await db.collection("bookings")
.where("user_id","==",req.session.user.id)
.get();

let result = [];

snapshot.forEach(doc=>{
result.push({
id: doc.id,
...doc.data()
});
});

res.json(result);

}catch(err){
console.log(err);
res.json([]);
}

});

/* CREATE BOOKING */
router.post('/create', upload.fields([
{ name:'tattoo_reference', maxCount:1 },
  { name:'proof_of_payment', maxCount:1 }
]), async (req,res)=>{

if(!req.session.user && !req.body.user_id){
  return res.json({ success:false, message:"Not logged in" });
}

try{

const user_id = req.body.user_id || req.session?.user?.id;
const {booking_date, booking_time, mobile_number, tattoo_area} = req.body;

//  FIX DATE FORMAT
const formattedDate = new Date(booking_date).toISOString().split("T")[0];

const tattoo = req.files?.tattoo_reference?.[0]?.filename;
const proof = req.files?.proof_of_payment?.[0]?.filename || null;



/*  DAILY LIMIT */
const sameDaySnap = await db.collection("bookings")
.where("booking_date","==",formattedDate)
.get();

let validDay = [];

sameDaySnap.forEach(doc=>{
const status = doc.data().status;

if(status === "Pending" || status === "Accepted"){
  validDay.push(doc);
}
});

if(validDay.length >= 3){
return res.json({
success:false,
message:"This date is already fully booked."
});
}

/* 🔥 TIME SLOT LIMIT */
const sameTimeSnap = await db.collection("bookings")
.where("booking_date","==",formattedDate)
.where("booking_time","==",booking_time)
.get();

let validTime = [];

sameTimeSnap.forEach(doc=>{
const status = doc.data().status;

if(status === "Pending" || status === "Accepted"){
  validTime.push(doc);
}
});

if(validTime.length >= 2){
return res.json({
success:false,
message:"This time slot is already full."
});
}

/* INSERT */
await db.collection("bookings").add({
  fullname: req.body.fullname || "Unknown",
  user_id,
  booking_date: formattedDate,
  booking_time,
  tattoo_reference: tattoo,
  proof_of_payment: proof,
  mobile_number,
  tattoo_area,
  status: "Pending",
  created_at: new Date()
});

res.json({success:true});

}catch(err){
console.log("BOOKING ERROR:", err);
res.json({success:false});
}

});

/* DELETE */
router.delete('/delete/:id', async (req,res)=>{

if(!req.session.user){
return res.json({success:false});
}

try{

const id = req.params.id;

await db.collection("bookings").doc(id).delete();

res.json({success:true});

}catch(err){
console.log(err);
res.json({success:false});
}

});

/* ALL BOOKINGS (FOR CALENDAR) */
router.get('/all', async (req,res)=>{

try{

const snapshot = await db.collection("bookings")
.where("status","==","Accepted")
.get();

let result = [];

snapshot.forEach(doc=>{

const data = doc.data();

/* 🔥 FILTER LANG */
if(data.status !== "Pending" && data.status !== "Accepted") return;

result.push({
id: doc.id,
...data
});


});

res.json(result);

}catch(err){
console.log(err);
res.json([]);
}

});


/* GET BOOKINGS BY DATE (FOR ADMIN CALENDAR MODAL) */
router.get('/date-info/:date', async (req,res)=>{

try{

const date = req.params.date;

const snapshot = await db.collection("bookings")
.where("booking_date","==",date)
.get();

let result = [];

snapshot.forEach(doc=>{

const data = doc.data();

/* REMOVE FINISHED + DENIED */
if(data.status !== "Accepted") return;

result.push({
id: doc.id,
...data
});

});

res.json(result);

}catch(err){
console.log("DATE INFO ERROR:", err);
res.json([]);
}

});

module.exports = router;