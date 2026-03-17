const express = require('express');
const router = express.Router();
const db = require('../config/db');
const path = require('path');

/* DASHBOARD PAGE */
router.get('/dashboard',(req,res)=>{

if(!req.session.user || req.session.user.role !== "admin"){
return res.redirect('/login.html');
}

res.sendFile(path.join(__dirname,'../public/admin.html'));

});

/* ALL BOOKINGS */
router.get('/bookings',(req,res)=>{

if(!req.session.user || req.session.user.role!=='admin'){
return res.json([]);
}

db.query(`
SELECT bookings.*, users.fullname
FROM bookings
JOIN users ON bookings.user_id = users.id
ORDER BY booking_date ASC
`,(err,result)=>{

if(err){
console.log(err);
return res.json([]);
}

res.json(result);

});

});

/* CALENDAR (ACCEPTED ONLY) */
router.get('/calendar',(req,res)=>{

db.query(`
SELECT DATE(booking_date) as booking_date, COUNT(*) as total
FROM bookings
WHERE status='Accepted'
GROUP BY DATE(booking_date)
`,(err,result)=>{

if(err){
console.log(err);
return res.json([]);
}

/* FORCE STRING FORMAT (ANTI TIMEZONE BUG) */
const fixed = result.map(r=>({
booking_date: r.booking_date.toISOString().split('T')[0],
total: r.total
}));

res.json(fixed);

});

});
/* UPDATE STATUS */
router.post('/update',(req,res)=>{
    const {id,status} = req.body;

    db.query(
        "UPDATE bookings SET status=? WHERE id=?",
        [status,id],
        (err,result)=>{
            if(err){
                console.log(err);
                return res.json({success:false});
            }

            if(result.affectedRows === 0){
                return res.json({success:false});
            }

            res.json({success:true});
        }
    );
});


router.post('/add-note',(req,res)=>{

const {id,note} = req.body;

db.query(
"UPDATE bookings SET admin_note=?, client_seen=0 WHERE id=?",
[note,id],
(err)=>{
if(err) return res.json({success:false});
res.json({success:true});
}
);

});


module.exports = router;

