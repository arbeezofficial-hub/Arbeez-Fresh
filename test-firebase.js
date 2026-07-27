import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json'));
console.log("config is", config);
