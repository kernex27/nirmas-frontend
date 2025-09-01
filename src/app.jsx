// src/app.jsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import {
  LayoutDashboard, Scale, Soup, Droplet, Nut, ChevronRight, MessageSquareText,
  Loader2, User, Lock, Cake, Ruler, Weight, Activity, Plus, Search, Calendar, Download
} from 'lucide-react';

// ===== Firebase (gunakan 1x import saja) =====
import { auth, db } from './firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// ===== Context Auth =====
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// ===== Utils =====
const calculateAge = (birthdateString) => {
  if (!birthdateString) return null;
  const today = new Date();
  const birthDate = new Date(birthdateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const calculateTDEE = (gender, birthdateString, height, weight, activityLevel) => {
  if (!gender || !birthdateString || !height || !weight || !activityLevel) return null;
  const age = calculateAge(birthdateString);
  if (age === null || height <= 0 || weight <= 0) return null;

  const bmr = gender === 'male'
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161;

  const map = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  return Math.round(bmr * (map[activityLevel] || 1.2));
};

// ===== Landing =====
const WelcomePage = ({ onGetStarted }) => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-emerald-700 flex flex-col lg:flex-row items-center justify-center p-4 text-white relative overflow-hidden">
    <div className="absolute inset-0 z-0 bg-green-600 opacity-0"></div>
    <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left p-4 lg:w-1/2">
      <div className="text-4xl font-extrabold mb-8">Nirmas.id</div>
      <h1 className="text-5xl font-extrabold leading-tight mb-4">Pantau Gizi,<br />Kendalikan Kesehatan</h1>
      <p className="text-xl mb-8 max-w-md">Lacak nutrisi harianmu dengan akurat, Raih kesehatan optimal lebih mudah!</p>
      <button
        onClick={onGetStarted}
        className="px-8 py-4 bg-white text-emerald-700 font-bold rounded-full text-lg shadow-lg hover:bg-emerald-100 transition-all duration-300 transform hover:scale-105"
      >GET STARTED</button>
    </div>
    <div className="relative z-10 lg:w-1/2 flex justify-center items-center p-4 mt-8 lg:mt-0">
      <img
        src={`${import.meta.env.BASE_URL}images/mangkok.png`}
        alt="Healthy Food Bowl"
        className="max-w-full h-auto object-contain transform rotate-3 hover:rotate-0 transition-transform duration-300"
        style={{ mixBlendMode: 'multiply' }}
      />
    </div>
    <footer className="absolute bottom-4 text-gray-200 text-sm z-10">Nirmas.id</footer>
  </div>
);

// ===== Login (Firebase Auth) =====
const LoginPage = ({ onLoginSuccess, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // Ambil profil Firestore
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      const profile = snap.exists() ? snap.data() : { profileComplete: false };

      const merged = {
        uid,
        email: cred.user.email,
        name: cred.user.displayName || profile.name || 'Pengguna',
        ...profile,
      };
      onLoginSuccess(merged);
    } catch (err) {
      console.error('Login error:', err?.code, err?.message);
      const code = err?.code || '';
      let msg = 'Gagal masuk.';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password') msg = 'Email atau password salah.';
      else if (code === 'auth/too-many-requests') msg = 'Terlalu banyak percobaan. Coba lagi nanti.';
      setError(`${msg}${code ? ` (${code})` : ''}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-6">MASUK</h2>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">Email</label>
            <input type="email" id="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-200" placeholder="Masukkan email Anda" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading}/>
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">Password</label>
            <input type="password" id="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-200" placeholder="Masukkan password Anda" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading}/>
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null} MASUK
          </button>
        </form>
        <p className="text-center text-gray-600 mt-6">
          Belum punya akun?{' '}
          <button onClick={onNavigateToRegister} className="text-emerald-600 font-medium hover:underline">Daftar Sekarang</button>
        </p>
      </div>
    </div>
  );
};

// ===== Register (Firebase Auth) =====
const RegisterPage = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setIsLoading(true);
    try {
      if (password.length < 6) throw { code: 'auth/weak-password' };

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });

      const uid = cred.user.uid;
      await setDoc(doc(db, 'users', uid), {
        name,
        email,
        profileComplete: false,
        createdAt: serverTimestamp(),
      }, { merge: true });

      onRegisterSuccess({ uid, name, email, profileComplete: false });
    } catch (err) {
      console.error('Register error:', err?.code, err?.message);
      const code = err?.code || '';
      let msg = 'Terjadi kesalahan saat mendaftar.';
      if (code === 'auth/email-already-in-use') msg = 'Email sudah terdaftar. Silakan masuk.';
      else if (code === 'auth/invalid-email') msg = 'Format email tidak valid.';
      else if (code === 'auth/weak-password') msg = 'Password minimal 6 karakter.';
      setError(`${msg}${code ? ` (${code})` : ''}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-6">DAFTAR AKUN BARU</h2>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">Nama Lengkap</label>
            <input type="text" id="name" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" placeholder="Masukkan nama Anda" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading}/>
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">Email</label>
            <input type="email" id="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" placeholder="Masukkan email Anda" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading}/>
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">Password</label>
            <input type="password" id="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" placeholder="Buat password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading}/>
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null} DAFTAR
          </button>
        </form>
        <p className="text-center text-gray-600 mt-6">
          Sudah punya akun?{' '}
          <button onClick={onNavigateToLogin} className="text-emerald-600 font-medium hover:underline">Masuk</button>
        </p>
      </div>
    </div>
  );
};

// ===== Profile Setup =====
const UserProfileSetupPage = ({ onProfileComplete, user }) => {
  const [gender, setGender] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setIsLoading(true);

    if (!gender || !birthdate || !height || !weight || !activityLevel) {
      setError('Semua kolom wajib diisi.'); setIsLoading(false); return;
    }

    try {
      await setDoc(doc(db, 'users', user.uid), {
        name: user.name || user.displayName || 'Pengguna',
        gender,
        birthdate,
        height: parseInt(height, 10),
        weight: parseInt(weight, 10),
        activityLevel,
        profileComplete: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      onProfileComplete({ gender, birthdate, height: parseInt(height, 10), weight: parseInt(weight, 10), activityLevel, profileComplete: true });
    } catch (err) {
      console.error('Save profile error:', err);
      setError('Terjadi kesalahan saat menyimpan profil. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-6">Lengkapi Profil Anda</h2>
        <p className="text-center text-gray-600 mb-6">Informasi ini penting untuk rekomendasi gizi yang akurat.</p>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="gender" className="block text-gray-700 text-sm font-medium mb-2 flex items-center">
              <User className="w-4 h-4 mr-2" /> Jenis Kelamin
            </label>
            <select id="gender" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-200" value={gender} onChange={(e) => setGender(e.target.value)} required disabled={isLoading}>
              <option value="">Pilih Jenis Kelamin</option>
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
            </select>
          </div>
          <div>
            <label htmlFor="birthdate" className="block text-gray-700 text-sm font-medium mb-2 flex items-center">
              <Cake className="w-4 h-4 mr-2" /> Tanggal Lahir
            </label>
            <input type="date" id="birthdate" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-200" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} required disabled={isLoading}/>
          </div>
          <div>
            <label htmlFor="height" className="block text-gray-700 text-sm font-medium mb-2 flex items-center">
              <Ruler className="w-4 h-4 mr-2" /> Tinggi Badan (cm)
            </label>
            <input type="number" id="height" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-200" placeholder="Cth: 170" value={height} onChange={(e) => setHeight(e.target.value)} required disabled={isLoading}/>
          </div>
          <div>
            <label htmlFor="weight" className="block text-gray-700 text-sm font-medium mb-2 flex items-center">
              <Weight className="w-4 h-4 mr-2" /> Berat Badan (kg)
            </label>
            <input type="number" id="weight" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-200" placeholder="Cth: 65" value={weight} onChange={(e) => setWeight(e.target.value)} required disabled={isLoading}/>
          </div>
          <div>
            <label htmlFor="activityLevel" className="block text-gray-700 text-sm font-medium mb-2 flex items-center">
              <Activity className="w-4 h-4 mr-2" /> Tingkat Aktivitas
            </label>
            <select id="activityLevel" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-200" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} required disabled={isLoading}>
              <option value="sedentary">Sangat Ringan (Tidak banyak bergerak)</option>
              <option value="light">Ringan (Olahraga 1-3 hari/minggu)</option>
              <option value="moderate">Sedang (Olahraga 3-5 hari/minggu)</option>
              <option value="active">Aktif (Olahraga 6-7 hari/minggu)</option>
              <option value="very_active">Sangat Aktif (Olahraga setiap hari/pekerjaan fisik berat)</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null} SIMPAN PROFIL
          </button>
        </form>
      </div>
    </div>
  );
};

// ===== Dummy data =====
const dummySummary = {
  total_kcal: 900, protein_g: 90, carbs_g: 50, fat_g: 30,
  macro_pct: [
    { name: 'Protein', value: 42.2, color: '#38A169' },
    { name: 'Karbohidrat', value: 22.2, color: '#4299E1' },
    { name: 'Lemak', value: 35.6, color: '#ED8936' },
  ],
};
const dummyConsumptionData = [
  { No: 1, Makanan: 'Nasi Goreng', Waktu: '07.45' },
  { No: 2, Makanan: 'Roti', Waktu: '09.45' },
  { No: 3, Makanan: 'Nasi Padang', Waktu: '12.45' },
  { No: 4, Makanan: 'Kentang Goreng', Waktu: '15.03' },
  { No: 5, Makanan: 'Mie Goreng', Waktu: '19.00' },
  { No: 6, Makanan: 'Snack', Waktu: '20.00' },
  { No: 7, Makanan: 'Snack', Waktu: '21.15' },
];
const dummyBarChartData = [
  { name: 'Item 1', Kalori: 20 },
  { name: 'Item 2', Kalori: 100 },
  { name: 'Item 3', Kalori: 60 },
  { name: 'Item 4', Kalori: 80 },
  { name: 'Item 5', Kalori: 40 },
];

// ===== Kartu Ringkasan =====
const SummaryCard = ({ title, value, unit, icon: Icon }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between transition-transform duration-200 hover:scale-105">
    <div className="flex flex-col">
      <h3 className="text-sm font-medium text-gray-500">{title} Hari ini</h3>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value} {unit}</p>
    </div>
    {Icon && <Icon className="text-gray-40 w-8 h-8" />}
  </div>
);

// ===== Dashboard (dummy) =====
const Dashboard = () => {
  const [summary] = useState(dummySummary);
  const [barChartData] = useState(dummyBarChartData);

  return (
    <main className="flex-1 p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-emerald-800">Dashboard</h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <SummaryCard title="Kalori" value={summary.total_kcal} unit="Kkal" icon={Nut} />
        <SummaryCard title="Protein" value={summary.protein_g} unit="gram" icon={Soup} />
        <SummaryCard title="Karbohidrat" value={summary.carbs_g} unit="gram" icon={Scale} />
        <SummaryCard title="Lemak" value={summary.fat_g} unit="gram" icon={Droplet} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md transition-transform duration-200 hover:scale-[1.01]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Rekomendasi Gizi</h2>
            <a href="#" className="text-emerald-600 flex items-center text-sm font-medium">Semua Data <ChevronRight className="w-4 h-4 ml-1" /></a>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.macro_pct}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={5} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                >
                  {summary.macro_pct.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col space-y-2 mt-4 md:mt-0 md:ml-8 md:flex-shrink-0">
              {summary.macro_pct.map((m, i) => (
                <div key={i} className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: m.color }}></span>
                  <span className="text-gray-700">{m.name} {m.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md transition-transform duration-200 hover:scale-[1.01]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Kalori Hari ini</h2>
            <a href="#" className="text-emerald-600 flex items-center text-sm font-medium">Semua Data <ChevronRight className="w-4 h-4 ml-1" /></a>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dummyBarChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Kalori" fill="#82ca9d" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2 transition-transform duration-200 hover:scale-[1.01]">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Data Konsumsi Hari Ini</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Makanan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kkal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protein (g)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Karbo (g)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lemak (g)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dummyConsumptionData.map((item) => (
                  <tr key={item.No}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.No}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Makanan}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Waktu}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.kcal}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.protein}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.carbs}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.fat}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => alert('Edit ' + item.No)} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                      <button onClick={() => alert('Hapus ' + item.No)} className="text-red-600 hover:text-red-900">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
};

// ===== Kelola Data (dummy lokal) =====
const KelolaDataPage = () => {
  const [foodName, setFoodName] = useState('');
  const [portion, setPortion] = useState('');
  const [mealTime, setMealTime] = useState('');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [consumptions, setConsumptions] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const handleAddConsumption = (e) => {
    e.preventDefault();
    if (!foodName || !portion || !mealTime) { alert('Nama Makanan, Porsi/Berat, dan Waktu Makan wajib diisi.'); return; }

    if (editingId) {
      setConsumptions(consumptions.map(item => item.id === editingId
        ? { ...item, food: foodName, portion, time: mealTime, note,
            kcal: Math.floor(Math.random() * 300) + 50,
            protein: Math.floor(Math.random() * 20) + 1,
            carbs: Math.floor(Math.random() * 50) + 5,
            fat: Math.floor(Math.random() * 15) + 1,
          }
        : item
      ));
      setEditingId(null);
    } else {
      const newId = consumptions.length > 0 ? Math.max(...consumptions.map(i => i.id)) + 1 : 1;
      const newConsumption = {
        id: newId, food: foodName, portion, time: mealTime, note,
        kcal: Math.floor(Math.random() * 300) + 50,
        protein: Math.floor(Math.random() * 20) + 1,
        carbs: Math.floor(Math.random() * 50) + 5,
        fat: Math.floor(Math.random() * 15) + 1,
      };
      setConsumptions([...consumptions, newConsumption]);
    }

    setFoodName(''); setPortion(''); setMealTime(''); setNote('');
  };

  const handleEditConsumption = (id) => {
    const itemToEdit = consumptions.find(item => item.id === id);
    if (itemToEdit) {
      setFoodName(itemToEdit.food);
      setPortion(itemToEdit.portion);
      setMealTime(itemToEdit.time);
      setNote(itemToEdit.note || '');
      setEditingId(id);
    }
  };

  const handleDeleteConsumption = (idToDelete) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus konsumsi ini?')) {
      setConsumptions(consumptions.filter(item => item.id !== idToDelete));
    }
  };

  const filteredConsumptions = consumptions.filter(item => item.food.toLowerCase().includes(searchTerm.toLowerCase()));
  const dailyHistoryData = Object.values(consumptions.reduce((acc, item) => {
    const date = selectedDate;
    if (!acc[date]) acc[date] = { date: date, kcal: 0 };
    acc[date].kcal += item.kcal;
    return acc;
  }, {})).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <main className="flex-1 p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-emerald-800">Kelola Data</h1>
        <p className="text-gray-600 mt-2">Atur dan pantau data konsumsi harian Anda.</p>
      </header>

      <section className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          {editingId ? <span className="flex items-center"><Scale className="w-5 h-5 mr-2" /> Edit Konsumsi</span> : <span className="flex items-center"><Plus className="w-5 h-5 mr-2" /> Input Konsumsi Baru</span>}
        </h2>
        <form onSubmit={handleAddConsumption} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="foodName" className="block text-sm font-medium text-gray-700 mb-1">Nama Makanan</label>
            <input type="text" id="foodName" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="Cth: Nasi Putih" required />
          </div>
          <div>
            <label htmlFor="portion" className="block text-sm font-medium text-gray-700 mb-1">Porsi/Berat</label>
            <input type="text" id="portion" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" value={portion} onChange={(e) => setPortion(e.target.value)} placeholder="Cth: 150 g atau 1 butir" required />
          </div>
          <div>
            <label htmlFor="mealTime" className="block text-sm font-medium text-gray-700 mb-1">Waktu Makan (HH:mm)</label>
            <input type="time" id="mealTime" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" value={mealTime} onChange={(e) => setMealTime(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
            <input type="text" id="note" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Cth: Dengan sambal" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center">
              {editingId ? <span className="flex items-center"><Scale className="w-5 h-5 mr-2" /> Simpan Perubahan</span> : <span className="flex items-center"><Plus className="w-5 h-5 mr-2" /> Tambah Konsumsi</span>}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setFoodName(''); setPortion(''); setMealTime(''); setNote(''); }} className="w-full mt-2 bg-gray-400 text-white font-bold py-2 rounded-lg hover:bg-gray-500 transition-colors duration-200 flex items-center justify-center">
                Batal Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Data Konsumsi Harian</h2>
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input type="date" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 w-full" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
          <div className="relative w-full md:w-auto">
            <input type="text" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" placeholder="Cari makanan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Makanan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Porsi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kkal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protein (g)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Karbo (g)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lemak (g)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConsumptions.length > 0 ? (
                filteredConsumptions.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.food}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.portion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.kcal}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.protein}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.carbs}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.fat}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEditConsumption(item.id)} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                      <button onClick={() => handleDeleteConsumption(item.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">Tidak ada data konsumsi untuk tanggal ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Grafik Histori Konsumsi Harian</h2>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyHistoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Kalori (Kkal)', angle: -90, position: 'insideLeft', fill: '#888888' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="kcal" fill="#38A169" radius={[4, 4, 0, 0]} name="Kalori Harian" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
};

// ===== Laporan (dummy) =====
const LaporanPage = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [rangeType, setRangeType] = useState('daily');

  const dummyReportSummary = {
    target_kcal: 2200, actual_kcal: 1800, deficit_kcal: 400,
    target_protein: 120, actual_protein: 90, deficit_protein: 30,
    target_carbs: 260, actual_carbs: 200, deficit_carbs: 60,
    target_fat: 60, actual_fat: 50, deficit_fat: 10,
  };

  const dummyReportHistory = [
    { date: '2025-07-15', food: 'Nasi Goreng', portion: '1 porsi', time: '07:30', kcal: 500, protein: 15, carbs: 60, fat: 20 },
    { date: '2025-07-15', food: 'Roti Gandum', portion: '2 lembar', time: '10:00', kcal: 180, protein: 7, carbs: 30, fat: 3 },
    { date: '2025-07-16', food: 'Nasi Padang', portion: '1 porsi', time: '13:00', kcal: 700, protein: 25, carbs: 80, fat: 30 },
    { date: '2025-07-16', food: 'Kentang Goreng', portion: 'medium', time: '16:00', kcal: 350, protein: 4, carbs: 40, fat: 20 },
  ];

  const handleGeneratePDF = () => alert('Simulasi: Mengunduh laporan PDF...');

  return (
    <main className="flex-1 p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-emerald-800">Laporan & Rekomendasi Gizi</h1>
        <p className="text-gray-600 mt-2">Lihat histori konsumsi dan unduh laporan gizi Anda.</p>
      </header>

      <section className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Filter Laporan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="rangeType" className="block text-sm font-medium text-gray-700 mb-1">Tipe Rentang</label>
            <select id="rangeType" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" value={rangeType} onChange={(e) => setRangeType(e.target.value)}>
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
            </select>
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
            <input type="date" id="startDate" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
            <input type="date" id="endDate" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <button onClick={() => alert('Simulasi: Menerapkan filter laporan')} className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center">
          <Search className="w-5 h-5 mr-2" /> Terapkan Filter
        </button>
      </section>

      <section className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Ringkasan Gizi ({rangeType === 'daily' ? 'Harian' : rangeType === 'weekly' ? 'Mingguan' : 'Bulanan'})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Kalori</h3>
            <p className="text-lg font-bold text-gray-800">{dummyReportSummary.actual_kcal} Kkal / {dummyReportSummary.target_kcal} Kkal</p>
            <p className={`text-sm ${dummyReportSummary.deficit_kcal > 0 ? 'text-red-500' : 'text-green-500'}`}>{dummyReportSummary.deficit_kcal > 0 ? `Defisit ${dummyReportSummary.deficit_kcal} Kkal` : 'Target Tercapai!'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Protein</h3>
            <p className="text-lg font-bold text-gray-800">{dummyReportSummary.actual_protein} g / {dummyReportSummary.target_protein} g</p>
            <p className={`text-sm ${dummyReportSummary.deficit_protein > 0 ? 'text-red-500' : 'text-green-500'}`}>{dummyReportSummary.deficit_protein > 0 ? `Defisit ${dummyReportSummary.deficit_protein} g` : 'Target Tercapai!'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Karbohidrat</h3>
            <p className="text-lg font-bold text-gray-800">{dummyReportSummary.actual_carbs} g / {dummyReportSummary.target_carbs} g</p>
            <p className={`text-sm ${dummyReportSummary.deficit_carbs > 0 ? 'text-red-500' : 'text-green-500'}`}>{dummyReportSummary.deficit_carbs > 0 ? `Defisit ${dummyReportSummary.deficit_carbs} g` : 'Target Tercapai!'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Lemak</h3>
            <p className="text-lg font-bold text-gray-800">{dummyReportSummary.actual_fat} g / {dummyReportSummary.target_fat} g</p>
            <p className={`text-sm ${dummyReportSummary.deficit_fat > 0 ? 'text-red-500' : 'text-green-500'}`}>{dummyReportSummary.deficit_fat > 0 ? `Defisit ${dummyReportSummary.deficit_fat} g` : 'Target Tercapai!'}</p>
          </div>
        </div>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 mb-4">
          Grafik tren konsumsi (Pie/Bar/Line) akan tampil di sini.
        </div>
        <button onClick={handleGeneratePDF} className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center">
          <Download className="w-5 h-5 mr-2" /> Unduh Laporan PDF
        </button>
      </section>

      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Histori Konsumsi Detail</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Makanan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Porsi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kkal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protein (g)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Karbo (g)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lemak (g)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dummyReportHistory.length > 0 ? (
                dummyReportHistory.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.food}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.kcal}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.protein}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.carbs}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.fat}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">Tidak ada data histori laporan untuk rentang ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

// ===== AI Assistant (dummy) =====
const AIAssistant = () => {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const userTDEE = user ? calculateTDEE(user.gender, user.birthdate, user.height, user.weight, user.activityLevel) : null;
  const currentConsumptionKcal = 500;
  const dynamicDeficitCalorie = userTDEE ? Math.max(0, userTDEE - currentConsumptionKcal) : 0;
  const dynamicTargetsKcal = userTDEE || 2200;

  const dynamicTargets = {
    kcal: dynamicTargetsKcal,
    protein_g: userTDEE ? Math.round((dynamicTargetsKcal * 0.25) / 4) : 120,
    carbs_g: userTDEE ? Math.round((dynamicTargetsKcal * 0.50) / 4) : 260,
    fat_g: userTDEE ? Math.round((dynamicTargetsKcal * 0.25) / 9) : 60,
  };

  const recentConsumptions = [
    { name: 'Nasi Goreng', kcal: 500, protein_g: 15, carbs_g: 60, fat_g: 20 },
    { name: 'Roti', kcal: 150, protein_g: 5, carbs_g: 25, fat_g: 3 },
  ];

  const sendMessageToAI = async (message) => {
    if (!message.trim()) return;
    setChatHistory(prev => [...prev, { role: 'user', content: message }]);
    setUserInput(''); setIsLoading(true);
    // Simulasi saja
    await new Promise(r => setTimeout(r, 800));
    setChatHistory(prev => [...prev, { role: 'model', content: 'Contoh jawaban AI (demo).' }]);
    setIsLoading(false);
  };

  const handleQuickAction = (promptText, actionType) => {
    let finalPrompt = promptText;
    if (actionType === 'tambahKonsumsi' && user) {
      const age = calculateAge(user.birthdate);
      const genderText = user.gender === 'male' ? 'pria' : 'wanita';
      finalPrompt = `Profil: ${user.height} cm, ${user.weight} kg, ${genderText}, ${age} tahun, aktivitas ${user.activityLevel}. Hitung TDEE (≈${userTDEE} Kkal), lalu rekomendasi menu harian.`;
    } else if (actionType === 'saranVegetarian') {
      finalPrompt = 'Berikan saran menu vegetarian praktis.';
    }
    setUserInput(finalPrompt);
    sendMessageToAI(finalPrompt);
  };

  const renderMessageContent = (content) => (
    <div dangerouslySetInnerHTML={{ __html: String(content).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
  );

  return (
    <main className="flex-1 p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-emerald-800">AI Assistant ✨</h1>
        <p className="text-gray-600 mt-2">Dapatkan rekomendasi gizi personal dari asisten AI kami.</p>
      </header>

      <div className="flex-1 bg-white p-6 rounded-lg shadow-md flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-4 space-y-4 mb-4">
          {chatHistory.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              Mulai percakapan dengan AI Assistant Anda!
              <p className="mt-2 text-sm">Contoh: "Saya kekurangan 300 kalori, makanan apa yang bagus?"</p>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                {renderMessageContent(msg.content)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-lg bg-gray-200 text-gray-800 flex items-center">
                <Loader2 className="animate-spin mr-2" /> Mengetik...
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => handleQuickAction('', 'tambahKonsumsi')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition-colors duration-200 whitespace-nowrap"
            disabled={isLoading || !user?.profileComplete}
          >Tambah ke konsumsi</button>
          <button
            onClick={() => handleQuickAction('', 'saranVegetarian')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition-colors duration-200 whitespace-nowrap"
            disabled={isLoading}
          >Saran untuk vegetarian</button>
        </div>
        {!user?.profileComplete && (
          <p className="text-red-500 text-center mb-4">Lengkapi profil Anda di pengaturan untuk mendapatkan rekomendasi gizi personal.</p>
        )}

        <form onSubmit={(e) => { e.preventDefault(); sendMessageToAI(userInput); }} className="flex space-x-2">
          <input
            type="text"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Ketik pertanyaan Anda di sini..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-emerald-600 text-white p-3 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'KIRIM'}
          </button>
        </form>
      </div>
    </main>
  );
};

// ===== Sidebar =====
const Sidebar = ({ currentPage, setCurrentPage, onLogout }) => {
  const { user } = useAuth();
  return (
    <nav className="w-64 bg-emerald-700 h-full p-4 flex flex-col rounded-r-lg">
      <div className="text-white text-2xl font-bold mb-8">Nirmas.id</div>
      <div className="mb-6">
        <p className="text-white text-sm">Selamat datang,</p>
        <p className="text-white font-semibold">{user?.name || user?.displayName || 'Pengguna'}</p>
      </div>
      <ul className="space-y-4 flex-1">
        <li><button onClick={() => setCurrentPage('dashboard')} className={`flex items-center space-x-3 text-white font-medium p-3 rounded-md w-full text-left transition-colors duration-200 ${currentPage === 'dashboard' ? 'bg-emerald-600' : 'hover:bg-emerald-500'}`}><LayoutDashboard className="w-5 h-5" /><span>Dashboard</span></button></li>
        <li><button onClick={() => setCurrentPage('kelola-data')} className={`flex items-center space-x-3 text-white font-medium p-3 rounded-md w-full text-left transition-colors duration-200 ${currentPage === 'kelola-data' ? 'bg-emerald-600' : 'hover:bg-emerald-500'}`}><Scale className="w-5 h-5" /><span>Kelola Data</span></button></li>
        <li><button onClick={() => setCurrentPage('laporan')} className={`flex items-center space-x-3 text-white font-medium p-3 rounded-md w-full text-left transition-colors duration-200 ${currentPage === 'laporan' ? 'bg-emerald-600' : 'hover:bg-emerald-500'}`}><Soup className="w-5 h-5" /><span>Laporan</span></button></li>
        <li><button onClick={() => setCurrentPage('ai-assistant')} className={`flex items-center space-x-3 text-white font-medium p-3 rounded-md w-full text-left transition-colors duration-200 ${currentPage === 'ai-assistant' ? 'bg-emerald-600' : 'hover:bg-emerald-500'}`}><MessageSquareText className="w-5 h-5" /><span>AI Assistant ✨</span></button></li>
      </ul>
      <div className="mt-8">
        <button onClick={onLogout} className="flex items-center space-x-3 text-white font-medium p-3 rounded-md w-full text-left bg-red-600 hover:bg-red-700 transition-colors duration-200">
          <Lock className="w-5 h-5" /><span>Keluar</span>
        </button>
      </div>
    </nav>
  );
};

// ===== App Root =====
const App = () => {
  const [appState, setAppState] = useState('landing');
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setAppState('landing');
        setLoadingAuth(false);
        return;
      }
      const ref = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(ref);
      const profile = snap.exists() ? snap.data() : { profileComplete: false };
      const merged = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName || profile.name || 'Pengguna',
        ...profile,
      };
      setUser(merged);
      setAppState(merged.profileComplete ? 'main' : 'profileSetup');
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setAppState(userData.profileComplete ? 'main' : 'profileSetup');
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setAppState('profileSetup');
  };

  const handleProfileComplete = (profileData) => {
    const updatedUser = { ...user, ...profileData, profileComplete: true };
    setUser(updatedUser);
    setAppState('main');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setAppState('landing');
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <Loader2 className="animate-spin w-6 h-6 mr-2" /> Memuat...
      </div>
    );
  }

  const renderContent = () => {
    switch (appState) {
      case 'landing':
        return <WelcomePage onGetStarted={() => setAppState('login')} />;
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigateToRegister={() => setAppState('register')} />;
      case 'register':
        return <RegisterPage onRegisterSuccess={handleRegisterSuccess} onNavigateToLogin={() => setAppState('login')} />;
      case 'profileSetup':
        return <UserProfileSetupPage onProfileComplete={handleProfileComplete} user={user} />;
      case 'main':
        return (
          <AuthContext.Provider value={{ user, handleLogout }}>
            <div className="min-h-screen bg-gray-100 flex font-sans text-gray-800">
              <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />
              {currentPage === 'dashboard' && <Dashboard />}
              {currentPage === 'kelola-data' && <KelolaDataPage />}
              {currentPage === 'laporan' && <LaporanPage />}
              {currentPage === 'ai-assistant' && <AIAssistant />}
            </div>
          </AuthContext.Provider>
        );
      default:
        return <WelcomePage onGetStarted={() => setAppState('login')} />;
    }
  };

  return renderContent();
};

export default App;
