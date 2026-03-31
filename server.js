require('dotenv').config();
process.env.TZ = 'Asia/Manila';

const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const helmet = require('helmet'); 
const csrf = require('csurf'); 
const cookieParser = require('cookie-parser'); 

const app = express();
const admin = require('firebase-admin');

/*  SECURITY  */

//  CLICKJACKING 
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);


app.use(
  helmet.frameguard({
    action: "deny"
  })
);

//  COOKIE PARSER FOR CSRF
app.use(cookieParser());

/*  STATIC  */

app.use('/uploads', express.static('uploads'));

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

/*  CSRF  */


const csrfProtection = csrf({ cookie: true });

//  TOKEN ROUTE 
app.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

/*  ROUTES  */

//  auth 
app.use('/auth', require('./routes/auth'));
app.use('/admin', csrfProtection, require('./routes/admin'));

//  booking csrf
app.use('/booking', require('./routes/booking'));

/*  ADMIN  */

app.get('/fix-admin', async (req,res)=>{

  const bcrypt = require('bcryptjs');

  const email = "admin@mlc.com";
  const password = "admin123";

  try{

    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;

    const hashed = await bcrypt.hash(password,10);

    await db.collection("users").doc(uid).update({
      password: hashed
    });

    res.send("Admin password fixed ");

  }catch(err){
    console.log(err);
    res.send(err.message);
  }

});

/* HOME  */

app.get('/',(req,res)=>{
  res.sendFile(path.join(__dirname,'public/index.html'));
});

app.get('/auth/status', (req, res) => {
    if(req.session.user){
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});

/*SERVER */

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
  console.log("🚀 Server running on port",PORT);
});