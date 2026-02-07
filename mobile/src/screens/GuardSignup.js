import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, ArrowLeft, Mail, Lock, User, Briefcase, Eye, EyeOff } from 'lucide-react-native';
import api from '../services/api';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

const GuardSignup = ({ navigation }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async () => {
        const { name, email, password, confirmPassword } = formData;
        if (!name || !email || !password || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        const cleanEmail = email.trim().toLowerCase();
        const cleanName = name.trim();

        try {
            await api.post('/guards/signup', { name: cleanName, email: cleanEmail, password });
            Alert.alert('Success', 'Account created! You can now login.', [
                { text: 'OK', onPress: () => navigation.navigate('GuardLogin') }
            ]);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <StyledView className="flex-1 px-6">
                <StyledTouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="mt-6 p-2 bg-white rounded-full self-start shadow-sm"
                >
                    <ArrowLeft size={24} color="#475569" />
                </StyledTouchableOpacity>

                <StyledScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    <StyledView className="items-center my-8">
                        <Image
                            source={require('../../assets/attendence_logo.png')}
                            style={{ width: 100, height: 100, marginBottom: 15 }}
                        />
                        <StyledText className="text-2xl font-bold text-slate-900">Security Registration</StyledText>
                        <StyledText className="text-slate-500 mt-1">Join the site security team</StyledText>
                    </StyledView>

                    <StyledView className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                        <StyledView className="mb-4">
                            <StyledText className="text-sm font-bold text-slate-700 mb-1 ml-1">Full Name</StyledText>
                            <StyledView className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                <User size={18} color="#94a3b8" />
                                <StyledTextInput
                                    className="flex-1 ml-3 text-slate-900"
                                    placeholder="Officer Name"
                                    value={formData.name}
                                    onChangeText={(val) => setFormData({ ...formData, name: val })}
                                />
                            </StyledView>
                        </StyledView>

                        <StyledView className="mb-4">
                            <StyledText className="text-sm font-bold text-slate-700 mb-1 ml-1">Work Email</StyledText>
                            <StyledView className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                <Mail size={18} color="#94a3b8" />
                                <StyledTextInput
                                    className="flex-1 ml-3 text-slate-900"
                                    placeholder="email@tripod.com"
                                    value={formData.email}
                                    onChangeText={(val) => setFormData({ ...formData, email: val })}
                                    autoCapitalize="none"
                                />
                            </StyledView>
                        </StyledView>

                        <StyledView className="mb-4">
                            <StyledText className="text-sm font-bold text-slate-700 mb-1 ml-1">Password</StyledText>
                            <StyledView className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                <Lock size={18} color="#94a3b8" />
                                <StyledTextInput
                                    className="flex-1 ml-3 text-slate-900"
                                    placeholder="••••••••"
                                    secureTextEntry={!showPassword}
                                    value={formData.password}
                                    onChangeText={(val) => setFormData({ ...formData, password: val })}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                                    {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                                </TouchableOpacity>
                            </StyledView>
                        </StyledView>

                        <StyledView className="mb-6">
                            <StyledText className="text-sm font-bold text-slate-700 mb-1 ml-1">Confirm Password</StyledText>
                            <StyledView className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                <Lock size={18} color="#94a3b8" />
                                <StyledTextInput
                                    className="flex-1 ml-3 text-slate-900"
                                    placeholder="••••••••"
                                    secureTextEntry={!showConfirmPassword}
                                    value={formData.confirmPassword}
                                    onChangeText={(val) => setFormData({ ...formData, confirmPassword: val })}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-1">
                                    {showConfirmPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                                </TouchableOpacity>
                            </StyledView>
                        </StyledView>

                        {error ? <StyledText className="text-red-500 text-sm mb-4 text-center font-medium">{error}</StyledText> : null}

                        <StyledTouchableOpacity
                            onPress={handleSignup}
                            disabled={loading}
                            className={`bg-primary py-4 rounded-2xl shadow-lg border-b-4 border-secondary flex-row justify-center items-center ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <StyledText className="text-white font-bold text-lg">Create Guard Account</StyledText>}
                        </StyledTouchableOpacity>
                    </StyledView>
                </StyledScrollView>
            </StyledView>
        </SafeAreaView>
    );
};

export default GuardSignup;
