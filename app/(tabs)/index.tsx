import { Image, StyleSheet, Platform } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/ordinem-logo.png')}
          style={styles.logo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">¡Bienvenido!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Paso 1: Pruébalo</ThemedText>
        <ThemedText>
          Edita <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> para ver los cambios.
          Presiona{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12'
            })}
          </ThemedText>{' '}
          para abrir las herramientas de desarrollo.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Paso 2: Explora</ThemedText>
        <ThemedText>
          Toca la pestaña Explorar para aprender más sobre lo que incluye esta aplicación.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Paso 3: Comienza desde cero</ThemedText>
        <ThemedText>
          Cuando estés listo, ejecuta{' '}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> para obtener un nuevo directorio{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText>. Esto moverá el{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> actual a{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  logo: {
    height: 200,
    width: 200,
    bottom: 0,
    left: 20,
    position: 'absolute',
    resizeMode: 'contain'
  },
});
