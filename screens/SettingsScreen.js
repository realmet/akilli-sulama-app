import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function SettingsScreen() {
    const { theme, isDark, toggleTheme } = useTheme();
    const { lang, toggleLang } = useLanguage();
    const [alan, setAlan] = useState('');

    const s = makeStyles(theme);
    const tr = lang === 'tr';

    useEffect(() => {
        AsyncStorage.getItem('tarla_settings').then(v => {
            if (v) {
                const p = JSON.parse(v);
                if (p.alan) setAlan(String(p.alan));
            }
        });
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            const existing = await AsyncStorage.getItem('tarla_settings');
            const parsed = existing ? JSON.parse(existing) : {};
            await AsyncStorage.setItem('tarla_settings', JSON.stringify({
                ...parsed,
                alan: parseFloat(alan) || null,
            }));
        }, 600);
        return () => clearTimeout(timer);
    }, [alan]);

    async function gecmisiTemizle() {
        Alert.alert(
            tr ? 'Geçmişi Temizle' : 'Clear History',
            tr ? 'Tüm analiz geçmişi silinecek. Emin misin?' : 'All analysis history will be deleted. Are you sure?',
            [
                { text: tr ? 'İptal' : 'Cancel', style: 'cancel' },
                {
                    text: tr ? 'Temizle' : 'Clear', style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem('analiz_gecmisi');
                        Alert.alert('✅', tr ? 'Geçmiş temizlendi.' : 'History cleared.');
                    }
                }
            ]
        );
    }

    return (
        <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

            {/* Dil Seçimi */}
            <Text style={s.sectionLabel}>🌐 {tr ? 'Dil Seçimi' : 'Language'}</Text>
            <View style={s.card}>
                <View style={s.optRow}>
                    <TouchableOpacity style={[s.optBtn, lang === 'tr' && s.optBtnActive(theme)]} onPress={() => lang !== 'tr' && toggleLang()}>
                        <Text style={s.optFlag}>🇹🇷</Text>
                        <Text style={[s.optLabel, lang === 'tr' && { color: '#fff' }]}>Türkçe</Text>
                        {lang === 'tr' && <View style={s.checkDot} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.optBtn, lang === 'en' && s.optBtnActive(theme)]} onPress={() => lang !== 'en' && toggleLang()}>
                        <Text style={s.optFlag}>🇬🇧</Text>
                        <Text style={[s.optLabel, lang === 'en' && { color: '#fff' }]}>English</Text>
                        {lang === 'en' && <View style={s.checkDot} />}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tema Seçimi */}
            <Text style={s.sectionLabel}>🎨 {tr ? 'Tema' : 'Theme'}</Text>
            <View style={s.card}>
                <View style={s.optRow}>
                    <TouchableOpacity style={[s.optBtn, !isDark && s.optBtnActive(theme)]} onPress={() => isDark && toggleTheme()}>
                        <Text style={s.optFlag}>☀️</Text>
                        <Text style={[s.optLabel, !isDark && { color: '#fff' }]}>{tr ? 'Aydınlık' : 'Light'}</Text>
                        {!isDark && <View style={s.checkDot} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.optBtn, isDark && s.optBtnActive(theme)]} onPress={() => !isDark && toggleTheme()}>
                        <Text style={s.optFlag}>🌙</Text>
                        <Text style={[s.optLabel, isDark && { color: '#fff' }]}>{tr ? 'Karanlık' : 'Dark'}</Text>
                        {isDark && <View style={s.checkDot} />}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tarla Alanı */}
            <Text style={s.sectionLabel}>🌾 {tr ? 'Tarla Alanı' : 'Field Area'}</Text>
            <View style={s.card}>
                <Text style={s.inputLabel}>{tr ? 'Alan (dekar)' : 'Area (decare)'}</Text>
                <TextInput
                    style={s.input}
                    value={alan}
                    onChangeText={setAlan}
                    keyboardType="numeric"
                    placeholder={tr ? 'örn: 5' : 'e.g: 5'}
                    placeholderTextColor={theme.textLight}
                />
                <Text style={s.hint}>
                    {tr
                        ? 'Girilirse sulama miktarı litre ve m³ olarak da gösterilir.'
                        : 'If entered, irrigation amount will also be shown in litres and m³.'}
                </Text>
            </View>

            {/* Geçmişi Temizle */}
            <Text style={s.sectionLabel}>🗑️ {tr ? 'Veri' : 'Data'}</Text>
            <View style={s.card}>
                <TouchableOpacity style={s.dangerBtn} onPress={gecmisiTemizle}>
                    <Text style={s.dangerBtnText}>🗑️ {tr ? 'Analiz Geçmişini Temizle' : 'Clear Analysis History'}</Text>
                </TouchableOpacity>
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
        optBtn: { flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: theme.border, padding: 16, alignItems: 'center', gap: 8, backgroundColor: theme.inputBg },
        optBtnActive: (theme) => ({ backgroundColor: theme.green, borderColor: theme.green }),
        optFlag: { fontSize: 28 },
        optLabel: { fontSize: 14, fontWeight: '500', color: theme.text },
        checkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', marginTop: 4 },
        inputLabel: { fontSize: 11, color: theme.textLight, marginBottom: 6 },
        input: { fontSize: 14, color: theme.text, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: theme.inputBg, borderRadius: 8 },
        hint: { fontSize: 11, color: theme.textSub, marginTop: 8, fontStyle: 'italic' },
        dangerBtn: { backgroundColor: '#ffebee', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ef9a9a' },
        dangerBtnText: { fontSize: 14, fontWeight: '500', color: '#c62828' },
    });
}
