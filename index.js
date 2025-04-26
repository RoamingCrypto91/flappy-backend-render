const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Submit Score Endpoint
app.post('/submit-score', async (req, res) => {
  const { username, score } = req.body;

  if (!username || typeof score !== 'number' || score < 0) {
    return res.status(400).send('Invalid request payload');
  }

  const scoreRef = db.collection('scores').doc(username);

  try {
    const doc = await scoreRef.get();

    if (!doc.exists) {
      await scoreRef.set({
        score: score,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.status(200).send('✅ Score created');
    }

    const existing = doc.data();
    if (score > existing.score) {
      await scoreRef.update({
        score: score,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.status(200).send('⬆️ High score updated');
    }

    return res.status(200).send('🛑 Lower score not saved');
  } catch (err) {
    console.error('Error writing score:', err);
    return res.status(500).send('❌ Server error');
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('Flappy backend is running!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
