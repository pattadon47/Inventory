import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { inventoryAPI } from '../services/api';
import {
  Plus, Search, Pencil, Trash2, X, RefreshCw, Package, ChevronLeft, ChevronRight,
  Monitor, Wrench, Scan, Calendar, Key, Tag, AlertTriangle, Cpu, Layers, Upload, Check, Clock, User, Menu, BookOpen,
  Phone, Shield, Copy, ExternalLink
} from 'lucide-react';

const ITEM_TYPES = ['Hardware', 'Software', 'Accessory', 'Network', 'Cable', 'Other'];
const ITEM_CATEGORIES = [
  'Monitor', 'Mouse', 'Keyboard', 'Phone Headset', 'Computer Headset',
  'Computer', 'CPU Components', 'LAN Cable', 'Phone Cable', 'HDMI Cable',
  'LG Cable', 'AOC Cable', 'VGA Cable', 'Power AC Cable', 'ATA Cable',
  'Phone Box', 'Type-C to LAN Adapter',
];
const STATUS_OPTIONS = ['In Stock', 'Low Stock', 'Out of Stock'];
const CONDITION_OPTIONS = ['Normal', 'In Use', 'Under Repair', 'Broken'];

const emptyItem = {
  itemId: '', name: '', type: '', category: '', brand: '', model: '',
  quantity: '', unitPrice: '', supplier: '', image: '',
  purchaseDate: '', warrantyExpiry: '', status: 'In Stock', condition: 'Normal', notes: '',
};

// Mock data without locations
const mockProducts = [
  { _id: '1', itemId: 'IT-2024-0001', name: 'Dell UltraSharp 27" Monitor', type: 'Hardware', category: 'Monitor', brand: 'Dell', model: 'U2723QE', quantity: 15, unitPrice: 619.99, status: 'In Stock', condition: 'In Use', supplier: 'Dell Direct', image: '' },
  { _id: '2', itemId: 'IT-2024-0002', name: 'Logitech MX Master 3S', type: 'Accessory', category: 'Mouse', brand: 'Logitech', model: 'MX Master 3S', quantity: 30, unitPrice: 99.99, status: 'In Stock', condition: 'Normal', supplier: 'Amazon', image: '' },
  { _id: '3', itemId: 'IT-2024-0003', name: 'Mechanical Keyboard', type: 'Accessory', category: 'Keyboard', brand: 'Keychron', model: 'K8 Pro', quantity: 3, unitPrice: 109.99, status: 'Low Stock', condition: 'Normal', supplier: 'Keychron Store', image: '' },
  { _id: '4', itemId: 'IT-2024-0004', name: 'Cat6 LAN Cable 3m', type: 'Cable', category: 'LAN Cable', brand: 'Ugreen', model: 'NW102', quantity: 0, unitPrice: 8.99, status: 'Out of Stock', condition: 'Broken', supplier: 'Ugreen', image: '' },
  { _id: '5', itemId: 'IT-2024-0005', name: 'HP EliteDesk 800 G6', type: 'Hardware', category: 'Computer', brand: 'HP', model: '800 G6 SFF', quantity: 8, unitPrice: 1249.99, status: 'In Stock', condition: 'In Use', supplier: 'HP Direct', image: '' },
  { _id: '6', itemId: 'IT-2024-0006', name: 'Jabra Evolve2 75', type: 'Accessory', category: 'Computer Headset', brand: 'Jabra', model: 'Evolve2 75', quantity: 5, unitPrice: 299.99, status: 'Low Stock', condition: 'Under Repair', supplier: 'Jabra', image: '' },
  { _id: '7', itemId: 'IT-2024-0007', name: 'HDMI Cable 2m Premium', type: 'Cable', category: 'HDMI Cable', brand: 'Belkin', model: 'AV10175bt2M', quantity: 45, unitPrice: 14.99, status: 'In Stock', condition: 'Normal', supplier: 'Amazon', image: '' },
  { _id: '8', itemId: 'IT-2024-0008', name: 'Windows 11 Pro License', type: 'Software', category: 'Computer', brand: 'Microsoft', model: 'Win 11 Pro', quantity: 50, unitPrice: 199.99, status: 'In Stock', condition: 'Normal', supplier: 'Microsoft', image: '' },
];

const KB_ARTICLES = [
  {
    id: 'kb_zoiper',
    category: 'Software',
    title: {
      en: 'How to Install and Setup Zoiper Softphone',
      th: 'วิธีติดตั้งและตั้งค่าการใช้งาน Zoiper'
    },
    desc: {
      en: 'Step-by-step guide to installing and configuring Zoiper for corporate VoIP phone calls.',
      th: 'ขั้นตอนการติดตั้งและตั้งค่าโปรแกรม Zoiper สำหรับระบบสายในโทรศัพท์สำนักงาน (VoIP)'
    },
    steps: {
      en: [
        'Download Zoiper from the official website (www.zoiper.com/en/voip-softphone/download/current) or search "Zoiper" on App Store/Google Play for mobile.',
        'Run the installer file, click "Next", accept the License Agreement, choose the default installation folder, and click "Finish" to complete.',
        'Launch Zoiper and click the link "Continue as a Free User" to proceed with the free community edition.',
        'Enter your login credentials provided by the IT department (Format: SIP_Extension@domain, e.g., 101@voip.itopplus.com) and your extension password.',
        'Input the Outbound Proxy / SIP Server Domain of the company (e.g., voip.itopplus.com:5060 or corporate VoIP IP) and click "Next".',
        'Wait for Zoiper to auto-detect the network transport protocol (SIP UDP, SIP TCP, or IAX). Click "Next" once a protocol is detected.',
        'Check the registration status. The account status indicator at the top left must display a green checkmark or show "Registered" (Account is active).'
      ],
      th: [
        'ดาวน์โหลดโปรแกรม Zoiper จากเว็บไซต์ทางการ (www.zoiper.com) หรือค้นหาแอป "Zoiper" ใน App Store / Play Store สำหรับติดตั้งในมือถือ',
        'เปิดไฟล์ติดตั้ง กด "Next" ยอมรับข้อตกลงการใช้งาน (License Agreement) เลือกโฟลเดอร์ติดตั้ง และกด "Finish" เพื่อเสร็จสิ้นขั้นตอน',
        'เปิดแอปพลิเคชัน Zoiper ขึ้นมา แล้วคลิกเลือกปุ่ม "Continue as a Free User" เพื่อใช้เวอร์ชันฟรีของระบบ',
        'กรอกบัญชีผู้ใช้งาน VoIP (ในรูปแบบ หมายเลขสายใน@โดเมน เช่น 101@voip.itopplus.com) และรหัสผ่านที่คุณได้รับจากฝ่ายไอที',
        'กรอกโฮสต์เซิร์ฟเวอร์ Outbound Proxy หรือ SIP Domain ของผู้ให้บริการ VoIP ของบริษัท (เช่น voip.itopplus.com) จากนั้นกดปุ่ม "Next"',
        'ระบบจะสแกนหาโปรโตคอลการรับส่งข้อมูล (SIP UDP, SIP TCP, หรือ IAX) อัตโนมัติ เมื่อพบแล้วให้กดปุ่ม "Next" เพื่อบันทึกค่า',
        'ตรวจสอบความพร้อมใช้งาน โดยแถบสถานะมุมซ้ายบนของโปรแกรมจะต้องเปลี่ยนเป็นสีเขียวหรือขึ้นข้อความว่า "Registered" (พร้อมใช้งาน)'
      ]
    }
  },
  {
    id: 'kb_vpn',
    category: 'Network',
    title: {
      en: 'How to Install and Connect to Corporate VPN',
      th: 'วิธีติดตั้งและตั้งค่าการเชื่อมต่อใช้งาน VPN'
    },
    desc: {
      en: 'Guide to installing the VPN client and establishing a secure connection to the corporate server.',
      th: 'คู่มือการดาวน์โหลดและติดตั้ง VPN Client ของบริษัท เพื่อเข้าใช้งานฐานข้อมูลและระบบเครือข่ายภายใน'
    },
    steps: {
      en: [
        'Download the Cisco AnyConnect VPN Client installer from the internal IT Support Portal or network shared drive.',
        'Double-click the downloaded file to run the Setup Wizard. Click "Next", select "I accept...", click "Install", and click "Finish".',
        'Open Cisco AnyConnect Secure Mobility Client from the Windows Start Menu or System Tray.',
        'In the connection server field, type the corporate VPN server address: vpn.itopplus.com and click "Connect".',
        'Select the appropriate group (e.g. Staff, Developer, IT-Admin) and enter your Active Directory (AD) username and Windows password.',
        'Wait a few seconds for the secure connection to build. The system tray icon will display a green/blue padlock representing a successful connection.'
      ],
      th: [
        'ดาวน์โหลดตัวติดตั้งโปรแกรม Cisco AnyConnect VPN Client ได้จากหน้าพอร์ทัลบริการไอทีหลัก หรือลิงก์ที่ได้รับจากฝ่ายสนับสนุน',
        'ดับเบิลคลิกไฟล์ติดตั้ง จากนั้นทำตามขั้นตอนของระบบติดตั้ง (กด Next -> ยอมรับเงื่อนไขการใช้งาน -> กด Install -> กด Finish)',
        'เปิดโปรแกรม Cisco AnyConnect Secure Mobility Client จากเมนู Start หรือคลิกไอคอนที่ทาสก์บาร์ขึ้นมา',
        'ระบุโฮสต์แอดเดรสของเซิร์ฟเวอร์ VPN ของบริษัทลงในช่องว่าง: vpn.itopplus.com แล้วคลิกปุ่ม "Connect"',
        'เลือกกลุ่มเครือข่าย (Group) ที่คุณสังกัด จากนั้นกรอกชื่อผู้ใช้ (AD Account) และรหัสผ่านที่ใช้เข้าเครื่องคอมพิวเตอร์ของคุณ',
        'รอระบบทำการตรวจสอบสิทธิ์และสร้างอุโมงค์เชื่อมต่อแบบเข้ารหัส เมื่อสำเร็จไอคอนที่ทาสก์บาร์จะมีรูปกุญแจล็อกสีเขียวปรากฏอยู่'
      ]
    }
  }
];

export default function InventoryPage() {
  const { isAdmin, user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const tab = new URLSearchParams(location.search).get('tab') || 'overview';

  const [products, setProducts] = useState(mockProducts);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ ...emptyItem });
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);

  // QR Scanner specific states
  const [scannedProduct, setScannedProduct] = useState(null);
  const [scanMessage, setScanMessage] = useState('');

  // Warranty Calendar specific states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedWarrantyDate, setSelectedWarrantyDate] = useState(null);

  // Maintenance specific states
  const [repairHistory, setRepairHistory] = useState(() => {
    const saved = localStorage.getItem('pinventory_repair_history');
    return saved ? JSON.parse(saved) : [
      { id: 'h1', name: 'MacBook Pro 16"', resolvedAt: '2026-06-15', user: 'admin', previousStatus: 'Broken', notes: 'Replaced power connector and battery' },
      { id: 'h2', name: 'Dell Monitor 24"', resolvedAt: '2026-06-14', user: 'admin', previousStatus: 'Under Repair', notes: 'Backlight board replaced' },
      { id: 'h3', name: 'Cisco Router Switch', resolvedAt: '2026-06-11', user: 'system', previousStatus: 'Broken', notes: 'Firmware reset and power supply clean' }
    ];
  });
  const [editingHistoryItem, setEditingHistoryItem] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Knowledge Base specific states
  const [kbSearch, setKbSearch] = useState('');
  const [selectedKbCategory, setSelectedKbCategory] = useState('All');
  const [expandedArticle, setExpandedArticle] = useState(null);

  // Dynamic Items per page from Settings
  const itemsPerPage = parseInt(localStorage.getItem('itemsPerPage') || '10');

  const toggleMainSidebar = () => {
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    localStorage.setItem('sidebarCollapsed', String(!isCollapsed));
    window.dispatchEvent(new Event('sidebarToggle'));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem('pinventory_repair_history', JSON.stringify(repairHistory));
  }, [repairHistory]);

  const fetchProducts = async () => {
    try {
      const res = await inventoryAPI.getAll();
      if (res.data && Array.isArray(res.data)) {
        setProducts(res.data);
      } else if (res.data?.products) {
        setProducts(res.data.products);
      }
    } catch {
      // Use mock data
    }
  };

  const generateItemId = () => {
    const year = new Date().getFullYear();
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    return `IT-${year}-${rand}`;
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ ...emptyItem, itemId: generateItemId() });
    setShowModal(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setShowModal(true);
  };

  const handleOpenDelete = (product) => {
    setEditingProduct(product);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingProduct) {
        await inventoryAPI.update(editingProduct._id || editingProduct.id, formData);
        setProducts(prev => prev.map(p => (p._id === editingProduct._id || p.id === editingProduct.id) ? { ...p, ...formData } : p));
        showToast('Product updated successfully');
        if (scannedProduct && (scannedProduct._id === editingProduct._id || scannedProduct.id === editingProduct.id)) {
          setScannedProduct({ ...scannedProduct, ...formData });
        }
      } else {
        const res = await inventoryAPI.create(formData);
        const savedProduct = res.data || res;
        setProducts(prev => [...prev, { ...formData, ...savedProduct }]);
        showToast('Product added successfully');
      }
    } catch {
      // Local update for demo
      if (editingProduct) {
        setProducts(prev => prev.map(p => (p._id === editingProduct._id || p.id === editingProduct.id) ? { ...p, ...formData } : p));
        showToast('Product updated successfully');
        if (scannedProduct && (scannedProduct._id === editingProduct._id || scannedProduct.id === editingProduct.id)) {
          setScannedProduct({ ...scannedProduct, ...formData });
        }
      } else {
        setProducts(prev => [...prev, { _id: Date.now().toString(), ...formData }]);
        showToast('Product added successfully');
      }
    }
    setShowModal(false);
  };

  const handleDelete = async () => {
    try {
      await inventoryAPI.delete(editingProduct._id || editingProduct.id);
    } catch {
      // Local delete for demo
    }
    setProducts(prev => prev.filter(p => (p._id !== editingProduct._id && p.id !== editingProduct.id)));
    if (scannedProduct && (scannedProduct._id === editingProduct._id || scannedProduct.id === editingProduct.id)) {
      setScannedProduct(null);
    }
    setShowDeleteModal(false);
    showToast('Product deleted successfully');
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = (status) => {
    const map = {
      'In Stock': 'badge-green',
      'Low Stock': 'badge-orange',
      'Out of Stock': 'badge-red',
    };
    return map[status] || 'badge-gray';
  };

  const getConditionBadge = (cond) => {
    const map = {
      'Normal': 'badge-green',
      'In Use': 'badge-blue',
      'Under Repair': 'badge-orange',
      'Broken': 'badge-red',
    };
    return map[cond] || 'badge-gray';
  };

  const getConditionLabel = (cond) => {
    const map = {
      'Normal': localT('condNormal'),
      'In Use': localT('condInUse'),
      'Under Repair': localT('condRepair'),
      'Broken': localT('condBroken'),
    };
    return map[cond] || cond;
  };

  const localT = (key) => {
    const currentLang = localStorage.getItem('language') || 'en';
    const localTranslations = {
      en: {
        overview: 'Overview',
        devices: 'Devices',
        software: 'Software',
        hardware: 'Hardware',
        alerts: 'Alerts',
        licenses: 'Licenses',
        categories: 'Categories',
        scanner: 'QR Scanner',
        warranty: 'Warranty Calendar',
        maintenance: 'Maintenance Queue',
        activeRepairs: 'Active Repairs',
        repairHistory: 'Repair History',
        markNormal: 'Mark Repaired (Normal)',
        markRepair: 'Mark Under Repair',
        markBroken: 'Mark Broken / Damaged',
        simulateScan: 'Simulate QR Scan of Asset',
        uploadImage: 'Upload QR Image File',
        noCamera: 'No camera on computer? Upload a QR/Asset photo to view details.',
        scannedAsset: 'Scanned Asset Information',
        editHistory: 'Edit Repair History Log',
        resolver: 'Resolver Person',
        resolvedAt: 'Resolution Date',
        previousStatus: 'Before Status',
        saveChanges: 'Save Changes',
        deleteRecord: 'Delete History Record',
        addHistory: 'Add Repair History Record',
        notes: 'Repair Details / Notes',
        photo: 'Asset Image / Photo',
        condNormal: 'Normal / Available',
        condInUse: 'In Use',
        condRepair: 'Under Repair',
        condBroken: 'Broken / Damaged',
        statusChangeSuccess: 'Condition status updated successfully',
        scanSuccess: 'QR Code processed successfully'
      },
      th: {
        overview: 'ภาพรวมคลัง',
        devices: 'อุปกรณ์',
        software: 'ซอฟต์แวร์',
        hardware: 'ฮาร์ดแวร์',
        alerts: 'แจ้งเตือนสินค้า',
        licenses: 'สิทธิ์การใช้งาน (Licenses)',
        categories: 'หมวดหมู่อุปกรณ์',
        scanner: 'เครื่องสแกน QR',
        warranty: 'ปฏิทินประกัน',
        maintenance: 'คิวซ่อมบำรุง',
        activeRepairs: 'รายการส่งซ่อมขณะนี้',
        repairHistory: 'ประวัติการซ่อมบำรุง',
        markNormal: 'ซ่อมเสร็จแล้ว (ปกติ)',
        markRepair: 'ส่งซ่อมบำรุง',
        markBroken: 'ชำรุดเสียหาย',
        simulateScan: 'จำลองการสแกน QR',
        uploadImage: 'อัปโหลดรูปภาพ QR Code',
        noCamera: 'คอมพิวเตอร์ไม่มีกล้อง? อัปโหลดรูปภาพ QR หรือภาพอุปกรณ์แทนได้',
        scannedAsset: 'รายละเอียดครุภัณฑ์ที่พบ',
        editHistory: 'แก้ไขประวัติการซ่อมบำรุง',
        resolver: 'ผู้ซ่อมแซม',
        resolvedAt: 'วันที่ซ่อมเสร็จ',
        previousStatus: 'สภาพก่อนหน้า',
        saveChanges: 'บันทึกการแก้ไข',
        deleteRecord: 'ลบประวัติ',
        addHistory: 'เพิ่มประวัติการซ่อม',
        notes: 'หมายเหตุการซ่อมแซม',
        photo: 'รูปภาพอุปกรณ์',
        condNormal: 'ใช้งานได้ปกติ / ว่าง',
        condInUse: 'กำลังใช้งาน',
        condRepair: 'ส่งซ่อมบำรุง',
        condBroken: 'ชำรุด / เสียหาย',
        statusChangeSuccess: 'อัปเดตสภาพอุปกรณ์เรียบร้อยแล้ว',
        scanSuccess: 'สแกน QR Code เสร็จสิ้น',
        knowledgeBase: 'คลังความรู้ & คู่มือไอที'
      }
    };
    localTranslations.en.knowledgeBase = 'IT Knowledge Base';
    return localTranslations[currentLang]?.[key] || t(key) || key;
  };

  // Sub-sidebar structure
  const subSidebarItems = [
    {
      section: 'INVENTORY',
      items: [
        { id: 'overview', label: localT('overview'), icon: Package },
        { id: 'devices', label: localT('devices'), icon: Monitor },
        { id: 'software', label: localT('software'), icon: Layers },
        { id: 'hardware', label: localT('hardware'), icon: Cpu },
      ]
    },
    {
      section: 'CONTROL',
      items: [
        { id: 'maintenance', label: localT('maintenance'), icon: Wrench },
        isAdmin ? { id: 'scanner', label: localT('scanner'), icon: Scan } : null,
      ].filter(Boolean)
    },
    {
      section: 'MANAGEMENT',
      items: [
        { id: 'warranty', label: localT('warranty'), icon: Calendar },
        { id: 'categories', label: localT('categories'), icon: Tag },
        { id: 'alerts', label: localT('alerts'), icon: AlertTriangle },
      ]
    }
  ];

  // Filter products for standard tables
  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.itemId?.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || p.type === filterType;
    const matchCategory = !filterCategory || p.category === filterCategory;
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchType && matchCategory && matchStatus;
  });

  const getTableData = () => {
    switch (tab) {
      case 'devices':
        return filtered.filter(p => p.type === 'Hardware' && (p.category === 'Computer' || p.category === 'Monitor' || p.category === 'CPU Components'));
      case 'software':
        return filtered.filter(p => p.type === 'Software');
      case 'hardware':
        return filtered.filter(p => p.type === 'Hardware');
      case 'alerts':
        return filtered.filter(p => p.quantity <= 5 || p.status === 'Low Stock' || p.status === 'Out of Stock');

      default:
        return filtered;
    }
  };

  const activeData = getTableData();
  const totalPages = Math.ceil(activeData.length / itemsPerPage);
  const paginated = activeData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // QR Scanner scan mockup handlers
  const handleQRUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Simulate decoding QR
      const randomIdx = Math.floor(Math.random() * products.length);
      const randomProd = products[randomIdx];
      setScannedProduct(randomProd);
      setScanMessage(`${localT('scanSuccess')}: ID ${randomProd.itemId}`);
      showToast(localT('scanSuccess'));
    }
  };

  const handleSimulateScan = (itemId) => {
    if (!itemId) {
      setScannedProduct(null);
      setScanMessage('');
      return;
    }
    const found = products.find(p => p.itemId === itemId);
    if (found) {
      setScannedProduct(found);
      setScanMessage(`${localT('scanSuccess')}: ID ${found.itemId}`);
      showToast(localT('scanSuccess'));
    }
  };

  const handleUpdateScannedCondition = async (newCond) => {
    if (!scannedProduct) return;
    try {
      const prodId = scannedProduct._id || scannedProduct.id;
      const updated = { ...scannedProduct, condition: newCond };
      await inventoryAPI.update(prodId, updated);
      
      // Update local products list
      setProducts(prev => prev.map(p => (p._id === prodId || p.id === prodId) ? updated : p));
      setScannedProduct(updated);
      showToast(localT('statusChangeSuccess'));
      
      // Add to maintenance logs if set to Normal
      if (newCond === 'Normal') {
        const nowStr = new Date().toISOString().split('T')[0];
        const newHistory = {
          id: `h-${Date.now()}`,
          name: scannedProduct.name,
          resolvedAt: nowStr,
          user: user?.fullName || user?.username || 'admin',
          previousStatus: scannedProduct.condition,
          notes: 'Resolved via QR scan condition update'
        };
        setRepairHistory(prev => [newHistory, ...prev]);
      }
    } catch {
      // Offline simulation
      const prodId = scannedProduct._id || scannedProduct.id;
      const updated = { ...scannedProduct, condition: newCond };
      setProducts(prev => prev.map(p => (p._id === prodId || p.id === prodId) ? updated : p));
      setScannedProduct(updated);
      showToast(localT('statusChangeSuccess'));
      
      if (newCond === 'Normal') {
        const nowStr = new Date().toISOString().split('T')[0];
        const newHistory = {
          id: `h-${Date.now()}`,
          name: scannedProduct.name,
          resolvedAt: nowStr,
          user: user?.fullName || user?.username || 'admin',
          previousStatus: scannedProduct.condition,
          notes: 'Resolved via QR scan condition update'
        };
        setRepairHistory(prev => [newHistory, ...prev]);
      }
    }
  };

  // Warranty Calendar Helpers
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDayIndex, totalDays };
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedWarrantyDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedWarrantyDate(null);
  };

  const getWarrantyItemsForDay = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const targetDateStr = `${year}-${month}-${dayStr}`;
    return products.filter(p => p.warrantyExpiry && p.warrantyExpiry.startsWith(targetDateStr));
  };

  // Maintenance Tab: Active repairs
  const activeRepairs = products.filter(p => p.condition === 'Under Repair' || p.condition === 'Broken');

  const handleMaintenanceStatusChange = async (product, newCond) => {
    try {
      const prodId = product._id || product.id;
      const updated = { ...product, condition: newCond };
      
      // Update in API
      await inventoryAPI.update(prodId, updated);
      setProducts(prev => prev.map(p => (p._id === prodId || p.id === prodId) ? updated : p));
      showToast(localT('statusChangeSuccess'));

      // If condition was changed to Normal, record to history log
      if (newCond === 'Normal') {
        const nowStr = new Date().toISOString().split('T')[0];
        const newHistory = {
          id: `h-${Date.now()}`,
          name: product.name,
          resolvedAt: nowStr,
          user: user?.fullName || user?.username || 'admin',
          previousStatus: product.condition,
          notes: 'Device repaired and returned to normal service'
        };
        setRepairHistory(prev => [newHistory, ...prev]);
      }
    } catch {
      // Offline fallback
      const prodId = product._id || product.id;
      const updated = { ...product, condition: newCond };
      setProducts(prev => prev.map(p => (p._id === prodId || p.id === prodId) ? updated : p));
      showToast(localT('statusChangeSuccess'));

      if (newCond === 'Normal') {
        const nowStr = new Date().toISOString().split('T')[0];
        const newHistory = {
          id: `h-${Date.now()}`,
          name: product.name,
          resolvedAt: nowStr,
          user: user?.fullName || user?.username || 'admin',
          previousStatus: product.condition,
          notes: 'Device repaired and returned to normal service'
        };
        setRepairHistory(prev => [newHistory, ...prev]);
      }
    }
  };

  // Edit History Handlers
  const handleOpenEditHistory = (item) => {
    setEditingHistoryItem(item);
    setShowHistoryModal(true);
  };

  const handleSaveHistoryEdit = () => {
    setRepairHistory(prev => prev.map(h => h.id === editingHistoryItem.id ? editingHistoryItem : h));
    setShowHistoryModal(false);
    setEditingHistoryItem(null);
    showToast('Repair history updated successfully');
  };

  const handleDeleteHistory = (histId) => {
    setRepairHistory(prev => prev.filter(h => h.id !== histId));
    showToast('Repair record deleted successfully');
  };

  const handleHistoryChange = (field, value) => {
    setEditingHistoryItem(prev => ({ ...prev, [field]: value }));
  };

  // Categories Tab calculations
  const getCategoriesStats = () => {
    return ITEM_CATEGORIES.map(cat => {
      const catProducts = products.filter(p => p.category === cat);
      const totalQuantity = catProducts.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
      const totalVal = catProducts.reduce((sum, p) => sum + ((parseInt(p.quantity) || 0) * (parseFloat(p.unitPrice) || 0)), 0);
      return {
        name: cat,
        itemCount: catProducts.length,
        totalQty: totalQuantity,
        totalValue: totalVal
      };
    });
  };

  // Content switcher
  const renderContent = () => {
    if (tab === 'scanner') {
      if (!isAdmin) {
        const currentLang = localStorage.getItem('language') || 'en';
        return (
          <div style={{ padding: 48, textAlign: 'center', background: 'white', borderRadius: 12, border: '1px solid var(--gray-200)', margin: '24px auto', maxWidth: 600 }}>
            <h2 style={{ color: '#dc2626', marginBottom: 12 }}>{currentLang === 'th' ? 'ปฏิเสธการเข้าถึง' : 'Access Denied'}</h2>
            <p>{currentLang === 'th' ? 'คุณไม่มีสิทธิ์ในการเข้าใช้งานเครื่องสแกน QR' : 'You do not have permission to view the QR Scanner.'}</p>
          </div>
        );
      }
      return (
        <div style={{ padding: 24, maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="page-header">
            <h1>{localT('scanner')}</h1>
            <p>Simulate QR Code scanning and asset status lookup</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
            {/* Scanner Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', background: 'white', border: '1px solid var(--gray-100)', padding: 32, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="scanner-area">
                <div className="scanner-laser"></div>
                <div className="scanner-viewfinder">
                  <div className="scanner-corner top-left"></div>
                  <div className="scanner-corner top-right"></div>
                  <div className="scanner-corner bottom-left"></div>
                  <div className="scanner-corner bottom-right"></div>
                </div>
              </div>

              <p style={{ color: 'var(--gray-500)', fontSize: 13, textAlign: 'center' }}>
                {localT('noCamera')}
              </p>

              <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
                <label className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                  <Upload size={16} />
                  {localT('uploadImage')}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleQRUpload} />
                </label>
              </div>

              <div style={{ width: '100%', borderTop: '1px solid var(--gray-100)', paddingTop: 16 }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--gray-700)', marginBottom: 8, display: 'block' }}>
                  {localT('simulateScan')}
                </label>
                <select className="form-select" onChange={(e) => handleSimulateScan(e.target.value)} defaultValue="" style={{ width: '100%' }}>
                  <option value="">-- Choose Asset --</option>
                  {products.map(p => (
                    <option key={p._id || p.id} value={p.itemId}>{p.itemId} - {p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {scannedProduct ? (
                <div className="warranty-calendar-card animate-fadeIn" style={{ background: 'white', padding: 24, borderLeft: '4px solid var(--primary-500)' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary-700)' }}>
                    <Check size={18} /> {localT('scannedAsset')}
                  </h3>
                  <div style={{ display: 'flex', gap: 16, marginTop: 16, borderBottom: '1px solid var(--gray-100)', paddingBottom: 16 }}>
                    {scannedProduct.image ? (
                      <img src={scannedProduct.image} alt="Asset" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--gray-200)' }} />
                    ) : (
                      <div style={{ width: 80, height: 80, background: 'var(--gray-100)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                        <Package size={32} />
                      </div>
                    )}
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 700 }}>{scannedProduct.name}</h4>
                      <p style={{ margin: 0, color: 'var(--primary-600)', fontWeight: 600 }}>{scannedProduct.itemId}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--gray-500)' }}>{scannedProduct.brand} • {scannedProduct.model}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16, fontSize: 13 }}>
                    <div><strong>Type:</strong> {scannedProduct.type}</div>
                    <div><strong>Category:</strong> {scannedProduct.category}</div>
                    <div><strong>Qty:</strong> {scannedProduct.quantity}</div>
                    <div><strong>Price:</strong> ${Number(scannedProduct.unitPrice || 0).toFixed(2)}</div>
                    <div><strong>Status:</strong> <span className={`badge ${getStatusBadge(scannedProduct.status)}`}>{scannedProduct.status}</span></div>
                    <div>
                      <strong>Condition:</strong> <span className={`badge ${getConditionBadge(scannedProduct.condition)}`}>{getConditionLabel(scannedProduct.condition)}</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
                      <label className="form-label" style={{ fontWeight: 600, color: 'var(--gray-700)', marginBottom: 8, display: 'block' }}>
                        Update Condition Status
                      </label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleUpdateScannedCondition('Normal')}>{localT('markNormal')}</button>
                        <button className="btn btn-outline btn-sm" style={{ color: '#f59e0b', borderColor: '#f59e0b' }} onClick={() => handleUpdateScannedCondition('Under Repair')}>{localT('markRepair')}</button>
                        <button className="btn btn-outline btn-sm btn-danger" onClick={() => handleUpdateScannedCondition('Broken')}>{localT('markBroken')}</button>
                      </div>

                      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleOpenEdit(scannedProduct)}>
                          <Pencil size={12} /> Edit Details & Photo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: 'white', border: '1px dashed var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', color: 'var(--gray-400)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Scan size={48} style={{ marginBottom: 12, color: 'var(--gray-300)' }} />
                  <h4>Waiting for Scan</h4>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>Select an asset above to simulate scanning or upload an image file</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (tab === 'warranty') {
      const { firstDayIndex, totalDays } = getDaysInMonth();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const days = [];
      for (let i = 0; i < firstDayIndex; i++) {
        days.push(<div key={`empty-${i}`} className="warranty-calendar-day empty"></div>);
      }
      for (let d = 1; d <= totalDays; d++) {
        const expiringItems = getWarrantyItemsForDay(d);
        const hasExpiry = expiringItems.length > 0;
        days.push(
          <div
            key={`day-${d}`}
            className={`warranty-calendar-day ${selectedWarrantyDate === d ? 'selected' : ''}`}
            onClick={() => setSelectedWarrantyDate(d)}
          >
            {d}
            {hasExpiry && (
              <span className={`warranty-calendar-dot ${expiringItems.some(i => i.status === 'Low Stock' || i.condition === 'Broken') ? 'red' : 'orange'}`}></span>
            )}
          </div>
        );
      }

      const selectedDayItems = selectedWarrantyDate ? getWarrantyItemsForDay(selectedWarrantyDate) : [];

      return (
        <div style={{ padding: 24, maxWidth: 850, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="page-header">
            <h1>{localT('warranty')}</h1>
            <p>Track hardware warranty expirations in calendar view</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
            {/* Calendar Widget */}
            <div className="warranty-calendar-card">
              <div className="warranty-calendar-header">
                <span className="warranty-calendar-month-title">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="warranty-calendar-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
                  <button className="warranty-calendar-nav-btn" onClick={handleNextMonth}><ChevronRight size={16} /></button>
                </div>
              </div>
              <div className="warranty-calendar-grid">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="warranty-calendar-weekday">{day}</div>
                ))}
                {days}
              </div>
            </div>

            {/* List Widget */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedWarrantyDate ? (
                <div className="warranty-calendar-card" style={{ padding: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--gray-800)' }}>
                    Expirations on {selectedWarrantyDate} {monthNames[currentDate.getMonth()]}
                  </h3>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedDayItems.length === 0 ? (
                      <p style={{ color: 'var(--gray-500)', fontSize: 13, margin: 0 }}>No warranties expire on this date.</p>
                    ) : (
                      selectedDayItems.map(item => (
                        <div key={item._id || item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid var(--gray-100)' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{item.name}</h4>
                            <p style={{ margin: '2px 0 0 0', fontSize: 11, color: 'var(--gray-500)' }}>{item.itemId} • Qty: {item.quantity}</p>
                          </div>
                          <span className={`badge ${getStatusBadge(item.status)}`}>{item.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ background: 'white', border: '1px dashed var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', color: 'var(--gray-400)', height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Calendar size={36} style={{ marginBottom: 12, color: 'var(--gray-300)' }} />
                  <h4>Select a Date</h4>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>Click on a day in the calendar to view expiring items.</p>
                </div>
              )}

              {/* Monthly Overview summary card */}
              <div className="warranty-calendar-card" style={{ padding: 20 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Monthly Statistics</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-600)' }}>
                      {products.filter(p => p.warrantyExpiry && p.warrantyExpiry.includes(`-${String(currentDate.getMonth() + 1).padStart(2, '0')}-`)).length}
                    </span>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>Total expirations this month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (tab === 'maintenance') {
      return (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="page-header">
            <div>
              <h1>{localT('maintenance')}</h1>
              <p>Manage and log repairs for damaged physical inventory items</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
            {/* Active repairs queue */}
            <div className="warranty-calendar-card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wrench size={18} color="var(--primary-600)" />
                {localT('activeRepairs')}
              </h3>

              {activeRepairs.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--gray-500)', fontSize: 13 }}>
                  No active devices in repair queue.
                </div>
              ) : (
                <div className="table-container" style={{ border: 'none', padding: 0, boxShadow: 'none' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Asset ID</th>
                        <th>Device Name</th>
                        <th>Current Condition</th>
                        {isAdmin && <th>Update Condition</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {activeRepairs.map(prod => (
                        <tr key={prod._id || prod.id}>
                          <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{prod.itemId}</td>
                          <td style={{ fontWeight: 500 }}>{prod.name}</td>
                          <td><span className={`badge ${getConditionBadge(prod.condition)}`}>{getConditionLabel(prod.condition)}</span></td>
                          {isAdmin && (
                            <td>
                              <select
                                className="filter-select"
                                style={{ margin: 0, padding: '4px 8px', height: 'auto', fontSize: 12 }}
                                value={prod.condition}
                                onChange={(e) => handleMaintenanceStatusChange(prod, e.target.value)}
                              >
                                <option value="Normal">✓ Repaired / Available</option>
                                <option value="Under Repair">⚠ Under Repair</option>
                                <option value="Broken">✗ Broken / Damaged</option>
                              </select>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Repair history */}
            <div className="warranty-calendar-card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} color="var(--primary-600)" />
                {localT('repairHistory')}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
                {repairHistory.map((item) => (
                  <div key={item.id} style={{ border: '1px solid var(--gray-100)', borderRadius: 8, padding: 12, background: '#f8fafc', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', paddingRight: 40 }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{item.name}</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'var(--gray-500)', display: 'flex', gap: 8 }}>
                          <span><User size={10} style={{ display: 'inline', marginRight: 2 }} /> {item.user}</span>
                          <span>•</span>
                          <span>{item.resolvedAt}</span>
                        </p>
                      </div>
                      <span className="badge badge-green" style={{ fontSize: 10 }}>Fixed</span>
                    </div>
                    {item.notes && (
                      <p style={{ margin: '8px 0 0 0', fontSize: 11, color: 'var(--gray-600)', background: 'white', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--gray-50)' }}>
                        {item.notes}
                      </p>
                    )}
                    {isAdmin && (
                      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => handleOpenEditHistory(item)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', padding: 2 }}
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteHistory(item.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--red-500)', cursor: 'pointer', padding: 2 }}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Edit History Item Modal */}
          {showHistoryModal && editingHistoryItem && (
            <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                <div className="modal-header">
                  <h3 className="modal-title">{localT('editHistory')}</h3>
                  <button className="modal-close" onClick={() => setShowHistoryModal(false)}><X size={18}/></button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">{localT('resolver')}</label>
                    <input className="form-input" value={editingHistoryItem.user} onChange={(e) => handleHistoryChange('user', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{localT('resolvedAt')}</label>
                    <input className="form-input" type="date" value={editingHistoryItem.resolvedAt} onChange={(e) => handleHistoryChange('resolvedAt', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{localT('notes')}</label>
                    <textarea className="form-textarea" value={editingHistoryItem.notes || ''} onChange={(e) => handleHistoryChange('notes', e.target.value)} rows={3} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>{localT('cancel')}</button>
                  <button className="btn btn-primary" onClick={handleSaveHistoryEdit}>{localT('saveChanges')}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (tab === 'categories') {
      const stats = getCategoriesStats();
      return (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="page-header">
            <h1>{localT('categories')}</h1>
            <p>Distribution stats and summaries by device category</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {stats.map(cat => (
              <div key={cat.name} className="location-summary-card">
                <div className="location-summary-card-header">
                  <div className="location-summary-icon">
                    <Tag size={16} />
                  </div>
                  <h3 style={{ fontSize: 14, margin: 0, fontWeight: 700 }}>{cat.name}</h3>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--gray-50)', paddingTop: 10, fontSize: 12 }}>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-800)' }}>{cat.itemCount}</span>
                    <p style={{ margin: 0, color: 'var(--gray-400)' }}>Product types</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-600)' }}>{cat.totalQty}</span>
                    <p style={{ margin: 0, color: 'var(--gray-400)' }}>In Stock</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (tab === 'kb') {
      const currentLang = localStorage.getItem('language') || 'en';
      const filteredArticles = KB_ARTICLES.filter(art => {
        const titleText = art.title[currentLang] || '';
        const descText = art.desc[currentLang] || '';
        const matchSearch = !kbSearch ||
          titleText.toLowerCase().includes(kbSearch.toLowerCase()) ||
          descText.toLowerCase().includes(kbSearch.toLowerCase());
        const matchCat = selectedKbCategory === 'All' || art.category === selectedKbCategory;
        return matchSearch && matchCat;
      });

      const kbCategories = currentLang === 'th'
        ? ['ทั้งหมด', 'Software', 'Network']
        : ['All', 'Software', 'Network'];

      const getCatValue = (cat) => {
        if (cat === 'ทั้งหมด' || cat === 'All') return 'All';
        return cat;
      };

      const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text);
        showToast(currentLang === 'th' ? `คัดลอก ${label} สำเร็จ!` : `${label} copied!`);
      };

      return (
        <div className="kb-container">
          <div className="kb-banner">
            <h1>{currentLang === 'th' ? 'ศูนย์ช่วยเหลือและคู่มือไอที' : 'IT Support Center'}</h1>
            <p>
              {currentLang === 'th'
                ? 'ยินดีต้อนรับสู่คลังข้อมูลฝ่ายไอที ค้นหาคู่มือแนะนำการปฏิบัติงาน ขั้นตอนการติดตั้งซอฟต์แวร์ และการเชื่อมต่อระบบเครือข่ายภายในบริษัทได้อย่างรวดเร็ว'
                : 'Welcome to the IT Knowledge Base. Browse step-by-step guides, official software installation procedures, and secure network setup configurations.'}
            </p>

            <div className="kb-search-row">
              <div className="kb-search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder={currentLang === 'th' ? 'ค้นหาคู่มือช่วยเหลือ...' : 'Search installation guides...'}
                  value={kbSearch}
                  onChange={(e) => setKbSearch(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {kbCategories.map(cat => {
                  const val = getCatValue(cat);
                  const isCatActive = selectedKbCategory === val;
                  return (
                    <button
                      key={cat}
                      className={`btn ${isCatActive ? 'btn-primary' : 'btn-outline'}`}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        height: 'auto',
                        minHeight: 'auto',
                        fontWeight: 600,
                      }}
                      onClick={() => setSelectedKbCategory(val)}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="kb-grid">
            {filteredArticles.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0', color: 'var(--gray-400)', background: 'white', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                {currentLang === 'th' ? 'ไม่พบข้อมูลคู่มือที่ค้นหา' : 'No articles match your search or filter criteria.'}
              </div>
            ) : (
              filteredArticles.map(art => {
                const isExpanded = expandedArticle === art.id;
                const isZoiper = art.id === 'kb_zoiper';
                const Icon = isZoiper ? Phone : Shield;
                
                return (
                  <div
                    key={art.id}
                    className={`kb-card ${isExpanded ? 'active' : ''}`}
                    onClick={() => setExpandedArticle(isExpanded ? null : art.id)}
                  >
                    <div className="kb-card-header">
                      <div className={`kb-card-icon-container ${isZoiper ? 'zoiper' : 'vpn'}`}>
                        <Icon size={24} />
                      </div>
                      <div className="kb-card-title-section">
                        <span className={isZoiper ? 'badge-zoiper' : 'badge-vpn'}>
                          {art.category}
                        </span>
                        <h3>{art.title[currentLang]}</h3>
                        <p>{art.desc[currentLang]}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', height: '100%', alignSelf: 'center' }}>
                        <ChevronRight
                          size={20}
                          style={{
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            color: 'var(--gray-400)',
                          }}
                        />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="kb-card-body" onClick={e => e.stopPropagation()}>
                        {/* Canva Slide Embed */}
                        <div style={{ marginBottom: 24 }}>
                          <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--gray-200)' }}>
                            <iframe
                              src={isZoiper 
                                ? "https://www.canva.com/design/DAHI-Rb3UQw/view?embed" 
                                : "https://www.canva.com/design/DAHI9qtPlSQ/view?embed"
                              }
                              allowFullScreen
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                              title={art.title[currentLang]}
                              loading="lazy"
                            />
                          </div>
                        </div>
                        <div className="kb-timeline">
                          {art.steps[currentLang].map((step, idx) => {
                            const stepNum = String(idx + 1).padStart(2, '0');
                            
                            // Check for copyable fields
                            let codeValue = null;
                            let codeLabel = '';
                            if (isZoiper && idx === 4) {
                              codeValue = 'voip.itopplus.com';
                              codeLabel = 'SIP Domain';
                            } else if (!isZoiper && idx === 3) {
                              codeValue = 'vpn.itopplus.com';
                              codeLabel = 'VPN Server';
                            }

                            return (
                              <div key={idx} className="kb-timeline-item">
                                <div className="kb-timeline-number">
                                  {stepNum}
                                </div>
                                <div className="kb-timeline-content">
                                  <h4>
                                    {isZoiper 
                                      ? (currentLang === 'th' ? `ขั้นตอนที่ ${idx + 1}` : `Step ${idx + 1}`)
                                      : (currentLang === 'th' ? `ขั้นตอนที่ ${idx + 1}` : `Step ${idx + 1}`)
                                    }
                                  </h4>
                                  <p>{step}</p>
                                  
                                  {codeValue && (
                                    <div className="kb-code-box">
                                      <span className="kb-code-text">{codeValue}</span>
                                      <button 
                                        className="kb-copy-btn"
                                        onClick={() => handleCopy(codeValue, codeLabel)}
                                      >
                                        <Copy size={12} />
                                        <span>{currentLang === 'th' ? 'คัดลอก' : 'Copy'}</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }

    // Default: List Table View (for overview, devices, software, hardware, alerts)
    return (
      <>
        <div className="page-header">
          <div className="page-header-actions">
            <div>
              <h1>{localT(tab)}</h1>
              <p>Manage your IT inventory assets</p>
            </div>
            {isAdmin && (
              <button className="btn btn-primary" onClick={handleOpenAdd}>
                <Plus size={18} />
                {t('addItem')}
              </button>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-box">
            <div className="search-box-icon"><Search size={18} /></div>
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select className="filter-select" value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
            <option value="">{t('allTypes')}</option>
            {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="filter-select" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}>
            <option value="">{t('allCategories')}</option>
            {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
            <option value="">{t('allStatus')}</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        {activeData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={36} /></div>
            <h3>No products found</h3>
            <p>Try adjusting your search or filter criteria, or add a new inventory item.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('itemId')}</th>
                  <th>Image</th>
                  <th>{t('itemName')}</th>
                  <th>{t('itemType')}</th>
                  <th>{t('itemCategory')}</th>
                  <th>{t('brand')}</th>
                  <th>{t('quantity')}</th>
                  <th>{t('unitPrice')}</th>
                  <th>{t('status')}</th>
                  <th>{t('condition')}</th>
                  {isAdmin && <th>{t('actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => (
                  <tr key={p._id || p.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{p.itemId}</td>
                    <td>
                      {p.image ? (
                        <img src={p.image} alt="product" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 32, height: 32, background: 'var(--gray-100)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                          <Package size={14} />
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td>{p.type}</td>
                    <td>{p.category}</td>
                    <td>{p.brand}</td>
                    <td style={{ fontWeight: 600 }}>{p.quantity}</td>
                    <td>${Number(p.unitPrice || 0).toFixed(2)}</td>
                    <td><span className={`badge ${getStatusBadge(p.status)}`}>{p.status}</span></td>
                    <td><span className={`badge ${getConditionBadge(p.condition)}`}>{getConditionLabel(p.condition)}</span></td>
                    {isAdmin && (
                      <td>
                        <div className="flex gap-8" style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-icon-sm btn-outline" onClick={() => handleOpenEdit(p)} title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-icon-sm btn-danger" onClick={() => handleOpenDelete(p)} title="Delete" style={{ width: 32, height: 32, padding: 0, borderRadius: 6 }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                  <ChevronRight size={16} />
                </button>
                <span className="pagination-info">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, activeData.length)} of {activeData.length}
                </span>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="inventory-layout">
      {/* Sub-sidebar inside InventoryPage */}
      <div className="inventory-sub-sidebar">
        {/* Toggle Main Sidebar Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px 12px 14px', borderBottom: '1px solid var(--gray-100)', marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-800)' }}>PInventory</span>
          <button 
            onClick={toggleMainSidebar} 
            style={{ background: 'transparent', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: 4 }}
            title="Toggle Sidebar"
          >
            <Menu size={18} />
          </button>
        </div>

        {subSidebarItems.map((section, idx) => (
          <div key={idx} style={{ marginBottom: 18 }}>
            <div className="inventory-sub-sidebar-header-section">{section.section}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <div
                  key={item.id}
                  className={`inventory-sub-sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    navigate(`/inventory?tab=${item.id}`);
                    setCurrentPage(1);
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Main inventory content */}
      <div className="inventory-main-content animate-fadeIn">
        <div style={{ padding: '0 24px 24px 24px' }}>
          {renderContent()}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingProduct ? t('editItem') : t('addItem')}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('itemId')}</label>
                  <div className="form-inline">
                    <input className="form-input" value={formData.itemId} onChange={(e) => handleChange('itemId', e.target.value)} placeholder="IT-2024-XXXX" />
                    <button className="btn btn-outline btn-sm" onClick={() => handleChange('itemId', generateItemId())} type="button">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('itemName')}</label>
                  <input className="form-input" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Product name" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('itemType')}</label>
                  <select className="form-select" value={formData.type} onChange={(e) => handleChange('type', e.target.value)}>
                    <option value="">Select type...</option>
                    {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('itemCategory')}</label>
                  <select className="form-select" value={formData.category} onChange={(e) => handleChange('category', e.target.value)}>
                    <option value="">Select category...</option>
                    {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('brand')}</label>
                  <input className="form-input" value={formData.brand} onChange={(e) => handleChange('brand', e.target.value)} placeholder="Brand name" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('model')}</label>
                  <input className="form-input" value={formData.model} onChange={(e) => handleChange('model', e.target.value)} placeholder="Model number" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('quantity')}</label>
                  <input className="form-input" type="number" min="0" value={formData.quantity} onChange={(e) => handleChange('quantity', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('unitPrice')}</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={formData.unitPrice} onChange={(e) => handleChange('unitPrice', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('supplier')}</label>
                  <input className="form-input" value={formData.supplier} onChange={(e) => handleChange('supplier', e.target.value)} placeholder="Supplier name" />
                </div>
                <div className="form-group">
                  <label className="form-label">{localT('photo')}</label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {formData.image && (
                      <img src={formData.image} alt="Preview" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--gray-200)' }} />
                    )}
                    <label className="btn btn-outline btn-sm" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <Upload size={14} />
                      Choose Image
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            handleChange('image', reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                    {formData.image && (
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => handleChange('image', '')} style={{ padding: '4px 8px', height: 'auto', minHeight: 'auto' }}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('purchaseDate')}</label>
                  <input className="form-input" type="date" value={formData.purchaseDate} onChange={(e) => handleChange('purchaseDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('warrantyExpiry')}</label>
                  <input className="form-input" type="date" value={formData.warrantyExpiry} onChange={(e) => handleChange('warrantyExpiry', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('status')}</label>
                  <select className="form-select" value={formData.status} onChange={(e) => handleChange('status', e.target.value)}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('condition')}</label>
                  <select className="form-select" value={formData.condition || 'Normal'} onChange={(e) => handleChange('condition', e.target.value)}>
                    {CONDITION_OPTIONS.map(c => <option key={c} value={c}>{getConditionLabel(c)}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('notes')}</label>
                <textarea className="form-textarea" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Additional notes..." rows={3} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editingProduct ? t('save') : t('addItem')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="confirm-modal">
              <div className="confirm-icon danger">
                <Trash2 size={28} />
              </div>
              <h3 className="confirm-title">{t('deleteItem')}</h3>
              <p className="confirm-text">
                {t('deleteConfirm')} <strong>{editingProduct?.name}</strong>
              </p>
              <div className="confirm-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>{t('cancel')}</button>
                <button className="btn btn-danger" onClick={handleDelete}>{t('deleteItem')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast toast-success">✓ {toast}</div>}
    </div>
  );
}
