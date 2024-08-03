const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const db = require('./db');
const axios = require('axios');
const config = require('./config');

const app = express();
const port = 3000; // or any port you prefer

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Postback URL endpoint
app.post('/postback', (req, res) => {
    const { digest, txnid, status, refno } = req.body;

    const merchant_statuses = {
        'P': 'Unpaid',
        'U': 'Unpaid',
        'F': 'Payment Failed',
        'S': 'Paid',
        'V': 'Cancelled',
        'R': 'Reversed',
    };

    if (!digest || !txnid || !status || !refno) {
        return res.status(400).send('result=missing_parameters');
    }

    if (!merchant_statuses.hasOwnProperty(status)) {
        return res.status(400).send(`result=invalid_status_${status}`);
    }

    const digestString = `${txnid}:${refno}:${status}:${config.secretKey}`;
    const digestCompare = crypto.createHash('sha1').update(digestString).digest('hex');

    if (digestCompare !== digest) {
        return res.status(400).send('result=digest_error');
    }

    db.query("SELECT * FROM transactions WHERE txnid = ?", [txnid], (err, results) => {
        if (err) {
            console.error('Database query error in SELECT:', err.message);
            return res.status(500).send('result=db_error');
        }

        if (results.length === 0) {
            return res.status(404).send('result=txn_not_found');
        }

        const merchant_status = merchant_statuses[status];
        if (results[0].status !== 'Paid' || status === 'S') {
            db.query("UPDATE transactions SET status = ?, refno = ? WHERE txnid = ?", [merchant_status, refno, txnid], (err) => {
                if (err) {
                    console.error('Database query error in UPDATE:', err.message);
                    return res.status(500).send('result=db_error');
                }
                return res.send('result=ok');
            });
        } else {
            return res.status(400).send('result=invalid_transition');
        }
    });
});

// Thank you page endpoint
app.get('/thankyou', (req, res) => {
    res.send('Thank you for your payment!');
});

// Endpoint to create a payment
app.post('/create_payment', async (req, res) => {
    const txnid = crypto.randomBytes(20).toString('hex');
    const url = `${config.baseUrl}${txnid}/post`;

    const data = {
        Amount: req.body.amount || '1234.00',
        Currency: req.body.currency || 'PHP',
        Description: req.body.description || 'Test Payment',
        Email: req.body.email || 'johnlouiecampos@gmail.com',
        Mode: req.body.mode || 2,
        ProcId: req.body.procId || '',
        Param1: req.body.param1 || 'Test parameter 1',
        Param2: req.body.param2 || 'Test parameter 2',
    };

    const json_payload = JSON.stringify(data);
    const auth = Buffer.from(`${config.testMerchantId}:${config.testApiKey}`).toString('base64');

    try {
        const response = await axios.post(url, json_payload, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${auth}`
            }
        });

        if (response.status === 401) {
            return res.status(401).send("Error: Unauthorized. Please check your API credentials.");
        }

        if (response.status === 400) {
            return res.status(400).send(`Error: ${response.data}`);
        }

        if (response.data && response.data.Url) {
            db.query("INSERT INTO transactions (txnid, refno, status, amount, currency, procid) VALUES (?, ?, 'P', ?, ?, ?)", [txnid, response.data.RefNo, data.Amount, data.Currency, data.ProcId], (err) => {
                if (err) {
                    console.error('Error storing transaction:', err.message);
                    return res.status(500).send('Error storing transaction');
                }
                res.redirect(response.data.Url);
            });
        } else {
            return res.status(400).send(`Error: ${response.data}`);
        }
    } catch (error) {
        console.error('Error in /create_payment:', error.message);
        return res.status(500).send('Error: ' + error.message);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
