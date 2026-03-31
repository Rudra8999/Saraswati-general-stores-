import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        
        // Check if this is the special admin email
        const role = email.toLowerCase() === 'saraswatigeneral@gmail.com' ? 'admin' : 'customer';
        
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: email,
          role: role,
          displayName: name
        });
        toast.success('Account created successfully!');
      }
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-3xl border border-[#800000]/10 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#800000]" style={{ fontFamily: "'Playfair Display', serif" }}>
          {isLogin ? 'Welcome Back' : 'Join Our Community'}
        </h1>
        <p className="text-[#5C4033] mt-2 opacity-70">
          {isLogin ? 'Login to manage your orders and profile' : 'Create an account to start shopping'}
        </p>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-bold text-[#5C4033] mb-1">Full Name</label>
            <input 
              type="text" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-[#800000]/10 outline-none focus:ring-2 focus:ring-[#FFD700]"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-bold text-[#5C4033] mb-1">Email Address</label>
          <input 
            type="email" 
            required 
            className="w-full px-4 py-3 rounded-xl border border-[#800000]/10 outline-none focus:ring-2 focus:ring-[#FFD700]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-[#5C4033] mb-1">Password</label>
          <input 
            type="password" 
            required 
            className="w-full px-4 py-3 rounded-xl border border-[#800000]/10 outline-none focus:ring-2 focus:ring-[#FFD700]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button 
          disabled={loading}
          className="w-full bg-[#800000] text-white py-4 rounded-xl font-bold hover:bg-[#600000] transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
        </button>
      </form>

      <p className="text-center mt-8 text-sm text-[#5C4033]">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="ml-2 text-[#800000] font-bold hover:underline"
        >
          {isLogin ? 'Sign Up' : 'Login'}
        </button>
      </p>
    </div>
  );
}
