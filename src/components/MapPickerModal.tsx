import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '../constants/theme';
import { AttendanceService, SavedLocation } from '../services/attendanceService';

interface MapPickerModalProps {
  visible: boolean;
  initialLocation?: SavedLocation | null;
  onClose: () => void;
  onSelectLocation: (loc: SavedLocation) => void;
}

export const MapPickerModal: React.FC<MapPickerModalProps> = ({
  visible,
  initialLocation,
  onClose,
  onSelectLocation,
}) => {
  const initialLat = initialLocation?.latitude || -7.433924;
  const initialLng = initialLocation?.longitude || 109.248612;

  const [currentLat, setCurrentLat] = useState(initialLat);
  const [currentLng, setCurrentLng] = useState(initialLng);
  const [searchQuery, setSearchQuery] = useState('');
  const [locName, setLocName] = useState(initialLocation?.name || 'Titik Peta Pilihan');
  const [address, setAddress] = useState(initialLocation?.address || 'SMK Telkom Purwokerto, Jawa Tengah');
  const [isSearching, setIsSearching] = useState(false);

  const webViewRef = useRef<WebView>(null);

  // Exact Leaflet HTML + CartoDB tiles from Absenin Aja APK
  const mapHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body, html, #map {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #f3f4f6;
        }
        .center-pin {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            z-index: 1000;
            pointer-events: none;
            font-size: 38px;
            filter: drop-shadow(0 3px 5px rgba(0,0,0,0.4));
        }
        .pulse-circle {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 12px;
            height: 12px;
            background: rgba(217, 0, 0, 0.4);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            z-index: 999;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <div class="pulse-circle"></div>
    <div class="center-pin">📍</div>
    
    <script>
        var map;
        
        function initMap(lat, lng) {
            map = L.map('map', {
                center: [lat, lng],
                zoom: 17,
                zoomControl: true
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: 'OpenStreetMap contributors CartoDB',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            map.on('moveend', function() {
                var center = map.getCenter();
                sendCoords(center.lat, center.lng);
            });

            // Initial coords send
            var center = map.getCenter();
            sendCoords(center.lat, center.lng);
        }

        function flyTo(lat, lng) {
            if (map) {
                map.flyTo([lat, lng], 17);
            }
        }

        function sendCoords(lat, lng) {
            var msg = JSON.stringify({ type: 'COORDS', lat: lat, lng: lng });
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(msg);
            }
        }

        window.onload = function() {
            initMap(${initialLat}, ${initialLng});
        };
    </script>
</body>
</html>
  `;

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'COORDS') {
        const lat = parseFloat(data.lat.toFixed(6));
        const lng = parseFloat(data.lng.toFixed(6));
        setCurrentLat(lat);
        setCurrentLng(lng);

        // Reverse geocode debounce
        const fullAddr = await AttendanceService.reverseGeocode(lat, lng);
        setAddress(fullAddr);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await AttendanceService.searchOfficialLocations(searchQuery.trim());
    setIsSearching(false);

    if (results.length > 0) {
      const top = results[0];
      setLocName(top.name);
      setAddress(top.address || top.name);
      setCurrentLat(top.latitude);
      setCurrentLng(top.longitude);

      // Inject flyTo in webview
      const js = `flyTo(${top.latitude}, ${top.longitude}); true;`;
      webViewRef.current?.injectJavaScript(js);
    }
  };

  const handleQuickFly = (name: string, lat: number, lng: number, addr: string) => {
    setLocName(name);
    setAddress(addr);
    setCurrentLat(lat);
    setCurrentLng(lng);
    const js = `flyTo(${lat}, ${lng}); true;`;
    webViewRef.current?.injectJavaScript(js);
  };

  const handleConfirmLocation = () => {
    const chosenLocation: SavedLocation = {
      id: Date.now().toString(),
      name: locName.trim() || 'Titik Peta Pilihan',
      latitude: currentLat,
      longitude: currentLng,
      address: address.trim(),
    };
    onSelectLocation(chosenLocation);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Pilih Titik Koordinat Peta</Text>
            <Text style={styles.headerSub}>Geser peta untuk menentukan posisi presensi</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Cari lokasi (cth: SMK Telkom Purwokerto)..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.searchBtnText}>Cari</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Presets Strip */}
        <View style={styles.quickStrip}>
          <TouchableOpacity
            style={styles.presetChip}
            onPress={() =>
              handleQuickFly(
                'SMK Telkom Purwokerto (Gerbang)',
                -7.433924,
                109.248612,
                'Jl. D.I. Panjaitan No.128, Purwokerto Selatan'
              )
            }
          >
            <Text style={styles.presetChipText}>🏫 Gerbang Telkom</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetChip}
            onPress={() =>
              handleQuickFly(
                'Lab RPL (Gedung B)',
                -7.433850,
                109.248550,
                'Lab RPL SMK Telkom Lantai 2'
              )
            }
          >
            <Text style={styles.presetChipText}>💻 Lab RPL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetChip}
            onPress={() =>
              handleQuickFly(
                'Lapangan Sentra',
                -7.434010,
                109.248720,
                'Lapangan Sentra SMK Telkom'
              )
            }
          >
            <Text style={styles.presetChipText}>🚩 Sentra</Text>
          </TouchableOpacity>
        </View>

        {/* Leaflet CartoDB Map WebView */}
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: mapHTML }}
            style={styles.webview}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Memuat Peta Satelit OpenStreetMap...</Text>
              </View>
            )}
          />
        </View>

        {/* Bottom Location Details Card */}
        <View style={styles.bottomCard}>
          <View style={styles.infoRow}>
            <View style={styles.pinCircle}>
              <Text style={{ fontSize: 20 }}>📍</Text>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                style={styles.locNameInput}
                value={locName}
                onChangeText={setLocName}
                placeholder="Nama Tempat Presensi"
              />
              <Text style={styles.coordsBadge}>
                Lat: {currentLat} | Lng: {currentLng}
              </Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {address}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirmLocation}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBtnText}>
              ✓ GUNAKAN TITIK KOORDINAT INI
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: COLORS.white,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  quickStrip: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
    backgroundColor: COLORS.white,
  },
  presetChip: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  presetChipText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  bottomCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  pinCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locNameInput: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textDark,
    padding: 0,
    marginBottom: 2,
  },
  coordsBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  addressText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 14,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
