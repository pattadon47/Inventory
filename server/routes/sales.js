const express = require('express');
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/sales/summary - Monthly/yearly expense summaries, category breakdown
router.get('/summary', authenticate, async (req, res) => {
  try {
    const ordersSnap = await db.collection('purchase_orders').get();
    const orders = ordersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate overall totals
    const total_orders = orders.length;
    const total_spent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const avg_order_value = total_orders > 0 ? total_spent / total_orders : 0;

    // Monthly expenses (group by YYYY-MM)
    const monthlyMap = {};
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    orders.forEach(o => {
      if (!o.order_date) return;
      const orderDate = new Date(o.order_date);
      if (orderDate >= twelveMonthsAgo) {
        const monthStr = o.order_date.substring(0, 7); // 'YYYY-MM'
        if (!monthlyMap[monthStr]) {
          monthlyMap[monthStr] = { month: monthStr, order_count: 0, total_amount: 0 };
        }
        monthlyMap[monthStr].order_count += 1;
        monthlyMap[monthStr].total_amount += (o.total_amount || 0);
      }
    });

    const monthlyExpenses = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    // Yearly expenses
    const yearlyMap = {};
    orders.forEach(o => {
      if (!o.order_date) return;
      const yearStr = o.order_date.substring(0, 4); // 'YYYY'
      if (!yearlyMap[yearStr]) {
        yearlyMap[yearStr] = { year: yearStr, order_count: 0, total_amount: 0 };
      }
      yearlyMap[yearStr].order_count += 1;
      yearlyMap[yearStr].total_amount += (o.total_amount || 0);
    });

    const yearlyExpenses = Object.values(yearlyMap).sort((a, b) => a.year.localeCompare(b.year));

    // Fetch all products first to map product_id -> category
    const productsSnap = await db.collection('products').get();
    const productCategoryMap = {};
    productsSnap.docs.forEach(doc => {
      const data = doc.data();
      productCategoryMap[doc.id] = data.item_category || 'Other';
    });

    // Category breakdown by spending
    const categoryMap = {};
    orders.forEach(o => {
      if (!o.items) return;
      o.items.forEach(item => {
        const cat = productCategoryMap[item.product_id] || 'Other';
        if (!categoryMap[cat]) {
          categoryMap[cat] = { category: cat, item_count: 0, total_spent: 0 };
        }
        categoryMap[cat].item_count += (item.quantity || 0);
        categoryMap[cat].total_spent += (item.total_price || 0);
      });
    });

    const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.total_spent - a.total_spent);

    // Supplier breakdown
    const supplierMap = {};
    orders.forEach(o => {
      const sup = o.supplier || 'Unknown';
      if (!supplierMap[sup]) {
        supplierMap[sup] = { supplier: sup, order_count: 0, total_amount: 0 };
      }
      supplierMap[sup].order_count += 1;
      supplierMap[sup].total_amount += (o.total_amount || 0);
    });

    const supplierBreakdown = Object.values(supplierMap).sort((a, b) => b.total_amount - a.total_amount);

    res.json({
      success: true,
      data: {
        monthlyExpenses,
        yearlyExpenses,
        categoryBreakdown,
        supplierBreakdown,
        overallTotals: {
          total_orders,
          total_spent,
          avg_order_value
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
