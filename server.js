require('dotenv').config();
process.env.TZ = 'Asia/Manila'; 

const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use((req,res,next)=>{
    res.locals.user = req.session ? req.session.user : null;
    next();
});

app.use('/auth', require('./routes/auth'));
app.use('/booking', require('./routes/booking'));
app.use('/admin', require('./routes/admin'));
app.use('/schedule', require('./routes/schedule'));

app.get('/create-admin', async (req,res)=>{
    const hashed = await bcrypt.hash('admin123',10);

    db.query(
        "INSERT INTO users (fullname,email,password,role) VALUES (?,?,?,?)",
        ['Admin','admin@mlc.com',hashed,'admin'],
        ()=>{
            res.send("Admin Created");
        }
    );
});

app.get('/', (req,res)=>{
    res.sendFile(path.join(__dirname,'public/index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
  console.log(`Server running on port ${PORT}`);
});
