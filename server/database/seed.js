const bcrypt = require('bcryptjs');
const db = require('./db');

async function cleanCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

async function seed() {
  await db.init();

  console.log('Starting Firestore database seed...');

  // Clean collections
  console.log('Cleaning existing collections...');
  await cleanCollection('users');
  await cleanCollection('products');
  await cleanCollection('purchase_orders');
  await cleanCollection('activity_log');
  console.log('✓ Collections cleaned.');

  // ============================================
  // 1. Seed Users
  // ============================================
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const userPassword = bcrypt.hashSync('user123', 10);

  const adminRef = await db.collection('users').add({
    username: 'admin',
    password: adminPassword,
    full_name: 'Administrator',
    email: 'admin@inventory.local',
    phone: '02-000-0001',
    role: 'admin',
    avatar: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  const adminId = adminRef.id;

  const userRef = await db.collection('users').add({
    username: 'user',
    password: userPassword,
    full_name: 'User',
    email: 'user@inventory.local',
    phone: '02-000-0002',
    role: 'user',
    avatar: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  const userId = userRef.id;

  console.log('✓ Users seeded (admin/admin123, user/user123)');

  // ============================================
  // 2. Seed Products
  // ============================================
  const products = [
    ['ITM-001', 'จอมอนิเตอร์ Dell 24 นิ้ว', 'Hardware', 'Monitor', 'Dell', 'P2422H', 15, 7500, 'IT City', 'ห้อง IT ชั้น 3', '2025-01-15', '2028-01-15', 'In Stock', 'จอ IPS Full HD', 'In Use'],
    ['ITM-002', 'จอมอนิเตอร์ LG 27 นิ้ว', 'Hardware', 'Monitor', 'LG', '27MK430H', 3, 6900, 'JIB Computer', 'ห้อง IT ชั้น 3', '2025-03-10', '2028-03-10', 'Low Stock', 'จอ IPS FHD', 'Under Repair'],
    ['ITM-003', 'เมาส์ไร้สาย Logitech', 'Accessory', 'Mouse', 'Logitech', 'M331 Silent Plus', 50, 590, 'Banana IT', 'คลังอุปกรณ์ ชั้น 1', '2025-02-20', '2026-02-20', 'In Stock', 'เมาส์ไร้เสียง', 'Normal'],
    ['ITM-004', 'คีย์บอร์ด Logitech K120', 'Accessory', 'Keyboard', 'Logitech', 'K120', 35, 390, 'IT City', 'คลังอุปกรณ์ ชั้น 1', '2025-01-10', '2027-01-10', 'In Stock', 'คีย์บอร์ด USB แบบมีสาย', 'Normal'],
    ['ITM-005', 'หูฟังโทรศัพท์ Plantronics', 'Accessory', 'Phone Headset', 'Plantronics', 'HW251N', 12, 2500, 'JIB Computer', 'ห้อง IT ชั้น 3', '2025-04-05', '2027-04-05', 'In Stock', 'หูฟังสำหรับคอลเซ็นเตอร์', 'In Use'],
    ['ITM-006', 'หูฟังคอมพิวเตอร์ HyperX', 'Accessory', 'Computer Headset', 'HyperX', 'Cloud Stinger', 8, 1290, 'Banana IT', 'คลังอุปกรณ์ ชั้น 1', '2025-05-12', '2027-05-12', 'In Stock', 'หูฟังพร้อมไมค์', 'Normal'],
    ['ITM-007', 'คอมพิวเตอร์ตั้งโต๊ะ Dell OptiPlex', 'Hardware', 'Computer', 'Dell', 'OptiPlex 7010', 10, 25000, 'IT City', 'ห้อง IT ชั้น 3', '2025-02-01', '2028-02-01', 'In Stock', 'Intel Core i5, 16GB RAM, 512GB SSD', 'In Use'],
    ['ITM-008', 'RAM DDR4 16GB', 'Hardware', 'CPU Components', 'Kingston', 'Fury Beast DDR4', 20, 1590, 'JIB Computer', 'คลังอุปกรณ์ ชั้น 1', '2025-06-01', '2030-06-01', 'In Stock', 'RAM สำหรับอัพเกรด', 'Normal'],
    ['ITM-009', 'สาย LAN Cat6 3 เมตร', 'Cable', 'LAN Cable', 'AMP', 'Cat6 UTP', 100, 85, 'Banana IT', 'คลังสาย ชั้น 1', '2025-03-15', null, 'In Stock', 'สายแลนสำเร็จรูป', 'Normal'],
    ['ITM-010', 'สายโทรศัพท์ RJ11', 'Cable', 'Phone Cable', 'No Brand', 'RJ11 3m', 60, 45, 'IT City', 'คลังสาย ชั้น 1', '2025-01-20', null, 'In Stock', 'สายโทรศัพท์พร้อมหัว RJ11', 'Normal'],
    ['ITM-011', 'สาย HDMI 2.0 1.8 เมตร', 'Cable', 'HDMI Cable', 'Ugreen', 'HDMI 2.0 4K', 40, 290, 'JIB Computer', 'คลังสาย ชั้น 1', '2025-04-10', null, 'In Stock', 'สาย HDMI รองรับ 4K', 'Normal'],
    ['ITM-012', 'สาย LG Display Port', 'Cable', 'LG Cable', 'LG', 'DP Cable 1.8m', 0, 350, 'IT City', 'คลังสาย ชั้น 1', '2024-12-10', null, 'Out of Stock', 'สายจอสำหรับ LG Monitor', 'Broken'],
    ['ITM-013', 'สาย AOC Display Cable', 'Cable', 'AOC Cable', 'AOC', 'DP to HDMI', 5, 290, 'Banana IT', 'คลังสาย ชั้น 1', '2025-05-01', null, 'Low Stock', 'สายจอ AOC แปลง DP เป็น HDMI', 'Normal'],
    ['ITM-014', 'สาย VGA 1.8 เมตร', 'Cable', 'VGA Cable', 'No Brand', 'VGA M-M 1.8m', 25, 120, 'IT City', 'คลังสาย ชั้น 1', '2025-02-15', null, 'In Stock', 'สาย VGA สำหรับจอรุ่นเก่า', 'Normal'],
    ['ITM-015', 'สาย Power AC 3 ขา', 'Cable', 'Power AC Cable', 'No Brand', 'AC Power 1.8m', 80, 65, 'Banana IT', 'คลังสาย ชั้น 1', '2025-01-05', null, 'In Stock', 'สายไฟ 3 ขาสำหรับคอมพิวเตอร์', 'Normal'],
    ['ITM-016', 'สาย SATA Data', 'Cable', 'ATA Cable', 'No Brand', 'SATA III 0.5m', 30, 35, 'JIB Computer', 'คลังสาย ชั้น 1', '2025-03-20', null, 'In Stock', 'สาย SATA สำหรับฮาร์ดดิสก์', 'Normal'],
    ['ITM-017', 'กล่องโทรศัพท์ IP Phone', 'Hardware', 'Phone Box', 'Grandstream', 'GXP1625', 7, 3200, 'IT City', 'ห้อง IT ชั้น 3', '2025-04-20', '2027-04-20', 'In Stock', 'โทรศัพท์ IP 2 สาย', 'Broken'],
    ['ITM-018', 'Type-C to LAN Adapter', 'Accessory', 'Type-C to LAN Adapter', 'Ugreen', 'USB-C RJ45 Gigabit', 10, 490, 'Banana IT', 'คลังอุปกรณ์ ชั้น 1', '2025-05-15', '2026-05-15', 'In Stock', 'ตัวแปลง USB-C เป็น RJ45 Gigabit LAN', 'Normal'],
  ];

  const productRefs = {};

  for (const p of products) {
    const docRef = await db.collection('products').add({
      item_id: p[0],
      item_name: p[1],
      item_type: p[2],
      item_category: p[3],
      brand: p[4],
      model: p[5],
      quantity: p[6],
      unit_price: p[7],
      supplier: p[8],
      purchase_date: p[10],
      warranty_expiry: p[11],
      status: p[12],
      notes: p[13],
      condition: p[14] || 'Normal',
      created_by: adminId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    productRefs[p[0]] = docRef.id;
  }

  console.log(`✓ ${products.length} products seeded`);

  // Helper to map index key to Firestore product ID
  const getProductDocId = (sqliteIndex) => {
    const suffix = String(sqliteIndex).padStart(3, '0');
    const itemId = `ITM-${suffix}`;
    return productRefs[itemId] || '';
  };

  const getProductName = (sqliteIndex) => {
    const idx = sqliteIndex - 1;
    return products[idx] ? products[idx][1] : '';
  };

  // ============================================
  // 3. Seed Purchase Orders
  // ============================================
  const orders = [
    { order_id: 'PO-2025-001', supplier: 'IT City', order_date: '2025-01-15', status: 'Received', notes: 'จัดซื้อจอและคีย์บอร์ดประจำไตรมาส 1',
      items: [
        { productIndex: 1, quantity: 10, unit_price: 7500 },
        { productIndex: 4, quantity: 20, unit_price: 390 },
      ]
    },
    { order_id: 'PO-2025-002', supplier: 'JIB Computer', order_date: '2025-02-10', status: 'Received', notes: 'จัดซื้อ RAM และหูฟัง',
      items: [
        { productIndex: 8, quantity: 15, unit_price: 1590 },
        { productIndex: 5, quantity: 10, unit_price: 2500 },
      ]
    },
    { order_id: 'PO-2025-003', supplier: 'Banana IT', order_date: '2025-03-05', status: 'Received', notes: 'จัดซื้อเมาส์และอุปกรณ์เสริม',
      items: [
        { productIndex: 3, quantity: 30, unit_price: 590 },
        { productIndex: 6, quantity: 5, unit_price: 1290 },
        { productIndex: 18, quantity: 10, unit_price: 490 },
      ]
    },
    { order_id: 'PO-2025-004', supplier: 'IT City', order_date: '2025-04-20', status: 'Approved', notes: 'จัดซื้อสายเคเบิลหลายรายการ',
      items: [
        { productIndex: 9, quantity: 50, unit_price: 85 },
        { productIndex: 11, quantity: 20, unit_price: 290 },
        { productIndex: 14, quantity: 15, unit_price: 120 },
        { productIndex: 15, quantity: 40, unit_price: 65 },
      ]
    },
    { order_id: 'PO-2025-005', supplier: 'IT City', order_date: '2025-05-10', status: 'Pending', notes: 'จัดซื้อคอมพิวเตอร์ชุดใหม่',
      items: [
        { productIndex: 7, quantity: 5, unit_price: 25000 },
      ]
    },
    { order_id: 'PO-2025-006', supplier: 'JIB Computer', order_date: '2025-05-25', status: 'Pending', notes: 'จัดซื้อจอ LG เพิ่มเติม',
      items: [
        { productIndex: 2, quantity: 5, unit_price: 6900 },
        { productIndex: 16, quantity: 20, unit_price: 35 },
      ]
    },
    { order_id: 'PO-2025-007', supplier: 'Banana IT', order_date: '2025-06-01', status: 'Cancelled', notes: 'ยกเลิก - เปลี่ยนไปสั่งจาก IT City',
      items: [
        { productIndex: 13, quantity: 10, unit_price: 290 },
      ]
    },
    { order_id: 'PO-2025-008', supplier: 'IT City', order_date: '2025-06-05', status: 'Approved', notes: 'จัดซื้อกล่องโทรศัพท์และสายโทรศัพท์',
      items: [
        { productIndex: 17, quantity: 3, unit_price: 3200 },
        { productIndex: 10, quantity: 30, unit_price: 45 },
      ]
    },
  ];

  for (const order of orders) {
    const formattedItems = order.items.map(item => {
      const pId = getProductDocId(item.productIndex);
      const pName = getProductName(item.productIndex);
      return {
        product_id: pId,
        product: pName,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price
      };
    });

    const totalAmount = formattedItems.reduce((sum, item) => sum + item.total_price, 0);

    await db.collection('purchase_orders').add({
      order_id: order.order_id,
      supplier: order.supplier,
      total_amount: totalAmount,
      order_date: order.order_date,
      status: order.status,
      notes: order.notes,
      items: formattedItems,
      created_by: adminId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  console.log(`✓ ${orders.length} purchase orders seeded`);

  // ============================================
  // 4. Seed Activity Log
  // ============================================
  const activities = [
    [adminId, 'LOGIN', 'User admin logged in', '2025-06-10T08:00:00.000Z'],
    [adminId, 'CREATE_PRODUCT', 'Created product: จอมอนิเตอร์ Dell 24 นิ้ว (ITM-001)', '2025-06-10T08:05:00.000Z'],
    [adminId, 'CREATE_PRODUCT', 'Created product: เมาส์ไร้สาย Logitech (ITM-003)', '2025-06-10T08:10:00.000Z'],
    [adminId, 'CREATE_ORDER', 'Created purchase order: PO-2025-001', '2025-06-10T08:15:00.000Z'],
    [adminId, 'UPDATE_ORDER', 'Updated purchase order: PO-2025-001 status to Received', '2025-06-10T09:00:00.000Z'],
    [userId, 'LOGIN', 'User user logged in', '2025-06-10T09:30:00.000Z'],
    [adminId, 'CREATE_PRODUCT', 'Created product: คอมพิวเตอร์ตั้งโต๊ะ Dell OptiPlex (ITM-007)', '2025-06-10T10:00:00.000Z'],
    [adminId, 'CREATE_ORDER', 'Created purchase order: PO-2025-005', '2025-06-10T10:30:00.000Z'],
    [adminId, 'UPDATE_PRODUCT', 'Updated product: สาย LG Display Port (ITM-012) - Out of Stock', '2025-06-10T11:00:00.000Z'],
    [adminId, 'CREATE_USER', 'Created user: user', '2025-06-10T07:55:00.000Z'],
    [adminId, 'LOGIN', 'User admin logged in', '2025-06-11T08:00:00.000Z'],
    [adminId, 'CREATE_ORDER', 'Created purchase order: PO-2025-008', '2025-06-11T09:00:00.000Z'],
  ];

  for (const a of activities) {
    await db.collection('activity_log').add({
      user_id: a[0],
      action: a[1],
      details: a[2],
      created_at: a[3]
    });
  }

  console.log(`✓ ${activities.length} activity log entries seeded`);

  console.log('\n✅ Firebase Firestore seeded successfully!');
  console.log('   Admin login: admin / admin123');
  console.log('   User login:  user / user123');

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
