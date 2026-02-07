import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, Modal, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, AlertCircle, MessageSquare, X, Send, Shield } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

const LandingScreen = ({ navigation }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Contact Modal State
    const [contactModalVisible, setContactModalVisible] = useState(false);
    const [contactEmail, setContactEmail] = useState('');
    const [contactQuery, setContactQuery] = useState('');
    const [contactLoading, setContactLoading] = useState(false);
    const [contactSuccess, setContactSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!code) {
            setError('Project Code is required');
            return;
        }

        setError('');
        setLoading(true);
        console.log('[LandingScreen] Submitting code:', code);

        try {
            const trimmedCode = code.trim();
            // Using the new simplified endpoint that doesn't require a password
            console.log('[LandingScreen] Calling API...');
            const res = await api.post('/projects/verify-code', { code: trimmedCode });
            console.log('[LandingScreen] API Success:', res.data);

            if (res.data.valid) {
                // Ensure no old codes are left saved
                await AsyncStorage.removeItem('savedProjectCode');
                await AsyncStorage.setItem('rememberMe', 'false');

                const projectData = { ...res.data.project, code: trimmedCode };
                await AsyncStorage.setItem('currentProject', JSON.stringify(projectData));
                navigation.navigate('MobileForm');
            } else {
                setError(res.data.error || 'Invalid Project Code');
            }
        } catch (err) {
            console.error('[LandingScreen] Error:', err);
            setError(err.response?.data?.error || 'Connection Error');
        } finally {
            console.log('[LandingScreen] Loading finished');
            setLoading(false);
        }
    };

    const handleContactSubmit = async () => {
        if (!contactEmail.trim() || !contactQuery.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setContactLoading(true);
        try {
            const res = await api.post('/contact', {
                email: contactEmail,
                query: contactQuery
            });

            if (res.status === 200) {
                setContactSuccess(true);
                setContactEmail('');
                setContactQuery('');
                setTimeout(() => {
                    setContactModalVisible(false);
                    setContactSuccess(false);
                }, 2000);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to send query. Please try again.');
        } finally {
            setContactLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <StyledView className="flex-1 justify-center items-center p-6">
                <StyledView className="w-full max-w-sm">
                    <StyledView className="items-center mb-8">
                        <StyledView className="mb-4">
                            <Image
                                source={require('../../assets/attendence_logo.png')}
                                style={{ width: 120, height: 120 }}
                                resizeMode="contain"
                            />
                        </StyledView>
                        <StyledText className="text-3xl font-extrabold text-slate-900 tracking-tight">Attendance Pro</StyledText>
                        <StyledText className="text-slate-500 mt-1 font-medium italic">Project Worker Access</StyledText>
                    </StyledView>

                    <StyledView className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                        <StyledText className="text-xl font-bold text-center mb-6 text-slate-800">Enter Project Code</StyledText>

                        <StyledView>
                            <StyledView className="mb-8">
                                <StyledText className="text-xs font-bold uppercase tracking-widest text-primary mb-2 ml-1">Site Identifier</StyledText>
                                <StyledTextInput
                                    placeholder="SITE-001"
                                    placeholderTextColor="#cbd5e1"
                                    className="w-full bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 text-slate-900 text-center font-bold uppercase text-lg"
                                    value={code}
                                    onChangeText={(text) => {
                                        setCode(text.toUpperCase());
                                        setError('');
                                    }}
                                    autoCapitalize="characters"
                                    autoFocus
                                />
                            </StyledView>

                            {error && (
                                <StyledView className="flex-row items-center bg-red-50 p-4 rounded-2xl border border-red-100 gap-3 mb-6">
                                    <AlertCircle size={20} color="#dc2626" />
                                    <StyledText className="text-red-700 font-bold text-sm flex-1">{error}</StyledText>
                                </StyledView>
                            )}

                            <StyledTouchableOpacity
                                onPress={handleSubmit}
                                disabled={loading}
                                className={`w-full bg-primary py-5 rounded-2xl flex-row items-center justify-center gap-3 shadow-lg shadow-cyan-200 border-b-4 border-secondary ${loading ? 'opacity-70' : ''}`}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <StyledText className="text-white font-bold text-xl tracking-wide uppercase">Enter Site</StyledText>
                                        <ArrowRight size={22} color="white" strokeWidth={3} />
                                    </View>
                                )}
                            </StyledTouchableOpacity>
                        </StyledView>
                    </StyledView>

                    <StyledView className="mt-8 items-center">
                        <TouchableOpacity onPress={() => setContactModalVisible(true)} className="mb-4 flex-row items-center gap-2 px-4 py-2">
                            <MessageSquare size={16} color="#00afca" />
                            <Text className="text-[#00afca] font-bold text-xs uppercase tracking-wider">Need Help? Contact Support</Text>
                        </TouchableOpacity>
                        <StyledText className="text-[10px] text-slate-300 font-bold uppercase">Secure Enterprise Logistics</StyledText>
                    </StyledView>
                </StyledView>
            </StyledView>

            {/* Contact Support Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={contactModalVisible}
                onRequestClose={() => setContactModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, minHeight: '60%' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>Contact Support</Text>
                                <TouchableOpacity onPress={() => setContactModalVisible(false)} style={{ padding: 5 }}>
                                    <X size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            {contactSuccess ? (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                                        <Send size={40} color="#16a34a" />
                                    </View>
                                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#166534', marginBottom: 10 }}>Message Sent!</Text>
                                    <Text style={{ textAlign: 'center', color: '#475569', lineHeight: 24 }}>
                                        We have received your query.{'\n'}Our support team will contact you shortly.
                                    </Text>
                                </View>
                            ) : (
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <Text style={{ color: '#64748b', marginBottom: 20 }}>
                                        Having trouble accessing your project? Send a query directly to the admin.
                                    </Text>

                                    <View style={{ marginBottom: 20 }}>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Your Email</Text>
                                        <TextInput
                                            value={contactEmail}
                                            onChangeText={setContactEmail}
                                            placeholder="Enter your email address"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16, color: '#0f172a' }}
                                        />
                                    </View>

                                    <View style={{ marginBottom: 30 }}>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Your Query</Text>
                                        <TextInput
                                            value={contactQuery}
                                            onChangeText={setContactQuery}
                                            placeholder="Describe your issue..."
                                            multiline
                                            numberOfLines={4}
                                            style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16, color: '#0f172a', height: 120, textAlignVertical: 'top' }}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleContactSubmit}
                                        disabled={contactLoading}
                                        style={{ backgroundColor: '#00afca', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: '#00afca', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 }}
                                    >
                                        {contactLoading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Send Query</Text>
                                                <Send size={20} color="#fff" />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

export default LandingScreen;
