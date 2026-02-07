import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, User, Clock, Search, LogOut as CheckoutIcon, CheckCircle2, Shield } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);
const StyledTextInput = styled(TextInput);

const GuardDashboard = ({ navigation }) => {
    const { logout } = useAuth();
    const [projectCode, setProjectCode] = useState('');
    const [activeLogs, setActiveLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [guard, setGuard] = useState(null);

    useEffect(() => {
        loadGuard();
    }, []);

    const loadGuard = async () => {
        const user = await AsyncStorage.getItem('user');
        if (user) setGuard(JSON.parse(user));
    };

    const handleStartSession = async () => {
        if (!projectCode.trim()) {
            Alert.alert('Required', 'Please enter a Project Code to start monitoring.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`/logs/active/${projectCode.trim().toUpperCase()}`);
            setActiveLogs(res.data);
            setIsSessionActive(true);
        } catch (err) {
            Alert.alert('Error', 'Could not find project or fetch logs.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = (log) => {
        Alert.alert(
            'Confirm Checkout',
            `Are you sure you want to checkout ${log.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            await api.post(`/logs/${log.id}/checkout`);
                            // Refresh list
                            const res = await api.get(`/logs/active/${projectCode.trim().toUpperCase()}`);
                            setActiveLogs(res.data);
                        } catch (err) {
                            Alert.alert('Error', 'Failed to perform checkout.');
                        }
                    }
                }
            ]
        );
    };

    const handleLogout = async () => {
        await logout();
    };

    if (!isSessionActive) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
                <StyledView className="bg-white px-6 py-4 border-b border-slate-100 flex-row justify-between items-center">
                    <StyledView className="flex-row items-center">
                        <Image
                            source={require('../../assets/attendence_logo.png')}
                            style={{ width: 30, height: 30, marginRight: 10 }}
                        />
                        <StyledText className="text-xl font-bold text-slate-900">Security Guard</StyledText>
                    </StyledView>
                    <StyledTouchableOpacity onPress={handleLogout}>
                        <LogOut size={22} color="#64748b" />
                    </StyledTouchableOpacity>
                </StyledView>

                <StyledView className="flex-1 justify-center p-8">
                    <StyledView className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 items-center">
                        <Image
                            source={require('../../assets/attendence_logo.png')}
                            style={{ width: 100, height: 100, marginBottom: 20 }}
                        />
                        <StyledText className="text-2xl font-bold text-slate-900 text-center uppercase tracking-tight">Active Monitoring</StyledText>
                        <StyledText className="text-slate-500 text-center mt-2 mb-8 font-medium">Enter the Site Code to start managing workers on site.</StyledText>

                        <StyledView className="w-full mb-8">
                            <StyledText className="text-xs font-bold text-primary uppercase mb-2 ml-1">Site Code</StyledText>
                            <StyledTextInput
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-center text-xl font-bold text-slate-900 uppercase"
                                placeholder="SITE-123"
                                value={projectCode}
                                onChangeText={setProjectCode}
                                autoCapitalize="characters"
                            />
                        </StyledView>

                        <StyledTouchableOpacity
                            onPress={handleStartSession}
                            disabled={loading}
                            className="bg-primary w-full py-5 rounded-2xl shadow-xl border-b-4 border-secondary flex-row justify-center items-center"
                        >
                            {loading ? <ActivityIndicator color="white" /> : (
                                <>
                                    <StyledText className="text-white font-bold text-lg mr-2 uppercase">Connect to Site</StyledText>
                                    <Search size={20} color="white" />
                                </>
                            )}
                        </StyledTouchableOpacity>
                    </StyledView>
                </StyledView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <StyledView className="bg-white px-6 py-4 border-b border-slate-100 flex-row justify-between items-center">
                <StyledView>
                    <StyledText className="text-xs font-bold text-primary uppercase">{projectCode.toUpperCase()}</StyledText>
                    <StyledText className="text-xl font-bold text-slate-900">Monitoring Site</StyledText>
                </StyledView>
                <StyledTouchableOpacity onPress={() => setIsSessionActive(false)} className="p-2 bg-slate-100 rounded-full">
                    <Search size={20} color="#64748b" />
                </StyledTouchableOpacity>
            </StyledView>

            <StyledScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                <StyledView className="flex-row items-center mb-6">
                    <Clock size={20} color="#2b4594" />
                    <StyledText className="text-lg font-bold text-slate-800 ml-2">Workers On Site</StyledText>
                    <StyledView className="ml-auto bg-primary px-3 py-1 rounded-full">
                        <StyledText className="text-white text-xs font-bold">{activeLogs.length}</StyledText>
                    </StyledView>
                </StyledView>

                {activeLogs.length === 0 ? (
                    <StyledView className="bg-white p-10 rounded-3xl items-center border border-dashed border-slate-300">
                        <StyledText className="text-slate-400 font-bold text-center">No workers currently checked in for this site.</StyledText>
                    </StyledView>
                ) : (
                    activeLogs.map(log => (
                        <StyledView key={log.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4 flex-row items-center justify-between">
                            <StyledView className="flex-1">
                                <StyledText className="font-bold text-slate-900 text-lg mb-1">{log.name}</StyledText>
                                <StyledView className="flex-row items-center">
                                    <Clock size={12} color="#94a3b8" />
                                    <StyledText className="text-xs text-slate-500 ml-1 font-medium">In: {log.time_in}</StyledText>
                                    <StyledView className="w-1 h-1 bg-slate-300 rounded-full mx-2" />
                                    <StyledText className="text-xs text-slate-400 italic">{log.trade}</StyledText>
                                </StyledView>
                            </StyledView>

                            <StyledTouchableOpacity
                                onPress={() => handleCheckout(log)}
                                className="bg-red-50 p-4 rounded-2xl border border-red-100"
                            >
                                <CheckoutIcon size={24} color="#ef4444" />
                            </StyledTouchableOpacity>
                        </StyledView>
                    ))
                )}
                <StyledView className="h-20" />
            </StyledScrollView>
        </SafeAreaView>
    );
};

export default GuardDashboard;
