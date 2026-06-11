function formatUser(user) {
  if (!user) return null;
  return {
    _id: user.id,
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}

function formatProduct(product) {
  if (!product) return null;
  return {
    _id: product.id,
    id: product.id,
    itemId: product.item_id,
    name: product.item_name,
    type: product.item_type,
    category: product.item_category,
    brand: product.brand,
    model: product.model,
    quantity: product.quantity,
    unitPrice: product.unit_price,
    supplier: product.supplier,
    location: product.location,
    purchaseDate: product.purchase_date,
    warrantyExpiry: product.warranty_expiry,
    status: product.status,
    notes: product.notes,
    condition: product.condition || 'Normal',
    createdBy: product.created_by,
    createdByUsername: product.created_by_username,
    createdAt: product.created_at,
    updatedAt: product.updated_at
  };
}

function formatPurchaseOrderItem(item) {
  if (!item) return null;
  return {
    _id: item.id,
    id: item.id,
    orderId: item.order_id,
    productId: item.product_id,
    quantity: item.quantity,
    price: item.unit_price,
    totalPrice: item.total_price,
    product: item.item_name
  };
}

function formatPurchaseOrder(order) {
  if (!order) return null;
  const formatted = {
    _id: order.id,
    id: order.id,
    orderId: order.order_id,
    supplier: order.supplier,
    totalAmount: order.total_amount,
    orderDate: order.order_date,
    status: order.status,
    notes: order.notes,
    createdBy: order.created_by,
    createdByUsername: order.created_by_username,
    createdAt: order.created_at,
    updatedAt: order.updated_at
  };
  if (order.items) {
    formatted.items = order.items.map(formatPurchaseOrderItem);
  }
  return formatted;
}

module.exports = {
  formatUser,
  formatProduct,
  formatPurchaseOrder,
  formatPurchaseOrderItem
};
