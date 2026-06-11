const express = require('express');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');
const { formatPurchaseOrder } = require('../utils/formatter');

const router = express.Router();

// GET /api/purchases - List all orders with items
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, supplier } = req.query;

    const purchasesRef = db.collection('purchase_orders');
    const snapshot = await purchasesRef.get();

    let orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Perform in-memory filter
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    if (supplier) {
      orders = orders.filter(o => o.supplier && o.supplier.toLowerCase().includes(supplier.toLowerCase()));
    }

    // Sort by created_at DESC
    orders.sort((a, b) => {
      const tA = new Date(a.created_at || 0).getTime();
      const tB = new Date(b.created_at || 0).getTime();
      return tB - tA;
    });

    const total = orders.length;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedOrders = orders.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        orders: paginatedOrders.map(formatPurchaseOrder),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/purchases/:id - Get single order with items
router.get('/:id', authenticate, async (req, res) => {
  try {
    const doc = await db.collection('purchase_orders').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }
    res.json({ success: true, data: formatPurchaseOrder({ id: doc.id, ...doc.data() }) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/purchases - Create order (admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const order_id = req.body.order_id || req.body.orderId;
    const supplier = req.body.supplier;
    const order_date = req.body.order_date || req.body.orderDate;
    const status = req.body.status || 'Pending';
    const notes = req.body.notes || null;
    const items = req.body.items || [];

    if (!order_id || !supplier || !order_date) {
      return res.status(400).json({ success: false, message: 'order_id, supplier, and order_date are required.' });
    }

    const purchasesRef = db.collection('purchase_orders');
    const existingSnap = await purchasesRef.where('order_id', '==', order_id).limit(1).get();
    if (!existingSnap.empty) {
      return res.status(409).json({ success: false, message: 'Order with this order_id already exists.' });
    }

    let total_amount = 0;
    const formattedItems = [];
    if (items && items.length > 0) {
      for (const item of items) {
        const product_id = item.product_id || item.productId || '';
        const product = item.product || '';
        const quantity = item.quantity !== undefined ? parseInt(item.quantity) : 0;
        const unit_price = item.unit_price !== undefined ? parseFloat(item.unit_price) : (item.price !== undefined ? parseFloat(item.price) : 0);
        const totalPrice = quantity * unit_price;
        total_amount += totalPrice;

        formattedItems.push({
          product_id,
          product,
          quantity,
          unit_price,
          total_price: totalPrice
        });
      }
    }

    const newOrder = {
      order_id,
      supplier,
      total_amount,
      order_date,
      status,
      notes,
      items: formattedItems,
      created_by: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const docRef = await purchasesRef.add(newOrder);

    // Log activity
    await db.collection('activity_log').add({
      user_id: req.user.id,
      username: req.user.username,
      action: 'CREATE_ORDER',
      details: `Created purchase order: ${order_id}`,
      created_at: new Date().toISOString()
    });

    const savedDoc = await docRef.get();
    res.status(201).json({ success: true, data: formatPurchaseOrder({ id: savedDoc.id, ...savedDoc.data() }) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/purchases/:id - Update order (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const docRef = db.collection('purchase_orders').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }

    const body = req.body;
    const supplier = body.supplier;
    const order_date = body.order_date || body.orderDate;
    const status = body.status;
    const notes = body.notes;
    const items = body.items;

    const updateData = {};
    if (supplier !== undefined) updateData.supplier = supplier;
    if (order_date !== undefined) updateData.order_date = order_date;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    if (items !== undefined) {
      let total_amount = 0;
      const formattedItems = [];
      for (const item of items) {
        const product_id = item.product_id || item.productId || '';
        const product = item.product || '';
        const quantity = item.quantity !== undefined ? parseInt(item.quantity) : 0;
        const unit_price = item.unit_price !== undefined ? parseFloat(item.unit_price) : (item.price !== undefined ? parseFloat(item.price) : 0);
        const totalPrice = quantity * unit_price;
        total_amount += totalPrice;

        formattedItems.push({
          product_id,
          product,
          quantity,
          unit_price,
          total_price: totalPrice
        });
      }
      updateData.items = formattedItems;
      updateData.total_amount = total_amount;
    }

    updateData.updated_at = new Date().toISOString();

    await docRef.update(updateData);

    // Log activity
    await db.collection('activity_log').add({
      user_id: req.user.id,
      username: req.user.username,
      action: 'UPDATE_ORDER',
      details: `Updated purchase order: ${doc.data().order_id}`,
      created_at: new Date().toISOString()
    });

    const updatedDoc = await docRef.get();
    res.json({ success: true, data: formatPurchaseOrder({ id: updatedDoc.id, ...updatedDoc.data() }) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/purchases/:id - Delete order (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const docRef = db.collection('purchase_orders').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }

    const order = doc.data();

    await docRef.delete();

    // Log activity
    await db.collection('activity_log').add({
      user_id: req.user.id,
      username: req.user.username,
      action: 'DELETE_ORDER',
      details: `Deleted purchase order: ${order.order_id}`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, message: 'Purchase order deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
