import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { Package, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OrdersProps {
  user: any;
}

export default function Orders({ user }: OrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-[#800000] mb-4">Please login to view your orders</h2>
        <Link to="/login" className="bg-[#800000] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#600000] transition-colors">
          Login Now
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000]"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-[#800000]/10 shadow-xl">
        <ShoppingBag size={64} className="mx-auto text-[#800000]/20 mb-6" />
        <h2 className="text-2xl font-bold text-[#5C4033] mb-2">No orders yet</h2>
        <p className="text-[#5C4033] opacity-60 mb-8">Start shopping to see your orders here!</p>
        <Link to="/products" className="bg-[#800000] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#600000] transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-[#800000]" style={{ fontFamily: "'Playfair Display', serif" }}>My Orders</h1>
      
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-3xl border border-[#800000]/10 shadow-lg overflow-hidden">
            <div className="p-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[#F5F2ED] text-[#800000] rounded-2xl">
                  <Package size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#5C4033] opacity-60 uppercase tracking-wider">Order ID</p>
                  <p className="font-bold text-[#800000]">#{order.id.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-bold text-[#5C4033] opacity-60 uppercase tracking-wider">Date</p>
                <p className="font-bold text-[#5C4033]">{order.createdAt.toDate().toLocaleDateString()}</p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-[#5C4033] opacity-60 uppercase tracking-wider">Total Amount</p>
                <p className="font-bold text-[#800000]">₹{order.total}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${
                  order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.status === 'completed' && <CheckCircle2 size={14} className="mr-2" />}
                  {order.status === 'cancelled' && <XCircle size={14} className="mr-2" />}
                  {order.status === 'pending' && <Clock size={14} className="mr-2" />}
                  {order.status}
                </div>
                
                <button 
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
            </div>
            
            {expandedOrder === order.id && (
              <div className="px-6 pb-6 border-t border-gray-50 pt-6 bg-[#F5F2ED]/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-[#800000] mb-4 text-sm uppercase tracking-widest">Items Ordered</h4>
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div className="flex items-center space-x-3">
                            <span className="w-6 h-6 flex items-center justify-center bg-[#FFD700] rounded text-[#800000] font-bold text-[10px]">{item.quantity}</span>
                            <span className="text-[#5C4033] font-medium">{item.name}</span>
                          </div>
                          <span className="font-bold text-[#800000]">₹{item.discountedPrice * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-[#800000] mb-2 text-sm uppercase tracking-widest">Shipping Address</h4>
                      <p className="text-sm text-[#5C4033] opacity-80 leading-relaxed">{order.address}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#800000] mb-2 text-sm uppercase tracking-widest">Contact Info</h4>
                      <p className="text-sm text-[#5C4033] opacity-80">{order.contact}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
