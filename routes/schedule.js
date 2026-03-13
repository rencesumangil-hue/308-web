const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/status',(req,res)=>{
    db.query(`
        SELECT DATE_FORMAT(booking_date, '%Y-%m-%d') as booking_date,
        COUNT(*) as total
        FROM bookings
        WHERE status='Accepted'
        GROUP BY booking_date
    `,(err,result)=>{
        if(err){
            console.log(err);
            return res.json([]);
        }
        res.json(result);
    });
});

module.exports = router;