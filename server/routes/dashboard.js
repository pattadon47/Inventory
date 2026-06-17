const express = require('express');
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to + 'T23:59:59.999Z') : null;

    // 1. Fetch all products (not filtered by date — represents current state)
    const productsSnap = await db.collection('products').get();
    const products = productsSnap.docs.map(doc => doc.data());

    const totalProducts = products.length;
    const lowStockCount = products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').length;
    const totalStockValue = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.unit_price || 0)), 0);

    // 2. Fetch all purchase orders
    const ordersSnap = await db.collection('purchase_orders').get();
    const allOrders = ordersSnap.docs.map(doc => doc.data());

    // Filter orders by date range if provided
    const orders = allOrders.filter(o => {
      if (!o.order_date) return !fromDate; // include if no date filter
      const orderDate = new Date(o.order_date);
      if (fromDate && orderDate < fromDate) return false;
      if (toDate && orderDate > toDate) return false;
      return true;
    });

    const totalPurchaseAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Monthly purchases (within range)
    const monthlyMap = {};
    orders.forEach(o => {
      if (!o.order_date) return;
      const monthStr = o.order_date.substring(0, 7); // 'YYYY-MM'
      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = { month: monthStr, count: 0, total: 0 };
      }
      monthlyMap[monthStr].count += 1;
      monthlyMap[monthStr].total += (o.total_amount || 0);
    });

    const monthlyPurchases = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    // Category distribution (current inventory, not date-filtered)
    const catMap = {};
    products.forEach(p => {
      const cat = p.item_category || 'Other';
      if (!catMap[cat]) {
        catMap[cat] = { category: cat, count: 0, total_quantity: 0 };
      }
      catMap[cat].count += 1;
      catMap[cat].total_quantity += (p.quantity || 0);
    });

    const categoryDistribution = Object.values(catMap).sort((a, b) => b.count - a.count);

    // Monthly expenses (same as monthly purchases within range)
    const monthlyExpenses = monthlyPurchases.map(p => ({
      month: p.month,
      total: p.total
    }));

    // Fetch activities & users
    const activitySnap = await db.collection('activity_log').get();
    const usersSnap = await db.collection('users').get();
    
    const userMap = {};
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      userMap[doc.id] = { username: data.username, full_name: data.full_name };
    });

    let recentActivity = activitySnap.docs.map(doc => {
      const data = doc.data();
      const user = userMap[data.user_id] || { username: 'system', full_name: 'System' };
      return {
        id: doc.id,
        ...data,
        username: user.username,
        full_name: user.full_name
      };
    });

    // Filter activity by date range if provided
    if (fromDate || toDate) {
      recentActivity = recentActivity.filter(a => {
        const actDate = new Date(a.created_at || 0);
        if (fromDate && actDate < fromDate) return false;
        if (toDate && actDate > toDate) return false;
        return true;
      });
    }

    // Sort activity by created_at DESC and limit to 20
    recentActivity.sort((a, b) => {
      const tA = new Date(a.created_at || 0).getTime();
      const tB = new Date(b.created_at || 0).getTime();
      return tB - tA;
    });

    const limitedActivity = recentActivity.slice(0, 20);

    // Compute condition statistics
    const conditionCounts = {
      Normal: 0,
      InUse: 0,
      UnderRepair: 0,
      Broken: 0
    };
    products.forEach(p => {
      const cond = p.condition || 'Normal';
      const qty = parseInt(p.quantity || 0);
      if (cond === 'Normal') conditionCounts.Normal += qty;
      else if (cond === 'In Use') conditionCounts.InUse += qty;
      else if (cond === 'Under Repair') conditionCounts.UnderRepair += qty;
      else if (cond === 'Broken') conditionCounts.Broken += qty;
    });

    res.json({
      success: true,
      data: {
        totalProducts,
        totalPurchaseAmount,
        lowStockCount,
        totalStockValue,
        monthlyPurchases,
        categoryDistribution,
        monthlyExpenses,
        recentActivity: limitedActivity,
        conditionCounts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

