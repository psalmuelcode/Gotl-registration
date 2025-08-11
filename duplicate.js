// // 1. Import Firebase Admin SDK
// const admin = require('firebase-admin');

// // 2. Initialize Firebase Admin (make sure you are authenticated)
// admin.initializeApp({
//   credential: admin.credential.applicationDefault(), // Use gcloud CLI auth or replace with cert if needed
// });

// // 3. Get Firestore DB instance
// const db = admin.firestore();

// // 4. Function to delete duplicate emails
// async function deleteDuplicates() {
//   const collectionRef = db.collection('attendees'); // ✅ Your real collection name
//   const snapshot = await collectionRef.get();

//   const seenEmails = new Set();
//   const deletes = [];

//   snapshot.forEach(doc => {
//     const data = doc.data();
//     const email = data.email?.toLowerCase()?.trim();

//     if (!email) return; // skip if email is missing

//     if (seenEmails.has(email)) {
//       deletes.push(doc.ref.delete());
//     } else {
//       seenEmails.add(email);
//     }
//   });

//   await Promise.all(deletes);
//   console.log(`✅ Deleted ${deletes.length} duplicate attendees.`);
// }

// // 5. Run
// deleteDuplicates().catch(console.error);
