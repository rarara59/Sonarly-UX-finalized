const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

// Print only the first webhook payload
let first = true;

app.post('/webhook', (req, res) => {
  if (first) {
    console.log('🚨 First real payload:\n', JSON.stringify(req.body, null, 2));
    first = false;
  }
  res.status(200).send('ok');
});

app.listen(3000, () => {
  console.log('✅ Listening on http://localhost:3000/webhook');
});