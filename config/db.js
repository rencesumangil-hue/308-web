const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  port: process.env.MYSQLPORT || process.env.DB_PORT,
  ssl: process.env.MYSQLHOST ? { rejectUnauthorized: false } : false
});

db.connect((err)=>{
  if(err){
    console.log("❌ DATABASE CONNECTION ERROR");
    console.log(err);
  }else{
    console.log("✅ MySQL Connected");
  }
});

module.exports = db;