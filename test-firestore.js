import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    console.log("Fetching...");
    await getDocs(collection(db, 'test'));
    console.log("Success");
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
