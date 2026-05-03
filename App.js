import { TouchableOpacity, Text, View, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

import HomeScreen from './screens/HomeScreen';
import ForecastScreen from './screens/ForecastScreen';
import SettingsScreen from './screens/SettingsScreen';
import AboutScreen from './screens/AboutScreen';

const Tab = createBottomTabNavigator();

function LogoTitle() {
  const { isDark } = useTheme();
  return (
    <Image
      source={require('./assets/logo_sulama-Photoroom.png')}
      style={{ width: 130, height: 60, resizeMode: 'contain', tintColor: isDark ? '#ffffff' : undefined }}
    />
  );
}

function HeaderButtons() {
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLanguage();

  return (
    <View style={{ flexDirection: 'row', gap: 8, marginRight: 12, alignItems: 'center', marginTop: -12 }}>
      <TouchableOpacity
        onPress={toggleLang}
        style={{ flexDirection: 'row', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}
      >
        <Text style={{ fontSize: 18, opacity: lang === 'tr' ? 1 : 0.4 }}>🇹🇷</Text>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, alignSelf: 'center' }}>|</Text>
        <Text style={{ fontSize: 18, opacity: lang === 'en' ? 1 : 0.4 }}>🇬🇧</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={toggleTheme}
        style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 }}
      >
        <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function TabIcon({ name }) {
  const icons = { Home: '🏠', Forecast: '📅', Settings: '⚙️', About: 'ℹ️' };
  return <Text style={{ fontSize: 20 }}>{icons[name]}</Text>;
}

function AppNavigator() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: () => <TabIcon name={route.name} />,
          tabBarActiveTintColor: theme.green,
          tabBarInactiveTintColor: theme.textLight,
          tabBarStyle: {
            backgroundColor: theme.tabBar,
            borderTopColor: theme.tabBarBorder,
            paddingBottom: 6,
            height: 100,
            paddingBottom: 20,
          },
          tabBarLabelStyle: { fontSize: 11 },
          headerStyle: { backgroundColor: theme.header, height: 90 },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '500' },
          headerTitleContainerStyle: { marginTop: -12 },
          headerTitle: () => <LogoTitle />,
          headerRight: () => <HeaderButtons />,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t.homeTab }} />
        <Tab.Screen name="Forecast" component={ForecastScreen} options={{ tabBarLabel: t.forecastTab }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: t.settingsTab }} />
        <Tab.Screen name="About" component={AboutScreen} options={{ tabBarLabel: t.aboutTab }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppNavigator />
      </LanguageProvider>
    </ThemeProvider>
  );
}