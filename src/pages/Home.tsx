import { useState, useEffect } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product, Category } from '../types';
import { Link } from 'react-router-dom';
import { Book, PenTool, Palette, School, Wind, Gift, Package, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const categoryIcons: Record<string, any> = {
  'Notebooks': Book,
  'Pens & Pencils': PenTool,
  'Art Supplies': Palette,
  'School Essentials': School,
  'Perfumes': Wind,
  'Gifts': Gift,
  'Miscellaneous': Package
};

export default function Home({ addToCart }: { addToCart: (p: Product) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catSnap = await getDocs(collection(db, 'categories'));
        const cats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(cats);

        const prodSnap = await getDocs(query(collection(db, 'products'), limit(4)));
        const prods = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setFeaturedProducts(prods);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'categories/products');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative h-[500px] rounded-3xl overflow-hidden bg-[#800000] text-white flex items-center">
        <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/stationery/1920/1080')] bg-cover bg-center" />
        <div className="relative z-10 px-8 md:px-16 max-w-2xl">
          <motion.h1 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-5xl md:text-7xl font-bold mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Saraswati General Stores
          </motion.h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 font-medium">
            Discover the finest stationery, art supplies, and local treasures in the heart of the city.
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center bg-[#FFD700] text-[#800000] px-8 py-4 rounded-full text-lg font-bold hover:bg-white transition-all transform hover:scale-105"
          >
            Browse Products <ArrowRight className="ml-2" />
          </Link>
        </div>
      </section>

      {/* Category Highlights */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#800000]" style={{ fontFamily: "'Playfair Display', serif" }}>Shop by Category</h2>
            <p className="text-[#5C4033] mt-2">Everything you need, organized for you.</p>
          </div>
          <Link to="/products" className="text-[#800000] font-bold hover:underline">View All Categories</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.length > 0 ? categories.map((cat) => {
            const Icon = categoryIcons[cat.name] || Package;
            return (
              <Link 
                key={cat.id} 
                to={`/products?category=${cat.id}`}
                className="bg-white p-6 rounded-2xl border border-[#800000]/10 flex flex-col items-center text-center hover:shadow-xl hover:border-[#FFD700] transition-all group"
              >
                <div className="w-12 h-12 bg-[#F5F2ED] rounded-full flex items-center justify-center text-[#800000] mb-4 group-hover:bg-[#FFD700] transition-colors">
                  <Icon size={24} />
                </div>
                <span className="font-bold text-sm text-[#5C4033]">{cat.name}</span>
              </Link>
            );
          }) : (
            [1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-[#800000]/10 animate-pulse h-32" />
            ))
          )}
        </div>
      </section>

      {/* Offers Banner */}
      <section className="bg-[#FFD700] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between border-2 border-[#800000]/20">
        <div className="mb-8 md:mb-0">
          <span className="bg-[#800000] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Limited Time Offer</span>
          <h2 className="text-4xl font-bold text-[#800000] mt-4 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Back to School Sale!</h2>
          <p className="text-[#5C4033] text-lg">Get up to <span className="font-bold text-[#800000]">20% OFF</span> on all notebooks and art supplies.</p>
        </div>
        <Link to="/products" className="bg-[#800000] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#600000] transition-colors shadow-lg">
          Claim Discount
        </Link>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#800000]" style={{ fontFamily: "'Playfair Display', serif" }}>Featured Products</h2>
            <p className="text-[#5C4033] mt-2">Handpicked items just for you.</p>
          </div>
          <Link to="/products" className="text-[#800000] font-bold hover:underline">See More</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map((product) => {
            const category = categories.find(c => c.id === product.categoryId);
            const finalDiscount = Math.max(product.discount || 0, category?.discount || 0);
            
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-[#800000]/10 overflow-hidden hover:shadow-2xl transition-all group">
                <div className="h-64 overflow-hidden relative">
                  <img 
                    src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {finalDiscount > 0 && (
                    <span className="absolute top-4 left-4 bg-[#800000] text-white text-xs font-bold px-3 py-1 rounded-full">
                      {finalDiscount}% OFF
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg text-[#141414] mb-1">{product.name}</h3>
                  <p className="text-sm text-[#5C4033] mb-4 line-clamp-1 opacity-70">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      {finalDiscount > 0 ? (
                        <>
                          <span className="text-xs text-gray-400 line-through">₹{product.price}</span>
                          <span className="text-xl font-bold text-[#800000]">₹{Math.round(product.price * (1 - finalDiscount / 100))}</span>
                        </>
                      ) : (
                        <span className="text-xl font-bold text-[#800000]">₹{product.price}</span>
                      )}
                    </div>
                    <button 
                      onClick={() => addToCart({ ...product, discount: finalDiscount })}
                      className="bg-[#FFD700] text-[#800000] p-3 rounded-xl hover:bg-[#800000] hover:text-white transition-colors"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
