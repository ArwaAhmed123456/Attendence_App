import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Folder, LogOut, Clock, Check, X, Eye, EyeOff, LayoutDashboard, Users, Zap, Lock } from 'lucide-react';
import { io } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';

const AdminDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [authPassword, setAuthPassword] = useState('');
    const [showAuthPassword, setShowAuthPassword] = useState(false);
    const [rememberPassword, setRememberPassword] = useState(false);
    const [editProject, setEditProject] = useState({ name: '', code: '' });
    const [newProject, setNewProject] = useState({ name: '', code: '', password: '', confirmPassword: '', admin_email: '' });
    const [resetFlow, setResetFlow] = useState({ step: 1, code: '', token: '', newPassword: '', confirmPassword: '', targetEmail: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formError, setFormError] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
        fetchPendingRequests();

        // Initialize Socket.io
        const socketHost = window.location.hostname.includes('onrender.com')
            ? `https://${window.location.hostname}`
            : `http://${window.location.hostname}:5000`;
        const socket = io(socketHost);

        socket.on('newAttendance', (data) => {
            toast.success(
                (t) => (
                    <div className="flex flex-col">
                        <span className="font-bold">New Attendance Log!</span>
                        <span className="text-sm">{data.name} just signed into {data.project_code}</span>
                    </div>
                ),
                { duration: 5000, icon: '🚀' }
            );
            // Optionally refresh stats or logs here
        });

        socket.on('passwordRequest', (data) => {
            toast.error(
                (t) => (
                    <div className="flex flex-col">
                        <span className="font-bold">Password Recovery Request!</span>
                        <span className="text-sm">Worker needs password for project: <strong>{data.code}</strong></span>
                    </div>
                ),
                { duration: 10000, icon: '🔑' }
            );
        });

        return () => socket.disconnect();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (err) {
            if (err.response?.status === 401) navigate('/admin/login');
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const res = await api.get('/requests/pending');
            setPendingRequests(res.data);
        } catch (err) {
            console.error('Failed to fetch requests', err);
        }
    };

    const handleRequestAction = async (id, status) => {
        try {
            await api.put(`/requests/${id}/status`, { status });
            toast.success(`Request ${status}`);
            fetchPendingRequests();
        } catch (err) {
            toast.error('Action failed');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (newProject.password !== newProject.confirmPassword) {
            setFormError("Passwords do not match");
            return;
        }
        try {
            await api.post('/projects', newProject);
            setShowModal(false);
            setNewProject({ name: '', code: '', password: '', confirmPassword: '', admin_email: '' });
            toast.success("Project created successfully");
            fetchProjects();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error creating project');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        toast.success("Logged out");
        navigate('/admin/login');
    };

    const handleProjectClick = (project) => {
        setSelectedProject(project);
        setShowAuthModal(true);

        // Check if password is saved
        const savedPassword = localStorage.getItem(`project_pass_${project.id}`);
        if (savedPassword) {
            setAuthPassword(savedPassword);
            setRememberPassword(true);
        } else {
            setAuthPassword('');
            setRememberPassword(false);
        }

        setFormError('');
        setShowAuthPassword(false);
    };

    const handleProjectAccess = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/projects/${selectedProject.id}/verify-access`, { password: authPassword });

            // Save password if remember me is checked
            if (rememberPassword) {
                localStorage.setItem(`project_pass_${selectedProject.id}`, authPassword);
            }

            setShowAuthModal(false);
            navigate(`/admin/project/${selectedProject.id}`);
        } catch (err) {
            setFormError('Incorrect project password');
        }
    };

    const handleDeleteProject = async (project) => {
        console.log('Attempting to delete project:', project.id, project.name);
        if (window.confirm(`Are you sure you want to delete "${project.name}"? This will delete all associated logs and cannot be undone!`)) {
            try {
                console.log('Confirmed deletion for project:', project.id);
                const res = await api.delete(`/projects/${project.id}`);
                console.log('Delete response:', res.data);
                toast.success('Project deleted successfully');
                fetchProjects();
                localStorage.removeItem(`project_pass_${project.id}`);
            } catch (err) {
                console.error('Delete error:', err.response?.data || err.message);
                toast.error('Failed to delete project: ' + (err.response?.data?.error || 'Server error'));
            }
        } else {
            console.log('Deletion cancelled by user');
        }
    };

    const handleEditProject = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/projects/${selectedProject.id}`, {
                name: editProject.name,
                code: editProject.code
            });
            toast.success('Project updated successfully');
            setShowEditModal(false);
            fetchProjects();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update project');
        }
    };

    const openEditModal = (project) => {
        setSelectedProject(project);
        setEditProject({ name: project.name, code: project.code });
        setShowEditModal(true);
    };

    const openResetModal = () => {
        setShowAuthModal(false);
        setShowResetModal(true);
        setResetFlow({ step: 1, code: selectedProject.code, token: '', newPassword: '', confirmPassword: '', targetEmail: '' });
        setFormError('');
    };

    const generateRandomCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let random = '';
        for (let i = 0; i < 4; i++) random += chars.charAt(Math.floor(Math.random() * chars.length));
        setNewProject(prev => ({ ...prev, code: `TRIPOD-${random}` }));
    };

    const handleSendResetCode = async () => {
        setResetLoading(true);
        setFormError('');
        try {
            const res = await api.post('/projects/forgot-password', {
                code: resetFlow.code
            });
            toast.success('Verification code sent to email!');
            setResetFlow({ ...resetFlow, step: 2, targetEmail: res.data.email });
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to send reset code');
        } finally {
            setResetLoading(false);
        }
    };

    const handleVerifyToken = async () => {
        setResetLoading(true);
        setFormError('');
        try {
            await api.post('/projects/verify-reset-token', {
                code: resetFlow.code,
                reset_token: resetFlow.token
            });
            setResetFlow({ ...resetFlow, step: 3 });
        } catch (err) {
            setFormError(err.response?.data?.error || 'Invalid or expired code');
        } finally {
            setResetLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (resetFlow.newPassword !== resetFlow.confirmPassword) {
            setFormError('Passwords do not match');
            return;
        }
        setResetLoading(true);
        setFormError('');
        try {
            await api.post('/projects/reset-password', {
                code: resetFlow.code,
                reset_token: resetFlow.token,
                new_password: resetFlow.newPassword
            });
            toast.success('Password reset successfully!');
            setShowResetModal(false);
            setAuthPassword(resetFlow.newPassword);
            setShowAuthModal(true);
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Toaster position="top-right" />
            <nav className="bg-slate-900 shadow-xl p-4 flex justify-between items-center px-12 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" className="w-10 h-10" alt="Logo" />
                    <h1 className="text-xl font-bold text-white tracking-tight">Attendance Pro</h1>
                </div>
                <button onClick={handleLogout} className="text-slate-300 hover:text-white flex items-center gap-2 font-medium transition">
                    <LogOut size={18} /> Logout
                </button>
            </nav>

            <div className="max-w-7xl mx-auto p-8 lg:p-12">
                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="bg-cyan-50 p-4 rounded-xl text-cyan-600">
                            <LayoutDashboard size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Projects</p>
                            <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
                        <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Live Activity</p>
                            <p className="text-2xl font-bold text-slate-900">Active</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-4">
                        <div className="bg-orange-50 p-4 rounded-xl text-orange-600">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Pending Tasks</p>
                            <p className="text-2xl font-bold text-slate-900">{pendingRequests.length}</p>
                        </div>
                    </div>
                </div>

                {/* Pending Requests Section */}
                {pendingRequests.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Clock className="text-orange-500" /> Pending Date Requests
                        </h2>
                        <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="p-4 border-b border-gray-50 flex items-center justify-between last:border-0 hover:bg-orange-50/10 transition">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900">{req.user_name}</span>
                                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">{req.project_code}</span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Requested Date: <span className="font-medium text-orange-600">{req.requested_date}</span>
                                            {req.reason && <span className="text-gray-400"> • "{req.reason}"</span>}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRequestAction(req.id, 'approved')}
                                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-200 transition"
                                            title="Approve"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleRequestAction(req.id, 'rejected')}
                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition"
                                            title="Reject"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-cyan-700 transition"
                    >
                        <Plus size={20} /> New Project
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((p) => (
                        <div
                            key={p.id}
                            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 group relative"
                        >
                            <div
                                onClick={() => handleProjectClick(p)}
                                className="cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-cyan-50 p-3 rounded-lg text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition">
                                        <Folder size={24} />
                                    </div>
                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{p.code}</span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-800 mb-1">{p.name}</h3>
                                <p className="text-gray-400 text-sm">Created: {new Date(p.created_at).toLocaleDateString()}</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(p);
                                    }}
                                    className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProject(p);
                                    }}
                                    className="flex-1 py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-cyan-100 p-3 rounded-2xl text-cyan-600">
                                <Plus size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">New Project</h3>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                placeholder="Project Name"
                                className="w-full px-4 py-2 border rounded-lg"
                                value={newProject.name}
                                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                required
                            />
                            <div className="flex gap-2">
                                <input
                                    placeholder="Project Code (e.g. SITE-001)"
                                    className="flex-1 px-4 py-2 border rounded-lg uppercase"
                                    value={newProject.code}
                                    onChange={e => setNewProject({ ...newProject, code: e.target.value.toUpperCase() })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={generateRandomCode}
                                    className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"
                                >
                                    ✨ Generate
                                </button>
                            </div>
                            <input
                                placeholder="Admin Email (for password recovery)"
                                type="email"
                                className="w-full px-4 py-2 border rounded-lg"
                                value={newProject.admin_email}
                                onChange={e => setNewProject({ ...newProject, admin_email: e.target.value })}
                                required
                            />
                            <div className="relative">
                                <input
                                    placeholder="Project Password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full px-4 py-2 border rounded-lg pr-10"
                                    value={newProject.password}
                                    onChange={e => setNewProject({ ...newProject, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    placeholder="Confirm Project Password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className="w-full px-4 py-2 border rounded-lg pr-10"
                                    value={newProject.confirmPassword}
                                    onChange={e => setNewProject({ ...newProject, confirmPassword: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {formError && <p className="text-red-500 text-sm">{formError}</p>}
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => { setShowModal(false); setFormError(''); }} className="flex-1 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="flex-1 bg-cyan-600 text-white py-2 rounded-lg font-bold">Create Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Project Access Auth Modal */}
            {showAuthModal && selectedProject && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-cyan-100 p-3 rounded-2xl text-cyan-600">
                                <Lock size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">Project Access</h3>
                        </div>
                        <p className="text-slate-600 mb-6">Enter the project password to view logs for <span className="font-bold text-slate-900">{selectedProject.name}</span></p>
                        <form onSubmit={handleProjectAccess} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Project Password</label>
                                <div className="relative">
                                    <input
                                        type={showAuthPassword ? 'text' : 'password'}
                                        placeholder="Enter project password"
                                        className="w-full px-4 py-3 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                                        value={authPassword}
                                        onChange={(e) => setAuthPassword(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowAuthPassword(!showAuthPassword)}
                                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                                    >
                                        {showAuthPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me Checkbox */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="rememberPassword"
                                    checked={rememberPassword}
                                    onChange={(e) => setRememberPassword(e.target.checked)}
                                    className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                                />
                                <label htmlFor="rememberPassword" className="text-sm text-slate-600 cursor-pointer">
                                    Remember password for this project
                                </label>
                            </div>

                            {formError && <p className="text-red-500 text-sm">{formError}</p>}

                            <button
                                type="button"
                                onClick={openResetModal}
                                className="text-cyan-600 hover:text-cyan-700 text-sm font-medium underline"
                            >
                                Forgot Password?
                            </button>

                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAuthModal(false);
                                        setFormError('');
                                        setAuthPassword('');
                                        setShowAuthPassword(false);
                                    }}
                                    className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-bold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-cyan-600 text-white py-3 rounded-lg font-bold hover:bg-cyan-700 transition shadow-lg"
                                >
                                    Access Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Project Modal */}
            {showEditModal && selectedProject && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">Edit Project</h3>
                        </div>
                        <form onSubmit={handleEditProject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Project Name</label>
                                <input
                                    type="text"
                                    placeholder="Construction Site A"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editProject.name}
                                    onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Project Code</label>
                                <input
                                    type="text"
                                    placeholder="SITE-001"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
                                    value={editProject.code}
                                    onChange={(e) => setEditProject({ ...editProject, code: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            {formError && <p className="text-red-500 text-sm">{formError}</p>}
                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setFormError('');
                                    }}
                                    className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-bold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Multi-Step Password Reset Modal */}
            {showResetModal && selectedProject && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                                <Lock size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">Reset Password</h3>
                                <p className="text-sm text-slate-500">{selectedProject.name}</p>
                            </div>
                        </div>

                        {/* Step 1: Confirm Destination */}
                        {resetFlow.step === 1 && (
                            <div className="space-y-4">
                                <p className="text-slate-600 text-sm">A verification code will be sent to the administrator email associated with this project for security.</p>

                                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowResetModal(false);
                                            setShowAuthModal(true);
                                        }}
                                        className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-bold transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSendResetCode}
                                        disabled={resetLoading}
                                        className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition shadow-lg disabled:opacity-50"
                                    >
                                        {resetLoading ? 'Sending...' : 'Send Reset Code'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Enter Verification Code */}
                        {resetFlow.step === 2 && (
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <p className="text-green-800 text-sm">
                                        ✅ Verification code sent to <strong>{resetFlow.targetEmail}</strong>
                                    </p>
                                </div>
                                <p className="text-slate-600">Enter the 6-digit code from your email. The code expires in 15 minutes.</p>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Verification Code</label>
                                    <input
                                        type="text"
                                        placeholder="123456"
                                        maxLength="6"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-center text-2xl font-mono tracking-widest"
                                        value={resetFlow.token}
                                        onChange={(e) => setResetFlow({ ...resetFlow, token: e.target.value.replace(/\D/g, '') })}
                                        autoFocus
                                    />
                                </div>
                                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                                <button
                                    onClick={() => setResetFlow({ ...resetFlow, step: 1 })}
                                    className="text-orange-600 hover:text-orange-700 text-sm font-medium underline"
                                >
                                    Didn't receive code? Try again
                                </button>
                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowResetModal(false);
                                            setShowAuthModal(true);
                                        }}
                                        className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-bold transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleVerifyToken}
                                        disabled={resetLoading || resetFlow.token.length !== 6}
                                        className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition shadow-lg disabled:opacity-50"
                                    >
                                        {resetLoading ? 'Verifying...' : 'Verify Code'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Set New Password */}
                        {resetFlow.step === 3 && (
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <p className="text-green-800 text-sm">
                                        ✅ Code verified! Set your new password below.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        placeholder="Enter new password"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        value={resetFlow.newPassword}
                                        onChange={(e) => setResetFlow({ ...resetFlow, newPassword: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
                                    <input
                                        type="password"
                                        placeholder="Confirm new password"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        value={resetFlow.confirmPassword}
                                        onChange={(e) => setResetFlow({ ...resetFlow, confirmPassword: e.target.value })}
                                    />
                                </div>
                                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowResetModal(false);
                                            setShowAuthModal(true);
                                        }}
                                        className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-bold transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleResetPassword}
                                        disabled={resetLoading || !resetFlow.newPassword || !resetFlow.confirmPassword}
                                        className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition shadow-lg disabled:opacity-50"
                                    >
                                        {resetLoading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
