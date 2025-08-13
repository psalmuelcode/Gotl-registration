// ==== Firebase init ====
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

// ==== EmailJS init ====
emailjs.init("Ye5lGqLNRydJQrTgI");

// ==== Helpers ====
function toDocIdFromName(name) {
  return name.trim().replace(/\s+/g, " ").toLowerCase().replace(/\//g, "∕");
}

function debounce(fn, wait = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function setLoading(button, isLoading) {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `<span class="spinner"></span> Generating...`;
    button.disabled = true;
  } else {
    button.innerHTML = button.dataset.originalText || "Generate Ticket";
    button.disabled = false;
  }
}

// ==== DOM refs ====
const form = document.getElementById("registrationForm");
const submitBtn = form.querySelector('button[type="submit"]');
const nameInput = document.getElementById("name");
const nameStatus = document.getElementById("nameStatus");
const statusEl = document.getElementById("status");
const qrContainer = document.getElementById("qr");

let nameTaken = false;

// ==== Live name check ====
const checkNameAvailability = debounce(async () => {
  const raw = nameInput.value.trim();
  nameTaken = false;
  nameStatus.textContent = "";
  nameStatus.className = "hint";

  if (!raw) {
    submitBtn.disabled = false;
    return;
  }

  try {
    const docId = toDocIdFromName(raw);
    const snap = await db.collection("tickets").doc(docId).get();

    if (snap.exists) {
      nameTaken = true;
      nameStatus.textContent = "This name is already registered.";
      nameStatus.classList.add("error");
      submitBtn.disabled = true;
    } else {
      nameTaken = false;
      nameStatus.textContent = "Name is available.";
      nameStatus.classList.add("ok");
      submitBtn.disabled = false;
    }
  } catch (err) {
    console.error("Name check failed:", err);
  }
}, 400);

nameInput.addEventListener("input", checkNameAvailability);

// ==== Submit handler ====
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setLoading(submitBtn, true);
  statusEl.textContent = "";
  statusEl.style.color = "inherit";

  const rawName = nameInput.value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const church = document.getElementById("church").value.trim();
  const tickets = document.getElementById("tickets").value;

  if (!rawName || !email || !phone || !address || !tickets) {
    statusEl.textContent = "⚠️ Please fill out all required fields.";
    statusEl.style.color = "red";
    setLoading(submitBtn, false);
    return;
  }

  const docId = toDocIdFromName(rawName);
  const docRef = db.collection("tickets").doc(docId);

  try {
    // 🔒 Re-check inside transaction
    await db.runTransaction(async (t) => {
      const doc = await t.get(docRef);
      if (doc.exists) {
        throw new Error(`❌ The name "${rawName}" is already registered.`);
      }

      t.set(docRef, {
        name: rawName,
        email,
        phone,
        address,
        church,
        tickets,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    // ✅ Generate QR silently
    const qrData = `Ticket ID: ${docId}\nName: ${rawName}\nTickets: ${tickets}`;
    const temp = document.createElement("div");
    new QRCode(temp, { text: qrData, width: 200, height: 200 });

    const qrImg = temp.querySelector("img") || temp.querySelector("canvas");
    const qrBase64 = qrImg.tagName === "CANVAS" ? qrImg.toDataURL() : qrImg.src;

    // ✅ Send email with QR code
    await emailjs.send("service_mvkr18k", "template_76a336l", {
      to_email: email,
      to_name: rawName,
      ticket_id: docId,
      tickets,
      qr_code: qrBase64,
      message: `Ticket ID: ${docId}\nName: ${rawName}\nEmail: ${email}\nPhone: ${phone}\nTickets: ${tickets}\nChurch: ${church}\nAddress: ${address}`
    });

    statusEl.textContent = "✅ Ticket generated & email sent!";
    statusEl.style.color = "green";
    form.reset();
    nameStatus.textContent = "";
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.style.color = "red";
    console.error("Registration failed:", err);
  } finally {
    setLoading(submitBtn, false);
  }
});