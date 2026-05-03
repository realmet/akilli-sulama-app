import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, StyleSheet, Alert, Switch,
    TextInput, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFocusEffect } from '@react-navigation/native';

const API = 'https://web-production-2b8d.up.railway.app';

export default function HomeScreen() {
    const { theme } = useTheme();
    const { t, lang } = useLanguage();

    // Analiz & API state
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [apiStatus, setApiStatus] = useState('checking');
    const [manualIrrigation, setManualIrrigation] = useState(false);
    const [irrigationLoading, setIrrigationLoading] = useState(false);

    // Konum & mod state
    const [lat, setLat] = useState('39.9167');
    const [lon, setLon] = useState('32.8333');
    const [mod, setMod] = useState('sensorsuz');
    const [wr, setWr] = useState('95.0');
    const [rain, setRain] = useState('5.0');
    const [locationName, setLocationName] = useState('');
    const [locationLoading, setLocationLoading] = useState(false);
    const [sensorFetching, setSensorFetching] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [tempCoords, setTempCoords] = useState(null);

    // --- Ağ dinleyici ---
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            if (state.isConnected) {
                syncOfflineData();
                checkApi();
            }
        });
        return () => unsubscribe();
    }, []);

    // --- İlk yükleme ---
    useEffect(() => { loadSettings(); }, []);

    // --- Konum adı (reverse geocode) ---
    useEffect(() => {
        const latNum = Number(lat);
        const lonNum = Number(lon);
        if (isNaN(latNum) || isNaN(lonNum) || !lat || !lon) { setLocationName(''); return; }
        const controller = new AbortController();
        setLocationLoading(true);
        fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latNum}&longitude=${lonNum}&localityLanguage=${lang}`,
            { signal: controller.signal }
        )
            .then(r => r.json())
            .then(data => {
                const parts = [data.city || data.locality, data.principalSubdivision, data.countryName].filter(Boolean);
                setLocationName(parts.join(', '));
            })
            .catch(() => setLocationName(''))
            .finally(() => { if (!controller.signal.aborted) setLocationLoading(false); });
        return () => controller.abort();
    }, [lat, lon, lang]);

    // --- Otomatik kaydetme ---
    useEffect(() => {
        const timer = setTimeout(async () => {
            const settings = {
                lat: parseFloat(lat) || 39.9167,
                lon: parseFloat(lon) || 32.8333,
                mod,
                wr: parseFloat(wr) || 95.0,
                rain: parseFloat(rain) || 5.0,
                cityName: locationName,
            };
            await AsyncStorage.setItem('tarla_settings', JSON.stringify(settings));
        }, 600);
        return () => clearTimeout(timer);
    }, [lat, lon, mod, wr, rain, locationName]);

    // --- Ekrana odaklanınca API kontrol ---
    useFocusEffect(
        useCallback(() => { checkApi(); }, [])
    );

    async function loadSettings() {
        try {
            const s = await AsyncStorage.getItem('tarla_settings');
            if (s) {
                const p = JSON.parse(s);
                setLat(String(p.lat));
                setLon(String(p.lon));
                setMod(p.mod);
                setWr(String(p.wr ?? '95.0'));
                setRain(String(p.rain ?? '5.0'));
            }
        } catch (_) {}
    }

    async function checkApi() {
        setApiStatus('checking');
        try {
            const res = await fetch(`${API}/health`);
            const data = await res.json();
            setApiStatus(data.status === 'ok' ? 'online' : 'offline');
        } catch (_) { setApiStatus('offline'); }
        try {
            const res = await fetch(`${API}/irrigation/control`);
            if (res.ok) {
                const data = await res.json();
                setManualIrrigation(data.manual_on);
            }
        } catch (_) {}
    }

    async function getGpsLocation() {
        try {
            const Location = await import('expo-location');
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t.errorTitle, lang === 'tr' ? 'Konum izni verilmedi!' : 'Location permission denied!');
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            setLat(location.coords.latitude.toFixed(4));
            setLon(location.coords.longitude.toFixed(4));
        } catch (_) {
            Alert.alert(t.errorTitle, lang === 'tr' ? 'Konum alınamadı!' : 'Could not get location!');
        }
    }

    async function fetchFromSensor() {
        setSensorFetching(true);
        try {
            const res = await fetch(`${API}/sensor-data/latest`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            if (!data.connected) {
                Alert.alert('⚠️ ESP32 Bağlı Değil', `Son okuma 1 saatten eski (${new Date(data.timestamp).toLocaleTimeString('tr-TR')}). Wr değerini manuel girin.`);
            } else {
                setWr(String(data.wr.toFixed(1)));
                const ts = new Date(data.timestamp).toLocaleTimeString('tr-TR');
                Alert.alert('✅ Sensör Verisi Alındı', `Wr: ${data.wr.toFixed(1)} mm\nSıcaklık: ${data.temperature ?? '-'}°C\nNem: ${data.humidity ?? '-'}%\nSon okuma: ${ts}`);
            }
        } catch (_) {
            Alert.alert('⚠️ ESP32 Bağlı Değil', 'Sensörden veri alınamadı. ESP32 çalışıyor mu?');
        }
        setSensorFetching(false);
    }

    function confirmMapLocation() {
        if (tempCoords) {
            setLat(tempCoords.lat.toFixed(4));
            setLon(tempCoords.lon.toFixed(4));
        }
        setShowMap(false);
    }

    async function saveToOfflineQueue(url, body) {
        try {
            const existing = await AsyncStorage.getItem('offlineQueue');
            let queue = existing ? JSON.parse(existing) : [];
            queue.push({ url, body, timestamp: new Date().toISOString() });
            await AsyncStorage.setItem('offlineQueue', JSON.stringify(queue));
        } catch (_) {}
    }

    async function syncOfflineData() {
        try {
            const existing = await AsyncStorage.getItem('offlineQueue');
            if (existing) {
                const queue = JSON.parse(existing);
                if (queue.length > 0) {
                    for (const item of queue) {
                        await fetch(item.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item.body) });
                    }
                    await AsyncStorage.removeItem('offlineQueue');
                    Alert.alert('Senkronizasyon Başarılı', 'Çevrimdışıyken alınan kararlar sisteme aktarıldı!');
                }
            }
        } catch (_) {}
    }

    async function toggleManualIrrigation(value) {
        if (value === true) {
            try {
                const sdRes = await fetch(`${API}/sensor-data/latest`);
                if (sdRes.ok) {
                    const sdData = await sdRes.json();
                    if (!sdData.connected) {
                        Alert.alert('⚠️ ESP32 Bağlı Değil', 'Manuel sulama açılamaz. ESP32 bağlantısı yok.');
                        return;
                    }
                } else {
                    Alert.alert('⚠️ ESP32 Bağlı Değil', 'Manuel sulama açılamaz. Sensörden veri alınamadı.');
                    return;
                }
            } catch (_) {
                Alert.alert('⚠️ ESP32 Bağlı Değil', 'Manuel sulama açılamaz. Sensöre ulaşılamıyor.');
                return;
            }
        }
        setIrrigationLoading(true);
        try {
            const res = await fetch(`${API}/irrigation/control`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ manual_on: value }),
            });
            if (res.ok) setManualIrrigation(value);
            else Alert.alert('Hata', 'Sulama komutu gönderilemedi.');
        } catch (_) {
            Alert.alert('Hata', "API'ye bağlanılamıyor.");
        }
        setIrrigationLoading(false);
    }

    async function analizeEt() {
        const latNum = parseFloat(lat) || 39.9167;
        const lonNum = parseFloat(lon) || 32.8333;
        const wrNum  = parseFloat(wr) || 95.0;
        const rainNum = parseFloat(rain) || 0;

        setLoading(true);
        setResult(null);

        let wrValue = wrNum;

        if (mod === 'sensorlu') {
            try {
                const sdRes = await fetch(`${API}/sensor-data/latest`);
                if (sdRes.ok) {
                    const sdData = await sdRes.json();
                    if (sdData.connected) {
                        wrValue = sdData.wr;
                    } else {
                        setLoading(false);
                        Alert.alert('⚠️ ESP32 Bağlı Değil', 'Son sensör verisi 1 saatten eski. Wr değerini manuel girin veya Sensörsüz moda geçin.', [{ text: 'Tamam' }]);
                        return;
                    }
                } else {
                    setLoading(false);
                    Alert.alert('⚠️ ESP32 Bağlı Değil', 'Sensörden veri alınamadı.', [{ text: 'Tamam' }]);
                    return;
                }
            } catch (_) {
                setLoading(false);
                Alert.alert('⚠️ ESP32 Bağlı Değil', 'Sensöre ulaşılamadı.', [{ text: 'Tamam' }]);
                return;
            }
        }

        const url = mod === 'sensorsuz' ? `${API}/predict/no-sensor` : `${API}/predict/sensor`;
        const body = mod === 'sensorsuz'
            ? { location: { lat: latNum, lon: lonNum } }
            : { wr_current: wrValue, location: { lat: latNum, lon: lonNum }, rain_next_3days: rainNum };

        try {
            const netInfo = await NetInfo.fetch();
            if (netInfo.isConnected) {
                const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                setResult(await res.json());
            } else {
                uretOfflineKarar(url, body, wrNum);
            }
        } catch (_) {
            uretOfflineKarar(url, body, wrNum);
        }
        setLoading(false);
    }

    function uretOfflineKarar(url, body, wrNum) {
        saveToOfflineQueue(url, body);
        const isSoilDry = wrNum < 40;
        setResult({
            irrigate_now: isSoilDry,
            amount_mm: isSoilDry ? 15 : 0,
            stress_detected: isSoilDry,
            message: '⚠️ ÇEVRİMDIŞI MOD: Yapay zekaya ulaşılamıyor. Yerel acil durum kuralları işletildi.',
            wr_current: wrNum,
            temp_max: null,
            rain_next_3days: parseFloat(rain) || 0,
            stress_level: isSoilDry ? 'Riskli (Çevrimdışı)' : 'Normal (Çevrimdışı)',
            vpd: null,
            wr_forecast: null,
        });
    }

    function getBanner() {
        if (!result) return null;
        if (result.irrigate_now) {
            return { bg: '#e8f4fd', border: '#2196F3', icon: '💧', title: t.irrigateNow || 'Şimdi Sula', sub: `${result.amount_mm} ${t.mmAmount || 'mm'}`, iconBg: '#2196F3' };
        } else if (result.stress_detected) {
            return { bg: '#fffbea', border: '#F59E0B', icon: '⚠️', title: t.stressRisk || 'Risk Tespit Edildi', sub: result.days_until_stress ? `${result.days_until_stress} ${t.daysUntilStress}` : t.stressSoon || 'Acil Müdahale', iconBg: '#F59E0B' };
        } else {
            return { bg: theme.greenLight, border: theme.green, icon: '✅', title: t.allGood || 'Her Şey Yolunda', sub: t.allGoodSub || 'Sulama gerekmiyor', iconBg: theme.green };
        }
    }

    const banner = getBanner();
    const s = makeStyles(theme);

    function ApiStatusBadge() {
        const color = apiStatus === 'online' ? '#4caf50' : apiStatus === 'offline' ? '#f44336' : '#FF9800';
        const label = apiStatus === 'online' ? (t.apiOnline || 'API Bağlı') : apiStatus === 'offline' ? (t.apiOffline || 'API Bağlı Değil') : (t.apiChecking || 'Kontrol ediliyor...');
        return (
            <TouchableOpacity onPress={checkApi} style={s.apiBadge}>
                <View style={[s.apiDot, { backgroundColor: color }]} />
                <Text style={[s.apiLabel, { color }]}>{label}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

            {/* Offline Banner */}
            {apiStatus === 'offline' && (
                <View style={s.offlineBanner}>
                    <Text style={s.offlineBannerText}>📵 Offline Mode — Yerel kurallar aktif</Text>
                </View>
            )}

            <ApiStatusBadge />

            {/* Konum Kartı */}
            <Text style={s.sectionLabel}>{t.manualCoords || '📍 Konum'}</Text>
            <View style={s.card}>
                <Text style={s.inputLabel}>{t.lat}</Text>
                <TextInput
                    style={s.input}
                    value={lat}
                    onChangeText={setLat}
                    keyboardType="numeric"
                    placeholder={t.latPlaceholder}
                    placeholderTextColor={theme.textLight}
                />
                <View style={s.divider} />
                <Text style={s.inputLabel}>{t.lon}</Text>
                <TextInput
                    style={s.input}
                    value={lon}
                    onChangeText={setLon}
                    keyboardType="numeric"
                    placeholder={t.lonPlaceholder}
                    placeholderTextColor={theme.textLight}
                />
                {locationLoading && (
                    <View style={s.locationBox}>
                        <Text style={s.locationIcon}>🔍</Text>
                        <Text style={s.locationLoading}>{lang === 'tr' ? 'Konum adı çözümleniyor...' : 'Resolving location name...'}</Text>
                    </View>
                )}
                {!locationLoading && locationName !== '' && (
                    <View style={s.locationBox}>
                        <Text style={s.locationIcon}>📍</Text>
                        <View>
                            <Text style={s.locationName}>{locationName}</Text>
                            <Text style={s.locationSub}>{lat}, {lon}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* GPS + Harita */}
            <View style={s.btnRow}>
                <TouchableOpacity style={[s.iconBtn, { borderColor: '#2196F3' }]} onPress={getGpsLocation}>
                    <Text style={{ fontSize: 16 }}>📡</Text>
                    <Text style={[s.iconBtnText, { color: '#2196F3' }]}>{lang === 'tr' ? 'GPS' : 'GPS'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.iconBtn, { borderColor: '#4caf50' }]} onPress={() => { setTempCoords(null); setShowMap(true); }}>
                    <Text style={{ fontSize: 16 }}>🗺️</Text>
                    <Text style={[s.iconBtnText, { color: '#4caf50' }]}>{lang === 'tr' ? 'Haritadan Seç' : 'Pick on Map'}</Text>
                </TouchableOpacity>
            </View>

            {/* Harita Modal */}
            <Modal visible={showMap} animationType="slide" onRequestClose={() => setShowMap(false)}>
                <View style={{ flex: 1 }}>
                    <View style={s.modalHeader}>
                        <Text style={s.modalTitle}>{lang === 'tr' ? '🗺️ Haritaya tıkla, konum seç' : '🗺️ Tap on map to select location'}</Text>
                        <TouchableOpacity onPress={() => setShowMap(false)}>
                            <Text style={s.modalClose}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    {tempCoords && (
                        <View style={s.tempCoordsBar}>
                            <Text style={s.tempCoordsText}>📍 {tempCoords.lat.toFixed(4)}, {tempCoords.lon.toFixed(4)}</Text>
                        </View>
                    )}
                    <MapView
                        style={{ flex: 1 }}
                        initialRegion={{ latitude: parseFloat(lat) || 39.9167, longitude: parseFloat(lon) || 32.8333, latitudeDelta: 5, longitudeDelta: 5 }}
                        onPress={(e) => setTempCoords({ lat: e.nativeEvent.coordinate.latitude, lon: e.nativeEvent.coordinate.longitude })}
                    >
                        {tempCoords && <Marker coordinate={{ latitude: tempCoords.lat, longitude: tempCoords.lon }} />}
                    </MapView>
                    <View style={s.modalButtons}>
                        <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowMap(false)}>
                            <Text style={s.modalCancelText}>{lang === 'tr' ? 'İptal' : 'Cancel'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.modalConfirmBtn, !tempCoords && { opacity: 0.5 }]}
                            onPress={confirmMapLocation}
                            disabled={!tempCoords}
                        >
                            <Text style={s.modalConfirmText}>{lang === 'tr' ? 'Bu Konumu Kullan' : 'Use This Location'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Mod Seçimi */}
            <Text style={s.sectionLabel}>{t.modeSelect}</Text>
            <View style={s.card}>
                <View style={s.modRow}>
                    <TouchableOpacity
                        style={[s.modBtn, mod === 'sensorsuz' && { backgroundColor: theme.green, borderColor: theme.green }]}
                        onPress={() => setMod('sensorsuz')}
                    >
                        <Text style={[s.modBtnText, mod === 'sensorsuz' && { color: '#fff' }]}>{t.sensorless}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.modBtn, mod === 'sensorlu' && { backgroundColor: theme.green, borderColor: theme.green }]}
                        onPress={() => setMod('sensorlu')}
                    >
                        <Text style={[s.modBtnText, mod === 'sensorlu' && { color: '#fff' }]}>{t.sensor}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={s.modDesc}>{mod === 'sensorsuz' ? t.sensorlessDesc : t.sensorDesc}</Text>
            </View>

            {/* Sensörlü: ESP32 + opsiyonel yağış */}
            {mod === 'sensorlu' && (
                <>
                    <Text style={s.sectionLabel}>{t.sensorData}</Text>
                    <View style={s.card}>
                        <TouchableOpacity style={s.sensorFetchBtn} onPress={fetchFromSensor} disabled={sensorFetching}>
                            {sensorFetching
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={s.sensorFetchText}>{lang === 'tr' ? "📡 ESP32'den Güncel Veriyi Çek" : '📡 Fetch Latest from ESP32'}</Text>
                            }
                        </TouchableOpacity>
                        <View style={s.divider} />
                        <Text style={s.inputLabel}>{t.rainInput}</Text>
                        <TextInput
                            style={s.input}
                            value={rain}
                            onChangeText={setRain}
                            keyboardType="numeric"
                            placeholder={t.rainPlaceholder}
                            placeholderTextColor={theme.textLight}
                        />
                    </View>
                </>
            )}

            {/* Sensörsüz: opsiyonel Wr + yağış */}
            {mod === 'sensorsuz' && (
                <>
                    <Text style={s.sectionLabel}>{lang === 'tr' ? '⚙️ Opsiyonel Girdiler' : '⚙️ Optional Inputs'}</Text>
                    <View style={s.card}>
                        <Text style={s.optionalNote}>{lang === 'tr' ? 'Boş bırakılabilir. Girilirse tahmin daha hassas olur.' : 'Optional. Filling these improves prediction accuracy.'}</Text>
                        <View style={s.divider} />
                        <Text style={s.inputLabel}>{t.wrInput}</Text>
                        <TextInput
                            style={s.input}
                            value={wr}
                            onChangeText={setWr}
                            keyboardType="numeric"
                            placeholder={t.wrPlaceholder}
                            placeholderTextColor={theme.textLight}
                        />
                        <View style={s.divider} />
                        <Text style={s.inputLabel}>{t.rainInput}</Text>
                        <TextInput
                            style={s.input}
                            value={rain}
                            onChangeText={setRain}
                            keyboardType="numeric"
                            placeholder={t.rainPlaceholder}
                            placeholderTextColor={theme.textLight}
                        />
                    </View>
                </>
            )}

            {/* Analiz Et */}
            <TouchableOpacity style={s.btn} onPress={analizeEt} disabled={loading}>
                {loading
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <Text style={s.btnIcon}>🔍</Text>
                        <Text style={s.btnText}>{t.analyze || 'Analiz Et'}</Text>
                    </>
                }
            </TouchableOpacity>

            {/* Manuel Sulama Toggle */}
            <View style={s.manualCard}>
                <View style={{ flex: 1 }}>
                    <Text style={s.manualTitle}>💧 {t.manualIrrigation || 'Manuel Sulama'}</Text>
                    <Text style={s.manualSub}>{manualIrrigation ? (t.irrigationOn || 'Sulama açık') : (t.irrigationOff || 'Sulama kapalı')}</Text>
                </View>
                {irrigationLoading
                    ? <ActivityIndicator size="small" color={theme.green} />
                    : <Switch value={manualIrrigation} onValueChange={toggleManualIrrigation} trackColor={{ false: '#ccc', true: theme.green }} thumbColor="#fff" />
                }
            </View>

            {loading && (
                <View style={s.loadingBox}>
                    <Text style={s.loadingText}>{t.analyzing || 'Analiz ediliyor...'}</Text>
                </View>
            )}

            {/* Sonuç Banner */}
            {banner && (
                <View style={[s.banner, { backgroundColor: banner.bg, borderColor: banner.border }]}>
                    <View style={[s.bannerIconWrap, { backgroundColor: banner.iconBg }]}>
                        <Text style={{ fontSize: 28 }}>{banner.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.bannerTitle, { color: banner.border }]}>{banner.title}</Text>
                        <Text style={[s.bannerSub, { color: banner.border }]}>{banner.sub}</Text>
                    </View>
                </View>
            )}

            {/* Stat Kartları */}
            {result && (
                <>
                    <Text style={s.sectionLabel}>{t.detailedInfo || 'Detaylı Bilgi'}</Text>
                    <View style={s.statGrid}>
                        {[
                            { icon: '🌡️', value: result.temp_max ? `${result.temp_max}°C` : '-', label: t.maxTemp || 'Max Sıc.' },
                            { icon: '💧', value: result.wr_current ?? '-', label: t.soilMoisture || 'Toprak Nemi' },
                            { icon: '🌧️', value: result.rain_next_3days ?? '-', label: t.rain3Days || '3 G. Yağış' },
                            { icon: '💨', value: result.vpd ?? '-', label: t.vpd || 'VPD' },
                            { icon: '⚡', value: result.stress_level || '-', label: t.stressLevel || 'Stres Seviyesi' },
                            { icon: '🚿', value: result.amount_mm ?? '-', label: t.irrigation || 'Sulama' },
                        ].map((item, i) => (
                            <View key={i} style={s.statCard}>
                                <Text style={s.statIcon}>{item.icon}</Text>
                                <Text style={s.statValue}>{item.value}</Text>
                                <Text style={s.statLabel}>{item.label}</Text>
                            </View>
                        ))}
                    </View>

                    {result.wr_forecast && (
                        <>
                            <Text style={s.sectionLabel}>{t.wrForecast || 'Tahmin'}</Text>
                            <View style={s.forecastRow}>
                                {[
                                    { label: `${t.day || 'Gün'} 1`, value: result.wr_forecast.day_1 },
                                    { label: `${t.day || 'Gün'} 3`, value: result.wr_forecast.day_3 },
                                    { label: `${t.day || 'Gün'} 7`, value: result.wr_forecast.day_7 },
                                ].map((item, i) => {
                                    const isRisk = item.value < 109;
                                    return (
                                        <View key={i} style={[s.forecastCard, { borderColor: isRisk ? '#F59E0B' : theme.green }]}>
                                            <Text style={s.forecastLabel}>{item.label}</Text>
                                            <Text style={[s.forecastValue, { color: isRisk ? '#F59E0B' : theme.green }]}>{item.value ? `${item.value} mm` : '-'}</Text>
                                            <Text style={[s.forecastStatus, { color: isRisk ? '#F59E0B' : theme.green }]}>{isRisk ? '⚠️ Risk' : `✅ ${t.normal || 'Normal'}`}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    <View style={s.messageCard}>
                        <Text style={s.messageTitle}>🤖 {t.aiSuggestion || 'Sistem Tavsiyesi'}</Text>
                        <Text style={s.messageText}>{result.message}</Text>
                    </View>
                </>
            )}

            {!result && !loading && (
                <View style={s.emptyBox}>
                    <Text style={s.emptyIcon}>🌱</Text>
                    <Text style={s.emptyTitle}>{t.waitingAnalysis || 'Analiz Bekleniyor'}</Text>
                    <Text style={s.emptyText}>{lang === 'tr' ? 'Konumu ve modu ayarlayıp Analiz Et butonuna bas.' : 'Set your location and mode, then press Analyze.'}</Text>
                </View>
            )}

        </ScrollView>
    );
}

function makeStyles(theme) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.bg },
        apiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', backgroundColor: theme.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 10, borderWidth: 0.5, borderColor: theme.border },
        apiDot: { width: 8, height: 8, borderRadius: 4 },
        apiLabel: { fontSize: 11, fontWeight: '500' },
        offlineBanner: { backgroundColor: '#FF5722', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 10 },
        offlineBannerText: { color: '#fff', fontWeight: '500', fontSize: 13 },
        sectionLabel: { fontSize: 12, fontWeight: '500', color: theme.textSub, marginBottom: 8, marginTop: 4 },
        card: { backgroundColor: theme.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: theme.border, elevation: 2 },
        inputLabel: { fontSize: 11, color: theme.textLight, marginBottom: 6 },
        input: { fontSize: 14, color: theme.text, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: theme.inputBg, borderRadius: 8 },
        divider: { height: 0.5, backgroundColor: theme.border, marginVertical: 10 },
        locationBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, backgroundColor: theme.greenLight, borderRadius: 10, padding: 10 },
        locationIcon: { fontSize: 18 },
        locationName: { fontSize: 13, fontWeight: '500', color: theme.greenText },
        locationSub: { fontSize: 11, color: theme.textSub, marginTop: 2 },
        locationLoading: { fontSize: 12, color: theme.greenText, fontStyle: 'italic' },
        btnRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
        iconBtn: { flex: 1, backgroundColor: theme.card, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5 },
        iconBtnText: { fontSize: 13, fontWeight: '500' },
        modRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
        modBtn: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: theme.border, padding: 10, alignItems: 'center' },
        modBtnText: { fontSize: 13, color: theme.textSub, fontWeight: '500' },
        modDesc: { fontSize: 12, color: theme.textSub, lineHeight: 18 },
        sensorFetchBtn: { backgroundColor: '#2196F3', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 4 },
        sensorFetchText: { color: '#fff', fontWeight: '500', fontSize: 13 },
        optionalNote: { fontSize: 12, color: theme.textSub, fontStyle: 'italic', marginBottom: 4 },
        btn: { backgroundColor: theme.green, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, elevation: 4 },
        btnIcon: { fontSize: 18 },
        btnText: { color: '#fff', fontWeight: '500', fontSize: 16 },
        manualCard: { backgroundColor: theme.card, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: theme.green, elevation: 2 },
        manualTitle: { fontSize: 14, fontWeight: '500', color: theme.text, marginBottom: 2 },
        manualSub: { fontSize: 12, color: theme.textSub },
        loadingBox: { backgroundColor: theme.greenLight, borderRadius: 10, padding: 12, marginBottom: 12, alignItems: 'center' },
        loadingText: { fontSize: 13, color: theme.greenText },
        banner: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16, borderWidth: 1.5 },
        bannerIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
        bannerTitle: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
        bannerSub: { fontSize: 13 },
        statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
        statCard: { flex: 1, minWidth: '30%', backgroundColor: theme.statCard, borderRadius: 14, padding: 12, alignItems: 'center', elevation: 2, borderWidth: 0.5, borderColor: theme.border },
        statIcon: { fontSize: 22, marginBottom: 6 },
        statValue: { fontSize: 15, fontWeight: '500', color: theme.green, marginBottom: 4 },
        statLabel: { fontSize: 10, color: theme.textLight, textAlign: 'center' },
        forecastRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
        forecastCard: { flex: 1, backgroundColor: theme.card, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1.5, elevation: 2 },
        forecastLabel: { fontSize: 12, color: theme.textSub, marginBottom: 6, fontWeight: '500' },
        forecastValue: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
        forecastStatus: { fontSize: 11 },
        messageCard: { backgroundColor: theme.card, borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: theme.green, elevation: 2 },
        messageTitle: { fontSize: 13, fontWeight: '500', color: theme.green, marginBottom: 8 },
        messageText: { fontSize: 13, color: theme.text, lineHeight: 20 },
        emptyBox: { alignItems: 'center', marginTop: 20, padding: 24, backgroundColor: theme.card, borderRadius: 16, elevation: 2, borderWidth: 0.5, borderColor: theme.border },
        emptyIcon: { fontSize: 48, marginBottom: 12 },
        emptyTitle: { fontSize: 16, fontWeight: '500', color: theme.text, marginBottom: 8 },
        emptyText: { fontSize: 13, color: theme.textSub, textAlign: 'center', lineHeight: 20 },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#1a5c35' },
        modalTitle: { fontSize: 14, fontWeight: '500', color: '#fff', flex: 1 },
        modalClose: { fontSize: 22, color: '#fff', paddingHorizontal: 8 },
        tempCoordsBar: { backgroundColor: '#e8f5e9', padding: 10, alignItems: 'center' },
        tempCoordsText: { fontSize: 13, fontWeight: '500', color: '#1a5c35' },
        modalButtons: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 0.5, borderColor: '#ddd', backgroundColor: '#fff' },
        modalCancelBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
        modalCancelText: { fontSize: 14, color: '#666' },
        modalConfirmBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#1a5c35' },
        modalConfirmText: { fontSize: 14, color: '#fff', fontWeight: '500' },
    });
}
