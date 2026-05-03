import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function SettingsScreen() {
    const { theme, isDark, toggleTheme } = useTheme();
    const { lang, toggleLang } = useLanguage();

    const s = makeStyles(theme);

    return (
        <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

            {/* Dil Seçimi */}
            <Text style={s.sectionLabel}>🌐 {lang === 'tr' ? 'Dil Seçimi' : 'Language'}</Text>
            <View style={s.card}>
                <View style={s.optRow}>
                    <TouchableOpacity
                        style={[s.optBtn, lang === 'tr' && s.optBtnActive(theme)]}
                        onPress={() => lang !== 'tr' && toggleLang()}
                    >
                        <Text style={s.optFlag}>🇹🇷</Text>
                        <Text style={[s.optLabel, lang === 'tr' && { color: '#fff' }]}>Türkçe</Text>
                        {lang === 'tr' && <View style={s.checkDot} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.optBtn, lang === 'en' && s.optBtnActive(theme)]}
                        onPress={() => lang !== 'en' && toggleLang()}
                    >
                        <Text style={s.optFlag}>🇬🇧</Text>
                        <Text style={[s.optLabel, lang === 'en' && { color: '#fff' }]}>English</Text>
                        {lang === 'en' && <View style={s.checkDot} />}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tema Seçimi */}
            <Text style={s.sectionLabel}>🎨 {lang === 'tr' ? 'Tema' : 'Theme'}</Text>
            <View style={s.card}>
                <View style={s.optRow}>
                    <TouchableOpacity
                        style={[s.optBtn, !isDark && s.optBtnActive(theme)]}
                        onPress={() => isDark && toggleTheme()}
                    >
                        <Text style={s.optFlag}>☀️</Text>
                        <Text style={[s.optLabel, !isDark && { color: '#fff' }]}>{lang === 'tr' ? 'Aydınlık' : 'Light'}</Text>
                        {!isDark && <View style={s.checkDot} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.optBtn, isDark && s.optBtnActive(theme)]}
                        onPress={() => !isDark && toggleTheme()}
                    >
                        <Text style={s.optFlag}>🌙</Text>
                        <Text style={[s.optLabel, isDark && { color: '#fff' }]}>{lang === 'tr' ? 'Karanlık' : 'Dark'}</Text>
                        {isDark && <View style={s.checkDot} />}
                    </TouchableOpacity>
                </View>
            </View>

        </ScrollView>
    );
}

function makeStyles(theme) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.bg },
        sectionLabel: { fontSize: 12, fontWeight: '500', color: theme.textSub, marginBottom: 8, marginTop: 4 },
        card: { backgroundColor: theme.card, borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 0.5, borderColor: theme.border, elevation: 2 },
        optRow: { flexDirection: 'row', gap: 12 },
        optBtn: {
            flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: theme.border,
            padding: 16, alignItems: 'center', gap: 8, backgroundColor: theme.inputBg,
        },
        optBtnActive: (theme) => ({
            backgroundColor: theme.green,
            borderColor: theme.green,
        }),
        optFlag: { fontSize: 28 },
        optLabel: { fontSize: 14, fontWeight: '500', color: theme.text },
        checkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', marginTop: 4 },
    });
}
