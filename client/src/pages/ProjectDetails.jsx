import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Search, Download, Users, Calendar, Settings, Lock, Eye, EyeOff } from 'lucide-react';
import jsPDF from 'jspdf';
import toast, { Toaster } from 'react-hot-toast';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [logs, setLogs] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showPassModal, setShowPassModal] = useState(false);
    const [newPass, setNewPass] = useState({ password: '', confirm: '' });
    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/logs/project/${id}`);
            setProject(res.data.project);
            setLogs(res.data.logs);
        } catch (err) {
            if (err.response?.status === 401) navigate('/admin/login');
            toast.error("Failed to load project details");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPass.password !== newPass.confirm) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            await api.put(`/projects/${id}/password`, { password: newPass.password });
            toast.success("Project password updated");
            setShowPassModal(false);
            setNewPass({ password: '', confirm: '' });
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const filteredLogs = logs.filter(log =>
        log.name.toLowerCase().includes(search.toLowerCase()) ||
        log.date.includes(search) ||
        log.trade?.toLowerCase().includes(search.toLowerCase())
    );

    // Simple stats
    const uniqueWorkers = new Set(filteredLogs.map(l => l.name)).size;
    const today = new Date().toISOString().split('T')[0];
    const presentToday = filteredLogs.filter(l => l.date === today).length;

    const downloadPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(project.name, 14, 22);
        doc.setFontSize(11);
        doc.text(`Project Code: ${project.code}`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);

        let y = 45;

        // Simple table header manually
        const headers = ["Date", "Name", "Trade", "Car", "In", "Out", "Hrs"];
        const xPos = [14, 40, 75, 110, 135, 150, 170];

        doc.setFont(undefined, 'bold');
        headers.forEach((h, i) => doc.text(h, xPos[i], y));
        doc.line(14, y + 2, 195, y + 2);
        y += 10;

        doc.setFont(undefined, 'normal');

        filteredLogs.forEach((log) => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.text(log.date, xPos[0], y);
            doc.text(log.name.substring(0, 15), xPos[1], y);
            doc.text((log.trade || '-').substring(0, 12), xPos[2], y);
            doc.text((log.car_reg || '-').substring(0, 10), xPos[3], y);
            doc.text(log.time_in, xPos[4], y);
            doc.text(log.time_out, xPos[5], y);
            doc.text(String(log.hours || 0), xPos[6], y);
            y += 8;
        });

        doc.save(`${project.name}_Report.pdf`);
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!project) return <div className="p-8">Project not found</div>;

    return (
        <div className="min-h-screen bg-slate-50">
            <Toaster position="top-right" />
            <nav className="bg-white shadow-sm p-4 px-12 border-b border-slate-100 sticky top-0 z-50 flex justify-between items-center">
                <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-slate-500 hover:text-cyan-600 font-bold transition">
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
                <img src="/logo.png" className="w-8 h-8 rounded-lg" alt="Logo" />
            </nav>

            <div className="max-w-7xl mx-auto p-8 lg:p-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
                            <span className="bg-cyan-100 text-cyan-700 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase">{project.code}</span>
                        </div>
                        <p className="text-slate-500">Project Oversight & Attendance Logs</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowPassModal(true)}
                            className="bg-white text-slate-700 px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-slate-50 border border-slate-200 font-bold transition shadow-sm"
                        >
                            <Lock size={18} /> Password
                        </button>
                        <button
                            onClick={downloadPDF}
                            className="bg-cyan-600 text-white px-8 py-3 rounded-2xl flex items-center gap-2 hover:bg-cyan-700 transition shadow-lg shadow-cyan-200 font-bold"
                        >
                            <Download size={20} /> Export Report
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="bg-cyan-100 p-3 rounded-full text-cyan-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Present Today</p>
                            <h2 className="text-2xl font-bold">{presentToday}</h2>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="bg-cyan-100 p-3 rounded-full text-cyan-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Total Workers (Filtered)</p>
                            <h2 className="text-2xl font-bold">{uniqueWorkers}</h2>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Total Logs</p>
                            <h2 className="text-2xl font-bold">{filteredLogs.length}</h2>
                        </div>
                    </div>
                </div>


                {/* Filters */}
                <div className="bg-white p-4 rounded-t-xl border-b border-gray-100 flex items-center gap-4">
                    <Search size={20} className="text-gray-400" />
                    <input
                        placeholder="Search by name, date, trade..."
                        className="flex-1 outline-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="bg-white rounded-b-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium text-sm uppercase">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Trade</th>
                                <th className="p-4">Car Reg</th>
                                <th className="p-4">User Type</th>
                                <th className="p-4">Time In</th>
                                <th className="p-4">Time Out</th>
                                <th className="p-4">Hrs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="p-4 text-gray-600">{log.date}</td>
                                    <td className="p-4 font-medium text-gray-900">{log.name}</td>
                                    <td className="p-4 text-gray-600">{log.trade}</td>
                                    <td className="p-4 text-gray-600 font-mono text-sm">{log.car_reg || '-'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${log.user_type === 'Visitor' ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'}`}>
                                            {log.user_type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">{log.time_in}</td>
                                    <td className="p-4 text-gray-600">{log.time_out}</td>
                                    <td className="p-4 font-bold text-gray-800">{log.hours}</td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-400">No logs found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
