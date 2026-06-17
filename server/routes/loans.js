const express = require('express');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/loans - List all loans. If user is regular employee, filter by their user_id. If admin, return all.
router.get('/', authenticate, async (req, res) => {
  try {
    const loansRef = db.collection('loans');
    const snapshot = await loansRef.get();
    
    let loans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // If not admin, only return user's own loans
    if (req.user.role !== 'admin') {
      loans = loans.filter(l => l.user_id === req.user.id);
    }

    // Sort by created_at desc (latest first)
    loans.sort((a, b) => {
      const tA = new Date(a.created_at || 0).getTime();
      const tB = new Date(b.created_at || 0).getTime();
      return tB - tA;
    });

    res.json({ success: true, data: loans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/loans/request - Request to borrow a product
router.post('/request', authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    const requestedQty = parseInt(req.body.quantity) || 1;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }
    if (requestedQty <= 0) {
      return res.status(400).json({ success: false, message: 'Requested quantity must be greater than 0.' });
    }

    let savedLoanData = null;

    await db.runTransaction(async (transaction) => {
      // Get the product details
      const productRef = db.collection('products').doc(productId);
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists) {
        throw new Error('Product not found.');
      }

      const product = productDoc.data();
      const availableQty = parseInt(product.quantity) || 0;

      // Check if product quantity is greater than 0
      if (availableQty <= 0) {
        throw new Error('This item is currently out of stock and cannot be borrowed.');
      }

      // Check if requested quantity exceeds current stock
      if (requestedQty > availableQty) {
        throw new Error(`Cannot borrow: Requested quantity (${requestedQty}) exceeds available stock (${availableQty}).`);
      }

      // Check total pending borrow requests for this product to prevent over-requesting stock reserves
      const pendingQuery = db.collection('loans')
        .where('product_id', '==', productId)
        .where('status', '==', 'pending_borrow');
      
      const pendingSnap = await transaction.get(pendingQuery);
      
      let totalPending = 0;
      pendingSnap.docs.forEach(doc => {
        totalPending += (doc.data().quantity || 1);
      });

      if (totalPending + requestedQty > availableQty) {
        const remainingStock = Math.max(0, availableQty - totalPending);
        throw new Error(`Cannot request ${requestedQty} units. Only ${remainingStock} unit(s) are left after accounting for pending reservations.`);
      }

      const newLoanRef = db.collection('loans').doc(); // Auto-generated ID
      const newLoan = {
        user_id: req.user.id,
        username: req.user.username,
        full_name: req.user.full_name || req.user.username,
        product_id: productId,
        item_id: product.item_id || product.itemId || '',
        item_name: product.item_name || product.name || '',
        brand: product.brand || '',
        model: product.model || '',
        quantity: requestedQty,
        status: 'pending_borrow',
        borrow_date: null,
        return_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      transaction.set(newLoanRef, newLoan);

      // Log activity
      const activityRef = db.collection('activity_log').doc();
      transaction.set(activityRef, {
        user_id: req.user.id,
        username: req.user.username,
        action: 'LOAN_REQUEST',
        details: `Requested to borrow ${newLoan.item_name} x${requestedQty} (Item ID: ${newLoan.item_id})`,
        created_at: new Date().toISOString()
      });

      savedLoanData = { id: newLoanRef.id, ...newLoan };
    });

    res.status(201).json({ success: true, data: savedLoanData });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/loans/:id/return - Request to return a borrowed product
router.post('/:id/return', authenticate, async (req, res) => {
  try {
    const loanRef = db.collection('loans').doc(req.params.id);
    const loanDoc = await loanRef.get();

    if (!loanDoc.exists) {
      return res.status(404).json({ success: false, message: 'Loan request not found.' });
    }

    const loan = loanDoc.data();

    // Verify ownership (unless admin)
    if (loan.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to return this item.' });
    }

    if (loan.status !== 'borrowed') {
      return res.status(400).json({ success: false, message: 'This item is not in borrowed status.' });
    }

    await loanRef.update({
      status: 'pending_return',
      updated_at: new Date().toISOString()
    });

    // Log activity
    await db.collection('activity_log').add({
      user_id: req.user.id,
      username: req.user.username,
      action: 'LOAN_RETURN_REQUEST',
      details: `Requested to return ${loan.item_name} (Item ID: ${loan.item_id})`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, message: 'Return request submitted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/loans/:id/approve - Approve a loan or return request (admin only)
router.post('/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    const loanRef = db.collection('loans').doc(req.params.id);

    await db.runTransaction(async (transaction) => {
      const loanDoc = await transaction.get(loanRef);
      if (!loanDoc.exists) {
        throw new Error('Loan request not found.');
      }

      const loan = loanDoc.data();
      const productRef = db.collection('products').doc(loan.product_id);
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists) {
        throw new Error('Associated product not found.');
      }

      const product = productDoc.data();
      const loanQty = parseInt(loan.quantity) || 1;
      const productQty = parseInt(product.quantity) || 0;

      if (loan.status === 'pending_borrow') {
        // Approve borrow request
        if (productQty < loanQty) {
          throw new Error(`Cannot approve request: Requested quantity (${loanQty}) exceeds available stock (${productQty}).`);
        }

        // Decrement product quantity by loanQty
        const newQty = productQty - loanQty;
        const newStatus = newQty <= 0 ? 'Out of Stock' : (newQty <= 5 ? 'Low Stock' : 'In Stock');

        transaction.update(productRef, {
          quantity: newQty,
          status: newStatus,
          updated_at: new Date().toISOString()
        });

        transaction.update(loanRef, {
          status: 'borrowed',
          borrow_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // Log activity
        const activityRef = db.collection('activity_log').doc();
        transaction.set(activityRef, {
          user_id: req.user.id,
          username: req.user.username,
          action: 'LOAN_APPROVE',
          details: `Approved loan of ${loan.item_name} x${loanQty} to ${loan.username}`,
          created_at: new Date().toISOString()
        });

      } else if (loan.status === 'pending_return') {
        // Approve return request
        // Increment product quantity by loanQty
        const newQty = productQty + loanQty;
        const newStatus = newQty <= 0 ? 'Out of Stock' : (newQty <= 5 ? 'Low Stock' : 'In Stock');

        transaction.update(productRef, {
          quantity: newQty,
          status: newStatus,
          updated_at: new Date().toISOString()
        });

        transaction.update(loanRef, {
          status: 'returned',
          return_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // Log activity
        const activityRef = db.collection('activity_log').doc();
        transaction.set(activityRef, {
          user_id: req.user.id,
          username: req.user.username,
          action: 'RETURN_APPROVE',
          details: `Approved return of ${loan.item_name} x${loanQty} from ${loan.username}`,
          created_at: new Date().toISOString()
        });

      } else {
        throw new Error('Invalid request status for approval.');
      }
    });

    res.json({ success: true, message: 'Request approved successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/loans/:id/reject - Reject a loan or return request (admin only)
router.post('/:id/reject', authenticate, authorize('admin'), async (req, res) => {
  try {
    const loanRef = db.collection('loans').doc(req.params.id);
    const loanDoc = await loanRef.get();

    if (!loanDoc.exists) {
      return res.status(404).json({ success: false, message: 'Loan request not found.' });
    }

    const loan = loanDoc.data();

    if (loan.status === 'pending_borrow') {
      await loanRef.update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      });

      // Log activity
      await db.collection('activity_log').add({
        user_id: req.user.id,
        username: req.user.username,
        action: 'LOAN_REJECT',
        details: `Rejected loan request of ${loan.item_name} from ${loan.username}`,
        created_at: new Date().toISOString()
      });

      res.json({ success: true, message: 'Loan request rejected successfully.' });
    } else if (loan.status === 'pending_return') {
      // Revert return status back to borrowed
      await loanRef.update({
        status: 'borrowed',
        updated_at: new Date().toISOString()
      });

      // Log activity
      await db.collection('activity_log').add({
        user_id: req.user.id,
        username: req.user.username,
        action: 'RETURN_REJECT',
        details: `Rejected return request of ${loan.item_name} from ${loan.username}`,
        created_at: new Date().toISOString()
      });

      res.json({ success: true, message: 'Return request rejected. Item remains in borrowed state.' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid request status for rejection.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
