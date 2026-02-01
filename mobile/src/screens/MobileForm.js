import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, User, Briefcase, Car, Calendar, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react-native';
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

    const [calculatedHours, setCalculatedHours] = useState(0);

    useEffect(() => {
        loadProject();
    }, []);

    const loadProject = async () => {
        const p = await AsyncStorage.getItem('currentProject');
        if (!p) {
            navigation.navigate('Landing');
            return;
        }
        const parsed = JSON.parse(p);
        setProject(parsed);
    };

    useEffect(() => {
        if (formData.time_in && formData.time_out && formData.date) {
            const startStr = formData.date + 'T' + formData.time_in;
            const endStr = formData.date + 'T' + formData.time_out;
            const start = new Date(startStr);
            const end = new Date(endStr);
            let diff = (end - start) / (1000 * 60 * 60);
            if (diff < 0) diff = 0;
            setCalculatedHours(diff.toFixed(2));
        } else {
            setCalculatedHours(0);
        }
    }, [formData.time_in, formData.time_out, formData.date]);

    const validate = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = "Full Name is required";
        if (!formData.trade.trim()) errors.trade = "Trade / Company is required";
        if (!formData.car_reg.trim()) errors.car_reg = "Car Registration is required";
        if (!formData.date) errors.date = "Date is required";
        if (!formData.time_in) errors.time_in = "Time In is required";
        if (!formData.time_out) errors.time_out = "Time Out is required";

        if (formData.time_in && formData.time_out && formData.date) {
            const startStr = formData.date + 'T' + formData.time_in;
            const endStr = formData.date + 'T' + formData.time_out;
            const start = new Date(startStr);
            const end = new Date(endStr);
            if (end <= start) {
                errors.time_out = "Time Out must be after Time In";
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!project) return;

        if (!validate()) {
            setError('Please fill in all required fields correctly.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/logs', {
                ...formData,
                project_code: project.code
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit log');
        } finally {
            setLoading(false);
        }
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

    const handleTimeOutChange = (event, selectedTime) => {
        setShowTimeOutPicker(false);
        if (selectedTime) {
            const hours = selectedTime.getHours().toString().padStart(2, '0');
            const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
            setFormData({ ...formData, time_out: `${hours}:${minutes}` });
        }
    };

    const submitPermissionRequest = async () => {
        if (!formData.name) {
            Alert.alert('Incomplete Form', 'Please enter your name first');
            return;
        }
        try {
            const res = await api.post('/requests', {
                project_code: project.code,
                user_name: formData.name,
                requested_date: restrictedDate,
                reason: formData.reason || 'Needed for log'
            });
            setPermissionRequestId(res.data.id);
            setPermissionStatus('pending');
            const interval = setInterval(() => checkRequestStatus(res.data.id), 3000);
            setCheckInterval(interval);
        } catch (err) {
            Alert.alert('Error', 'Failed to submit request');
        }
    };

    const checkRequestStatus = async (id) => {
        try {
            const res = await api.get(`/requests/${id}`);
            if (res.data.status === 'approved') {
                setPermissionStatus('approved');
                setShowPermissionModal(false);
                if (checkInterval) clearInterval(checkInterval);
            } else if (res.data.status === 'rejected') {
                setPermissionStatus('rejected');
                if (checkInterval) clearInterval(checkInterval);
            }
        } catch (err) {
            console.error('Polling error', err);
        }
    };

    useEffect(() => {
        return () => {
            if (checkInterval) clearInterval(checkInterval);
        };
    }, [checkInterval]);

    if (!project) return <ActivityIndicator style={{ flex: 1 }} />;

    if (success) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-6 text-center">
                <StyledView className="bg-cyan-100 p-6 rounded-full border border-cyan-200 shadow-sm mb-6">
                    <CheckCircle size={48} color="#0891b2" />
                </StyledView>
                <StyledText className="text-2xl font-bold text-gray-900 mb-2">Submission Successful</StyledText>
                <StyledText className="text-gray-500 mb-8 text-center px-4">Your daily log has been recorded securely in the Attendance System.</StyledText>
                <StyledTouchableOpacity
                    onPress={() => navigation.navigate('Landing')}
                    className="bg-cyan-600 py-4 px-12 rounded-2xl shadow-lg border-b-4 border-cyan-700"
                >
                    <StyledText className="text-white font-bold text-lg">Return to Home</StyledText>
                </StyledTouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <StyledView className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center justify-between">
                <StyledView className="flex-row items-center">
                    <StyledTouchableOpacity onPress={() => navigation.goBack()} className="p-2 mr-1">
                        <ArrowLeft size={20} color="#64748b" />
                    </StyledTouchableOpacity>
                    <StyledView>
                        <StyledText className="text-xs font-bold text-cyan-600 uppercase leading-none mb-1">{project.code}</StyledText>
                        <StyledText className="text-lg font-bold text-slate-900 leading-none" numberOfLines={1}>{project.name}</StyledText>
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

                    <StyledView className="flex-row bg-slate-100 p-1 rounded-xl mb-6">
                        {['Employee', 'Visitor'].map(type => (
                            <StyledTouchableOpacity
                                key={type}
                                onPress={() => setFormData({ ...formData, user_type: type })}
                                className={`flex-1 py-2 rounded-lg ${formData.user_type === type ? 'bg-white shadow-sm' : ''}`}
                            >
                                <StyledText className={`text-center font-bold ${formData.user_type === type ? 'text-slate-900' : 'text-slate-400'}`}>{type}</StyledText>
                            </StyledTouchableOpacity>
                        ))}
                    </StyledView>

                    <StyledView className="mb-4">
                        <StyledText className="text-sm font-medium text-slate-700 mb-2">Full Name *</StyledText>
                        <StyledView className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-cyan-500">
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
                        <StyledText className="text-sm font-medium text-slate-700 mb-2">Trade / Company *</StyledText>
                        <StyledView className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-cyan-500">
                            <Briefcase size={18} color="#94a3b8" />
                            <StyledTextInput
                                className="flex-1 ml-3 text-slate-900"
                                placeholder="Electrician / Acme Corp"
                                value={formData.trade}
                                onChangeText={(text) => setFormData({ ...formData, trade: text })}
                            />
                        </StyledView>
                        {fieldErrors.trade && <StyledText className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.trade}</StyledText>}
                    </StyledView>

                    <StyledView>
                        <StyledText className="text-sm font-medium text-slate-700 mb-2">Car Registration *</StyledText>
                        <StyledView className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-cyan-500">
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
                        <StyledText className="text-sm font-medium text-slate-700 mb-2">Date *</StyledText>
                        <StyledTouchableOpacity onPress={() => setShowDatePicker(true)}>
                            <StyledView className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                <Calendar size={18} color="#94a3b8" />
                                <StyledText className="flex-1 ml-3 text-slate-900">{formData.date || 'Select Date'}</StyledText>
                            </StyledView>
                        </StyledTouchableOpacity>
                        {fieldErrors.date && <StyledText className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.date}</StyledText>}
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
                            <StyledText className="text-sm font-medium text-slate-700 mb-2">Time In *</StyledText>
                            <StyledTouchableOpacity onPress={() => setShowTimeInPicker(true)}>
                                <StyledView className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                    <Clock size={16} color="#94a3b8" />
                                    <StyledText className="flex-1 ml-2 text-slate-900">{formData.time_in || '08:00'}</StyledText>
                                </StyledView>
                            </StyledTouchableOpacity>
                            {fieldErrors.time_in && <StyledText className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.time_in}</StyledText>}
                        </StyledView>

                        <StyledView className="flex-1">
                            <StyledText className="text-sm font-medium text-slate-700 mb-2">Time Out *</StyledText>
                            <StyledTouchableOpacity onPress={() => setShowTimeOutPicker(true)}>
                                <StyledView className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                    <Clock size={16} color="#94a3b8" />
                                    <StyledText className="flex-1 ml-2 text-slate-900">{formData.time_out || '17:00'}</StyledText>
                                </StyledView>
                            </StyledTouchableOpacity>
                            {fieldErrors.time_out && <StyledText className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.time_out}</StyledText>}
                        </StyledView>
                    </StyledView>

                    {showTimeInPicker && (
                        <DateTimePicker
                            value={new Date()}
                            mode="time"
                            is24Hour={true}
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleTimeInChange}
                        />
                    )}

                    {showTimeOutPicker && (
                        <DateTimePicker
                            value={new Date()}
                            mode="time"
                            is24Hour={true}
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleTimeOutChange}
                        />
                    )}

                    <StyledView className="bg-cyan-50 flex-row justify-between items-center p-4 rounded-xl border border-cyan-100 mb-4">
                        <StyledText className="text-cyan-700 font-bold">Total Duration</StyledText>
                        <StyledText className="text-xl font-bold text-cyan-900">{calculatedHours} hrs</StyledText>
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
                    className={`bg-cyan-600 py-5 rounded-2xl shadow-xl flex-row justify-center items-center mb-10 border-b-4 border-cyan-800 ${loading ? 'opacity-70' : ''}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <StyledText className="text-white font-bold text-xl">Submit Digital Log</StyledText>
                    )}
                </StyledTouchableOpacity>
            </StyledScrollView>

            {/* Permission Modal */}
            <Modal visible={showPermissionModal} transparent animationType="fade">
                <StyledView className="flex-1 bg-slate-900/80 justify-center p-6 backdrop-blur-sm">
                    <StyledView className="bg-white rounded-3xl p-8 items-center shadow-2xl">
                        <StyledView className="bg-cyan-100 p-5 rounded-full mb-4">
                            <Calendar size={48} color="#0891b2" />
                        </StyledView>
                        <StyledText className="text-2xl font-bold text-slate-900">Approval Required</StyledText>
                        <StyledText className="text-slate-500 text-center mt-3 text-base leading-relaxed">
                            Log for <StyledText className="font-bold text-slate-900">{restrictedDate}</StyledText> requires administrator approval to proceed.
                        </StyledText>

                        {!permissionStatus && (
                            <StyledView className="w-full mt-8">
                                <StyledTouchableOpacity
                                    onPress={submitPermissionRequest}
                                    className="bg-cyan-600 py-4 rounded-2xl shadow-lg shadow-cyan-200 border-b-2 border-cyan-700"
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
                                <ActivityIndicator color="#0891b2" size="large" />
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
