# Challenge Platform - TypeScript Implementation

Algorand blockchain üzerinde **TypeScript** kullanarak geliştirilmiş habit tracker challenge platformu. Kullanıcılar challenge'lara katılım ücreti ödeyerek dahil olur ve görevleri tamamlayarak puan kazanırlar.

## 🚀 Özellikler

### Challenge Sistemi
- 3 haftalık süreçli challenge'lar
- Minimum 10, maksimum 30 katılımcı
- Katılım ücreti (ALGO cinsinden)
- Her hafta puan bazlı sıralama
- Son sıradaki katılımcının elenmesi

### Puan ve Ödeme Sistemi
- Günlük görevler için puan kazanma
- Haftalık puan toplamına göre sıralama
- Elenen katılımcının %30 kesinti
- Kalan %70'in ilk 3'e dağıtımı:
  - 1. sıra: %40
  - 2. sıra: %30  
  - 3. sıra: %30

## 🛠️ Teknoloji Stack

- **Algorand blockchain**
- **TypeScript (full-stack)**
- **@algorandfoundation/algorand-typescript** (Smart contracts)
- **@algorandfoundation/algokit-utils** (Utilities)
- **algosdk** (Core SDK)
- **Express.js** (API Server)
- **Jest** (Testing)

## 📁 Proje Yapısı

```
challenge-platform/
├── contracts/
│   ├── HabitTrackerChallenge.algo.ts    # Ana smart contract
│   ├── client/
│   │   └── HabitTrackerClient.ts        # TypeScript client
│   ├── types/
│   │   └── index.ts                     # Type definitions
│   ├── api/
│   │   └── server.ts                    # Express.js API server
│   └── deploy.ts                        # Deployment script
├── tests/
│   ├── contracts/
│   │   └── HabitTrackerChallenge.test.ts
│   └── setup.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
├── algokit.toml
└── README.md
```

## 🚀 Kurulum

### 1. Dependencies Yükle
```bash
npm install
```

### 2. Environment Variables Ayarla
```bash
# .env dosyası oluştur
cp .env.example .env

# Environment variables'ları düzenle
DEPLOYER_MNEMONIC="your mnemonic phrase here"
ALGOD_SERVER="https://testnet-api.algonode.cloud"
ALGOD_TOKEN=""
```

### 3. Projeyi Build Et
```bash
npm run build:all
```

### 4. Testleri Çalıştır
```bash
npm test
```

## 🔧 Development

### Smart Contract Geliştirme
```bash
# Contract'ları derle
npm run build:contracts

# Development mode'da çalıştır
npm run dev:contracts
```

### API Server Geliştirme
```bash
# API server'ı development mode'da çalıştır
npm run dev:api
```

### Linting
```bash
# TypeScript linting
npm run lint

# Linting'i otomatik düzelt
npm run lint:fix
```

## 🚀 Deployment

### Local Network
```bash
# Local network başlat
algokit localnet start

# Contract'ı deploy et
npm run deploy:localnet
```

### Testnet
```bash
# Testnet'e deploy et
npm run deploy:testnet
```

### Mainnet
```bash
# Mainnet'e deploy et
npm run deploy:mainnet
```

## 📚 API Kullanımı

### Challenge Oluşturma
```typescript
POST /api/challenges/create
{
  "name": "Fitness Challenge",
  "description": "30-day fitness challenge",
  "entryFee": 1.0,
  "startTime": 1700000000000,
  "maxParticipants": 30,
  "creatorPrivateKey": "your private key",
  "appId": 123
}
```

### Challenge'a Katılım
```typescript
POST /api/challenges/:id/join
{
  "participantAddress": "participant address",
  "privateKey": "participant private key"
}
```

### Görev Tamamlama
```typescript
POST /api/challenges/:id/complete-task
{
  "taskId": "1",
  "participantAddress": "participant address",
  "privateKey": "participant private key",
  "pointsEarned": 10,
  "week": 1
}
```

### Haftalık Eleme
```typescript
POST /api/challenges/:id/eliminate
{
  "week": 1,
  "eliminatedParticipant": "participant address",
  "creatorPrivateKey": "creator private key"
}
```

### Ödül Dağıtımı
```typescript
POST /api/challenges/:id/distribute-rewards
{
  "week": 1,
  "winner1": "winner 1 address",
  "winner2": "winner 2 address",
  "winner3": "winner 3 address",
  "creatorPrivateKey": "creator private key"
}
```

## 🧪 Testing

### Tüm Testleri Çalıştır
```bash
npm test
```

### Sadece Contract Testleri
```bash
npm run test:contracts
```

### Sadece API Testleri
```bash
npm run test:api
```

### Integration Testleri
```bash
npm run test:integration
```

## 📖 Smart Contract Methods

### HabitTrackerChallenge Contract

#### Global State
- `challengeId`: Challenge ID
- `entryFee`: Katılım ücreti
- `startTime`: Başlangıç zamanı
- `currentWeek`: Mevcut hafta
- `totalParticipants`: Toplam katılımcı sayısı
- `maxParticipants`: Maksimum katılımcı sayısı
- `isActive`: Challenge aktif mi
- `creator`: Challenge oluşturucu
- `week1Pool`, `week2Pool`, `week3Pool`: Haftalık ödül havuzları

#### Local State (Her Katılımcı İçin)
- `isParticipant`: Katılımcı mı
- `week1Points`, `week2Points`, `week3Points`: Haftalık puanlar
- `totalPoints`: Toplam puan
- `isEliminated`: Elenmiş mi
- `eliminationWeek`: Elenme haftası
- `lastTaskTime`: Son görev zamanı

#### Methods
- `createChallenge()`: Challenge oluştur
- `joinChallenge()`: Challenge'a katıl
- `completeTask()`: Görev tamamla
- `weeklyElimination()`: Haftalık eleme
- `distributeWeeklyRewards()`: Haftalık ödül dağıt
- `endChallenge()`: Challenge'ı sonlandır
- `getParticipantState()`: Katılımcı durumunu sorgula
- `getChallengeInfo()`: Challenge bilgilerini sorgula

## 🔒 Güvenlik

- Tüm transaction'lar imzalanmalı
- Sadece creator belirli işlemleri yapabilir
- Katılımcı limitleri kontrol edilir
- Puan hesaplamaları doğrulanır
- Ödül dağıtımları güvenli

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 📞 İletişim

- **Proje Sahibi**: Challenge Platform Team
- **Email**: team@challengeplatform.com
- **GitHub**: [challenge-platform](https://github.com/challenge-platform/challenge-platform)

## 🙏 Teşekkürler

- [Algorand Foundation](https://algorand.foundation/)
- [AlgoKit](https://github.com/algorandfoundation/algokit)
- [TypeScript](https://www.typescriptlang.org/)
- [Express.js](https://expressjs.com/)