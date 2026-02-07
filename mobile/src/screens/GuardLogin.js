import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

const GuardLogin = ({ navigation }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadSavedCredentials();
    }, []);

    const loadSavedCredentials = async () => {
        try {
            const savedEmail = await AsyncStorage.getItem('guard_remember_email');
            if (savedEmail) {
                setEmail(savedEmail);
                setRememberMe(true);
            }
        } catch (error) {
            console.error('Failed to load saved credentials', error);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        const cleanEmail = email.trim().toLowerCase();
        const result = await login(cleanEmail, password, 'guard');

        if (result.success) {
            // Save or clear credentials based on Remember Me
            if (rememberMe) {
                await AsyncStorage.setItem('guard_remember_email', cleanEmail);
            } else {
                await AsyncStorage.removeItem('guard_remember_email');
            }
            navigation.navigate('GuardDashboard');
        } else {
            setError(result.message || 'Login failed');
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <StyledView className="flex-1 px-6 justify-center">

                <StyledView className="items-center mb-10">
                    <Image
                        source={require('../../assets/attendence_logo.png')}
                        style={{ width: 100, height: 100, marginBottom: 20 }}
                    />
                    <StyledText className="text-3xl font-bold text-slate-900">Guard Portal</StyledText>
                    <StyledText className="text-slate-500 mt-1">Tripod Services Security</StyledText>
                </StyledView>

                <StyledView className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                    <StyledView className="mb-5">
                        <StyledText className="text-sm font-bold text-slate-700 mb-2 ml-1">Email Address</StyledText>
                        <StyledView className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                            <Mail size={18} color="#94a3b8" />
                            <StyledTextInput
                                className="flex-1 ml-3 text-slate-900"
                                placeholder="guard@tripod.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </StyledView>
                    </StyledView>

                    <StyledView className="mb-8">
                        <StyledText className="text-sm font-bold text-slate-700 mb-2 ml-1">Password</StyledText>
                        <StyledView className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                            <Lock size={18} color="#94a3b8" />
                            <StyledTextInput
                                className="flex-1 ml-3 text-slate-900"
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                                {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                            </TouchableOpacity>
                        </StyledView>
                    </StyledView>

                    {/* Remember Me Checkbox */}
                    <StyledTouchableOpacity
                        onPress={() => setRememberMe(!rememberMe)}
                        className="flex-row items-center mb-6"
                    >
                        <StyledView className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${rememberMe ? 'bg-primary border-primary' : 'border-slate-300 bg-white'
                            }`}>
                            {rememberMe && (
                                <StyledText className="text-white text-xs font-bold">✓</StyledText>
                            )}
                        </StyledView>
                        <StyledText className="text-slate-600 text-sm font-medium">
                            Remember me
                        </StyledText>
                    </StyledTouchableOpacity>

                    {error ? <StyledText className="text-red-500 text-sm mb-4 text-center font-medium">{error}</StyledText> : null}

                    <StyledTouchableOpacity
                        onPress={handleLogin}
                        disabled={loading}
                        className={`bg-primary py-4 rounded-2xl shadow-lg border-b-4 border-secondary flex-row justify-center items-center ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <StyledText className="text-white font-bold text-lg">Login Access</StyledText>}
                    </StyledTouchableOpacity>

                    <StyledTouchableOpacity
                        onPress={() => navigation.navigate('GuardSignup')}
                        className="mt-6"
                    >
                        <StyledText className="text-center text-slate-500 font-medium">
                            Need an account? <StyledText className="text-primary font-bold">Sign Up</StyledText>
                        </StyledText>
                    </StyledTouchableOpacity>
                </StyledView>
            </StyledView>
        </SafeAreaView>
    );
};

export default GuardLogin;
