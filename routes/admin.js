const express = require('express');
const router = express.Router();
const db = require('../config/db');
const path = require('path');

/* DASHBOARD */
router.get('/dashboard',(req,res)=>{

if(!req.session.user || req.session.user.role !== "admin"){
return res.redirect('/login.html');
}

res.sendFile(path.join(__dirname,'../public/admin.html'));

});

/* ALL BOOKINGS */
router.get('/bookings', async (req,res)=>{

if(!req.session.user || req.session.user.role!=='admin'){
return res.json([]);
}

const snapshot = await db.collection("bookings").get();

let result = [];

snapshot.forEach(doc=>{
result.push({
id: doc.id,
...doc.data()
});
});

res.json(result);

});

/* UPDATE STATUS */
router.post('/update', async (req,res)=>{
const {id,status} = req.body;

await db.collection("bookings").doc(id).update({
status: status
});

res.json({success:true});
});

/* ADD NOTE */
router.post('/add-note', async (req,res)=>{

const {id,note} = req.body;

await db.collection("bookings").doc(id).update({
admin_note: note,
client_seen: 0
});

res.json({success:true});

});


/* ================= CALENDAR DATA ================= */
router.get('/calendar', async (req,res)=>{

if(!req.session.user || req.session.user.role !== "admin"){
return res.json([]);
}

try{

const snapshot = await db.collection("bookings").get();

let result = {};

snapshot.forEach(doc=>{

const data = doc.data();

/* 🔥 ACCEPTED LANG */
if(data.status !== "Accepted") return;

/* 🔥 FIX DATE FORMAT */
const date = new Date(data.booking_date)
.toISOString()
.split('T')[0];

/* COUNT */
if(!result[date]) result[date] = 0;

result[date]++;

});

/* CONVERT TO ARRAY */
let final = [];

for(let d in result){
final.push({
booking_date: d,
total: result[d]
});
}

res.json(final);

}catch(err){
console.log("CALENDAR ERROR:", err);
res.json([]);
}

});

module.exports = router;