import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6D9EBE" />
      </View>
    );
  }

  if (authenticated) {
    return <Redirect href="/(tabs)/products" />;
  }

  return <Redirect href="/Login" />;
}