import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, AlertCircle } from 'lucide-react-native';
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

    const handleSubmit = async () => {
        if (!code) {
            setError('Project Code is required');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const trimmedCode = code.trim();
            // Using the new simplified endpoint that doesn't require a password
            const res = await api.post('/projects/verify-code', { code: trimmedCode });

            if (res.data.valid) {
                // Ensure no old codes are left saved
                await AsyncStorage.removeItem('savedProjectCode');
                await AsyncStorage.setItem('rememberMe', 'false');

                const projectData = { ...res.data.project, code: code };
                await AsyncStorage.setItem('currentProject', JSON.stringify(projectData));
                navigation.navigate('MobileForm');
            } else {
                setError(res.data.error || 'Invalid Project Code');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Connection Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <StyledView className="flex-1 justify-center items-center p-6">
                <StyledView className="w-full max-w-sm">
                    <StyledView className="items-center mb-8">
                        <StyledView className="bg-white p-1 rounded-full shadow-2xl border-4 border-white mb-4">
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
                                <StyledText className="text-xs font-bold uppercase tracking-widest text-cyan-600 mb-2 ml-1">Site Identifier</StyledText>
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
                                className={`w-full bg-cyan-600 py-5 rounded-2xl flex-row items-center justify-center gap-3 shadow-lg shadow-cyan-200 border-b-4 border-cyan-700 ${loading ? 'opacity-70' : ''}`}
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

                    <StyledView className="mt-12 items-center">
                        <StyledText className="text-[10px] text-slate-300 font-bold uppercase">Secure Enterprise Logistics</StyledText>
                    </StyledView>
                </StyledView>
            </StyledView>
        </SafeAreaView>
    );
};

export default LandingScreen;
