import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import crypto from 'crypto';

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use((req, res, next) => {
  if (req.path.includes('/wompi/webhook')) {
    next(); // Saltar express.json para webhooks — ellos usan express.raw()
  } else {
    express.json({ limit: '50mb' })(req, res, next);
  }
});

let pool;
async function connectDB() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está definida');
    }

    pool = mysql.createPool(process.env.DATABASE_URL);

    await pool.query('SELECT 1');

    console.log('✅ Conectado a MySQL');
  } catch (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
    process.exit(1);
  }
}
connectDB();

async function runMigrations() {
  try {
    // Agregar columnas Wompi a orders (si no existen)
    await pool.query(`ALTER TABLE orders ADD COLUMN wompi_transaction_id VARCHAR(100) NULL`);
  } catch (_) { /* columna ya existe */ }
  try {
    await pool.query(`ALTER TABLE orders ADD COLUMN wompi_reference VARCHAR(100) NULL`);
  } catch (_) { /* columna ya existe */ }

  // Agregar nuevos estados a orders.status
  try {
    await pool.query(`ALTER TABLE orders MODIFY COLUMN status ENUM('Pending','Completed','PAGADO','RECHAZADO','ANULADO') DEFAULT 'Pending'`);
  } catch (_) { /* enum ya actualizado */ }

  // Crear tabla wompi_events
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS wompi_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      transaction_id VARCHAR(100) NOT NULL,
      reference VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL,
      amount_in_cents INT NOT NULL,
      currency VARCHAR(10) NOT NULL,
      customer_email VARCHAR(255) NULL,
      payment_method_type VARCHAR(50) NULL,
      environment VARCHAR(20) NULL,
      raw_payload JSON NULL,
      received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tx_id (transaction_id),
      INDEX idx_reference (reference)
    )`);
  } catch (_) { /* tabla ya existe */ }

  // Crear tabla sponsors
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS sponsors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(20) NULL,
      sponsor_code VARCHAR(30) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      commission_percent DECIMAL(5,2) DEFAULT 5.00,
      status ENUM('pending','active','rejected') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sponsor_code (sponsor_code)
    )`);
  } catch (_) { /* tabla ya existe */ }

  // Migrar affiliates a sponsors
  try {
    await pool.query(`ALTER TABLE sponsors ADD COLUMN clicks INT DEFAULT 0`);
  } catch (_) { /* columna ya existe */ }
  try {
    const [existing] = await pool.query(`SELECT COUNT(*) as cnt FROM sponsors`);
    if (existing[0].cnt === 0) {
      await pool.query(`INSERT IGNORE INTO sponsors (id, name, email, phone, sponsor_code, password_hash, commission_percent, status, created_at, clicks)
        SELECT id, name, email, phone, affiliate_code, password_hash, commission_percent, status, created_at, COALESCE(clicks, 0)
        FROM affiliates`);
    }
  } catch (_) { /* migración ya ejecutada o tabla affiliates no existe */ }

  // Crear tabla sponsor_product_commissions
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS sponsor_product_commissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sponsor_id INT NOT NULL,
      product_id VARCHAR(50) NOT NULL,
      commission_percent DECIMAL(5,2) NOT NULL DEFAULT 5.00,
      UNIQUE KEY uq_sponsor_product (sponsor_id, product_id),
      FOREIGN KEY (sponsor_id) REFERENCES sponsors(id) ON DELETE CASCADE
    )`);
  } catch (_) { /* tabla ya existe */ }

  // Migrar affiliate_product_commissions a sponsor_product_commissions
  try {
    const [existing] = await pool.query(`SELECT COUNT(*) as cnt FROM sponsor_product_commissions`);
    if (existing[0].cnt === 0) {
      await pool.query(`INSERT IGNORE INTO sponsor_product_commissions (id, sponsor_id, product_id, commission_percent)
        SELECT apc.id, apc.affiliate_id, apc.product_id, apc.commission_percent
        FROM affiliate_product_commissions apc`);
    }
  } catch (_) { /* migración ya ejecutada */ }

  // Agregar sponsor_code a orders
  try {
    await pool.query(`ALTER TABLE orders ADD COLUMN sponsor_code VARCHAR(30) NULL`);
  } catch (_) { /* columna ya existe */ }
  try {
    await pool.query(`ALTER TABLE orders ADD COLUMN affiliate_code VARCHAR(30) NULL`);
  } catch (_) { /* columna ya existe */ }

  // Agregar campos de comisión a order_items
  try {
    await pool.query(`ALTER TABLE order_items ADD COLUMN commission_percent DECIMAL(5,2) NULL`);
  } catch (_) { /* columna ya existe */ }
  try {
    await pool.query(`ALTER TABLE order_items ADD COLUMN commission_amount DECIMAL(10,2) NULL`);
  } catch (_) { /* columna ya existe */ }

  console.log('✅ Migraciones ejecutadas correctamente');
}

await pool.query('SELECT 1');
await runMigrations();

// Configuración Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bachestic API',
      version: '1.0.0',
      description: 'Documentación del backend para la plataforma Elite Sports Urban Hub',
    },
    servers: [{ url: `${process.env.VITE_API_BASE}/api` }],
  },
  apis: ['./server.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Obtener todos los productos
 *     responses:
 *       200:
 *         description: Lista de productos exitosa.
 */
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Crear un producto
 */
app.post('/api/products', async (req, res) => {
  const { id, name, description, price, image, stock, category, sizes, segment } = req.body;
  try {
    await pool.query(
      'INSERT INTO products (id, name, description, price, image, stock, category, sizes, segment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, description, price, image, stock, category, JSON.stringify(sizes), segment]
    );
    res.status(201).json({ message: 'Producto creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/products/:id:
 *   put:
 *     summary: Actualizar un producto
 */
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;

  const {
    name,
    description,
    price,
    image,
    stock,
    category,
    sizes,
    segment
  } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE products 
       SET name = ?, 
           description = ?, 
           price = ?, 
           image = ?, 
           stock = ?, 
           category = ?, 
           sizes = ?, 
           segment = ?
       WHERE id = ?`,
      [
        name,
        description,
        price,
        image,
        stock,
        category,
        JSON.stringify(sizes),
        segment,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto actualizado correctamente' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: Crear un nuevo pedido
 */
app.post('/api/orders', async (req, res) => {
  const { id, customerName, email, address, phone, total, paymentMethod, items, sponsor_code, affiliate_code } = req.body;
  const refCode = sponsor_code || affiliate_code || null;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO orders 
      (id, customerName, email, address, phone, total, paymentMethod, status, sponsor_code) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, customerName, email, address, phone, total, paymentMethod, 'Pending', refCode]
    );

    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items 
        (orderId, productId, name, selectedSize, quantity, price) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [id, item.id, item.name, item.selectedSize, item.quantity, item.price]
      );

      // 🔥 SOLO descontar si es contra entrega
      if (paymentMethod === 'COD') {
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.id]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ orderId: id });

  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});


/**
 * @openapi
 * /api/wompi/webhook/bachestic:
 *   post:
 *     summary: Webhook para actualizacion de estado del pedido desde wompi bachestic
 */
app.post('/api/wompi/webhook/bachestic',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const receivedChecksum = req.headers['x-event-checksum'];
      const rawBody = req.body.toString();
      const event = JSON.parse(rawBody);

      if (!receivedChecksum || !event?.data?.transaction) {
        return res.status(400).send('Falta firma o datos');
      }

      // Verificar checksum criptográficamente con el events secret
      const eventsSecret = process.env.WOMPI_EVENTS_SECRET_BACHESTIC;
      if (eventsSecret) {
        const { id, status, amount_in_cents } = event.data.transaction;
        const timestamp = event.timestamp;
        const stringToHash = `${id}${status}${amount_in_cents}${timestamp}${eventsSecret}`;
        const computed = crypto.createHash('sha256').update(stringToHash).digest('hex');
        if (computed !== receivedChecksum) {
          console.warn('⚠️ Firma webhook bachestic inválida');
          return res.status(401).send('Firma inválida');
        }
      }

      if (event.event === 'transaction.updated') {
        const transaction = event.data.transaction;
        const reference = transaction.reference;
        const txStatus = transaction.status;

        console.log('📦 Transacción bachestic:', reference, txStatus);

        const orderId = reference;

        if (txStatus === 'APPROVED') {
          await pool.query(
            `UPDATE orders SET status = 'PAGADO', wompi_transaction_id = ? WHERE id = ?`,
            [transaction.id, orderId]
          );

          const [items] = await pool.query(
            `SELECT productId, quantity FROM order_items WHERE orderId = ?`,
            [orderId]
          );

          for (const item of items) {
            await pool.query(
              `UPDATE products SET stock = stock - ? WHERE id = ?`,
              [item.quantity, item.productId]
            );
          }

          // Calcular comisiones de patrocinador
          const [orderRows] = await pool.query(
            `SELECT sponsor_code FROM orders WHERE id = ?`,
            [orderId]
          );
          const sponsorCode = orderRows[0]?.sponsor_code;
          if (sponsorCode) {
            const [spRows] = await pool.query(
              `SELECT id, commission_percent FROM sponsors WHERE sponsor_code = ? AND status = 'active'`,
              [sponsorCode]
            );
            if (spRows.length > 0) {
              const sponsor = spRows[0];
              for (const item of items) {
                const [pcRows] = await pool.query(
                  `SELECT commission_percent FROM sponsor_product_commissions
                   WHERE sponsor_id = ? AND product_id = ?`,
                  [sponsor.id, item.productId]
                );
                const rate = pcRows.length > 0 ? pcRows[0].commission_percent : sponsor.commission_percent;
                const [priceRows] = await pool.query(
                  `SELECT price FROM order_items WHERE orderId = ? AND productId = ?`,
                  [orderId, item.productId]
                );
                if (priceRows.length > 0) {
                  const itemTotal = priceRows[0].price * item.quantity;
                  const commissionAmount = (itemTotal * rate) / 100;
                  await pool.query(
                    `UPDATE order_items SET commission_percent = ?, commission_amount = ?
                     WHERE orderId = ? AND productId = ?`,
                    [rate, commissionAmount, orderId, item.productId]
                  );
                }
              }
            }
          }
        }

        if (txStatus === 'DECLINED') {
          await pool.query(
            `UPDATE orders SET status = 'RECHAZADO', wompi_transaction_id = ? WHERE id = ?`,
            [transaction.id, orderId]
          );
        }

        if (txStatus === 'VOIDED') {
          await pool.query(
            `UPDATE orders SET status = 'ANULADO', wompi_transaction_id = ? WHERE id = ?`,
            [transaction.id, orderId]
          );
        }

        await pool.query(
          `INSERT INTO wompi_events 
            (transaction_id, reference, status, amount_in_cents, currency, 
             customer_email, payment_method_type, environment, raw_payload, received_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             status = VALUES(status),
             raw_payload = VALUES(raw_payload),
             received_at = NOW()`,
          [
            transaction.id,
            transaction.reference,
            transaction.status,
            transaction.amount_in_cents,
            transaction.currency,
            transaction.customer_email,
            transaction.payment_method_type,
            event.environment,
            JSON.stringify(event)
          ]
        );
      }

      res.status(200).send('OK');

    } catch (err) {
      console.error('❌ Error webhook bachestic:', err.message);
      res.status(500).send('Error interno');
    }
  }
);


app.post('/api/wompi/webhook/loselite',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const receivedChecksum = req.headers['x-event-checksum'];
      const rawBody = req.body.toString();
      const event = JSON.parse(rawBody);

      if (!receivedChecksum || !event?.data?.transaction) {
        return res.status(400).send('Falta firma o datos');
      }

      // Verificar checksum criptográficamente con el events secret
      const eventsSecret = process.env.WOMPI_EVENTS_SECRET_LOSELITE;
      if (eventsSecret) {
        const { id, status, amount_in_cents } = event.data.transaction;
        const timestamp = event.timestamp;
        const stringToHash = `${id}${status}${amount_in_cents}${timestamp}${eventsSecret}`;
        const computed = crypto.createHash('sha256').update(stringToHash).digest('hex');
        if (computed !== receivedChecksum) {
          console.warn('⚠️ Firma webhook loselite inválida');
          return res.status(401).send('Firma inválida');
        }
      }

      if (event.event === 'transaction.updated') {
        const transaction = event.data.transaction;
        const reference = transaction.reference;
        const txStatus = transaction.status;

        console.log('📦 Transacción loselite:', reference, txStatus);

        const orderId = reference;

        if (txStatus === 'APPROVED') {
          await pool.query(
            `UPDATE orders SET status = 'PAGADO', wompi_transaction_id = ? WHERE id = ?`,
            [transaction.id, orderId]
          );

          const [items] = await pool.query(
            `SELECT productId, quantity FROM order_items WHERE orderId = ?`,
            [orderId]
          );

          for (const item of items) {
            await pool.query(
              `UPDATE products SET stock = stock - ? WHERE id = ?`,
              [item.quantity, item.productId]
            );
          }

          // Calcular comisiones de patrocinador
          const [orderRows] = await pool.query(
            `SELECT sponsor_code FROM orders WHERE id = ?`,
            [orderId]
          );
          const sponsorCode = orderRows[0]?.sponsor_code;
          if (sponsorCode) {
            const [spRows] = await pool.query(
              `SELECT id, commission_percent FROM sponsors WHERE sponsor_code = ? AND status = 'active'`,
              [sponsorCode]
            );
            if (spRows.length > 0) {
              const sponsor = spRows[0];
              for (const item of items) {
                const [pcRows] = await pool.query(
                  `SELECT commission_percent FROM sponsor_product_commissions
                   WHERE sponsor_id = ? AND product_id = ?`,
                  [sponsor.id, item.productId]
                );
                const rate = pcRows.length > 0 ? pcRows[0].commission_percent : sponsor.commission_percent;
                const [priceRows] = await pool.query(
                  `SELECT price FROM order_items WHERE orderId = ? AND productId = ?`,
                  [orderId, item.productId]
                );
                if (priceRows.length > 0) {
                  const itemTotal = priceRows[0].price * item.quantity;
                  const commissionAmount = (itemTotal * rate) / 100;
                  await pool.query(
                    `UPDATE order_items SET commission_percent = ?, commission_amount = ?
                     WHERE orderId = ? AND productId = ?`,
                    [rate, commissionAmount, orderId, item.productId]
                  );
                }
              }
            }
          }
        }

        if (txStatus === 'DECLINED') {
          await pool.query(
            `UPDATE orders SET status = 'RECHAZADO', wompi_transaction_id = ? WHERE id = ?`,
            [transaction.id, orderId]
          );
        }

        if (txStatus === 'VOIDED') {
          await pool.query(
            `UPDATE orders SET status = 'ANULADO', wompi_transaction_id = ? WHERE id = ?`,
            [transaction.id, orderId]
          );
        }

        await pool.query(
          `INSERT INTO wompi_events 
            (transaction_id, reference, status, amount_in_cents, currency,
             customer_email, payment_method_type, environment, raw_payload, received_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             status = VALUES(status),
             raw_payload = VALUES(raw_payload),
             received_at = NOW()`,
          [
            transaction.id,
            transaction.reference,
            transaction.status,
            transaction.amount_in_cents,
            transaction.currency,
            transaction.customer_email,
            transaction.payment_method_type,
            event.environment,
            JSON.stringify(event)
          ]
        );
      }

      res.status(200).send('OK');

    } catch (err) {
      console.error('❌ Error webhook loselite:', err.message);
      res.status(500).send('Error interno');
    }
  }
);
/**
 * @openapi
 * /api/wompi/create-checkout/loselite:
 *   post:
 *     summary: Checkout en wompi loselite
 */
app.post('/api/wompi/create-checkout/loselite', async (req, res) => {
  try {
    const { orderId, amount, customerEmail } = req.body;
    const reference = orderId;
    
    // Calcular firma de integridad
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET_LOSELITE;
    const publicKey = process.env.WOMPI_PUBLIC_KEY_LOSELITE;
    const stringToHash = `${reference}${amount}COP${integritySecret}`;
    const signature = crypto.createHash('sha256').update(stringToHash).digest('hex');

    const checkoutUrl = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=COP&amount-in-cents=${amount}&reference=${reference}&signature:integrity=${signature}&customer-data:email=${customerEmail}&redirect-url=${encodeURIComponent(process.env.FRONTEND_URL + '/pago-resultado')}`;

    console.log('🔑 Wompi Los Elite checkout:');
    console.log('   publicKey (primeros 20):', publicKey?.substring(0, 20));
    console.log('   integritySecret (primeros 15):', integritySecret?.substring(0, 15));
    console.log('   stringToHash:', stringToHash.replace(integritySecret || '', '***'));
    console.log('   signature:', signature);
    console.log('   amount (centavos):', amount, 'tipo:', typeof amount);
    console.log('   reference:', reference);
    console.log('   checkoutUrl:', checkoutUrl);

    await pool.query(
      `UPDATE orders SET wompi_reference = ? WHERE id = ?`,
      [reference, orderId]
    );

    res.json({ checkoutUrl });
  } catch (err) {
    console.error('❌ checkout loselite:', err.message);
    res.status(500).json({ error: 'Error creando checkout' });
  }
});

app.post('/api/wompi/create-checkout/bachestic', async (req, res) => {
  try {
    const { orderId, amount, customerEmail } = req.body;
    const reference = orderId;
    
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET_BACHESTIC;
    const publicKey = process.env.WOMPI_PUBLIC_KEY_BACHESTIC;
    const stringToHash = `${reference}${amount}COP${integritySecret}`;
    const signature = crypto.createHash('sha256').update(stringToHash).digest('hex');

    const checkoutUrl = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=COP&amount-in-cents=${amount}&reference=${reference}&signature:integrity=${signature}&customer-data:email=${customerEmail}&redirect-url=${encodeURIComponent(process.env.FRONTEND_URL + '/pago-resultado')}`;

    console.log('🔑 Wompi Bachestic checkout:');
    console.log('   publicKey (primeros 20):', publicKey?.substring(0, 20));
    console.log('   integritySecret (primeros 15):', integritySecret?.substring(0, 15));
    console.log('   stringToHash:', stringToHash.replace(integritySecret || '', '***'));
    console.log('   signature:', signature);
    console.log('   amount (centavos):', amount, 'tipo:', typeof amount);
    console.log('   reference:', reference);

    await pool.query(
      `UPDATE orders SET wompi_reference = ? WHERE id = ?`,
      [reference, orderId]
    );

    res.json({ checkoutUrl });
  } catch (err) {
    console.error('❌ checkout bachestic:', err.message);
    res.status(500).json({ error: 'Error creando checkout' });
  }
});

/**
 * @openapi
 * /api/settings:
 *   get:
 *     summary: Obtener la configuracion del software
 */
app.get('/api/settings', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1 ORDER BY id DESC LIMIT 1');
  res.json(rows[0]);
});

/**
 * @openapi
 * /api/settings:
 *   get:
 *     summary: Actualizar la configuracion del software
 */
app.put('/api/settings', async (req, res) => {
  const {
    historyBachestic,
    historyElite,
    ambassadors,
    ambassadorsImage,
    sponsors,
    sponsorsImage,
    deliveryEnabled,
    codEnabled,
    photoTrayectoriaBachestic,
    photoTrayectoriaElite,
    heroBachestic,
    heroElite,
    statYear, statCollections, statEliteEvents
  } = req.body;

  await pool.query(
    `UPDATE settings SET
      historyBachestic = ?,
      historyElite = ?,
      ambassadors = ?,
      ambassadorsImage = ?,
      sponsors = ?,
      sponsorsImage = ?,
      deliveryEnabled = ?,
      codEnabled = ?,
      photoTrayectoriaBachestic = ?,
      photoTrayectoriaElite = ?,
      heroBachestic = ?,
      heroElite = ?, 
      statYear = ?, 
      statCollections = ?, 
      statEliteEvents = ?
    WHERE id = 1`,
    [
      historyBachestic,
      historyElite,
      ambassadors,
      ambassadorsImage,
      sponsors,
      sponsorsImage,
      deliveryEnabled,
      codEnabled,
      photoTrayectoriaBachestic,
      photoTrayectoriaElite,
      heroBachestic,
      heroElite,
      statYear, 
      statCollections, 
      statEliteEvents
    ]
  );
  res.json({ message: 'Ajustes actualizados' });
});

/**
 * @openapi
 * /api/admin/login:
 *   post:
 *     summary: Login de usuario
 */
app.post('/api/admin/login', async (req, res) => {
  const { pin } = req.body;
  const [rows] = await pool.query('SELECT * FROM admin_users WHERE pin = ?', [pin]);
  if (rows.length > 0) {
    res.json({ success: true, user: rows[0] });
  } else {
    res.status(401).json({ success: false, message: 'PIN inválido' });
  }
});

/**
 * @openapi
 * /api/events:
 *   get:
 *     summary: Listado de eventos
 */
app.get('/api/events', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM events ORDER BY startDate ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/events:
 *   post:
 *     summary: Guardar eventos
 */
app.post('/api/events', async (req, res) => {
  const { id, startDate, endDate, type, category, description, notes, status, segment } = req.body;
  try {
    await pool.query(
      'INSERT INTO events (id, startDate, endDate, type, category, description, notes, status, segment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, startDate, endDate, type, category, description, notes, status, segment]
    );
    res.status(201).json({ message: 'Evento creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/events/:id:
 *   delete:
 *     summary: Eliminar eventos
 */
app.delete('/api/events/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Evento eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/registrations:
 *   get:
 *     summary: Listado inscripciones
 */
app.get('/api/registrations', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM registrations ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/registrations:
 *   post:
 *     summary: Crear inscripcion
 */
app.post('/api/registrations', async (req, res) => {
  const { id, tournamentId, teamName, contactName, email, phone } = req.body;
  try {
    await pool.query(
      'INSERT INTO registrations (id, tournamentId, teamName, contactName, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [id, tournamentId, teamName, contactName, email, phone]
    );
    res.status(201).json({ message: 'Inscripción exitosa' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/registrations/:id:
 *   delete:
 *     summary: Borrar inscripcion
 */
app.delete('/api/registrations/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM registrations WHERE id = ?', [req.params.id]);
    res.json({ message: 'Inscripción eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/gallery:
 *   get:
 *     summary: Listado de galerias
 */
app.get('/api/gallery', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM gallery ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/gallery/prohects:
 *   get:
 *     summary: Listado de proyectos de galerias
 */
app.get('/api/gallery/projects', async (req, res) => {
  try {
    const [projects] = await pool.query('SELECT * FROM gallery_projects ORDER BY created_at DESC');
    const [images]   = await pool.query('SELECT * FROM gallery ORDER BY created_at DESC');
    // Adjuntar imágenes a cada proyecto
    const result = projects.map(p => ({
      ...p,
      images: images.filter(img => img.project_id === p.id),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories/reorder', async (req, res) => {
  const { items } = req.body; // [{ id: 1, sort_order: 0 }, ...]
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items debe ser un array' });
 
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of items) {
      await connection.query(
        'UPDATE product_categories SET sort_order = ? WHERE id = ?',
        [item.sort_order, item.id]
      );
    }
    await connection.commit();
    res.json({ message: 'Orden actualizado' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

/**
 * @openapi
 * /api/categories:
 *   get:
 *     summary: Listado de categorias
 */
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM product_categories ORDER BY sort_order ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/categories:
 *   post:
 *     summary: Guardar categoria
 */
app.post('/api/categories', async (req, res) => {
  const {
    key_name,
    label,
    description,
    icon,
    segment,
    active,
    sort_order
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO product_categories 
      (key_name, label, description, icon, segment, active, sort_order) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        key_name,
        label,
        description || null,
        icon || '🏷️',
        segment || 'both',
        active ?? 1,
        sort_order || 0
      ]
    );

    res.status(201).json({
      id: result.insertId,
      key_name,
      label,
      segment
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/categories/:id:
 *   put:
 *     summary: Editar categoria
 */
app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;

  const {
    key_name,
    label,
    description,
    icon,
    segment,
    active,
    sort_order
  } = req.body;

  try {
    await pool.query(
      `UPDATE product_categories SET
        key_name = ?,
        label = ?,
        description = ?,
        icon = ?,
        segment = ?,
        active = ?,
        sort_order = ?
      WHERE id = ?`,
      [
        key_name,
        label,
        description || null,
        icon || '🏷️',
        segment || 'both',
        active ?? 1,
        sort_order || 0,
        id
      ]
    );

    res.json({ message: 'Categoría actualizada correctamente' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  if (!Object.keys(fields).length) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }

  try {
    const columns = [];
    const values = [];

    for (const key in fields) {
      columns.push(`${key} = ?`);
      values.push(fields[key]);
    }

    values.push(id);

    await pool.query(
      `UPDATE product_categories SET ${columns.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Categoría actualizada correctamente' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/gallery/projects/:id', async (req, res) => {
  const { name, description, cover_image } = req.body;
  try {
    await pool.query(
      'UPDATE gallery_projects SET name = ?, description = ?, cover_image = ? WHERE id = ?',
      [name, description || '', cover_image ?? null, req.params.id]
    );
    res.json({ message: 'Proyecto actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gallery/projects', async (req, res) => {
  const { name, description, cover_image } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO gallery_projects (name, description, cover_image) VALUES (?, ?, ?)',
      [name, description || '', cover_image || null]
    );
    res.status(201).json({ id: result.insertId, name, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/gallery/projects/:id', async (req, res) => {
  try {
    // Deslinkar fotos del proyecto (no las borra, queda project_id = NULL)
    await pool.query('UPDATE gallery SET project_id = NULL WHERE project_id = ?', [req.params.id]);
    await pool.query('DELETE FROM gallery_projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Proyecto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/gallery/:id/project', async (req, res) => {
  const { project_id } = req.body;
  try {
    await pool.query(
      'UPDATE gallery SET project_id = ? WHERE id = ?',
      [project_id ?? null, req.params.id]
    );
    res.json({ message: 'Foto actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/gallery:
 *   post:
 *     summary: Crear galeria
 */
app.post('/api/gallery', async (req, res) => {
  const { url, project_id } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO gallery (url, project_id) VALUES (?, ?)',
      [url, project_id ?? null]
    );
    res.status(201).json({ id: result.insertId, url, project_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/gallery/:id:
 *   delete:
 *     summary: Eliminar galeria
 */
app.delete('/api/gallery/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM gallery WHERE id = ?', [req.params.id]);
    res.json({ message: 'Imagen eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/orders:
 *   get:
 *     summary: Lista ordenes
 */
app.get('/api/orders', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
app.get('/api/orders/:id/items', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM order_items WHERE orderId = ?', [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status — Actualizar estado de una orden
app.patch('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['PENDIENTE', 'PAGADO', 'DESPACHADO', 'RECHAZADO', 'ANULADO'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.json({ success: true, id, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/orders/:id:
 *   delete:
 *     summary: Eliminar orden
 */
app.delete('/api/orders/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Pedido eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
app.get('/api/wompi/transaction/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const env = process.env.WOMPI_ENV || 'test';

    const tryFetch = async (wompiBase, privateKey) => {
      const resp = await fetch(`${wompiBase}/transactions/${id}`, {
        headers: { 'Authorization': `Bearer ${privateKey}` }
      });
      const json = await resp.json();
      return json?.data;
    };

    // Intentar con la clave principal según WOMPI_ENV
    let tx;
    if (env === 'test') {
      tx = await tryFetch('https://sandbox.wompi.co/v1', process.env.WOMPI_PRIVATE_KEY_BACHESTIC);
    } else {
      tx = await tryFetch('https://production.wompi.co/v1', process.env.WOMPI_PRIVATE_KEY_LOSELITE);
    }

    // Fallback: si no encontró, probar con la otra clave
    if (!tx) {
      if (env === 'test') {
        tx = await tryFetch('https://production.wompi.co/v1', process.env.WOMPI_PRIVATE_KEY_LOSELITE);
      } else {
        tx = await tryFetch('https://sandbox.wompi.co/v1', process.env.WOMPI_PRIVATE_KEY_BACHESTIC);
      }
    }

    res.json({
      status: tx?.status,
      reference: tx?.reference,
      id: tx?.id
    });

  } catch (err) {
    res.status(500).json({ error: 'Error consultando transacción' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SPONSORS API (Patrocinadores)
// ─────────────────────────────────────────────────────────────────────────────

const hashPassword = (pwd) => crypto.createHash('sha256').update(pwd).digest('hex');

/**
 * @openapi
 * /api/sponsors:
 *   post:
 *     summary: Crear patrocinador (admin)
 */
app.post('/api/sponsors', async (req, res) => {
  try {
    const { name, email, phone, password, commission_percent } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    const sponsorCode = `SPO-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const passwordHash = hashPassword(password);

    const [result] = await pool.query(
      `INSERT INTO sponsors (name, email, phone, sponsor_code, password_hash, commission_percent, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [name, email, phone || null, sponsorCode, passwordHash, commission_percent || 5.00]
    );

    res.status(201).json({
      message: 'Patrocinador creado exitosamente',
      sponsor: { id: result.insertId, name, email, sponsor_code: sponsorCode, commission_percent: commission_percent || 5.00, status: 'active' }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/sponsors/login:
 *   post:
 *     summary: Login de patrocinador
 */
app.post('/api/sponsors/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const passwordHash = hashPassword(password);
    const [rows] = await pool.query(
      `SELECT id, name, email, sponsor_code, commission_percent, status FROM sponsors
       WHERE email = ? AND password_hash = ?`,
      [email, passwordHash]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const sponsor = rows[0];
    if (sponsor.status !== 'active') {
      return res.status(403).json({ error: 'Tu cuenta no está activa' });
    }

    res.json({ success: true, sponsor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/sponsors:
 *   get:
 *     summary: Listar patrocinadores (admin)
 */
app.get('/api/sponsors', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, sponsor_code, commission_percent, status, clicks, created_at
       FROM sponsors ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/sponsors/:code/profile:
 *   get:
 *     summary: Perfil público de patrocinador
 */
app.get('/api/sponsors/:code/profile', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT name, email, sponsor_code, commission_percent, created_at FROM sponsors
       WHERE sponsor_code = ? AND status = 'active'`,
      [req.params.code]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Patrocinador no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/sponsors/:id/status:
 *   patch:
 *     summary: Activar/desactivar patrocinador (admin)
 */
app.patch('/api/sponsors/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'active', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    await pool.query(`UPDATE sponsors SET status = ? WHERE id = ?`, [status, req.params.id]);
    res.json({ message: 'Estado actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/sponsors/:id:
 *   put:
 *     summary: Editar patrocinador (admin)
 */
app.put('/api/sponsors/:id', async (req, res) => {
  try {
    const { name, email, phone, commission_percent, password } = req.body;
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (commission_percent !== undefined) { updates.push('commission_percent = ?'); values.push(commission_percent); }
    if (password && password.trim()) { updates.push('password_hash = ?'); values.push(hashPassword(password)); }

    if (updates.length === 0) return res.status(400).json({ error: 'Sin campos para actualizar' });

    values.push(req.params.id);
    await pool.query(`UPDATE sponsors SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Patrocinador actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/sponsors/:id:
 *   delete:
 *     summary: Eliminar patrocinador (admin)
 */
app.delete('/api/sponsors/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM sponsors WHERE id = ?', [req.params.id]);
    res.json({ message: 'Patrocinador eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/sponsors/:code/stats:
 *   get:
 *     summary: Estadísticas del patrocinador
 */
app.get('/api/sponsors/:code/stats', async (req, res) => {
  try {
    const [spRows] = await pool.query(
      `SELECT id, sponsor_code, commission_percent FROM sponsors WHERE sponsor_code = ? AND status = 'active'`,
      [req.params.code]
    );
    if (spRows.length === 0) return res.status(404).json({ error: 'Patrocinador no encontrado' });

    const sponsor = spRows[0];

    const [orderCount] = await pool.query(
      `SELECT COUNT(*) as total FROM orders WHERE sponsor_code = ? AND status IN ('PAGADO','Completed')`,
      [req.params.code]
    );

    const [commissionRows] = await pool.query(
      `SELECT COALESCE(SUM(commission_amount), 0) as total_commissions FROM order_items oi
       JOIN orders o ON oi.orderId = o.id
       WHERE o.sponsor_code = ? AND o.status IN ('PAGADO','Completed')`,
      [req.params.code]
    );

    res.json({
      sponsor_code: sponsor.sponsor_code,
      commission_percent: sponsor.commission_percent,
      total_orders: orderCount[0].total,
      total_commissions: commissionRows[0].total_commissions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/sponsors/:code/commissions:
 *   get:
 *     summary: Listado de comisiones del patrocinador
 */
app.get('/api/sponsors/:code/commissions', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.id as order_id, o.created_at, o.total, o.status,
              oi.productId, oi.name, oi.quantity, oi.price,
              oi.commission_percent, oi.commission_amount
       FROM orders o
       JOIN order_items oi ON oi.orderId = o.id
       WHERE o.sponsor_code = ?
       ORDER BY o.created_at DESC`,
      [req.params.code]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/sponsors/:code/product-commissions:
 *   post:
 *     summary: Configurar comisión por producto para patrocinador (admin)
 */
app.post('/api/sponsors/:code/product-commissions', async (req, res) => {
  try {
    const [spRows] = await pool.query(`SELECT id FROM sponsors WHERE sponsor_code = ?`, [req.params.code]);
    if (spRows.length === 0) return res.status(404).json({ error: 'Patrocinador no encontrado' });

    const sponsorId = spRows[0].id;
    const { product_id, commission_percent } = req.body;

    await pool.query(
      `INSERT INTO sponsor_product_commissions (sponsor_id, product_id, commission_percent)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE commission_percent = VALUES(commission_percent)`,
      [sponsorId, product_id, commission_percent]
    );

    res.json({ message: 'Comisión configurada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/sponsors/:code/product-commissions:
 *   get:
 *     summary: Obtener comisiones por producto del patrocinador
 */
app.get('/api/sponsors/:code/product-commissions', async (req, res) => {
  try {
    const [spRows] = await pool.query(`SELECT id FROM sponsors WHERE sponsor_code = ?`, [req.params.code]);
    if (spRows.length === 0) return res.status(404).json({ error: 'Patrocinador no encontrado' });

    const sponsorId = spRows[0].id;

    const [rows] = await pool.query(
      `SELECT spc.product_id, spc.commission_percent, p.name, p.price
       FROM sponsor_product_commissions spc
       JOIN products p ON p.id = spc.product_id
       WHERE spc.sponsor_id = ?`,
      [sponsorId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/sponsors/track-click:
 *   post:
 *     summary: Registrar click en link de patrocinador
 */
app.post('/api/sponsors/track-click', async (req, res) => {
  try {
    const { sponsor_code } = req.body;
    await pool.query(
      `UPDATE sponsors SET clicks = COALESCE(clicks, 0) + 1 WHERE sponsor_code = ?`,
      [sponsor_code]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AFFILIATES API (legacy - redirige a sponsors)
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/affiliates/register', async (req, res) => {
  res.status(410).json({ error: 'El registro de afiliados ya no está disponible. Contactá al administrador.' });
});

app.post('/api/affiliates/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son requeridos' });

    const passwordHash = hashPassword(password);
    const [rows] = await pool.query(
      `SELECT id, name, email, sponsor_code, commission_percent, status FROM sponsors
       WHERE email = ? AND password_hash = ?`,
      [email, passwordHash]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
    const sponsor = rows[0];
    if (sponsor.status !== 'active') return res.status(403).json({ error: 'Tu cuenta no está activa' });
    res.json({ success: true, sponsor: { ...sponsor, affiliate_code: sponsor.sponsor_code } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/affiliates', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, sponsor_code as affiliate_code, commission_percent, status, clicks, created_at
       FROM sponsors ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/affiliates/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'active', 'rejected'].includes(status)) return res.status(400).json({ error: 'Estado inválido' });
    await pool.query(`UPDATE sponsors SET status = ? WHERE id = ?`, [status, req.params.id]);
    res.json({ message: 'Estado actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/affiliates/:id', async (req, res) => {
  try {
    const { name, email, phone, commission_percent } = req.body;
    await pool.query(
      `UPDATE sponsors SET name = ?, email = ?, phone = ?, commission_percent = ? WHERE id = ?`,
      [name, email, phone || null, commission_percent, req.params.id]
    );
    res.json({ message: 'Patrocinador actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/affiliates/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM sponsors WHERE id = ?', [req.params.id]);
    res.json({ message: 'Patrocinador eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/affiliates/:code/stats', async (req, res) => {
  try {
    const [spRows] = await pool.query(
      `SELECT id, sponsor_code, commission_percent FROM sponsors WHERE sponsor_code = ? AND status = 'active'`,
      [req.params.code]
    );
    if (spRows.length === 0) return res.status(404).json({ error: 'Patrocinador no encontrado' });
    const sponsor = spRows[0];
    const [orderCount] = await pool.query(
      `SELECT COUNT(*) as total FROM orders WHERE sponsor_code = ? AND status IN ('PAGADO','Completed')`,
      [req.params.code]
    );
    const [commissionRows] = await pool.query(
      `SELECT COALESCE(SUM(commission_amount), 0) as total_commissions FROM order_items oi
       JOIN orders o ON oi.orderId = o.id
       WHERE o.sponsor_code = ? AND o.status IN ('PAGADO','Completed')`,
      [req.params.code]
    );
    res.json({
      affiliate_code: sponsor.sponsor_code,
      commission_percent: sponsor.commission_percent,
      total_orders: orderCount[0].total,
      total_commissions: commissionRows[0].total_commissions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/affiliates/:code/commissions', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.id as order_id, o.created_at, o.total, o.status,
              oi.productId, oi.name, oi.quantity, oi.price,
              oi.commission_percent, oi.commission_amount
       FROM orders o
       JOIN order_items oi ON oi.orderId = o.id
       WHERE o.sponsor_code = ?
       ORDER BY o.created_at DESC`,
      [req.params.code]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/affiliates/:code/product-commissions', async (req, res) => {
  try {
    const [spRows] = await pool.query(`SELECT id FROM sponsors WHERE sponsor_code = ?`, [req.params.code]);
    if (spRows.length === 0) return res.status(404).json({ error: 'Patrocinador no encontrado' });
    const sponsorId = spRows[0].id;
    const { product_id, commission_percent } = req.body;
    await pool.query(
      `INSERT INTO sponsor_product_commissions (sponsor_id, product_id, commission_percent)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE commission_percent = VALUES(commission_percent)`,
      [sponsorId, product_id, commission_percent]
    );
    res.json({ message: 'Comisión configurada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/affiliates/:code/product-commissions', async (req, res) => {
  try {
    const [spRows] = await pool.query(`SELECT id FROM sponsors WHERE sponsor_code = ?`, [req.params.code]);
    if (spRows.length === 0) return res.status(404).json({ error: 'Patrocinador no encontrado' });
    const sponsorId = spRows[0].id;
    const [rows] = await pool.query(
      `SELECT spc.product_id, spc.commission_percent, p.name, p.price
       FROM sponsor_product_commissions spc
       JOIN products p ON p.id = spc.product_id
       WHERE spc.sponsor_id = ?`,
      [sponsorId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/affiliates/track-click', async (req, res) => {
  try {
    const { affiliate_code } = req.body;
    const code = affiliate_code;
    await pool.query(
      `UPDATE sponsors SET clicks = COALESCE(clicks, 0) + 1 WHERE sponsor_code = ?`,
      [code]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// JOB — Limpieza automática de órdenes pendientes expiradas
// ─────────────────────────────────────────────────────────────────────────────
const cleanupExpiredOrders = async () => {
  try {
    const [result] = await pool.query(
      `UPDATE orders 
       SET status = 'ANULADO' 
       WHERE status = 'Pending' 
       AND created_at < DATE_SUB(NOW(), INTERVAL 2 HOUR)`
    );
    if (result.affectedRows > 0) {
      console.log(`🧹 ${result.affectedRows} órdenes expiradas anuladas`);
    }
  } catch (err) {
    console.error('❌ Error limpiando órdenes:', err.message);
  }
};

// Ejecutar al iniciar el servidor (por si quedaron pendientes del reinicio anterior)
cleanupExpiredOrders();

// Luego cada hora
setInterval(cleanupExpiredOrders, 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`Server running on ${process.env.VITE_API_BASE}/api`);
  console.log(`Swagger docs at ${process.env.VITE_API_BASE}/api/api-docs`);
});