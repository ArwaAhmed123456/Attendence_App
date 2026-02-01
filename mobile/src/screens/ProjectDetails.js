import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, User, Briefcase, Car, FileText } from 'lucide-react-native';
import api from '../services/api';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

const ProjectDetails = ({ route, navigation }) => {
    const { project } = route.params;
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get(`/logs?project_code=${project.code}`);
            setLogs(res.data);
        } catch (err) {
            console.error('Failed to fetch logs', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <StyledView className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center">
                <StyledTouchableOpacity onPress={() => navigation.goBack()} className="p-2 mr-2">
                    <ArrowLeft size={22} color="#475569" />
                </StyledTouchableOpacity>
                <StyledView className="flex-1">
                    <StyledText className="text-xl font-bold text-gray-900" numberOfLines={1}>{project.name}</StyledText>
                    <StyledText className="text-xs font-mono text-gray-400 uppercase tracking-widest">{project.code}</StyledText>
                </StyledView>
            </StyledView>

            {loading ? (
                <ActivityIndicator style={{ flex: 1 }} color="#2563eb" />
            ) : (
                <StyledScrollView className="flex-1 p-6">
                    <StyledView className="flex-row items-center mb-6">
                        <FileText size={20} color="#475569" />
                        <StyledText className="text-lg font-bold text-gray-800 ml-2">Recent Site Logs</StyledText>
                        <StyledText className="ml-auto text-gray-400 text-sm font-medium">{logs.length} entries</StyledText>
                    </StyledView>

                    {logs.length === 0 ? (
                        <StyledView className="bg-white p-10 rounded-2xl items-center border border-dashed border-gray-300">
                            <StyledText className="text-gray-400 font-medium text-center">No logs recorded for this project yet.</StyledText>
                        </StyledView>
                    ) : (
                        logs.map(log => (
                            <StyledView key={log.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
                                <StyledView className="flex-row justify-between items-start">
                                    <StyledView>
                                        <StyledView className="flex-row items-center mb-1">
                                            <User size={16} color="#64748b" />
                                            <StyledText className="font-bold text-gray-900 ml-2 text-base">{log.name}</StyledText>
                                        </StyledView>
                                        <StyledView className="flex-row items-center">
                                            <Briefcase size={12} color="#94a3b8" />
                                            <StyledText className="text-sm text-gray-500 ml-2 italic">{log.trade}</StyledText>
                                        </StyledView>
                                    </StyledView>
                                    <StyledView className={`px-3 py-1 rounded-full ${log.user_type === 'Employee' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                                        <StyledText className={`text-[10px] font-bold uppercase tracking-wider ${log.user_type === 'Employee' ? 'text-blue-600' : 'text-purple-600'}`}>
                                            {log.user_type}
                                        </StyledText>
                                    </StyledView>
                                </StyledView>

                                <StyledView className="flex-row items-center justify-between pt-4 border-t border-gray-50">
                                    <StyledView className="flex-row items-center">
                                        <Clock size={14} color="#64748b" />
                                        <StyledText className="text-xs text-gray-600 ml-1 font-medium">
                                            {log.time_in} - {log.time_out}
                                        </StyledText>
                                    </StyledView>
                                    <StyledView className="flex-row items-center">
                                        <Car size={14} color="#64748b" />
                                        <StyledText className="text-xs text-gray-600 ml-1 font-bold">{log.car_reg}</StyledText>
                                    </StyledView>
                                </StyledView>

                                {log.reason && (
                                    <StyledView className="mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <StyledText className="text-xs text-gray-500" numberOfLines={2}>
                                            <StyledText className="font-bold text-gray-700">Note: </StyledText>
                                            {log.reason}
                                        </StyledText>
                                    </StyledView>
                                )}
                            </StyledView>
                        ))
                    )}
                    <StyledView className="h-20" />
                </StyledScrollView>
            )}
        </SafeAreaView>
    );
};

export default ProjectDetails;
