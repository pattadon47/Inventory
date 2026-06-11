import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const translations = {
  en: {
    // Navigation / Menus
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    purchases: 'Purchase Orders',
    sales: 'Expenses & Sales',
    users: 'User Management',
    settings: 'Settings',
    profile: 'My Profile',
    logout: 'Logout',
    home: 'Home',
    account: 'Account',
    editProfile: 'Edit Profile',
    signOut: 'Sign Out',
    welcome: 'Welcome back',
    systemDesc: 'IT Equipment Management System',
    productList: 'Product List',
    updateProduct: 'Update Product',
    manageOrder: 'Manage Order',
    
    // Login & Forgot Password
    username: 'Username',
    password: 'Password',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    backToLogin: 'Back to Login',
    forgotPasswordDesc: 'Enter your username or email and we will send you a reset link.',
    forgotSuccess: 'Reset instructions have been sent to your email.',
    usernameOrEmail: 'Username or Email',
    loginErrorEmpty: 'Please enter both username and password',
    forgotErrorEmpty: 'Please enter your username or email',
    
    // Dashboard Stats
    totalProducts: 'Total Products',
    totalPurchases: 'Total Purchases',
    lowStock: 'Low Stock Items',
    totalValue: 'Total Stock Value',
    recentActivity: 'Recent Activity',
    monthlyPurchases: 'Monthly Purchases',
    categoryDist: 'Category Distribution',
    expenseTrend: 'Monthly Expenses Trend',
    assetOverview: 'IT Asset Condition Overview',
    
    // Asset Conditions
    condNormal: 'Normal / Available',
    condInUse: 'In Use',
    condRepair: 'Under Repair',
    condBroken: 'Broken / Damaged',
    condUnit: 'units',

    // Inventory Page
    addItem: 'Add Inventory',
    editItem: 'Edit Product',
    deleteItem: 'Delete Product',
    searchPlaceholder: 'Search by name, ID, or brand...',
    allTypes: 'All Types',
    allCategories: 'All Categories',
    allStatus: 'All Status',
    itemId: 'Item ID',
    itemName: 'Item Name',
    itemType: 'Item Type',
    itemCategory: 'Item Category',
    brand: 'Brand',
    model: 'Model',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    supplier: 'Supplier',
    location: 'Location',
    purchaseDate: 'Purchase Date',
    warrantyExpiry: 'Warranty Expiry',
    status: 'Status',
    condition: 'Condition',
    notes: 'Notes',
    actions: 'Actions',
    save: 'Save',
    cancel: 'Cancel',
    deleteConfirm: 'Are you sure you want to delete this item? This action cannot be undone.',

    // Settings
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    systemPrefs: 'System Preferences',
    language: 'Language',
    timezone: 'Timezone',
    itemsPerPage: 'Items per page',
    savePrefs: 'Save Preferences',
    itemsPerPageDesc: 'Number of items to display per page in the data tables (pagination).',
    
    // Profile
    fullName: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    saveChanges: 'Save Changes',
    changePhoto: 'Change Photo',
    uploadSuccess: 'Profile photo updated successfully',
    profileSaved: 'Profile updated successfully',
  },
  th: {
    // Navigation / Menus
    dashboard: 'แผงควบคุม',
    inventory: 'คลังอุปกรณ์',
    purchases: 'รายการจัดซื้อ',
    sales: 'รายงานค่าใช้จ่าย',
    users: 'จัดการผู้ใช้งาน',
    settings: 'ตั้งค่าระบบ',
    profile: 'ข้อมูลส่วนตัว',
    logout: 'ออกจากระบบ',
    home: 'หน้าแรก',
    account: 'บัญชีผู้ใช้',
    editProfile: 'แก้ไขโปรไฟล์',
    signOut: 'ออกจากระบบ',
    welcome: 'ยินดีต้อนรับกลับมา',
    systemDesc: 'ระบบจัดการครุภัณฑ์และอุปกรณ์ IT',
    productList: 'รายการอุปกรณ์',
    updateProduct: 'อัปเดตอุปกรณ์',
    manageOrder: 'จัดการใบสั่งซื้อ',

    // Login & Forgot Password
    username: 'ชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    signIn: 'เข้าสู่ระบบ',
    signingIn: 'กำลังเข้าสู่ระบบ...',
    forgotPassword: 'ลืมรหัสผ่าน?',
    resetPassword: 'รีเซ็ตรหัสผ่าน',
    backToLogin: 'กลับสู่หน้าเข้าสู่ระบบ',
    forgotPasswordDesc: 'กรอกชื่อผู้ใช้หรืออีเมลของคุณเพื่อรับลิงก์สำหรับตั้งค่ารหัสผ่านใหม่',
    forgotSuccess: 'ระบบได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณเรียบร้อยแล้ว',
    usernameOrEmail: 'ชื่อผู้ใช้ หรือ อีเมล',
    loginErrorEmpty: 'กรุณากรอกทั้งชื่อผู้ใช้และรหัสผ่าน',
    forgotErrorEmpty: 'กรุณากรอกชื่อผู้ใช้หรืออีเมลของคุณ',

    // Dashboard Stats
    totalProducts: 'จำนวนอุปกรณ์ทั้งหมด',
    totalPurchases: 'ยอดเงินจัดซื้อสะสม',
    lowStock: 'อุปกรณ์ใกล้หมดคลัง',
    totalValue: 'มูลค่าคลังสินค้าทั้งหมด',
    recentActivity: 'บันทึกกิจกรรมล่าสุด',
    monthlyPurchases: 'สถิติการสั่งซื้อรายเดือน',
    categoryDist: 'สัดส่วนอุปกรณ์แบ่งตามหมวดหมู่',
    expenseTrend: 'แนวโน้มค่าใช้จ่ายรายเดือน',
    assetOverview: 'สรุปสภาพทางกายภาพอุปกรณ์ IT',
    
    // Asset Conditions
    condNormal: 'ใช้งานได้ปกติ / ว่าง',
    condInUse: 'กำลังใช้งาน',
    condRepair: 'ส่งซ่อมบำรุง',
    condBroken: 'ชำรุด / เสียหาย',
    condUnit: 'ชิ้น',

    // Inventory Page
    addItem: 'เพิ่มอุปกรณ์ใหม่',
    editItem: 'แก้ไขรายละเอียดอุปกรณ์',
    deleteItem: 'ลบอุปกรณ์',
    searchPlaceholder: 'ค้นหาด้วยชื่อ, รหัส หรือแบรนด์...',
    allTypes: 'ทุกประเภทอุปกรณ์',
    allCategories: 'ทุกหมวดหมู่',
    allStatus: 'ทุกสถานะคลัง',
    itemId: 'รหัสอุปกรณ์',
    itemName: 'ชื่ออุปกรณ์',
    itemType: 'ประเภทอุปกรณ์',
    itemCategory: 'หมวดหมู่อุปกรณ์',
    brand: 'ยี่ห้อ (Brand)',
    model: 'รุ่น (Model)',
    quantity: 'จำนวนอุปกรณ์',
    unitPrice: 'ราคาต่อหน่วย',
    supplier: 'ผู้จัดจำหน่าย',
    location: 'สถานที่จัดเก็บ',
    purchaseDate: 'วันที่จัดซื้อ',
    warrantyExpiry: 'วันหมดประกัน',
    status: 'สถานะสต็อก',
    condition: 'สภาพอุปกรณ์',
    notes: 'หมายเหตุ',
    actions: 'จัดการ',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    deleteConfirm: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้',

    // Settings
    changePassword: 'เปลี่ยนรหัสผ่านใหม่',
    currentPassword: 'รหัสผ่านปัจจุบัน',
    newPassword: 'รหัสผ่านใหม่',
    confirmPassword: 'ยืนยันรหัสผ่านใหม่',
    systemPrefs: 'ตั้งค่าการแสดงผลระบบ',
    language: 'ภาษา (Language)',
    timezone: 'เขตเวลา (Timezone)',
    itemsPerPage: 'จำนวนแถวข้อมูลต่อหน้า',
    savePrefs: 'บันทึกการตั้งค่า',
    itemsPerPageDesc: 'จำนวนแถวข้อมูลที่ต้องการให้แสดงผลต่อหน้าในตารางข้อมูลก่อนการแบ่งหน้าเพจ (Pagination)',

    // Profile
    fullName: 'ชื่อ-นามสกุล',
    email: 'อีเมล',
    phone: 'เบอร์โทรศัพท์',
    saveChanges: 'บันทึกข้อมูลส่วนตัว',
    changePhoto: 'อัพโหลดรูปโปรไฟล์',
    uploadSuccess: 'อัพเดตรูปโปรไฟล์สำเร็จ',
    profileSaved: 'บันทึกข้อมูลส่วนตัวสำเร็จ',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
