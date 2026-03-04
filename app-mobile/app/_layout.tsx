// app-mobile/app/_layout.tsx
// Mobile app root layout

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

const API_BASE_URL = 'http://113.44.66.210:3000/api';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#ffffff',
          },
          headerTintColor: colorScheme === 'dark' ? '#ffffff' : '#0f172a',
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#ffffff',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="chapter/[bookId]/[chapter]" 
          options={{ 
            title: '阅读',
            presentation: 'card'
          }} 
        />
        <Stack.Screen 
          name="search" 
          options={{ 
            title: '搜索',
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            title: '设置',
            presentation: 'modal'
          }} 
        />
      </Stack>
    </>
  );
}
