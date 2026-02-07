import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import MobileForm from './src/screens/MobileForm';
import AdminDashboard from './src/screens/AdminDashboard';
import ProjectDetails from './src/screens/ProjectDetails';
import GuardLogin from './src/screens/GuardLogin';
import GuardSignup from './src/screens/GuardSignup';
import GuardDashboard from './src/screens/GuardDashboard';
import { APP_CONFIG } from './src/config/env';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

const Navigation = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          user.role === 'admin' ? (
            // Admin Stack
            <Stack.Group>
              <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
              <Stack.Screen name="ProjectDetails" component={ProjectDetails} />
            </Stack.Group>
          ) : (
            // Guard Stack (When logged in as guard)
            <Stack.Group>
              <Stack.Screen name="GuardDashboard" component={GuardDashboard} />
            </Stack.Group>
          )
        ) : APP_CONFIG.APP_ROLE === 'worker' ? (
          // Worker-Only Stack (Public)
          <Stack.Group>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="MobileForm" component={MobileForm} />
          </Stack.Group>
        ) : (
          // Guard-Only Stack (Public/Initial)
          <Stack.Group>
            <Stack.Screen name="GuardLogin" component={GuardLogin} />
            <Stack.Screen name="GuardSignup" component={GuardSignup} />
            <Stack.Screen name="GuardDashboard" component={GuardDashboard} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
