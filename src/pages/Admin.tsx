import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { Product, Category, Order, UserProfile } from '../types';
import { 
  Plus, Edit2, Trash2, Package, List, ShoppingCart, 
  Image as ImageIcon, X, Check, ExternalLink, 
  Users, TrendingUp, AlertTriangle, LayoutDashboard,
  ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'users'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<any>({});
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodSnap, catSnap, orderSnap, userSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'categories')),
        getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'users'))
      ]);

      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      setOrders(orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setUsers(userSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    } catch (error) {
      console.error("Admin fetch error:", error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalSales: orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + o.total, 0),
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalCustomers: users.length,
    lowStockItems: products.filter(p => p.stock < 10).length
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = formData.imageUrl || '';
      if (imageFile) {
        const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const data = { ...formData, imageUrl };
      if (activeTab === 'products') {
        data.price = Number(data.price);
        data.discount = Number(data.discount || 0);
        data.stock = Number(data.stock || 0);
      } else if (activeTab === 'categories') {
        data.discount = Number(data.discount || 0);
      }

      if (editingItem) {
        await updateDoc(doc(db, activeTab, editingItem.id), data);
        toast.success('Updated successfully');
      } else {
        await addDoc(collection(db, activeTab), data);
        toast.success('Added successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, activeTab, itemToDelete));
      toast.success('Deleted');
      setIsConfirmOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const confirmDelete = (id: string) => {
    setItemToDelete(id);
    setIsConfirmOpen(true);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-4xl font-bold text-[#800000]" style={{ fontFamily: "'Playfair Display', serif" }}>Admin Dashboard</h1>
        <div className="flex flex-wrap bg-white p-1 rounded-2xl border border-[#800000]/10 shadow-sm">
          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'categories', label: 'Categories', icon: List },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'users', label: 'Users', icon: Users }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${activeTab === tab.id ? 'bg-[#FFD700] text-[#800000]' : 'text-[#5C4033] hover:bg-[#F5F2ED]'}`}
            >
              <tab.icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-[#800000]/10 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
                <TrendingUp size={24} />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <h3 className="text-[#5C4033] text-sm font-medium">Total Sales</h3>
            <p className="text-3xl font-bold text-[#800000] mt-1">₹{stats.totalSales}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-[#800000]/10 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                <ShoppingCart size={24} />
              </div>
            </div>
            <h3 className="text-[#5C4033] text-sm font-medium">Total Orders</h3>
            <p className="text-3xl font-bold text-[#800000] mt-1">{stats.totalOrders}</p>
            <p className="text-xs text-[#5C4033] mt-2 opacity-60">{stats.pendingOrders} pending</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-[#800000]/10 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                <Users size={24} />
              </div>
            </div>
            <h3 className="text-[#5C4033] text-sm font-medium">Total Customers</h3>
            <p className="text-3xl font-bold text-[#800000] mt-1">{stats.totalCustomers}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-[#800000]/10 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
            </div>
            <h3 className="text-[#5C4033] text-sm font-medium">Low Stock Items</h3>
            <p className="text-3xl font-bold text-[#800000] mt-1">{stats.lowStockItems}</p>
            <p className="text-xs text-red-600 mt-2 font-medium">Action required</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-[#800000]/10 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#5C4033] capitalize">{activeTab} Management</h2>
          {['products', 'categories'].includes(activeTab) && (
            <button 
              onClick={() => { setEditingItem(null); setFormData({}); setIsModalOpen(true); }}
              className="bg-[#800000] text-white px-4 py-2 rounded-xl font-bold flex items-center hover:bg-[#600000] transition-colors"
            >
              <Plus size={20} className="mr-2" /> Add New
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'products' && (
            <table className="w-full text-left">
              <thead className="bg-[#F5F2ED] text-[#800000] text-sm uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <img src={p.imageUrl} className="w-12 h-12 object-cover rounded-lg" alt="" referrerPolicy="no-referrer" />
                    </td>
                    <td className="px-6 py-4 font-bold">{p.name}</td>
                    <td className="px-6 py-4 text-sm">{categories.find(c => c.id === p.categoryId)?.name}</td>
                    <td className="px-6 py-4">₹{p.price}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${p.stock < 10 ? 'text-red-600' : 'text-[#5C4033]'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button onClick={() => { setEditingItem(p); setFormData(p); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                      <button onClick={() => confirmDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'categories' && (
            <table className="w-full text-left">
              <thead className="bg-[#F5F2ED] text-[#800000] text-sm uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Icon</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold">{c.name}</td>
                    <td className="px-6 py-4">{c.icon}</td>
                    <td className="px-6 py-4">{c.discount || 0}%</td>
                    <td className="px-6 py-4 space-x-2">
                      <button onClick={() => { setEditingItem(c); setFormData(c); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                      <button onClick={() => confirmDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'orders' && (
            <table className="w-full text-left">
              <thead className="bg-[#F5F2ED] text-[#800000] text-sm uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Order Info</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(o => (
                  <React.Fragment key={o.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            {expandedOrder === o.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <div>
                            <div className="font-bold text-xs">#{o.id.slice(-6).toUpperCase()}</div>
                            <div className="text-[10px] opacity-60">{o.createdAt.toDate().toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm">{o.customerName}</div>
                        <div className="text-xs opacity-60">{o.contact}</div>
                      </td>
                      <td className="px-6 py-4 font-bold">₹{o.total}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          o.status === 'completed' ? 'bg-green-100 text-green-700' : 
                          o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => updateOrderStatus(o.id, 'completed')} 
                            title="Mark as Completed"
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button 
                            onClick={() => updateOrderStatus(o.id, 'cancelled')} 
                            title="Cancel Order"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <XCircle size={18} />
                          </button>
                          <a 
                            href={o.paymentProofUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            title="View Payment Proof"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <ExternalLink size={18} />
                          </a>
                        </div>
                      </td>
                    </tr>
                    {expandedOrder === o.id && (
                      <tr className="bg-[#F5F2ED]/30">
                        <td colSpan={5} className="px-12 py-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-[#800000] text-sm mb-2">Order Items</h4>
                                <div className="space-y-2">
                                  {o.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center space-x-4 text-xs">
                                      <span className="w-6 h-6 flex items-center justify-center bg-[#FFD700] rounded text-[#800000] font-bold">{item.quantity}</span>
                                      <span className="flex-1">{item.name}</span>
                                      <span className="font-bold">₹{item.discountedPrice * item.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right">
                                <h4 className="font-bold text-[#800000] text-sm mb-2">Delivery Address</h4>
                                <p className="text-xs text-[#5C4033] max-w-xs">{o.address}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'users' && (
            <table className="w-full text-left">
              <thead className="bg-[#F5F2ED] text-[#800000] text-sm uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold">{u.displayName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F5F2ED]">
              <h3 className="text-xl font-bold text-[#800000]">{editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {activeTab === 'products' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-[#5C4033] mb-1">Product Name</label>
                    <input required className="w-full px-4 py-2 rounded-xl border border-gray-200" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#5C4033] mb-1">Description</label>
                    <textarea required className="w-full px-4 py-2 rounded-xl border border-gray-200" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#5C4033] mb-1">Price (₹)</label>
                      <input type="number" required className="w-full px-4 py-2 rounded-xl border border-gray-200" value={formData.price || ''} onChange={e => setFormData({...formData, price: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#5C4033] mb-1">Discount (%)</label>
                      <input type="number" className="w-full px-4 py-2 rounded-xl border border-gray-200" value={formData.discount || ''} onChange={e => setFormData({...formData, discount: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#5C4033] mb-1">Category</label>
                    <select required className="w-full px-4 py-2 rounded-xl border border-gray-200" value={formData.categoryId || ''} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#5C4033] mb-1">Product Image</label>
                    <input type="file" className="w-full text-sm" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#5C4033] mb-1">Stock</label>
                    <input type="number" required className="w-full px-4 py-2 rounded-xl border border-gray-200" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: e.target.value})} />
                  </div>
                </>
              )}

              {activeTab === 'categories' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-[#5C4033] mb-1">Category Name</label>
                    <input required className="w-full px-4 py-2 rounded-xl border border-gray-200" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#5C4033] mb-1">Icon Name (Lucide)</label>
                    <input className="w-full px-4 py-2 rounded-xl border border-gray-200" value={formData.icon || ''} onChange={e => setFormData({...formData, icon: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#5C4033] mb-1">Global Discount (%)</label>
                    <input type="number" className="w-full px-4 py-2 rounded-xl border border-gray-200" value={formData.discount || ''} onChange={e => setFormData({...formData, discount: e.target.value})} />
                  </div>
                </>
              )}

              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full bg-[#800000] text-white py-3 rounded-xl font-bold hover:bg-[#600000] transition-colors">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-[#141414] mb-2">Are you sure?</h2>
            <p className="text-[#5C4033] opacity-60 mb-8">This action cannot be undone. This item will be permanently deleted.</p>
            <div className="flex space-x-4">
              <button 
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-[#5C4033] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
