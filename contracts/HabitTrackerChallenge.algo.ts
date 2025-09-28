import { Contract } from '@algorandfoundation/algorand-typescript';

export class HabitTrackerChallenge extends Contract {
  // Global State
  challengeId = GlobalStateKey<uint64>();
  entryFee = GlobalStateKey<uint64>();
  startTime = GlobalStateKey<uint64>();
  currentWeek = GlobalStateKey<uint64>();
  totalParticipants = GlobalStateKey<uint64>();
  maxParticipants = GlobalStateKey<uint64>();
  isActive = GlobalStateKey<uint64>();
  creator = GlobalStateKey<Address>();
  
  // Prize pools
  week1Pool = GlobalStateKey<uint64>();
  week2Pool = GlobalStateKey<uint64>();
  week3Pool = GlobalStateKey<uint64>();
  
  // Challenge metadata
  challengeName = GlobalStateKey<string>();
  challengeDesc = GlobalStateKey<string>();

  // Local State (per participant)
  isParticipant = LocalStateKey<uint64>();
  week1Points = LocalStateKey<uint64>();
  week2Points = LocalStateKey<uint64>();
  week3Points = LocalStateKey<uint64>();
  totalPoints = LocalStateKey<uint64>();
  isEliminated = LocalStateKey<uint64>();
  eliminationWeek = LocalStateKey<uint64>();
  lastTaskTime = LocalStateKey<uint64>();

  /**
   * Challenge oluşturma - sadece creator çağırabilir
   */
  createChallenge(
    entryFee: uint64,
    startTime: uint64,
    maxParticipants: uint64,
    challengeName: string,
    challengeDesc: string
  ): void {
    // Sadece creator challenge oluşturabilir
    assert(this.txn.sender === this.creator.value);
    
    // Challenge zaten oluşturulmuş mu kontrol et
    assert(this.challengeId.value === 0);
    
    // Parametreleri kaydet
    this.challengeId.value = this.txn.applicationID;
    this.entryFee.value = entryFee;
    this.startTime.value = startTime;
    this.maxParticipants.value = maxParticipants;
    this.challengeName.value = challengeName;
    this.challengeDesc.value = challengeDesc;
    this.isActive.value = 1;
    this.creator.value = this.txn.sender;
    this.currentWeek.value = 1;
    
    // Başlangıç prize pool'larını sıfırla
    this.week1Pool.value = 0;
    this.week2Pool.value = 0;
    this.week3Pool.value = 0;
  }

  /**
   * Challenge'a katılım - payment transaction ile
   */
  joinChallenge(paymentTxn: PayTxn): void {
    // Challenge aktif mi kontrol et
    assert(this.isActive.value === 1);
    
    // Payment verification
    assert(paymentTxn.receiver === this.app.address);
    assert(paymentTxn.amount === this.entryFee.value);
    
    // Katılımcı limitleri
    assert(this.totalParticipants.value < this.maxParticipants.value);
    assert(this.isParticipant(this.txn.sender).value === 0);
    
    // Challenge'a ekle
    this.isParticipant(this.txn.sender).value = 1;
    this.totalParticipants.value += 1;
    
    // Prize pool'a ekle (%70 week1'e, %30 kesinti)
    this.week1Pool.value += (paymentTxn.amount * 70) / 100;
    
    // Katılımcı state'ini başlat
    this.week1Points(this.txn.sender).value = 0;
    this.week2Points(this.txn.sender).value = 0;
    this.week3Points(this.txn.sender).value = 0;
    this.totalPoints(this.txn.sender).value = 0;
    this.isEliminated(this.txn.sender).value = 0;
    this.eliminationWeek(this.txn.sender).value = 0;
    this.lastTaskTime(this.txn.sender).value = 0;
  }

  /**
   * Görev tamamlama - puan kazanma
   */
  completeTask(
    taskId: uint64, 
    pointsEarned: uint64,
    week: uint64
  ): void {
    // Katılımcı mı kontrol et
    assert(this.isParticipant(this.txn.sender).value === 1);
    assert(this.isEliminated(this.txn.sender).value === 0);
    assert(week >= 1 && week <= 3);
    
    // Challenge aktif mi kontrol et
    assert(this.isActive.value === 1);
    
    // Hafta kontrolü
    assert(week <= this.currentWeek.value);
    
    // Puanları haftaya göre ekle
    if (week === 1) {
      this.week1Points(this.txn.sender).value += pointsEarned;
    } else if (week === 2) {
      this.week2Points(this.txn.sender).value += pointsEarned;
    } else {
      this.week3Points(this.txn.sender).value += pointsEarned;
    }
    
    // Toplam puanı güncelle
    this.totalPoints(this.txn.sender).value += pointsEarned;
    this.lastTaskTime(this.txn.sender).value = globals.latestTimestamp;
  }

  /**
   * Haftalık eleme - sadece creator çağırabilir
   */
  weeklyElimination(week: uint64, eliminatedParticipant: Address): void {
    // Sadece creator eleme yapabilir
    assert(this.txn.sender === this.creator.value);
    assert(week >= 1 && week <= 3);
    assert(week <= this.currentWeek.value);
    
    // Katılımcı mı kontrol et
    assert(this.isParticipant(eliminatedParticipant).value === 1);
    assert(this.isEliminated(eliminatedParticipant).value === 0);
    
    // Elenen katılımcıyı işaretle
    this.isEliminated(eliminatedParticipant).value = 1;
    this.eliminationWeek(eliminatedParticipant).value = week;
    
    // Kesinti hesapla (%30 entry fee)
    const penalty = (this.entryFee.value * 30) / 100;
    
    // Kesinti sonraki haftanın pool'una ekle
    if (week === 1) {
      this.week2Pool.value += penalty;
    } else if (week === 2) {
      this.week3Pool.value += penalty;
    }
    
    // Hafta güncelle
    if (week === this.currentWeek.value) {
      this.currentWeek.value += 1;
    }
  }

  /**
   * Haftalık ödül dağıtımı - sadece creator çağırabilir
   */
  distributeWeeklyRewards(
    week: uint64,
    winner1: Address,
    winner2: Address,
    winner3: Address
  ): void {
    // Sadece creator ödül dağıtabilir
    assert(this.txn.sender === this.creator.value);
    assert(week >= 1 && week <= 3);
    
    // Hafta pool'unu al
    let pool: uint64;
    if (week === 1) {
      pool = this.week1Pool.value;
    } else if (week === 2) {
      pool = this.week2Pool.value;
    } else {
      pool = this.week3Pool.value;
    }
    
    // Pool boş mu kontrol et
    assert(pool > 0);
    
    // Ödülleri hesapla
    const reward1 = (pool * 40) / 100;  // 1. sıra %40
    const reward2 = (pool * 30) / 100;  // 2. sıra %30
    const reward3 = (pool * 30) / 100;  // 3. sıra %30
    
    // Kazananların katılımcı olduğunu kontrol et
    assert(this.isParticipant(winner1).value === 1);
    assert(this.isParticipant(winner2).value === 1);
    assert(this.isParticipant(winner3).value === 1);
    
    // Elenmemiş olduklarını kontrol et
    assert(this.isEliminated(winner1).value === 0);
    assert(this.isEliminated(winner2).value === 0);
    assert(this.isEliminated(winner3).value === 0);
    
    // Ödemeleri gönder
    sendPayment({
      receiver: winner1,
      amount: reward1,
    });
    
    sendPayment({
      receiver: winner2,
      amount: reward2,
    });
    
    sendPayment({
      receiver: winner3,
      amount: reward3,
    });
    
    // Pool'u sıfırla
    if (week === 1) {
      this.week1Pool.value = 0;
    } else if (week === 2) {
      this.week2Pool.value = 0;
    } else {
      this.week3Pool.value = 0;
    }
  }

  /**
   * Challenge'ı sonlandır - sadece creator çağırabilir
   */
  endChallenge(): void {
    // Sadece creator challenge'ı sonlandırabilir
    assert(this.txn.sender === this.creator.value);
    
    // Challenge aktif mi kontrol et
    assert(this.isActive.value === 1);
    
    // Challenge'ı sonlandır
    this.isActive.value = 0;
  }

  /**
   * Katılımcı durumunu sorgula
   */
  getParticipantState(participant: Address): ParticipantState {
    return {
      isParticipant: this.isParticipant(participant).value,
      week1Points: this.week1Points(participant).value,
      week2Points: this.week2Points(participant).value,
      week3Points: this.week3Points(participant).value,
      totalPoints: this.totalPoints(participant).value,
      isEliminated: this.isEliminated(participant).value,
      eliminationWeek: this.eliminationWeek(participant).value,
      lastTaskTime: this.lastTaskTime(participant).value
    };
  }

  /**
   * Challenge bilgilerini sorgula
   */
  getChallengeInfo(): ChallengeInfo {
    return {
      challengeId: this.challengeId.value,
      entryFee: this.entryFee.value,
      startTime: this.startTime.value,
      currentWeek: this.currentWeek.value,
      totalParticipants: this.totalParticipants.value,
      maxParticipants: this.maxParticipants.value,
      isActive: this.isActive.value,
      creator: this.creator.value,
      week1Pool: this.week1Pool.value,
      week2Pool: this.week2Pool.value,
      week3Pool: this.week3Pool.value,
      challengeName: this.challengeName.value,
      challengeDesc: this.challengeDesc.value
    };
  }
}

// Type definitions
export interface ParticipantState {
  isParticipant: uint64;
  week1Points: uint64;
  week2Points: uint64;
  week3Points: uint64;
  totalPoints: uint64;
  isEliminated: uint64;
  eliminationWeek: uint64;
  lastTaskTime: uint64;
}

export interface ChallengeInfo {
  challengeId: uint64;
  entryFee: uint64;
  startTime: uint64;
  currentWeek: uint64;
  totalParticipants: uint64;
  maxParticipants: uint64;
  isActive: uint64;
  creator: Address;
  week1Pool: uint64;
  week2Pool: uint64;
  week3Pool: uint64;
  challengeName: string;
  challengeDesc: string;
}
