// react-app/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx'; // Mengimpor komponen utama dari app.jsx (huruf kecil)
import './index.css'; // Pastikan path ini benar
import { BrowserRouter, Routes, Route } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<App />} /> {/* Menggunakan <App /> sebagai elemen utama */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
