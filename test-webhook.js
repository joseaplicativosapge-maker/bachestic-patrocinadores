import crypto from 'crypto';

const secret = 'test_events_0t7038g0dQy092PkTv9C9s1ieiIrcSMs';

const event = {
  "data": {
    "transaction": {
      "id": "12084840-1779905031-75601",
      "status": "APPROVED",
      "amount_in_cents": 15000000,
      "currency": "COP",
      "reference": "ORD-1779904965810-L4M",
      "customer_email": "face2462@gmail.com",
      "payment_method_type": "CARD"
    }
  },
  "event": "transaction.updated",
  "timestamp": 1779906839,
  "environment": "test",
  "signature": {
    "checksum": "dd9174c0a08c7cb8f19111fc4eed6f8ecf909b5bc38d6a883b5029912df150a8",
    "properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"]
  }
};

const { id, status, amount_in_cents } = event.data.transaction;
const timestamp = event.timestamp;
const stringToHash = `${id}${status}${amount_in_cents}${timestamp}${secret}`;
const computed = crypto.createHash('sha256').update(stringToHash).digest('hex');

console.log('Computed: ', computed);
console.log('Expected: ', event.signature.checksum);
console.log('Match?:   ', computed === event.signature.checksum);

try {
  console.log('Enviando a producción...');
  const response = await fetch('https://bachesticsport.com/api/wompi/webhook/loselite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-event-checksum': event.signature.checksum
    },
    body: JSON.stringify(event)
  });
  console.log('Status producción:', response.status);
  console.log('Body producción:  ', await response.text());
} catch (err) {
  console.error('❌ Error al conectar con producción:', err.message);
}