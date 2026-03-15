require('dotenv').config();
process.env.TZ = 'Asia/Manila';

const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const app = express();

/* BODY PARSER */
app.use(express.json());
app.use(express.urlencoded({ extended:true }));

/* STATIC FILES */
app.use(express.static(path.join(__dirname,'public')));

/* SESSION */
app.use(session({
  secret: process.env.SESSION_SECRET || "tattoo-secret",
  resave:false,
  saveUninitialized:false,
  cookie:{
    secure:false,
    maxAge:1000 * 60 * 60 * 24
  }
}));

/* PASS USER TO VIEWS */
app.use((req,res,next)=>{
  res.locals.user = req.session?.user || null;
  next();
});

/* ROUTES */
app.use('/auth', require('./routes/auth'));
app.use('/booking', require('./routes/booking'));
app.use('/admin', require('./routes/admin'));

/* CREATE ADMIN (FIRST RUN ONLY) */
app.get('/create-admin', async (req,res)=>{

  const hashed = await bcrypt.hash('admin123',10);

  db.query(
    "INSERT INTO users (fullname,email,password,role) VALUES (?,?,?,?)",
    ['Admin','admin@mlc.com',hashed,'admin'],
    (err)=>{
      if(err){
        console.log(err);
        return res.send("Admin already exists");
      }

      res.send("Admin Created");
    }
  );

});

/* HOME PAGE */
app.get('/',(req,res)=>{
  res.sendFile(path.join(__dirname,'public/index.html'));
});

/* SERVER */
const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
  console.log("🚀 Server running on port",PORT);
});

