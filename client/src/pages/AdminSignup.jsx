import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { UserPlus, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const AdminSignup = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        organization: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/signup', {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                organization: formData.organization,
                password: formData.password
            });
            toast.success("Account created successfully!");
            setTimeout(() => navigate('/admin/login'), 2000);
        } catch (err) {
            toast.error(err.response?.data?.error || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Toaster position="top-right" />
            <div className="max-w-2xl w-full">
                <div className="text-center mb-10">
                    <div className="inline-flex bg-white p-1 rounded-full shadow-2xl mb-4 border-4 border-white">
                        <img src="/logo.png" className="w-24 h-24 rounded-full" alt="Logo" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Admin Registration</h1>
                    <p className="text-slate-500 mt-2 font-medium">Create your professional admin account</p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                    <form onSubmit={handleSignup} className="space-y-5">
                        {/* Name Fields - Side by Side */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">First Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="John"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Last Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Doe"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Email Address *</label>
                            <input
                                type="email"
                                required
                                placeholder="admin@company.com"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition pr-12"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                            <input
                                type="tel"
                                placeholder="+92 300 1234567"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Organization</label>
                            <input
                                type="text"
                                placeholder="Company Name (Optional)"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition"
                                value={formData.organization}
                                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                            />
                        </div>

                        <div className="relative">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="••••••••"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition pr-12"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-11 text-slate-400 hover:text-blue-600 transition"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div className="relative">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                placeholder="••••••••"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition pr-12"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-11 text-slate-400 hover:text-blue-600 transition"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-cyan-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-cyan-200 hover:bg-cyan-700 transform hover:-translate-y-0.5 transition flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? "Initializing..." : (
                                <>
                                    <UserPlus size={20} />
                                    <span>Register Admin Account</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-500">
                            Already have an account?{" "}
                            <Link to="/admin/login" className="text-cyan-600 font-bold hover:text-cyan-700">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center text-slate-400 text-xs uppercase tracking-[0.2em]">
                    Secure Attendance Enterprise
                </div>
            </div>
        </div>
    );
};

export default AdminSignup;
