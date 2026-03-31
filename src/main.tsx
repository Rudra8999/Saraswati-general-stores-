import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { db } from './firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';

// Seed initial categories if empty
const seedCategories = async () => {
  try {
    const catSnap = await getDocs(collection(db, 'categories'));
    if (catSnap.empty) {
      const initialCategories = [
        { name: 'Notebooks', icon: 'Book', discount: 10 },
        { name: 'Pens & Pencils', icon: 'PenTool', discount: 5 },
        { name: 'Art Supplies', icon: 'Palette', discount: 0 },
        { name: 'School Essentials', icon: 'School', discount: 15 },
        { name: 'Perfumes', icon: 'Wind', discount: 0 },
        { name: 'Gifts', icon: 'Gift', discount: 0 },
        { name: 'Miscellaneous', icon: 'Package', discount: 0 }
      ];
      for (const cat of initialCategories) {
        await setDoc(doc(collection(db, 'categories')), cat);
      }
      console.log('Categories seeded!');
    }
  } catch (error) {
    // Silently fail if not authorized - only admin needs to seed
    console.log('Seeding skipped (not authorized or already seeded)');
  }
};

seedCategories();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
