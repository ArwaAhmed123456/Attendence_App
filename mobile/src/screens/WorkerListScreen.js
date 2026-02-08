import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Clock, LogOut, RotateCcw, Plus, Search, AlertCircle, CheckCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { styled } from 'nativewind';
import { useFocusEffect } from '@react-navigation/native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

const WorkerListScreen = ({ navigation }) => {
    const [project, setProject] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(null); // ID of worker being processed
    const [currentLogId, setCurrentLogId] = useState(null);
    const [lastCheckInName, setLastCheckInName] = useState(null);
    const [lastCheckInCar, setLastCheckInCar] = useState(null);

    // For Undo Functionality
    const [showUndoModal, setShowUndoModal] = useState(false);
    const [recentLogs, setRecentLogs] = useState([]); // Fetch logs with time_out != null

    // Help Modal
    const [showHelpModal, setShowHelpModal] = useState(false);

    const loadProjectAndWorkers = async () => {
        try {
            const p = await AsyncStorage.getItem('currentProject');
            const logId = await AsyncStorage.getItem('currentWorkerLogId');
            const name = await AsyncStorage.getItem('lastCheckInName');
            const car = await AsyncStorage.getItem('lastCheckInCar');

            console.log('[WorkerList] Loaded storage:', { logId, name, car });

            if (logId) setCurrentLogId(logId);
            if (name) setLastCheckInName(name);
            if (car) setLastCheckInCar(car);

            if (!p) {
                navigation.replace('Landing');
                return;
            }
            const parsedProject = JSON.parse(p);

            if (!parsedProject || !parsedProject.code) {
                // Invalid project data, force re-login
                await AsyncStorage.removeItem('currentProject');
                navigation.replace('Landing');
                return;
            }

            setProject(parsedProject);
            fetchWorkers(parsedProject.code);
        } catch (error) {
            console.error('Error loading project:', error);
            navigation.replace('Landing'); // Fallback to landing on error
        } finally {
            // ensure loading is turned off if we didn't redirect (though redirect unmounts)
            // putting setLoading(false) here might cause memory leak warning if unmounted, 
            // but strictly speaking we should only set it if still mounted.
            // For now, let's rely on fetchWorkers to turn it off, or set it off here if we aren't fetching.
        }
    };

    const fetchWorkers = async (projectCode) => {
        try {
            const res = await api.get(`/logs/active/${projectCode}`);
            setWorkers(res.data);
        } catch (error) {
            console.error('Error fetching workers:', error);
            // Alert.alert('Error', 'Failed to load worker list');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadProjectAndWorkers();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        if (project) {
            fetchWorkers(project.code);
        }
    };

    const handleCheckout = (worker) => {
        Alert.alert(
            "Confirm Check Out",
            `Are you sure you want to check out ${worker.name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Check Out",
                    style: "destructive",
                    onPress: async () => {
                        if (!project?.code) {
                            Alert.alert('Error', 'Project context lost. Please restart.');
                            return;
                        }
                        setCheckoutLoading(worker.id);
                        try {
                            await api.post(`/logs/${worker.id}/checkout`);
                            // Optimistic update or refresh
                            fetchWorkers(project.code);
                        } catch (error) {
                            Alert.alert("Error", "Failed to check out");
                        } finally {
                            setCheckoutLoading(null);
                        }
                    }
                }
            ]
        );
    };

    const handleUndo = async (logId) => {
        try {
            await api.post(`/logs/${logId}/undo-checkout`);
            fetchRecentLogs(); // Refresh undo list
            if (project?.code) {
                fetchWorkers(project.code); // Refresh active list
            }
            Alert.alert("Success", "Checkout undone. Worker is back on site.");
        } catch (error) {
            Alert.alert("Error", "Failed to undo checkout");
        }
    }

    const fetchRecentLogs = async () => {
        if (!project) return;
        try {
            // We reuse the existing endpoint but logic might need adjustment or new endpoint
            // For now, let's assume we can get all logs and filter client side or use a new endpoint if strictly needed.
            // Actually, `GET /api/logs/project/:id` returns all logs.
            const res = await api.get(`/logs/project/${project.id}`);
            // Filter for logs that have time_out and are from today (optional)
            const today = new Date().toISOString().split('T')[0];
            const checkedOut = res.data.logs.filter(l => l.time_out && l.date === today && l.id.toString() === currentLogId);
            setRecentLogs(checkedOut);
        } catch (error) {
            console.error("Error fetching recent logs", error);
        }
    };

    const openUndoModal = () => {
        setShowUndoModal(true);
        fetchRecentLogs();
    };

    const renderWorkerItem = ({ item }) => {
        const isSelf = item.id.toString() === currentLogId ||
            (item.name === lastCheckInName && item.car_reg === lastCheckInCar);

        return (
            <StyledTouchableOpacity
                onPress={() => {
                    if (isSelf) {
                        handleCheckout(item);
                    }
                }}
                className={`bg-white p-4 rounded-2xl mb-3 shadow-sm border ${isSelf ? 'border-primary' : 'border-slate-100'} flex-row items-center justify-between`}
                disabled={checkoutLoading === item.id || !isSelf}
            >
                <StyledView className="flex-row items-center flex-1">
                    <StyledView className="bg-blue-50 p-3 rounded-full mr-4">
                        <User size={24} color="#2b4594" />
                    </StyledView>
                    <StyledView>
                        <StyledText className="text-lg font-bold text-slate-800">{item.name}</StyledText>
                        <StyledText className="text-slate-500 text-xs">{item.trade} • {item.car_reg}</StyledText>
                    </StyledView>
                </StyledView>
                <StyledView className="items-end">
                    <StyledView className="bg-green-50 px-2 py-1 rounded-md mb-1">
                        <StyledText className="text-green-700 font-bold text-xs">{item.time_in}</StyledText>
                    </StyledView>
                    {checkoutLoading === item.id ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                    ) : (
                        isSelf ? (
                            <StyledText className="text-red-500 font-bold text-xs">Tap to Out</StyledText>
                        ) : (
                            <StyledText className="text-slate-400 font-bold text-xs">On Site</StyledText>
                        )
                    )}
                </StyledView>
            </StyledTouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <StyledView className="bg-white px-5 py-4 flex-row items-center justify-between shadow-sm z-10">
                <StyledView className="flex-row items-center gap-3">
                    <Image
                        source={require('../../assets/square-image.png')}
                        style={{ width: 50, height: 50 }}
                        resizeMode="contain"
                    />
                    <StyledView>
                        <StyledText className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Site</StyledText>
                        <StyledText className="text-xl font-extrabold text-slate-900">{project?.name || 'Loading...'}</StyledText>
                    </StyledView>
                </StyledView>
                <StyledView className="flex-row items-center gap-2">
                    <StyledTouchableOpacity
                        onPress={() => setShowHelpModal(true)}
                        className="bg-slate-100 p-2 rounded-full"
                    >
                        <AlertCircle size={20} color="#2b4594" />
                    </StyledTouchableOpacity>
                    <StyledTouchableOpacity
                        onPress={() => navigation.navigate('Landing')}
                        className="bg-slate-100 p-2 rounded-full"
                    >
                        <LogOut size={20} color="#64748b" />
                    </StyledTouchableOpacity>
                </StyledView>
            </StyledView>

            {/* Stats / Info */}
            <StyledView className="px-5 py-6">
                <StyledView className="flex-row justify-between items-end mb-4">
                    <StyledView>
                        <StyledText className="text-3xl font-bold text-slate-900">{workers.length}</StyledText>
                        <StyledText className="text-slate-500 font-medium">Workers On Site</StyledText>
                    </StyledView>
                    <StyledTouchableOpacity
                        onPress={openUndoModal}
                        className="flex-row items-center bg-slate-200 px-3 py-2 rounded-lg"
                    >
                        <RotateCcw size={14} color="#475569" />
                        <StyledText className="text-slate-600 font-bold text-xs ml-2">Undo Timeout</StyledText>
                    </StyledTouchableOpacity>
                </StyledView>

                {/* List */}
                <FlatList
                    data={workers}
                    renderItem={renderWorkerItem}
                    keyExtractor={item => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        !loading && (
                            <StyledView className="items-center justify-center py-20">
                                <StyledView className="bg-slate-100 p-6 rounded-full mb-4">
                                    <User size={40} color="#cbd5e1" />
                                </StyledView>
                                <StyledText className="text-slate-400 font-bold text-lg">No workers currently checked in</StyledText>
                            </StyledView>
                        )
                    }
                />
            </StyledView>

            {/* FAB - Check In */}
            <StyledView className="absolute bottom-8 right-6">
                <StyledTouchableOpacity
                    onPress={() => navigation.navigate('MobileForm')}
                    className="bg-primary p-4 rounded-full shadow-lg shadow-blue-900/30 border-2 border-white"
                >
                    <Plus size={32} color="white" />
                </StyledTouchableOpacity>
            </StyledView>

            {/* Undo Modal */}
            <Modal visible={showUndoModal} animationType="slide" presentationStyle="pageSheet">
                <StyledView className="flex-1 bg-white p-6">
                    <StyledView className="flex-row justify-between items-center mb-6">
                        <StyledText className="text-2xl font-bold text-slate-900">Recently Checked Out</StyledText>
                        <StyledTouchableOpacity onPress={() => setShowUndoModal(false)}>
                            <StyledText className="text-primary font-bold text-lg">Done</StyledText>
                        </StyledTouchableOpacity>
                    </StyledView>

                    <FlatList
                        data={recentLogs}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({ item }) => (
                            <StyledView className="flex-row items-center justify-between py-4 border-b border-slate-100">
                                <StyledView>
                                    <StyledText className="font-bold text-slate-800 text-lg">{item.name}</StyledText>
                                    <StyledText className="text-slate-500">Out: {item.time_out}</StyledText>
                                </StyledView>
                                <StyledTouchableOpacity
                                    onPress={() => handleUndo(item.id)}
                                    className="bg-slate-100 px-4 py-2 rounded-lg"
                                >
                                    <StyledText className="text-slate-700 font-bold">Undo</StyledText>
                                </StyledTouchableOpacity>
                            </StyledView>
                        )}
                        ListEmptyComponent={
                            <StyledText className="text-center text-slate-400 mt-10">No recent check-outs found for today.</StyledText>
                        }
                    />
                </StyledView>
            </Modal>

            {/* Help Modal */}
            <Modal visible={showHelpModal} animationType="fade" transparent>
                <StyledView className="flex-1 bg-slate-900/80 justify-center p-6">
                    <StyledView className="bg-white rounded-3xl p-6 shadow-2xl max-h-[80%]">
                        <StyledView className="flex-row justify-between items-center mb-6">
                            <StyledView className="flex-row items-center gap-3">
                                <StyledView className="bg-blue-50 p-2 rounded-full">
                                    <AlertCircle size={24} color="#2b4594" />
                                </StyledView>
                                <StyledText className="text-xl font-bold text-slate-900">How It Works</StyledText>
                            </StyledView>
                            <StyledTouchableOpacity onPress={() => setShowHelpModal(false)}>
                                <StyledText className="text-slate-400 font-bold">Close</StyledText>
                            </StyledTouchableOpacity>
                        </StyledView>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <StyledView className="mb-6">
                                <StyledText className="font-bold text-slate-800 mb-2 text-lg">1. Check In</StyledText>
                                <StyledText className="text-slate-600 leading-relaxed">
                                    Tap the large <StyledText className="text-primary font-bold">+</StyledText> button at the bottom right. Fill in your details (Name, Company, Car Reg) to check into the site.
                                </StyledText>
                            </StyledView>

                            <StyledView className="mb-6">
                                <StyledText className="font-bold text-slate-800 mb-2 text-lg">2. On Site List</StyledText>
                                <StyledText className="text-slate-600 leading-relaxed">
                                    The main screen shows everyone currently on site. Use this to verify who is present.
                                </StyledText>
                            </StyledView>

                            <StyledView className="mb-6">
                                <StyledText className="font-bold text-slate-800 mb-2 text-lg">3. Checking Out</StyledText>
                                <StyledText className="text-slate-600 leading-relaxed">
                                    Find <StyledText className="font-bold text-slate-900">YOUR name</StyledText> in the list. Tap <StyledText className="text-red-500 font-bold">"Tap to Out"</StyledText> to sign off. You can only check out yourself.
                                </StyledText>
                            </StyledView>

                            <StyledView className="mb-6">
                                <StyledText className="font-bold text-slate-800 mb-2 text-lg">4. Undo Mistake</StyledText>
                                <StyledText className="text-slate-600 leading-relaxed">
                                    Accidentally checked out? Tap <StyledText className="font-bold text-slate-700">"Undo Timeout"</StyledText> at the top of the list to bring yourself back on site.
                                </StyledText>
                            </StyledView>
                        </ScrollView>

                        <StyledTouchableOpacity
                            onPress={() => setShowHelpModal(false)}
                            className="bg-primary py-4 rounded-xl mt-4"
                        >
                            <StyledText className="text-white text-center font-bold text-lg">Got it!</StyledText>
                        </StyledTouchableOpacity>
                    </StyledView>
                </StyledView>
            </Modal>

            {loading && (
                <StyledView className="absolute inset-0 bg-white/80 justify-center items-center">
                    <ActivityIndicator size="large" color="#2b4594" />
                </StyledView>
            )}
        </SafeAreaView>
    );
};

export default WorkerListScreen;
