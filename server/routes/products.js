const express = require('express');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');
const { formatProduct } = require('../utils/formatter');

const router = express.Router();

// GET /api/products - List all products with search, filter, pagination
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, type, category, status, page = 1, limit = 20 } = req.query;

    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();
    
    let products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Perform in-memory filter & search to avoid requiring complex composite indexes
    if (search) {
      const s = search.toLowerCase();
      products = products.filter(p => 
        (p.item_name && p.item_name.toLowerCase().includes(s)) ||
        (p.item_id && p.item_id.toLowerCase().includes(s)) ||
        (p.brand && p.brand.toLowerCase().includes(s)) ||
        (p.model && p.model.toLowerCase().includes(s)) ||
        (p.supplier && p.supplier.toLowerCase().includes(s))
      );
    }
    if (type) {
      products = products.filter(p => p.item_type === type);
    }
    if (category) {
      products = products.filter(p => p.item_category === category);
    }
    if (status) {
      products = products.filter(p => p.status === status);
    }

    // Sort by created_at desc (latest first)
    products.sort((a, b) => {
      const tA = new Date(a.created_at || 0).getTime();
      const tB = new Date(b.created_at || 0).getTime();
      return tB - tA;
    });

    const total = products.length;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedProducts = products.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        products: paginatedProducts.map(formatProduct),
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

// GET /api/products/:id - Get single product
router.get('/:id', authenticate, async (req, res) => {
  try {
    const doc = await db.collection('products').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, data: formatProduct({ id: doc.id, ...doc.data() }) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products - Create product (admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const item_id = req.body.item_id || req.body.itemId;
    const item_name = req.body.item_name || req.body.name;
    const item_type = req.body.item_type || req.body.type;
    const item_category = req.body.item_category || req.body.category;
    const brand = req.body.brand || null;
    const model = req.body.model || null;
    const quantity = req.body.quantity !== undefined ? parseInt(req.body.quantity) : 0;
    const unit_price = req.body.unit_price !== undefined ? parseFloat(req.body.unit_price) : (req.body.unitPrice !== undefined ? parseFloat(req.body.unitPrice) : 0);
    const supplier = req.body.supplier || null;
    const purchase_date = req.body.purchase_date || req.body.purchaseDate || null;
    const warranty_expiry = req.body.warranty_expiry || req.body.warrantyExpiry || null;
    const status = req.body.status || 'In Stock';
    const notes = req.body.notes || null;
    const condition = req.body.condition || 'Normal';
    const image = req.body.image || null;

    if (!item_id || !item_name || !item_type || !item_category) {
      return res.status(400).json({ success: false, message: 'item_id, item_name, item_type, and item_category are required.' });
    }

    const productsRef = db.collection('products');
    const existingSnap = await productsRef.where('item_id', '==', item_id).limit(1).get();
    if (!existingSnap.empty) {
      return res.status(409).json({ success: false, message: 'Product with this item_id already exists.' });
    }

    const newProduct = {
      item_id,
      item_name,
      item_type,
      item_category,
      brand,
      model,
      quantity,
      unit_price,
      supplier,
      purchase_date,
      warranty_expiry,
      status,
      notes,
      condition,
      image,
      created_by: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const docRef = await productsRef.add(newProduct);

    // Log activity
    await db.collection('activity_log').add({
      user_id: req.user.id,
      username: req.user.username,
      action: 'CREATE_PRODUCT',
      details: `Created product: ${item_name} (${item_id})`,
      created_at: new Date().toISOString()
    });

    const savedDoc = await docRef.get();
    res.status(201).json({ success: true, data: formatProduct({ id: savedDoc.id, ...savedDoc.data() }) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const docRef = db.collection('products').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updateData = {};
    const body = req.body;

    const item_name = body.item_name !== undefined ? body.item_name : body.name;
    const item_type = body.item_type !== undefined ? body.item_type : body.type;
    const item_category = body.item_category !== undefined ? body.item_category : body.category;
    const brand = body.brand;
    const model = body.model;
    const quantity = body.quantity;
    const unit_price = body.unit_price !== undefined ? body.unit_price : body.unitPrice;
    const supplier = body.supplier;
    const purchase_date = body.purchase_date !== undefined ? body.purchase_date : body.purchaseDate;
    const warranty_expiry = body.warranty_expiry !== undefined ? body.warranty_expiry : body.warrantyExpiry;
    const status = body.status;
    const notes = body.notes;
    const condition = body.condition;
    const image = body.image;

    if (item_name !== undefined) updateData.item_name = item_name;
    if (item_type !== undefined) updateData.item_type = item_type;
    if (item_category !== undefined) updateData.item_category = item_category;
    if (brand !== undefined) updateData.brand = brand;
    if (model !== undefined) updateData.model = model;
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (unit_price !== undefined) updateData.unit_price = parseFloat(unit_price);
    if (supplier !== undefined) updateData.supplier = supplier;
    if (purchase_date !== undefined) updateData.purchase_date = purchase_date;
    if (warranty_expiry !== undefined) updateData.warranty_expiry = warranty_expiry;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (condition !== undefined) updateData.condition = condition;
    if (image !== undefined) updateData.image = image;
    
    updateData.updated_at = new Date().toISOString();

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    const product = { id: updatedDoc.id, ...updatedDoc.data() };

    // Log activity
    await db.collection('activity_log').add({
      user_id: req.user.id,
      username: req.user.username,
      action: 'UPDATE_PRODUCT',
      details: `Updated product: ${product.item_name} (${product.item_id})`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, data: formatProduct(product) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const docRef = db.collection('products').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = doc.data();

    await docRef.delete();

    // Log activity
    await db.collection('activity_log').add({
      user_id: req.user.id,
      username: req.user.username,
      action: 'DELETE_PRODUCT',
      details: `Deleted product: ${product.item_name} (${product.item_id})`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
