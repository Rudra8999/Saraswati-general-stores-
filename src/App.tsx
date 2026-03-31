import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, CartItem } from './types';
import { ShoppingCart, User as UserIcon, LogOut, Menu, X, Search, Phone, Settings } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// Components
import IntroAnimation from './components/IntroAnimation';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Orders from './pages/Orders';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Check if this is the special admin email
            const role = firebaseUser.email?.toLowerCase() === 'saraswatigeneral@gmail.com' ? 'admin' : 'customer';
            
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: role,
              displayName: firebaseUser.displayName || ''
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success('Added to cart!');
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-[#F5F2ED] text-[#141414] font-sans">
        <IntroAnimation />
        <Toaster position="bottom-center" />
        
        {/* Navigation */}
        <nav className="sticky top-0 z-40 bg-[#FFD700] border-b border-[#800000]/20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link to="/" className="flex flex-col">
                <span className="text-xl font-bold text-[#800000] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Saraswati
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#5C4033] font-semibold">
                  General Stores
                </span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center space-x-8">
                <Link to="/products" className="text-[#5C4033] hover:text-[#800000] font-medium transition-colors">Products</Link>
                {user && (
                  <Link to="/orders" className="text-[#5C4033] hover:text-[#800000] font-medium transition-colors">My Orders</Link>
                )}
                {profile?.role === 'admin' && (
                  <Link to="/admin" className="flex items-center space-x-1 text-[#800000] font-bold hover:underline">
                    <Settings size={18} />
                    <span>Admin</span>
                  </Link>
                )}
                <Link to="/cart" className="relative p-2 text-[#5C4033] hover:text-[#800000]">
                  <ShoppingCart size={24} />
                  {cart.length > 0 && (
                    <span className="absolute top-0 right-0 bg-[#800000] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#FFD700]">
                      {cart.reduce((acc, item) => acc + item.quantity, 0)}
                    </span>
                  )}
                </Link>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-[#5C4033] font-medium hidden lg:inline">Namaste, {user.displayName?.split(' ')[0] || 'User'}</span>
                    <button onClick={() => signOut(auth)} className="p-2 text-[#5C4033] hover:text-[#800000]">
                      <LogOut size={20} />
                    </button>
                  </div>
                ) : (
                  <Link to="/login" className="bg-[#800000] text-white px-4 py-2 rounded-md font-medium hover:bg-[#600000] transition-colors">
                    Login
                  </Link>
                )}
              </div>

              {/* Mobile Toggle */}
              <div className="md:hidden flex items-center space-x-4">
                <Link to="/cart" className="relative p-2 text-[#5C4033]">
                  <ShoppingCart size={24} />
                  {cart.length > 0 && (
                    <span className="absolute top-0 right-0 bg-[#800000] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                      {cart.reduce((acc, item) => acc + item.quantity, 0)}
                    </span>
                  )}
                </Link>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#800000]">
                  {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden bg-[#FFD700] border-t border-[#800000]/10 px-4 py-4 space-y-4 shadow-xl">
              <Link to="/products" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-[#5C4033]">Products</Link>
              <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-[#5C4033]">My Cart</Link>
              {user && (
                <Link to="/orders" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-[#5C4033]">My Orders</Link>
              )}
              {profile?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  onClick={() => setIsMenuOpen(false)} 
                  className="flex items-center justify-center space-x-2 text-lg font-bold text-white bg-[#800000] py-3 rounded-lg shadow-md hover:bg-[#5C4033] transition-all"
                >
                  <Settings size={20} />
                  <span>Admin Dashboard</span>
                </Link>
              )}
              {user ? (
                <button onClick={() => { signOut(auth); setIsMenuOpen(false); }} className="block w-full text-left text-lg font-medium text-[#5C4033]">Logout</button>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-[#800000]">Login</Link>
              )}
            </div>
          )}
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home addToCart={addToCart} />} />
            <Route path="/products" element={<Products addToCart={addToCart} />} />
            <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} />} />
            <Route path="/checkout" element={<Checkout cart={cart} clearCart={clearCart} user={user} />} />
            <Route path="/orders" element={<Orders user={user} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-[#141414] text-[#F5F2ED] py-12 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold text-[#FFD700] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Saraswati General Stores</h3>
              <p className="text-sm opacity-70 leading-relaxed">
                Your trusted neighborhood shop for all things stationery, gifts, and essentials. Serving the community with love since 1995.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 uppercase tracking-widest text-[#FFD700]">Quick Links</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li><Link to="/products">Browse Products</Link></li>
                <li><Link to="/cart">My Cart</Link></li>
                <li><Link to="/login">Login / Signup</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 uppercase tracking-widest text-[#FFD700]">Contact Us</h4>
              <div className="space-y-3 text-sm opacity-70">
                <p>123, Temple Road, Near Market Square, Varanasi, UP - 221001</p>
                <p>Phone: +91 98765 43210</p>
                <a href="https://wa.me/919876543210" className="inline-flex items-center text-[#FFD700] hover:underline">
                  <Phone size={16} className="mr-2" /> WhatsApp Us
                </a>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/10 text-center text-xs opacity-50">
            © 2026 Saraswati General Stores. All Rights Reserved.
          </div>
        </footer>

        {/* WhatsApp Floating Button */}
        <a 
          href="https://wa.me/919876543210" 
          target="_blank" 
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50"
        >
          <Phone size={28} />
        </a>
      </div>
    </Router>
  );
}
