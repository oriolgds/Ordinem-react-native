import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

interface FirebaseProviderProps {
  children: React.ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Import Firebase services dynamically to avoid early initialization
        await import('@/services/firebase');
        setFirebaseInitialized(true);
      } catch (error) {
        console.error('Error initializing Firebase:', error);
        // Still set as initialized to prevent infinite loading
        setFirebaseInitialized(true);
      }
    };

    initializeFirebase();
  }, []);

  if (!firebaseInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6D9EBE" />
      </View>
    );
  }

  return <>{children}</>;
};