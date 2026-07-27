import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Shop, Product } from '../types';
import { ArrowLeft, Star, Clock, Info, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import brandLogo from '../assets/logo';

export const ShopDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { items, addItem, removeItem, updateQuantity } = useCartStore();

  useEffect(() => {
    const fetchShopAndProducts = async () => {
      if (!id) return;
      try {
        const shopRef = doc(db, 'shops', id);
        const shopSnap = await getDoc(shopRef);
        if (shopSnap.exists()) {
          setShop(shopSnap.data() as Shop);
        }

        const productsRef = collection(db, 'products');
        const productsQuery = query(productsRef, where('shopId', '==', id));
        const productsSnap = await getDocs(productsQuery);
        setProducts(productsSnap.docs.map(doc => doc.data() as Product));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchShopAndProducts();
  }, [id]);

  if (loading) return (
    <div className="h-screen w-full bg-slate-50 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center animate-pulse">
        <div className="h-24 mb-4">
          <img src={brandLogo} alt="Arbeez Fresh Logo" className="h-full w-auto object-contain grayscale opacity-50" />
        </div>
      </div>
    </div>
  );
  if (!shop) return <div className="p-8 text-center mt-20 font-black text-2xl text-slate-400 uppercase tracking-tight">Shop not found</div>;

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  return (
    <div className="bg-slate-50 min-h-full pb-24 font-sans text-slate-900">
      {/* Header Image */}
      <div className="relative h-48 sm:h-64 bg-gray-200">
        <img src={shop.bannerUrl} alt={shop.name} className="w-full h-full object-cover" />
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 bg-white p-3 rounded-xl shadow-lg border border-slate-100"
        >
          <ArrowLeft size={20} className="text-slate-900" />
        </button>
      </div>

      {/* Shop Info Box */}
      <div className="relative px-6 -mt-12">
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200 flex flex-col gap-2">
          <div className="font-extrabold text-xs text-emerald-500 tracking-wide uppercase bg-emerald-50 px-2 py-1 rounded-md self-start">
            {shop.rating} ⭐
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{shop.name}</h1>
          <p className="text-sm text-slate-500 font-medium mb-4">{shop.description}</p>
          
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <span className="bg-slate-50 text-slate-900 px-3 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1">
               <Clock size={12} className="text-emerald-500" />
               {shop.deliveryTimeMins} MIN
            </span>
            <span className="bg-slate-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wide">
              ₹{shop.deliveryFee} DELIVERY
            </span>
          </div>
        </div>
      </div>

      {/* Products list */}
      <div className="px-6 mt-6">
        <h2 className="font-black text-2xl text-slate-900 mb-4 uppercase tracking-tight">All Products</h2>
        <div className="space-y-4">
          {products.map(product => {
            const cartItem = items.find(item => item.product.id === product.id);
            const quantity = cartItem?.quantity || 0;

            return (
              <div key={product.id} className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-200 flex gap-4 transition-all hover:shadow-md">
                <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 leading-tight mb-1">{product.name}</h3>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{product.unit}</p>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <div className="flex flex-col">
                      {product.originalPrice && (
                        <span className="text-xs text-slate-400 line-through font-bold">₹{product.originalPrice}</span>
                      )}
                      <span className="font-black text-emerald-500 text-xl">₹{product.price}</span>
                    </div>
                    
                    {/* Add to cart control */}
                    {quantity > 0 ? (
                      <div className="flex items-center bg-emerald-50 rounded-xl border border-emerald-200">
                        <button 
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="w-10 h-10 flex items-center justify-center text-emerald-600 font-bold hover:bg-emerald-100 rounded-l-xl transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-6 text-center font-black text-emerald-700 text-sm">{quantity}</span>
                        <button 
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center text-emerald-600 font-bold hover:bg-emerald-100 rounded-r-xl transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addItem(product, shop)}
                        className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-emerald-100 transition-colors shadow-sm"
                      >
                        ADD
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-6 flex justify-center z-50">
          <button 
            onClick={() => navigate('/cart')}
            className="w-full max-w-md bg-emerald-500 text-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-between p-4 px-6 border border-emerald-400 hover:bg-emerald-600 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <ShoppingBag size={24} />
                <span className="absolute -top-2 -right-2 bg-white text-emerald-600 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                  {cartItemCount}
                </span>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-emerald-100 uppercase tracking-widest font-extrabold">Total</p>
                <p className="font-black text-lg">₹{cartTotal}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-black uppercase text-sm tracking-wide">
              View Cart <ArrowLeft size={18} className="rotate-180" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
