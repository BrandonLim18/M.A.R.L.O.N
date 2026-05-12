import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen'; 
import MyBorrowingsScreen from './src/screens/MyBorrowingsScreen';
import BooksScreen from './src/screens/BooksScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        setUserToken(token);
      } catch (e) {
        console.error("Failed to fetch token", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkToken();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          // Unauthenticated Screens (Auth Stack)
          <>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} setToken={setUserToken} />}
            </Stack.Screen>
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          </>
        ) : (
          // Authenticated Screens (App Stack)
          <>
            <Stack.Screen name="Dashboard">
              {(props) => <DashboardScreen {...props} setToken={setUserToken} />}
            </Stack.Screen>
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="MyBorrowings" component={MyBorrowingsScreen} />
            <Stack.Screen name="Books" component={BooksScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}