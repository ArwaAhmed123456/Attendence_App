import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, User, Briefcase, Car, Calendar, ArrowLeft, CheckCircle, AlertCircle, Lock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

const MobileForm = ({ navigation }) => {
    const [project, setProject] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    // Time picker states
    const [showTimeInPicker, setShowTimeInPicker] = useState(false);
    const [showTimeOutPicker, setShowTimeOutPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Permission state
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState(null);
    const [permissionRequestId, setPermissionRequestId] = useState(null);
    const [restrictedDate, setRestrictedDate] = useState('');
    const [checkInterval, setCheckInterval] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        trade: '',
        car_reg: '',
        user_type: 'Employee',
        date: new Date().toISOString().split('T')[0],
        time_in: '',
        time_out: '',
        reason: ''
    });



    useEffect(() => {
        loadProject();

        // Auto-fill Time In with current time on mount (Time In Only)
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        setFormData(prev => ({
            ...prev,
            time_in: `${hours}:${minutes}`
        }));
    }, []);

    const loadProject = async () => {
        const p = await AsyncStorage.getItem('currentProject');
        if (!p) {
            navigation.navigate('Landing');
            return;
        }
        const parsed = JSON.parse(p);
        if (!parsed || !parsed.code) {
            await AsyncStorage.removeItem('currentProject');
            navigation.navigate('Landing');
            return;
        }
        setProject(parsed);
    };



    const startPolling = (id) => {
        if (checkInterval) clearInterval(checkInterval);

        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/requests/${id}`);
                const status = res.data?.status;

                if (status === 'approved') {
                    clearInterval(interval);
                    setPermissionStatus('approved');
                    setShowPermissionModal(false);
                    Alert.alert("Success", "Permission granted! You can now submit data for this date.");
                } else if (status === 'rejected') {
                    clearInterval(interval);
                    setPermissionStatus('rejected');
                }
            } catch (error) {
                console.log("Polling error:", error);
            }
        }, 3000); // Poll every 3 seconds
        setCheckInterval(interval);
    };

    const submitPermissionRequest = async () => {
        if (!project?.code || !formData.name || !restrictedDate) {
            Alert.alert("Missing Info", "Please ensure your name is entered before requesting permission.");
            return;
        }

        try {
            const res = await api.post('/requests', {
                project_code: project.code,
                user_name: formData.name,
                requested_date: restrictedDate,
                reason: formData.reason || 'Restricted date entry'
            });

            if (res.data.success) {
                setPermissionRequestId(res.data.id);
                setPermissionStatus('pending');
                startPolling(res.data.id);
            }
        } catch (error) {
            console.error("Permission Request Error:", error);
            Alert.alert("Error", "Failed to send permission request. Please try again.");
        }
    };

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (checkInterval) clearInterval(checkInterval);
        };
    }, []);

    const validate = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = "Full Name is required";
        if (!formData.trade.trim()) errors.trade = "Company is required";
        if (!formData.car_reg.trim()) errors.car_reg = "Car Registration is required";
        if (!formData.date) errors.date = "Date is required";
        if (!formData.time_in) errors.time_in = "Time In is required";

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!project?.code) {
            Alert.alert('Error', 'Project data missing. Reloading...');
            loadProject();
            return;
        }

        if (!validate()) {
            setError('Please fill in all required fields correctly.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await api.post('/logs', {
                ...formData,
                project_code: project.code
            });

            // Save local session
            const today = new Date().toISOString().split('T')[0];
            await AsyncStorage.setItem('lastCheckInDate', today);
            if (res.data.id) {
                await AsyncStorage.setItem('currentWorkerLogId', res.data.id.toString());
                await AsyncStorage.setItem('lastCheckInName', formData.name);
                await AsyncStorage.setItem('lastCheckInCar', formData.car_reg);
            }

            setSuccess(true);
        } catch (err) {
            console.error('[MobileForm] Submission Error:', err);
            console.log('[MobileForm] Error response data:', err.response?.data);
            const detail = err.response?.data?.error || err.message || 'Unknown network error';
            setError(`Submission Failed: ${detail}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSkipToList = () => {
        navigation.navigate('WorkerListScreen');
    };

    const isDateRestricted = (dateStr) => {
        const today = new Date().toISOString().split('T')[0];
        return dateStr !== today;
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const dateStr = selectedDate.toISOString().split('T')[0];
            setFormData({ ...formData, date: dateStr });

            if (isDateRestricted(dateStr)) {
                setRestrictedDate(dateStr);
                if (permissionStatus !== 'approved') {
                    setShowPermissionModal(true);
                }
            }
        }
    };

    const handleTimeInChange = (event, selectedTime) => {
        setShowTimeInPicker(false);
        if (selectedTime) {
            const hours = selectedTime.getHours().toString().padStart(2, '0');
            const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
            setFormData({ ...formData, time_in: `${hours}:${minutes}` });
        }
    };


    useEffect(() => {
        if (success) {
            // Auto redirect after a short delay or immediately
            navigation.replace('WorkerListScreen');
        }
    }, [success]);

    // ... (rest of logic)

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <StyledView className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center justify-between">
                <StyledView className="flex-row items-center">
                    <StyledTouchableOpacity onPress={() => navigation.goBack()} className="p-2 mr-1">
                        <ArrowLeft size={20} color="#64748b" />
                    </StyledTouchableOpacity>
                    <StyledView>
                        <StyledText className="text-xs font-bold text-primary uppercase leading-none mb-1">{project?.code || '...'}</StyledText>
                        <StyledText className="text-lg font-bold text-slate-900 leading-none" numberOfLines={1}>{project?.name || 'Loading...'}</StyledText>
                    </StyledView>
                </StyledView>
                <Image
                    source={require('../../assets/attendence_logo.png')}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                />
            </StyledView>

            <StyledScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                {error && (
                    <StyledView className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r flex-row">
                        <AlertCircle size={20} color="#ef4444" />
                        <StyledView className="ml-3">
                            <StyledText className="font-bold text-sm text-red-700">Submission Error</StyledText>
                            <StyledText className="text-sm text-red-600">{error}</StyledText>
                        </StyledView>
                    </StyledView>
                )}

                <StyledView className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6 font-Inter">
                    <StyledText className="text-xs font-bold text-slate-400 uppercase mb-4 font-Inter_Bold">Worker Details</StyledText>


                    <StyledView className="mb-4">
                        <StyledText className="text-sm font-medium text-slate-700 mb-2">Full Name *</StyledText>
                        <StyledView className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-primary">
                            <User size={18} color="#94a3b8" />
                            <StyledTextInput
                                className="flex-1 ml-3 text-slate-900"
                                placeholder="John Doe"
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                            />
                        </StyledView>
                        {fieldErrors.name && <StyledText className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.name}</StyledText>}
                    </StyledView>

                    <StyledView className="mb-4">
                        <StyledText className="text-sm font-medium text-slate-700 mb-2">Company *</StyledText>
                        <StyledView className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-primary">
                            <Briefcase size={18} color="#94a3b8" />
                            <StyledTextInput
                                className="flex-1 ml-3 text-slate-900"
                                placeholder="Acme Corp"
                                value={formData.trade}
                                onChangeText={(text) => setFormData({ ...formData, trade: text })}
                            />
                        </StyledView>
                        {fieldErrors.trade && <StyledText className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.trade}</StyledText>}
                    </StyledView>

                    <StyledView>
                        <StyledText className="text-sm font-medium text-slate-700 mb-2">Car Registration *</StyledText>
                        <StyledView className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-primary">
                            <Car size={18} color="#94a3b8" />
                            <StyledTextInput
                                className="flex-1 ml-3 text-slate-900"
                                placeholder="ABC-123"
                                value={formData.car_reg}
                                onChangeText={(text) => setFormData({ ...formData, car_reg: text })}
                            />
                        </StyledView>
                        {fieldErrors.car_reg && <StyledText className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.car_reg}</StyledText>}
                    </StyledView>
                </StyledView>

                <StyledView className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-10">
                    <StyledText className="text-xs font-bold text-slate-400 uppercase mb-4">Entry Log</StyledText>

                    <StyledView className="mb-4">
                        <StyledText className="text-sm font-medium text-slate-700 mb-2">Date (Locked)</StyledText>
                        <StyledView className="flex-row items-center bg-slate-100 border border-slate-200 rounded-xl px-4 py-3">
                            <Calendar size={18} color="#94a3b8" />
                            <StyledText className="flex-1 ml-3 text-slate-500 font-bold">{formData.date || 'Today'}</StyledText>
                            <Lock size={16} color="#94a3b8" />
                        </StyledView>
                    </StyledView>

                    {showDatePicker && (
                        <DateTimePicker
                            value={formData.date ? new Date(formData.date) : new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleDateChange}
                        />
                    )}

                    <StyledView className="flex-row gap-4 mb-4">
                        <StyledView className="flex-1">
                            <StyledText className="text-sm font-medium text-slate-700 mb-2">Time In (Auto)</StyledText>
                            <StyledView className="flex-row items-center bg-slate-100 border border-slate-200 rounded-xl px-4 py-3">
                                <Clock size={16} color="#94a3b8" />
                                <StyledText className="flex-1 ml-2 text-slate-500 font-bold">{formData.time_in || '--:--'}</StyledText>
                                <Lock size={16} color="#94a3b8" />
                            </StyledView>
                        </StyledView>
                    </StyledView>

                    <StyledView>
                        <StyledText className="text-sm font-medium text-slate-700 mb-2">Reason / Notes</StyledText>
                        <StyledTextInput
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 h-24 text-top"
                            multiline
                            numberOfLines={4}
                            placeholder="Regular daily work..."
                            value={formData.reason}
                            onChangeText={(text) => setFormData({ ...formData, reason: text })}
                            textAlignVertical="top"
                        />
                    </StyledView>
                </StyledView>

                <StyledTouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    className={`bg-primary py-5 rounded-2xl shadow-xl flex-row justify-center items-center mb-10 border-b-4 border-secondary ${loading ? 'opacity-70' : ''}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <StyledText className="text-white font-bold text-xl">Submit Digital Log</StyledText>
                    )}
                </StyledTouchableOpacity>

                <StyledTouchableOpacity
                    onPress={handleSkipToList}
                    className="py-3"
                >
                    <StyledText className="text-slate-500 font-bold text-center">Already checked in? View Site List</StyledText>
                </StyledTouchableOpacity>
            </StyledScrollView>

            {/* Permission Modal */}
            <Modal visible={showPermissionModal} transparent animationType="fade">
                <StyledView className="flex-1 bg-slate-900/80 justify-center p-6 backdrop-blur-sm">
                    <StyledView className="bg-white rounded-3xl p-8 items-center shadow-2xl">
                        <StyledView className="bg-blue-100 p-5 rounded-full mb-4">
                            <Calendar size={48} color="#2b4594" />
                        </StyledView>
                        <StyledText className="text-2xl font-bold text-slate-900">Approval Required</StyledText>
                        <StyledText className="text-slate-500 text-center mt-3 text-base leading-relaxed">
                            Log for <StyledText className="font-bold text-slate-900">{restrictedDate}</StyledText> requires administrator approval to proceed.
                        </StyledText>

                        {!permissionStatus && (
                            <StyledView className="w-full mt-8">
                                <StyledTouchableOpacity
                                    onPress={submitPermissionRequest}
                                    className="bg-primary py-4 rounded-2xl shadow-lg shadow-blue-200 border-b-2 border-secondary"
                                >
                                    <StyledText className="text-white text-center font-bold text-lg">Send Request</StyledText>
                                </StyledTouchableOpacity>
                                <StyledTouchableOpacity
                                    onPress={() => {
                                        setShowPermissionModal(false);
                                        setFormData({ ...formData, date: new Date().toISOString().split('T')[0] });
                                    }}
                                    className="py-3 mt-2"
                                >
                                    <StyledText className="text-slate-400 text-center font-bold">Cancel</StyledText>
                                </StyledTouchableOpacity>
                            </StyledView>
                        )}

                        {permissionStatus === 'pending' && (
                            <StyledView className="mt-8 items-center">
                                <ActivityIndicator color="#2b4594" size="large" />
                                <StyledText className="font-bold text-slate-800 text-lg mt-4 text-center">Waiting for Site Manager...</StyledText>
                                <StyledText className="text-sm text-slate-400 mt-2 text-center text-center">This window will close automatically once approved.</StyledText>
                            </StyledView>
                        )}

                        {permissionStatus === 'rejected' && (
                            <StyledView className="w-full mt-8">
                                <StyledText className="text-red-500 font-bold text-center text-xl mb-6">Request Declined</StyledText>
                                <StyledTouchableOpacity
                                    onPress={() => {
                                        setShowPermissionModal(false);
                                        setPermissionStatus(null);
                                        setFormData({ ...formData, date: new Date().toISOString().split('T')[0] });
                                    }}
                                    className="bg-slate-100 py-4 rounded-2xl"
                                >
                                    <StyledText className="text-slate-800 text-center font-bold">Try Another Date</StyledText>
                                </StyledTouchableOpacity>
                            </StyledView>
                        )}
                    </StyledView>
                </StyledView>
            </Modal>
        </SafeAreaView>
    );
};

export default MobileForm;
