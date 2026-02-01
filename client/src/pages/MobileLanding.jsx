import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Building2, ArrowRight, AlertCircle } from 'lucide-react';

const MobileLanding = () => {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/projects/verify-code', { code });
            if (res.data.valid) {
                // Save project code inside the object for persistence check
                const projectData = { ...res.data.project, code: code };
                localStorage.setItem('currentProject', JSON.stringify(projectData));
                navigate('/form');
            } else {
                setError(res.data.error || 'Invalid Project Code');
            }
        } catch (err) {
            setError('Connection Error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">

            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-10">
                    <div className="bg-white p-1 rounded-full shadow-2xl border-4 border-white">
                        <img src="/logo.png" className="w-32 h-32" alt="Logo" />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <h1 className="text-2xl font-bold text-center mb-1 text-slate-900">Project Sign-In</h1>
                    <p className="text-center text-slate-500 mb-8 text-sm">Enter your project code to proceed</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Project Code</label>
                            <input
                                type="text"
                                placeholder="e.g. SITE-001"
                                className="w-full px-4 py-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-center text-xl font-bold uppercase tracking-widest transition-all"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value.toUpperCase());
                                    setError('');
                                }}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
                                <AlertCircle size={16} className="shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-cyan-600 text-white font-bold py-4 rounded-xl hover:bg-cyan-700 shadow-lg shadow-cyan-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2 border-b-4 border-cyan-800"
                        >
                            {loading ? 'Verifying...' : 'Access Site'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center space-y-2">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Secure Attendance System</p>
                    <p className="text-[10px] text-slate-300">v1.0.4 • Enterprise Edition</p>
                </div>
            </div>
        </div>
    );
};

export default MobileLanding;
