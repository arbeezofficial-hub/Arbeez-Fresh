import express from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default PayU Sandbox Credentials if env not provided
const PAYU_KEY = process.env.PAYU_MERCHANT_KEY || 'JP421p';
const PAYU_SALT = process.env.PAYU_MERCHANT_SALT || 'pb7GeLyc';
const PAYU_ENV = process.env.PAYU_ENV || 'test'; // 'test' or 'production'

const PAYU_ACTION_URL = PAYU_ENV === 'production'
  ? 'https://secure.payu.in/_payment'
  : 'https://test.payu.in/_payment';

/**
 * SHA-512 Request Hash Generator for PayU India
 * Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 */
function generateRequestHash({
  key,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  udf1 = '',
  udf2 = '',
  udf3 = '',
  udf4 = '',
  udf5 = '',
  salt
}: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  salt: string;
}): string {
  const hashSequence = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  return crypto.createHash('sha512').update(hashSequence).digest('hex');
}

/**
 * SHA-512 Response Hash Verifier for PayU India
 * Formula: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * If additionalCharges is present: sha512(additionalCharges|SALT|status|...)
 */
function verifyResponseHash({
  key,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  udf1 = '',
  udf2 = '',
  udf3 = '',
  udf4 = '',
  udf5 = '',
  status,
  additionalCharges,
  salt,
  receivedHash
}: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  status: string;
  additionalCharges?: string;
  salt: string;
  receivedHash: string;
}): { isValid: boolean; calculatedHash: string; receivedHash: string } {
  let hashSequence = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  if (additionalCharges) {
    hashSequence = `${additionalCharges}|${hashSequence}`;
  }

  const calculatedHash = crypto.createHash('sha512').update(hashSequence).digest('hex');
  return {
    isValid: calculatedHash.toLowerCase() === (receivedHash || '').toLowerCase(),
    calculatedHash,
    receivedHash
  };
}

// ----------------------------------------------------------------------
// PAYU GATEWAY ENDPOINTS
// ----------------------------------------------------------------------

/**
 * GET /api/payu/config
 * Returns public configuration for PayU frontend checkout
 */
app.get('/api/payu/config', (_req, res) => {
  res.json({
    status: 'ok',
    merchantKey: PAYU_KEY,
    payuEnv: PAYU_ENV,
    actionUrl: PAYU_ACTION_URL,
    isMocking: !process.env.PAYU_MERCHANT_KEY
  });
});

/**
 * POST /api/payu/hash
 * Generates transaction ID, PayU payload parameters, and server-side SHA-512 hash
 */
app.post('/api/payu/hash', (req, res) => {
  try {
    const { amount, productinfo, firstname, email, phone, udf1, udf2, udf3, udf4, udf5, paymentMethod } = req.body;

    if (!amount || !productinfo || !firstname || !email) {
      return res.status(400).json({ error: 'Missing required parameters: amount, productinfo, firstname, email' });
    }

    const formattedAmount = Number(amount).toFixed(2);
    const txnid = `txnid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const hash = generateRequestHash({
      key: PAYU_KEY,
      txnid,
      amount: formattedAmount,
      productinfo,
      firstname,
      email,
      udf1: udf1 || '',
      udf2: udf2 || '',
      udf3: udf3 || '',
      udf4: udf4 || '',
      udf5: udf5 || '',
      salt: PAYU_SALT
    });

    res.json({
      success: true,
      payuPayload: {
        key: PAYU_KEY,
        txnid,
        amount: formattedAmount,
        productinfo,
        firstname,
        email,
        phone: phone || '9999999999',
        surl: `/api/payu/callback`,
        furl: `/api/payu/callback`,
        hash,
        udf1: udf1 || '',
        udf2: udf2 || '',
        udf3: udf3 || '',
        udf4: udf4 || '',
        udf5: udf5 || '',
        pg: paymentMethod === 'upi' ? 'UPI' : (paymentMethod === 'card' ? 'CC' : 'NB'),
        actionUrl: PAYU_ACTION_URL
      }
    });
  } catch (error: any) {
    console.error('Error generating PayU hash:', error);
    res.status(500).json({ error: 'Failed to generate PayU hash signature' });
  }
});

/**
 * POST /api/payu/verify
 * Verifies transaction signature and payment status from PayU gateway response
 */
app.post('/api/payu/verify', (req, res) => {
  try {
    const {
      key = PAYU_KEY,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1 = '',
      udf2 = '',
      udf3 = '',
      udf4 = '',
      udf5 = '',
      status,
      additionalCharges,
      hash: receivedHash
    } = req.body;

    if (!txnid || !amount || !status || !receivedHash) {
      return res.status(400).json({ error: 'Invalid PayU response payload for verification' });
    }

    const formattedAmount = Number(amount).toFixed(2);

    const { isValid, calculatedHash } = verifyResponseHash({
      key: key || PAYU_KEY,
      txnid,
      amount: formattedAmount,
      productinfo: productinfo || 'Arbeez Fresh Order',
      firstname: firstname || 'Customer',
      email: email || 'customer@arbeez.com',
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      status,
      additionalCharges,
      salt: PAYU_SALT,
      receivedHash
    });

    const isSuccess = status.toLowerCase() === 'success' && isValid;

    res.json({
      verified: isSuccess,
      status,
      isValidSignature: isValid,
      txnid,
      amount: formattedAmount,
      calculatedHash,
      receivedHash,
      gatewayMessage: isSuccess ? 'Payment verified successfully by PayU Backend' : 'Payment signature or status verification failed'
    });
  } catch (error: any) {
    console.error('Error verifying PayU payment:', error);
    res.status(500).json({ error: 'Failed to perform backend payment verification' });
  }
});

/**
 * POST /api/payu/callback
 * Handles PayU form submit callbacks or webhook notifications
 */
app.post('/api/payu/callback', (req, res) => {
  const payuData = req.body;
  console.log('Received PayU Callback:', payuData);
  
  const status = payuData.status || 'failed';
  const txnid = payuData.txnid || '';
  const amount = payuData.amount || '';
  const mihpayid = payuData.mihpayid || '';

  // Return HTML response redirecting back to application with URL query params
  res.send(`
    <!Server Response>
    <html>
      <head><title>PayU Payment Processing</title></head>
      <body>
        <p>Processing payment callback from PayU India...</p>
        <script>
          const result = {
            status: "${status}",
            txnid: "${txnid}",
            amount: "${amount}",
            mihpayid: "${mihpayid}",
            hash: "${payuData.hash || ''}"
          };
          if (window.opener) {
            window.opener.postMessage({ type: 'PAYU_RESPONSE', data: result }, '*');
            window.close();
          } else {
            window.location.href = "/checkout?status=" + status + "&txnid=" + txnid;
          }
        </script>
      </body>
    </html>
  `);
});

// ----------------------------------------------------------------------
// FIREBASE CLOUD MESSAGING & NOTIFICATION SERVER DISPATCH
// ----------------------------------------------------------------------

async function saveNotificationToFirestore(notif: {
  id: string;
  userId: string;
  role: string;
  title: string;
  message: string;
  type: string;
  orderId?: string;
  createdAt: number;
}) {
  const projectId = 'ornate-being-qwjrd';
  const databaseId = 'ai-studio-70d5a8d0-3f85-4ed6-bbcf-ad93c5750d48';
  const apiKey = 'AIzaSyCJ2K7hlsVwDCmnHMNK_R-pQj29ucZyXjw';

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/notifications?documentId=${notif.id}&key=${apiKey}`;

  const body = {
    fields: {
      id: { stringValue: notif.id },
      userId: { stringValue: notif.userId },
      role: { stringValue: notif.role || 'customer' },
      title: { stringValue: notif.title },
      message: { stringValue: notif.message },
      type: { stringValue: notif.type },
      read: { booleanValue: false },
      orderId: { stringValue: notif.orderId || '' },
      createdAt: { integerValue: notif.createdAt }
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return res.ok;
}

/**
 * POST /api/notifications/send
 * Secure backend notification dispatch. Never allows device-to-device direct messaging.
 */
app.post('/api/notifications/send', async (req, res) => {
  try {
    const { userId, role = 'customer', title, message, type, orderId } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ error: 'Missing required parameters: userId, title, message' });
    }

    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = Date.now();

    const saved = await saveNotificationToFirestore({
      id: notifId,
      userId,
      role,
      title,
      message,
      type: type || 'SYSTEM',
      orderId,
      createdAt
    });

    res.json({
      success: true,
      notifId,
      firestorePersisted: saved,
      message: 'Notification dispatched and stored in Firestore'
    });
  } catch (error: any) {
    console.error('Error dispatching notification:', error);
    res.status(500).json({ error: 'Failed to process notification dispatch' });
  }
});

// ----------------------------------------------------------------------
// VITE DEV & PRODUCTION SERVER BOOTSTRAP
// ----------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (PayU Gateway Integrated)`);
  });
}

startServer();
