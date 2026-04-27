import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function AboutScreen() {
    const { theme } = useTheme();
    const { t, lang } = useLanguage();
    const s = makeStyles(theme);

    return (
        <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

            {/* Logo */}
            <View style={s.logoCard}>
                <Text style={s.logoIcon}>🌱</Text>
                <Text style={s.logoTitle}>{t.appName}</Text>
                <Text style={s.logoSub}>AI Destekli Hassas Tarım / AI-Powered Precision Agriculture</Text>
            </View>

            {/* Proje */}
            <Text style={s.sectionLabel}>{t.project}</Text>
            <View style={s.card}>
                <View style={s.infoRow}>
                    <Text style={s.infoIcon}>🏛</Text>
                    <View style={s.infoText}>
                        <Text style={s.infoTitle}>TÜBİTAK 2209-A</Text>
                        <Text style={s.infoSub}>{t.tubitakDesc}</Text>
                    </View>
                </View>
                <View style={s.divider} />
                <View style={s.infoRow}>
                    <Text style={s.infoIcon}>🎓</Text>
                    <View style={s.infoText}>
                        <Text style={s.infoTitle}>Ostim Teknik Üniversitesi</Text>
                        <Text style={s.infoSub}>{t.academicYear}</Text>
                    </View>
                </View>
            </View>

            {/* Takım */}
            <Text style={s.sectionLabel}>{t.projectTeam}</Text>
            <View style={s.card}>

                {/* Proje Sahibi */}
                <View style={s.infoRow}>
                    <View style={[s.avatar, { backgroundColor: '#1a5c35' }]}>
                        <Text style={s.avatarText}>EY</Text>
                    </View>
                    <View style={s.infoText}>
                        <Text style={s.infoTitle}>Esmanur Yorulmaz</Text>
                        <Text style={s.infoSub}>{t.projectOwner}</Text>
                        <View style={s.badge}>
                            <Text style={s.badgeText}>👑 {t.leader} · 📱 {t.mobilePlatform}</Text>
                        </View>
                    </View>
                </View>

                <View style={s.divider} />

                {/* Takım Üyesi 1 */}
                <View style={s.infoRow}>
                    <View style={[s.avatar, { backgroundColor: '#2e7d32' }]}>
                        <Text style={s.avatarText}>İF</Text>
                    </View>
                    <View style={s.infoText}>
                        <Text style={s.infoTitle}>İsmet Faruk Özdemir</Text>
                        <Text style={s.infoSub}>{t.teamMember}</Text>
                        <View style={[s.badge, { backgroundColor: '#e3f2fd' }]}>
                            <Text style={[s.badgeText, { color: '#1565c0' }]}>🤖 AI, Model & Hardware</Text>
                        </View>
                    </View>
                </View>

                <View style={s.divider} />

                {/* Takım Üyesi 2 */}
                <View style={s.infoRow}>
                    <View style={[s.avatar, { backgroundColor: '#388e3c' }]}>
                        <Text style={s.avatarText}>NN</Text>
                    </View>
                    <View style={s.infoText}>
                        <Text style={s.infoTitle}>Nazife Naz Coşkun</Text>
                        <Text style={s.infoSub}>{t.teamMember}</Text>
                        <View style={[s.badge, { backgroundColor: '#fce4ec' }]}>
                            <Text style={[s.badgeText, { color: '#c62828' }]}>🔧 Web Application</Text>
                        </View>
                    </View>
                </View>

                <View style={s.divider} />

                {/* Danışman */}
                <View style={s.infoRow}>
                    <View style={[s.avatar, { backgroundColor: '#455a64' }]}>
                        <Text style={s.avatarText}>NG</Text>
                    </View>
                    <View style={s.infoText}>
                        <Text style={s.infoTitle}>Dr. Niayesh Gharaei</Text>
                        <Text style={s.infoSub}>{t.academicAdvisor}</Text>
                        <View style={[s.badge, { backgroundColor: '#f3e5f5' }]}>
                            <Text style={[s.badgeText, { color: '#6a1b9a' }]}>🎓 {t.academicAdvisor}</Text>
                        </View>
                    </View>
                </View>

            </View>

            {/* Model Performansı */}
            <Text style={s.sectionLabel}>{t.modelPerf}</Text>
            <View style={s.statGrid}>
                <View style={s.statCard}>
                    <Text style={s.statValue}>0.92+</Text>
                    <Text style={s.statLabel}>{t.rSquare}</Text>
                </View>
                <View style={s.statCard}>
                    <Text style={s.statValue}>LSTM</Text>
                    <Text style={s.statLabel}>{t.modelType}</Text>
                </View>
                <View style={s.statCard}>
                    <Text style={s.statValue}>%30-50</Text>
                    <Text style={s.statLabel}>{t.waterSaving}</Text>
                </View>
                <View style={s.statCard}>
                    <Text style={s.statValue}>%15-25</Text>
                    <Text style={s.statLabel}>{t.yieldIncrease}</Text>
                </View>
            </View>

            {/* Teknik Detaylar */}
            <Text style={s.sectionLabel}>{t.techDetails}</Text>
            <View style={s.card}>
                <View style={s.techRow}>
                    <Text style={s.techKey}>{t.aiAlgo}</Text>
                    <Text style={s.techVal}>Hybrid LSTM</Text>
                </View>
                <View style={s.divider} />
                <View style={s.techRow}>
                    <Text style={s.techKey}>{t.dataSource}</Text>
                    <Text style={s.techVal}>AquaCrop 7.0 + Sensor</Text>
                </View>
                <View style={s.divider} />
                <View style={s.techRow}>
                    <Text style={s.techKey}>{t.connection}</Text>
                    <Text style={s.techVal}>LoRaWAN</Text>
                </View>
                <View style={s.divider} />
                <View style={s.techRow}>
                    <Text style={s.techKey}>{t.workMode}</Text>
                    <Text style={s.techVal}>{t.onlineOffline}</Text>
                </View>
                <View style={s.divider} />
                <View style={s.techRow}>
                    <Text style={s.techKey}>{t.mobilePlatform}</Text>
                    <Text style={s.techVal}>React Native (Expo)</Text>
                </View>
            </View>

            {/* Kullanılan Teknolojiler */}
            <Text style={s.sectionLabel}>{t.techDetails} — Stack</Text>
            <View style={s.card}>
                <View style={s.techRow}>
                    <Text style={s.techKey}>Framework</Text>
                    <Text style={s.techVal}>React Native + Expo</Text>
                </View>
                <View style={s.divider} />
                <View style={s.techRow}>
                    <Text style={s.techKey}>{lang === 'tr' ? 'Navigasyon' : 'Navigation'}</Text>
                    <Text style={s.techVal}>React Navigation</Text>
                </View>
                <View style={s.divider} />
                <View style={s.techRow}>
                    <Text style={s.techKey}>{lang === 'tr' ? 'Yerel Depolama' : 'Local Storage'}</Text>
                    <Text style={s.techVal}>AsyncStorage</Text>
                </View>
                <View style={s.divider} />
                <View style={s.techRow}>
                    <Text style={s.techKey}>{lang === 'tr' ? 'Global Durum' : 'Global State'}</Text>
                    <Text style={s.techVal}>React Context API</Text>
                </View>
                <View style={s.divider} />
                <View style={s.techRow}>
                    <Text style={s.techKey}>AI Backend</Text>
                    <Text style={s.techVal}>Python + LSTM Model</Text>
                </View>
            </View>

            {/* Amaç */}
            <Text style={s.sectionLabel}>{t.purpose}</Text>
            <View style={s.infoBox}>
                <Text style={s.infoBoxText}>{t.purposeText}</Text>
            </View>

        </ScrollView>
    );
}

function makeStyles(theme) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.bg },
        logoCard: { backgroundColor: theme.header, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
        logoIcon: { fontSize: 48, marginBottom: 8 },
        logoTitle: { fontSize: 20, fontWeight: '500', color: '#fff', marginBottom: 4 },
        logoSub: { fontSize: 12, color: '#a8d5b5', textAlign: 'center' },
        sectionLabel: { fontSize: 12, fontWeight: '500', color: theme.textSub, marginBottom: 8, marginTop: 4 },
        card: { backgroundColor: theme.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: theme.border, elevation: 2 },
        infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
        infoIcon: { fontSize: 22, width: 32, textAlign: 'center' },
        avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
        avatarText: { fontSize: 14, fontWeight: '500', color: '#fff' },
        infoText: { flex: 1 },
        infoTitle: { fontSize: 14, fontWeight: '500', color: theme.text },
        infoSub: { fontSize: 11, color: theme.textSub, marginTop: 2 },
        badge: { marginTop: 4, backgroundColor: '#e8f5e9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
        badgeText: { fontSize: 11, color: '#1a5c35', fontWeight: '500' },
        divider: { height: 0.5, backgroundColor: theme.border, marginVertical: 10 },
        statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
        statCard: { width: '47%', flex: 1, backgroundColor: theme.card, borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: theme.border, alignItems: 'center', elevation: 2 },
        statValue: { fontSize: 20, fontWeight: '500', color: theme.green, marginBottom: 4 },
        statLabel: { fontSize: 11, color: theme.textSub },
        techRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
        techKey: { fontSize: 12, color: theme.textSub },
        techVal: { fontSize: 12, fontWeight: '500', color: theme.text },
        infoBox: { backgroundColor: theme.greenLight, borderRadius: 12, padding: 14 },
        infoBoxText: { fontSize: 13, color: theme.greenText, lineHeight: 20 },
    });
}