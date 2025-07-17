 

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBi5kmYtQXv6E0PhNgjSAJ5IM5TQGr0mz4",
  authDomain: "gotl-tickets.firebaseapp.com",
  projectId: "gotl-tickets",
  storageBucket: "gotl-tickets.firebasestorage.app",
  messagingSenderId: "38187079914",
  appId: "1:38187079914:web:a9f73c32fa768e9cec1f93"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


const form = document.getElementById("ticketForm");
const qrDiv = document.getElementById("qr");
const statusText = document.getElementById("status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const address = document.getElementById("address").value;
  const church = document.getElementById("church").value;
  const tickets = document.getElementById("tickets").value;

  try {

const attendeesRef = collection(db, "attendees");
const existingQuery = query(attendeesRef, where("email", "==", email));
const existingSnap = await getDocs(existingQuery);

// if (!existingSnap.empty) {
//   statusText.innerText = "❌ You’ve already registered with this email.";
//   return;
// }

// If not found, proceed to add new doc
const docRef = await addDoc(attendeesRef, {
  name,
  email,
  phone,
  address,
  church,
  tickets,
  createdAt: new Date()
});

    const uniqueId = docRef.id;

    // Use unique ID for QR data
    const qrData = uniqueId;

    // Clear previous QR
    qrDiv.innerHTML = "";

    // Generate QR
    new QRCode(qrDiv, {
      text: qrData,
      width: 200,
      height: 200,
    });

    // Convert QR canvas to base64 image
    setTimeout(() => {
      const qrImg = qrDiv.querySelector("img")?.src || qrDiv.querySelector("canvas")?.toDataURL();

      const ticketInfo = `GOTL 4.0 Ticket\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nHome Address: ${address}\nChurch: ${church}\nTickets: ${tickets}`;
      
      
      console.log("Sending to email:", email);
      statusText.innerText = "📧 Sending ticket to your email...";
      emailjs.send("service_mvkr18k", "template_76a336l", {
        to_name: name,
        to_email: email,
        message: ticketInfo + `\n\nScan this QR at the gate: ${uniqueId}`,
        qr_image: qrImg
      })
      .then(() => {
        statusText.innerText = "✅ Ticket sent to your email!";
      })
      .catch((error) => {
        console.error("Email error:", error);
        statusText.innerText = "❌ Failed to send email.";
      });
    }, 1000);

  } catch (error) {
    console.error("Error saving data:", error);
    statusText.innerText = "❌ Something went wrong. Please try again.";
  }
});
