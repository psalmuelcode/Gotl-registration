// =======================
// FIREBASE INITIALIZATION
// =======================
const firebaseConfig = {
  apiKey: "AIzaSyBi5kmYtQXv6E0PhNgjSAJ5IM5TQGr0mz4",
  authDomain: "gotl-tickets.firebaseapp.com",
  projectId: "gotl-tickets",
  storageBucket: "gotl-tickets.firebasestorage.app",
  messagingSenderId: "38187079914",
  appId: "1:38187079914:web:a9f73c32fa768e9cec1f93"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
console.log("Firebase initialized");

// =======================
// EMAILJS INITIALIZATION
// =======================
(function(){
  emailjs.init("Ye5lGqLNRydJQrTgI"); // Public key
})();
console.log("EmailJS initialized");

// =======================
// FORM SUBMISSION HANDLER
// =======================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrationForm");
  const qrContainer = document.getElementById("qr");
  const statusEl = document.getElementById("status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get form values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const church = document.getElementById("church").value.trim();
    const tickets = document.getElementById("tickets").value;

    if (!name || !email || !phone || !address || !tickets) {
      statusEl.textContent = "⚠️ Please fill out all required fields.";
      statusEl.style.color = "red";
      return;
    }

    try {
      // Save to Firestore
      const docRef = await db.collection("tickets").add({
        name,
        email,
        phone,
        address,
        church,
        tickets,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log("Ticket stored in Firestore with ID:", docRef.id);

      // Clear previous QR
      qrContainer.innerHTML = "";

      // Generate QR code and capture as Base64
      const qrData = `Ticket ID: ${docRef.id}\nName: ${name}\nTickets: ${tickets}`;
      const tempCanvas = document.createElement("canvas");
      new QRCode(tempCanvas, {
        text: qrData,
        width: 200,
        height: 200
      });

      // Extract Base64 PNG from canvas
      const qrImageBase64 = tempCanvas.querySelector("img").src;

      // Show QR code in page
      qrContainer.appendChild(tempCanvas.querySelector("img"));

      // Send email with EmailJS (including QR code image)
      await emailjs.send("service_mvkr18k", "template_76a336l", {
        to_email: email,
        to_name: name,
        ticket_id: docRef.id,
        tickets: tickets,
        qr_code: qrImageBase64
      });

      statusEl.textContent = "✅ Ticket generated & email sent!";
      statusEl.style.color = "green";
      form.reset();

    } catch (error) {
      console.error("Error generating ticket:", error);
      statusEl.textContent = "❌ Something went wrong. Please try again.";
      statusEl.style.color = "red";
    }
  });
});
