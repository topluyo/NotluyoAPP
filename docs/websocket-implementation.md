# WebSocket / Canlı Paylaşım Implementasyon Notu

## Mevcut Durum

Eski PHP projesi `web-connect/` klasöründe **long-polling** bazlı bir WebRTC signaling sistemi kullanıyordu:

- **WebConnectDB** class'ı PHP long-polling ile gerçekleştiriliyordu
- Kullanıcılar `webconnect_users` ve `webconnect_messages` tablolarından mesaj alışverişi yapıyordu
- Her 3 saniyede bir PHP endpoint'ine AJAX request atılarak yeni mesajlar kontrol ediliyordu
- WebRTC signaling: `offer`, `answer`, `candidate-offer`, `candidate-answer` mesajları
- Bağlantı türleri: `star` (herkesle), `one` (sadece host), `two` (bire bir)

## Neden Vercel'de Çalışmıyor

Vercel Serverless Functions:
- **Maksimum 10-60 saniye timeout** — long-polling mümkün değil
- **State tutamaz** — her invocation'da yeni bir context oluşur
- **WebSocket desteklemez** — Serverless fonksiyonları HTTP request/response cycle ile çalışır

## Önerilen Çözümler

### Seçenek 1: Managed WebSocket Servisi (En Hızlı)

**Ably, Pusher, veya Soketi** gibi managed bir servis kullanarak:

```
Kullanıcı A → Ably Channel → Kullanıcı B
```

**Avantajları:**
- Kendi sunucu yönetimi yok
- Ücretsiz planlar mevcut (Ably: 6M msg/ay, Pusher: 200K msg/gün)
- WebRTC signaling için yeterli
- SDK'lar hazır (JavaScript client)

**Implementasyon:**
1. Ably/Pusher hesabı oluştur
2. Frontend'de channel'a subscribe ol (`bord-{id}` gibi)
3. Signaling mesajlarını channel üzerinden gönder
4. WebRTC peer connection kurulumu mevcut koddan adapte edilir

### Seçenek 2: Kendi WebSocket Sunucusu (Daha Esnek)

Ayrı bir sunucuda (Railway, Fly.io, Render, VPS) Node.js WebSocket sunucusu:

```javascript
// ws-server.js (Node.js + ws)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const rooms = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    
    switch(data.action) {
      case 'join':
        // Odaya katıl
        break;
      case 'offer':
      case 'answer':
      case 'candidate-offer':
      case 'candidate-answer':
        // Hedefe forward et
        break;
    }
  });
});
```

**Avantajları:**
- Tam kontrol
- Ek maliyet düşük (Railway ücretsiz plan var)
- Mevcut WebConnect mantığı direkt adapte edilebilir

### Seçenek 3: Topluyo Socket Üzerinden (Mevcut Altyapı)

Eğer Topluyo platformunun zaten bir WebSocket altyapısı varsa (`wss://topluyo.com/!direct` gibi), canlı paylaşım mesajları bu kanal üzerinden de yönlendirilebilir.

## Konfigürasyon

Şu an canlı paylaşım **kapalı**. Aktif etmek için:

```env
# .env.local
WEBSOCKET_ENABLED=true
WEBSOCKET_URL=wss://your-ws-server.com
```

Frontend tarafında `window.info.websocket` flag'i kontrol edilir:

```javascript
if (window.info.websocket && window.info.websocketUrl) {
  // WebSocket bağlantısı kur
  const ws = new WebSocket(window.info.websocketUrl);
  // Signaling başlat...
} else {
  // Canlı paylaşım devre dışı
  console.log('Live sharing is disabled');
}
```

## DB Tabloları (WS Sunucusu için)

WebSocket sunucusu kurulursa, signaling için DB'ye gerek kalmaz - mesajlar doğrudan WS üzerinden iletilir. Ancak oda/kullanıcı takibi için:

```sql
-- Opsiyonel: aktif oda takibi
CREATE TABLE IF NOT EXISTS ws_rooms (
    id SERIAL PRIMARY KEY,
    bord_id INTEGER NOT NULL,
    host_user_id INTEGER REFERENCES users(id),
    type VARCHAR(10) DEFAULT 'star',  -- star, one, two
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Sonraki Adımlar

1. **WebSocket servisini seç** (Ably, kendi sunucu, veya Topluyo)
2. **Env değişkenlerini ayarla** (`WEBSOCKET_ENABLED=true`, `WEBSOCKET_URL=...`)
3. **Frontend'de WS client implementasyonu** yap
4. **WebRTC signaling'i WS üzerinden** çalışacak şekilde adapte et
5. **Oda yönetimi** (join/leave/kick) ekle
