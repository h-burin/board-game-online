const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkPlayerAnswers(sessionId) {
  console.log(`\n🔍 Checking player_answers for session: ${sessionId}\n`);

  const answersRef = collection(db, `game_sessions/${sessionId}/player_answers`);
  const snapshot = await getDocs(answersRef);

  console.log(`Total documents: ${snapshot.docs.length}\n`);

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    console.log(`📄 Document ID: ${doc.id}`);
    console.log(`   - playerId: ${data.playerId}`);
    console.log(`   - answerIndex: ${data.answerIndex}`);
    console.log(`   - number: ${data.number}`);
    console.log(`   - answer: "${data.answer}"`);
    console.log(`   - submittedAt: ${data.submittedAt}`);
    console.log();
  });
}

// ใส่ session ID ที่คุณทดสอบ
const sessionId = process.argv[2] || '9afsXREFIg4LJGNqv0ww';
checkPlayerAnswers(sessionId).then(() => process.exit(0));
