const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/postback', (req, res) => {
    // Save transaction details to the database
    console.log(req.body);
    res.send('status=ok');
});

app.get('/thankyou', (req, res) => {
    res.send('Thank you for your payment!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
