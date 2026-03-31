import { useState } from 'react';
import { CartItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { Upload, CheckCircle, CreditCard, MapPin, User as UserIcon, Phone } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface CheckoutProps {
  cart: CartItem[];
  clearCart: () => void;
  user: any;
}

export default function Checkout({ cart, clearCart, user }: CheckoutProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    address: '',
    contact: '',
  });
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  const total = cart.reduce((acc, item) => {
    const discount = item.discount || 0;
    const discountedPrice = Math.round(item.price * (1 - discount / 100));
    return acc + discountedPrice * item.quantity;
  }, 0);

  const onDrop = (acceptedFiles: File[]) => {
    setPaymentProof(acceptedFiles[0]);
    toast.success('Screenshot uploaded!');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    multiple: false 
  } as any);

  const handleOrderSubmit = async () => {
    if (!paymentProof) {
      toast.error('Please upload payment proof screenshot');
      return;
    }
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload screenshot
      const storageRef = ref(storage, `payment_proofs/${user.uid}_${Date.now()}`);
      await uploadBytes(storageRef, paymentProof);
      const proofUrl = await getDownloadURL(storageRef);

      // 2. Create order in Firestore
      const orderData = {
        userId: user.uid,
        customerName: formData.name,
        address: formData.address,
        contact: formData.contact,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          discountedPrice: Math.round(item.price * (1 - (item.discount || 0) / 100))
        })),
        total,
        paymentProofUrl: proofUrl,
        status: 'pending',
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      toast.success('Order placed successfully! We will contact you soon.');
      clearCart();
      navigate('/');
    } catch (error) {
      console.error("Order error:", error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-center space-x-4 mb-12">
        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-[#800000]' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 1 ? 'border-[#800000] bg-[#FFD700]' : 'border-gray-300'}`}>1</div>
          <span className="font-bold">Details</span>
        </div>
        <div className="w-12 h-0.5 bg-gray-200" />
        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-[#800000]' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 2 ? 'border-[#800000] bg-[#FFD700]' : 'border-gray-300'}`}>2</div>
          <span className="font-bold">Payment</span>
        </div>
      </div>

      {step === 1 ? (
        <div className="bg-white p-8 rounded-3xl border border-[#800000]/10 shadow-xl space-y-6">
          <h2 className="text-2xl font-bold text-[#800000] flex items-center" style={{ fontFamily: "'Playfair Display', serif" }}>
            <MapPin className="mr-2" /> Shipping Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#5C4033] flex items-center"><UserIcon size={16} className="mr-2" /> Full Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-[#800000]/10 outline-none focus:ring-2 focus:ring-[#FFD700]"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#5C4033] flex items-center"><Phone size={16} className="mr-2" /> Contact Number</label>
              <input 
                type="text" 
                placeholder="+91"
                className="w-full px-4 py-3 rounded-xl border border-[#800000]/10 outline-none focus:ring-2 focus:ring-[#FFD700]"
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-bold text-[#5C4033] flex items-center"><MapPin size={16} className="mr-2" /> Full Address</label>
              <textarea 
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[#800000]/10 outline-none focus:ring-2 focus:ring-[#FFD700]"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>
          <button 
            onClick={() => {
              if (formData.name && formData.address && formData.contact) setStep(2);
              else toast.error('Please fill all fields');
            }}
            className="w-full bg-[#800000] text-white py-4 rounded-xl font-bold hover:bg-[#600000] transition-colors"
          >
            Continue to Payment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-[#800000]/10 shadow-xl space-y-6">
            <h2 className="text-2xl font-bold text-[#800000] flex items-center" style={{ fontFamily: "'Playfair Display', serif" }}>
              <CreditCard className="mr-2" /> UPI Payment
            </h2>
            <div className="flex flex-col items-center bg-[#F5F2ED] p-6 rounded-2xl border border-[#800000]/10">
              <QRCodeSVG 
                value={`upi://pay?pa=saraswati.stores@upi&pn=Saraswati%20General%20Stores&am=${total}&cu=INR`} 
                size={200}
                fgColor="#800000"
                bgColor="#F5F2ED"
              />
              <p className="mt-4 font-bold text-[#800000]">Scan to Pay ₹{total}</p>
              <p className="text-xs text-[#5C4033] opacity-60 mt-1">UPI ID: saraswati.stores@upi</p>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-[#5C4033] font-medium">After payment, please upload the screenshot below:</p>
              <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-[#800000]/20 hover:border-[#800000]/40'}`}>
                <input {...getInputProps()} />
                <Upload className="mx-auto text-[#800000] mb-4" size={32} />
                {paymentProof ? (
                  <div className="flex items-center justify-center text-green-600 font-bold">
                    <CheckCircle size={18} className="mr-2" /> {paymentProof.name}
                  </div>
                ) : (
                  <p className="text-sm text-[#5C4033] opacity-60">Click or drag screenshot here</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-[#800000]/10 shadow-xl">
              <h3 className="font-bold text-[#800000] mb-4 uppercase tracking-widest text-sm">Order Summary</h3>
              <div className="space-y-3 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[#5C4033]">{item.name} x {item.quantity}</span>
                    <span className="font-bold">₹{Math.round(item.price * (1 - (item.discount || 0) / 100)) * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-[#5C4033]">Total</span>
                <span className="text-2xl font-bold text-[#800000]">₹{total}</span>
              </div>
            </div>
            <button 
              disabled={loading}
              onClick={handleOrderSubmit}
              className="w-full bg-[#800000] text-white py-5 rounded-2xl font-bold text-xl hover:bg-[#600000] transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'Processing Order...' : 'Complete Purchase'}
            </button>
            <button onClick={() => setStep(1)} className="w-full text-[#800000] font-bold text-sm hover:underline">
              Go Back to Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
