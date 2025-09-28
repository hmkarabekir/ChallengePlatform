# Challenge Platform Smart Contract

Algorand blockchain üzerinde çalışan fitness challenge platformu için akıllı sözleşme.

## 🎯 Özellikler

### ✅ Temel Özellikler
- **Challenge Oluşturma**: Kullanıcılar fitness challenge'ları oluşturabilir
- **Staking Sistemi**: Challenge'lara katılmak için ALGO stake yatırma
- **Haftalık Eleme**: Her 7 günde bir en az performans gösteren elenir
- **Pool Dağıtımı**: 21 gün sonunda kalan katılımcılara sıralamaya göre dağıtım
- **Erken Çıkış**: Erken çıkış stake kaybı (stake pool'da kalır)

### ✅ Gelişmiş Özellikler
- **Chat Sistemi**: Her challenge'ın kendi private chatroom'u
- **Health Data Verification**: Google Fit/Apple Health entegrasyonu
- **Task Management**: Görev oluşturma ve takibi
- **Platform Revenue**: %5 platform fee + %1 günlük faiz sistemi

## 🏗️ Mimari

### Smart Contract Yapısı
```
ChallengePlatform (ARC4Contract)
├── Challenge Management
│   ├── create_challenge()
│   ├── join_challenge()
│   ├── leave_challenge()
│   └── get_challenge_info()
├── Task System
│   ├── create_task()
│   ├── complete_task()
│   └── get_tasks()
├── Chat System
│   ├── send_chat_message()
│   └── get_chat_messages()
├── Health Data
│   ├── submit_health_data()
│   └── get_health_data()
├── Weekly Elimination
│   └── process_weekly_elimination()
├── Pool Distribution
│   └── distribute_pool()
└── Platform Revenue
    ├── calculate_platform_revenue()
    ├── get_platform_revenue()
    └── withdraw_platform_revenue()
```

### Veri Yapıları
- **Challenge**: Challenge bilgileri
- **Participant**: Katılımcı bilgileri
- **Task**: Görev tanımları
- **ChatMessage**: Chat mesajları
- **HealthData**: Sağlık verileri
- **WeeklyRanking**: Haftalık sıralamalar
- **PlatformRevenue**: Platform gelir takibi

## 🚀 Deployment

### 1. Gereksinimler
```bash
pip install algosdk
pip install algopy  # Algopy kurulumu gerekli
```

### 2. Testnet Deployment
```bash
# Gerçek deployment (Algopy ile derleme gerekli)
python real_deploy.py

# Mock deployment (test için)
python deploy.py
```

### 3. Test Etme
```bash
python test_contract.py
```

## 📋 Kullanım

### Challenge Oluşturma
```python
# 1 ALGO stake ile challenge oluştur
create_challenge(
    challenge_id=1,
    name="30-Day Fitness Challenge",
    description="Complete daily workouts",
    stake_amount=1000000,  # 1 ALGO
    max_participants=10
)
```

### Challenge'a Katılma
```python
# Challenge'a katıl ve stake yatır
join_challenge(
    challenge_id=1,
    payment=payment_transaction  # stake amount
)
```

### Chat Mesajı Gönderme
```python
# Challenge chat'ine mesaj gönder
send_chat_message(
    challenge_id=1,
    content="Hello everyone!"
)
```

### Health Data Gönderme
```python
# Sağlık verisi gönder
submit_health_data(
    challenge_id=1,
    data_type="steps",
    value=10000,
    source="google_fit",
    verification_hash="hash_12345"
)
```

## 💰 Platform Gelir Modeli

### Platform Fee
- Her stake'ten **%5 platform fee** kesilir
- Platform revenue'a eklenir

### Faiz Geliri
- Staked paralar üzerinden **günlük %1 faiz**
- Platform revenue'a eklenir

### Gelir Çekme
- Sadece platform owner (contract creator) çekebilir
- `withdraw_platform_revenue()` metodu ile

## 🔒 Güvenlik

### Access Control
- Challenge oluşturma: Herkes
- Challenge'a katılma: Herkes (stake ile)
- Chat mesajı: Sadece katılımcılar
- Health data: Sadece katılımcılar
- Task oluşturma: Sadece challenge creator
- Platform revenue çekme: Sadece platform owner

### Staking Güvenliği
- Stake'ler smart contract'ta güvenli şekilde saklanır
- Erken çıkış stake kaybı
- Platform fee otomatik kesilir
- Pool dağıtımı sıralamaya göre

## 🧪 Test Senaryoları

### 1. Temel Akış
1. Challenge oluştur
2. Katılımcılar ekle
3. Görevler oluştur
4. Health data gönder
5. Chat mesajları gönder
6. Haftalık eleme yap
7. Pool dağıt

### 2. Edge Cases
- Challenge dolu olduğunda katılım
- Erken çıkış durumu
- Challenge bitişinde pool dağıtımı
- Platform revenue hesaplama

## 📊 Performans

### Gas Cost Optimizasyonu
- BoxMap kullanımı ile verimli depolama
- ImmutableArray ile büyük veri yapıları
- Atomic transaction'lar ile güvenli işlemler

### Scalability
- Her challenge ayrı box'ta saklanır
- Chat mesajları ImmutableArray ile
- Health data ayrı box'ta

## 🔧 Geliştirme

### Hata Ayıklama
```bash
# Linter kontrolü
python -m flake8 challenge_contract.py

# Type checking
python -m mypy challenge_contract.py
```

### Test Coverage
```bash
# Test çalıştırma
python test_contract.py

# Coverage raporu
python -m coverage run test_contract.py
python -m coverage report
```

## 📝 Notlar

### Algopy Kullanımı
- ARC4Contract base class
- @abimethod decorator'ları
- BoxMap ve ImmutableArray
- arc4.Struct veri yapıları

### Algorand Özellikleri
- Box Storage (32KB limit)
- Atomic Transactions
- Application State
- ABI (Application Binary Interface)

### Production Hazırlığı
- Gerçek deployment için Algopy derleme gerekli
- Testnet'te test edilmeli
- Security audit yapılmalı
- Gas cost optimizasyonu

## 🚨 Bilinen Sorunlar

### 1. Mock Deployment
- `deploy.py` sadece mock deployment yapar
- Gerçek deployment için `real_deploy.py` kullanın

### 2. Algopy Derleme
- Contract'ı TEAL'e derlemek için Algopy gerekli
- Production'da derleme script'i eklenmeli

### 3. Health Data Verification
- Şu anda sadece hash kontrolü
- Gerçek verification için oracle entegrasyonu gerekli

## 📞 Destek

Sorularınız için:
- GitHub Issues
- Algorand Developer Forum
- Algopy Documentation

---

**⚠️ Uyarı**: Bu contract test amaçlıdır. Production kullanımından önce güvenlik audit'i yapılmalıdır.
