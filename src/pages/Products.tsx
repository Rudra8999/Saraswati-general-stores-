import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Category } from '../types';
import { Search, Filter, ShoppingCart, ArrowRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function Products({ addToCart }: { addToCart: (p: Product) => void }) {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const catSnap = await getDocs(collection(db, 'categories'));
        setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));

        const prodSnap = await getDocs(collection(db, 'products'));
        setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-4xl font-bold text-[#800000]" style={{ fontFamily: "'Playfair Display', serif" }}>Our Collection</h1>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C4033] opacity-50" size={20} />
          <input 
            type="text" 
            placeholder="Search for pens, notebooks, gifts..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#800000]/10 rounded-2xl focus:ring-2 focus:ring-[#FFD700] focus:border-transparent outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#800000]/10 shadow-sm">
            <h3 className="font-bold text-[#800000] mb-4 flex items-center">
              <Filter size={18} className="mr-2" /> Categories
            </h3>
            <div className="space-y-2">
              <button 
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-4 py-2 rounded-xl transition-all ${selectedCategory === 'all' ? 'bg-[#FFD700] text-[#800000] font-bold' : 'hover:bg-[#F5F2ED] text-[#5C4033]'}`}
              >
                All Products
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-4 py-2 rounded-xl transition-all ${selectedCategory === cat.id ? 'bg-[#FFD700] text-[#800000] font-bold' : 'hover:bg-[#F5F2ED] text-[#5C4033]'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl h-96 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => {
                const category = categories.find(c => c.id === product.categoryId);
                const finalDiscount = Math.max(product.discount || 0, category?.discount || 0);
                const finalPrice = Math.round(product.price * (1 - finalDiscount / 100));

                return (
                  <div key={product.id} className="bg-white rounded-2xl border border-[#800000]/10 overflow-hidden hover:shadow-xl transition-all group flex flex-col">
                    <div className="h-56 overflow-hidden relative">
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
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-2">
                        <span className="text-[10px] uppercase tracking-widest text-[#800000] font-bold">{category?.name}</span>
                        <h3 className="font-bold text-lg text-[#141414]">{product.name}</h3>
                      </div>
                      <p className="text-sm text-[#5C4033] mb-4 line-clamp-2 opacity-70 flex-1">{product.description}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                          {finalDiscount > 0 ? (
                            <>
                              <span className="text-xs text-gray-400 line-through">₹{product.price}</span>
                              <span className="text-xl font-bold text-[#800000]">₹{finalPrice}</span>
                            </>
                          ) : (
                            <span className="text-xl font-bold text-[#800000]">₹{product.price}</span>
                          )}
                        </div>
                        <button 
                          onClick={() => addToCart({ ...product, price: product.price, discount: finalDiscount })}
                          className="bg-[#FFD700] text-[#800000] px-4 py-2 rounded-xl font-bold hover:bg-[#800000] hover:text-white transition-colors flex items-center"
                        >
                          <ShoppingCart size={18} className="mr-2" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#800000]/20">
              <Search size={48} className="mx-auto text-[#800000] opacity-20 mb-4" />
              <h3 className="text-xl font-bold text-[#5C4033]">No products found</h3>
              <p className="text-[#5C4033] opacity-60">Try adjusting your filters or search term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
