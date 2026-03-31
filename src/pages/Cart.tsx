import { CartItem } from '../types';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

interface CartProps {
  cart: CartItem[];
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
}

export default function Cart({ cart, removeFromCart, updateQuantity }: CartProps) {
  const subtotal = cart.reduce((acc, item) => {
    const discount = item.discount || 0;
    const discountedPrice = Math.round(item.price * (1 - discount / 100));
    return acc + discountedPrice * item.quantity;
  }, 0);

  if (cart.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#800000]/20 max-w-2xl mx-auto">
        <ShoppingBag size={64} className="mx-auto text-[#800000] opacity-20 mb-6" />
        <h2 className="text-3xl font-bold text-[#5C4033]" style={{ fontFamily: "'Playfair Display', serif" }}>Your cart is empty</h2>
        <p className="text-[#5C4033] opacity-60 mt-4 mb-8">Looks like you haven't added anything yet. Explore our collection!</p>
        <Link to="/products" className="bg-[#800000] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#600000] transition-colors inline-flex items-center">
          Start Shopping <ArrowRight className="ml-2" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-[#800000]" style={{ fontFamily: "'Playfair Display', serif" }}>Your Shopping Cart</h1>
      
      <div className="bg-white rounded-3xl border border-[#800000]/10 shadow-xl overflow-hidden">
        <div className="divide-y divide-gray-100">
          {cart.map((item) => {
            const discount = item.discount || 0;
            const discountedPrice = Math.round(item.price * (1 - discount / 100));
            return (
              <div key={item.id} className="p-6 flex flex-col sm:flex-row items-center gap-6">
                <img 
                  src={item.imageUrl || `https://picsum.photos/seed/${item.id}/200/200`} 
                  alt={item.name} 
                  className="w-24 h-24 object-cover rounded-xl border border-[#800000]/10"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-bold text-lg text-[#141414]">{item.name}</h3>
                  <p className="text-sm text-[#5C4033] opacity-60 line-clamp-1">{item.description}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center bg-[#F5F2ED] rounded-xl p-1 border border-[#800000]/10">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:text-[#800000] transition-colors"><Minus size={16} /></button>
                    <span className="w-8 text-center font-bold text-[#800000]">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:text-[#800000] transition-colors"><Plus size={16} /></button>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="text-lg font-bold text-[#800000]">₹{discountedPrice * item.quantity}</p>
                    {discount > 0 && <p className="text-xs text-green-600 font-medium">Saved ₹{(item.price - discountedPrice) * item.quantity}</p>}
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[#F5F2ED]/50 p-8 border-t border-[#800000]/10">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-medium text-[#5C4033]">Total Amount</span>
            <span className="text-3xl font-bold text-[#800000]">₹{subtotal}</span>
          </div>
          <Link 
            to="/checkout" 
            className="w-full bg-[#800000] text-white py-5 rounded-2xl font-bold text-center block hover:bg-[#600000] transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
          >
            Proceed to Checkout
          </Link>
          <p className="text-center text-xs text-[#5C4033] mt-4 opacity-60">
            Taxes and shipping calculated at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
