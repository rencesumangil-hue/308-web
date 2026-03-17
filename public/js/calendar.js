let currentDate = new Date();
let allBookings = {};

/* ================= RENDER CALENDAR ================= */

function renderCalendar(){

const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");

calendar.innerHTML="";

const year = currentDate.getFullYear();
const month = currentDate.getMonth();

monthYear.innerText =
currentDate.toLocaleString("en-PH",{month:"long"}) + " " + year;

const firstDay = new Date(year,month,1).getDay();
const daysInMonth = new Date(year,month+1,0).getDate();

/* blank days */
for(let i=0;i<firstDay;i++){
calendar.innerHTML+="<div></div>";
}

/* create dates */
for(let day=1;day<=daysInMonth;day++){

const formattedDate =
year + "-" +
String(month+1).padStart(2,'0') + "-" +
String(day).padStart(2,'0');

const box = document.createElement("div");
box.className="calendar-day";
box.innerText=day;

/* TODAY + PAST LOGIC */
const today = new Date().toISOString().split('T')[0];

/* disable past */
if(formattedDate < today){
box.style.opacity="0.3";
box.style.pointerEvents="none";
}

/* highlight today */
if(formattedDate === today){
box.style.border="2px solid white";
}

/* IMPORTANT */
box.style.position="relative";

/* GET BOOKINGS */
const bookings = allBookings[formattedDate] || [];
const total = bookings.length;

/* APPLY STYLES (LOCK, COLORS, CLICK) */
applyBookingStyles(formattedDate, box, bookings, total);

calendar.appendChild(box);

}

}

/* ================= APPLY BOOKING STYLE ================= */

function applyBookingStyles(date, element, data, total){

/* COLOR SYSTEM */
if(total >=1 && total <=2){
element.style.background="#16a34a";
}
else if(total >=3 && total <=4){
element.style.background="#facc15";
}
else if(total >=5){
element.style.background="#dc2626";
}

/* FULL DAY LOCK */
if(total >=6){

element.style.background="#7f1d1d";
element.style.cursor="not-allowed";
element.style.opacity="0.85";

/* LOCK ICON */
const lock = document.createElement("span");
lock.innerText="🔒";

lock.style.position="absolute";
lock.style.top="4px";
lock.style.right="6px";
lock.style.fontSize="14px";

element.appendChild(lock);

return;
}

/* CLICK EVENT */
element.onclick=()=>{
showBookingModal(date,total,data);
};

}

/* ================= MODAL ================= */

function showBookingModal(date,total,data){

let html="";

if(total===0){
html="No bookings scheduled for this day.";
}else{

html="<b>Total Bookings: "+total+"</b><br><br>";

data.forEach(b=>{
html+=b.booking_time+"<br>";
});

}

const modal=document.createElement("div");

modal.innerHTML=`
<div style="
position:fixed;
top:0;
left:0;
width:100%;
height:100%;
background:rgba(0,0,0,0.65);
display:flex;
align-items:center;
justify-content:center;
z-index:9999;
">

<div style="
background:#0f0f0f;
padding:45px;
border-radius:14px;
text-align:center;
color:white;
min-width:320px;
transform:scale(1.15);
box-shadow:0 0 20px rgba(255,255,255,0.25);
">

<p style="font-size:15px;line-height:1.6;">
${html}
</p>

<button onclick="this.closest('div').parentElement.remove()"
style="
margin-top:20px;
padding:9px 22px;
background:#e53935;
border:none;
color:white;
border-radius:6px;
cursor:pointer;
font-weight:600;
">
Close
</button>

</div>
</div>
`;

document.body.appendChild(modal);

}

/* ================= PRELOAD BOOKINGS ================= */

async function preloadBookings(){

try{

const res = await fetch('/booking/all');
const data = await res.json();

allBookings = {};

data.forEach(b=>{
const date = b.booking_date;

if(!allBookings[date]){
allBookings[date]=[];
}

allBookings[date].push(b);
});

renderCalendar();

}catch(err){
console.log(err);
}

}

/* ================= NAVIGATION ================= */

function nextMonth(){
currentDate.setMonth(currentDate.getMonth()+1);
preloadBookings();
}

function prevMonth(){
currentDate.setMonth(currentDate.getMonth()-1);
preloadBookings();
}

/* ================= INIT ================= */

preloadBookings();

/* REALTIME UPDATE */
setInterval(()=>{
preloadBookings();
},3000);