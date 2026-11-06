// Bank soal kartu game
export const CARD_BANK = [
  // BOLEH dibagikan
  {
    id: 'nama_panggilan',
    text: 'Nama Panggilan',
    icon: '👤',
    boleh: true,
    alasan: 'Bagus! Nama panggilan aman untuk dibagikan dan melindungi identitas aslimu.'
  },
  {
    id: 'hobi_favorit',
    text: 'Hobi Favorit',
    icon: '⚽',
    boleh: true,
    alasan: 'Benar! Berbagi hobi membantu kamu berteman dengan orang yang punya minat sama.'
  },
  {
    id: 'makanan_favorit',
    text: 'Makanan Favorit',
    icon: '🍕',
    boleh: true,
    alasan: 'Tepat! Makanan favorit adalah informasi yang aman dan menyenangkan untuk dibagikan.'
  },
  {
    id: 'warna_favorit',
    text: 'Warna Favorit',
    icon: '🎨',
    boleh: true,
    alasan: 'Mantap! Warna favorit tidak bisa dipakai orang jahat untuk mencelakakanmu.'
  },
  {
    id: 'foto_kucing',
    text: 'Foto Kucing Peliharaan',
    icon: '🐱',
    boleh: true,
    alasan: 'Oke! Foto hewan peliharaan boleh dibagikan asalkan tidak ada informasi pribadi di latar belakang.'
  },
  {
    id: 'film_kartun',
    text: 'Film Kartun Favorit',
    icon: '🎬',
    boleh: true,
    alasan: 'Sip! Film favorit aman untuk dibagikan dan bisa jadi bahan obrolan seru.'
  },

  // JANGAN dibagikan
  {
    id: 'alamat_rumah',
    text: 'Alamat Rumah',
    icon: '🏠',
    boleh: false,
    alasan: 'Hampir! Alamat rumah rahasia ya, karena orang jahat bisa mendatangi rumahmu.'
  },
  {
    id: 'password',
    text: 'Password Akun',
    icon: '🔑',
    boleh: false,
    alasan: 'Hampir! Password itu kunci akunmu, harus dirahasiakan supaya akun tetap aman.'
  },
  {
    id: 'nomor_hp',
    text: 'Nomor HP Kamu',
    icon: '📱',
    boleh: false,
    alasan: 'Hampir! Nomor HP pribadi jangan dibagikan, bisa dipakai untuk menipu atau mengganggu.'
  },
  {
    id: 'foto_seragam',
    text: 'Foto Pakai Seragam Sekolah',
    icon: '👔',
    boleh: false,
    alasan: 'Hampir! Seragam menunjukkan nama sekolahmu, orang asing bisa tahu kamu sekolah di mana.'
  },
  {
    id: 'kode_otp',
    text: 'Kode OTP',
    icon: '🔢',
    boleh: false,
    alasan: 'Hampir! Kode OTP sangat rahasia, kalau dibagikan orang bisa membobol akunmu.'
  },
  {
    id: 'lokasi_live',
    text: 'Lokasi Kamu Saat Ini (Live)',
    icon: '📍',
    boleh: false,
    alasan: 'Hampir! Lokasi real-time berbahaya, orang asing jadi tahu persis kamu ada di mana.'
  },
  {
    id: 'nama_tanggal_lahir',
    text: 'Nama Lengkap + Tanggal Lahir',
    icon: '🎂',
    boleh: false,
    alasan: 'Hampir! Data lengkap seperti ini bisa dipakai untuk menebak password atau mencuri identitas.'
  },
  {
    id: 'nomor_hp_ortu',
    text: 'Nomor HP Orang Tua',
    icon: '👨‍👩‍👧',
    boleh: false,
    alasan: 'Hampir! Nomor HP orang tua juga harus dijaga, itu bukan milikmu untuk dibagikan.'
  },
  {
    id: 'foto_kartu_keluarga',
    text: 'Foto Kartu Keluarga',
    icon: '📄',
    boleh: false,
    alasan: 'Hampir! Kartu keluarga berisi banyak data pribadi penting yang harus dijaga ketat.'
  },
  {
    id: 'jadwal_sekolah',
    text: 'Jadwal Pergi & Pulang Sekolah',
    icon: '🕐',
    boleh: false,
    alasan: 'Hampir! Jadwal rutin memudahkan orang jahat merencanakan sesuatu yang buruk.'
  }
];

// Konfigurasi game
export const GAME_CONFIG = {
  cardsPerRound: 10,
  minBolehCards: 3,
  minJanganCards: 3,
  timePerCard: 8, // detik
  startingLives: 3,
  pointsPerCorrect: 10,
  comboBonus: {
    3: 5,  // 3 benar beruntun = +5 per jawaban
    5: 10  // 5+ benar beruntun = +10 per jawaban
  },
  titles: [
    { min: 90, title: 'Agen Rahasia Super', emoji: '🕵️' },
    { min: 50, title: 'Penjaga Data', emoji: '🛡️' },
    { min: 0, title: 'Pemula Waspada', emoji: '🌱' }
  ]
};

// Fungsi untuk mendapatkan gelar berdasarkan skor
export function getTitle(score) {
  for (const { min, title, emoji } of GAME_CONFIG.titles) {
    if (score >= min) return { title, emoji };
  }
  return { title: 'Pemula Waspada', emoji: '🌱' };
}

// Fungsi untuk mendapatkan kartu random untuk satu ronde
export function getRandomCards() {
  const bolehCards = CARD_BANK.filter(c => c.boleh);
  const janganCards = CARD_BANK.filter(c => !c.boleh);

  // Shuffle arrays
  const shuffledBoleh = [...bolehCards].sort(() => Math.random() - 0.5);
  const shuffledJangan = [...janganCards].sort(() => Math.random() - 0.5);

  // Ambil minimal yang diperlukan
  const selectedBoleh = shuffledBoleh.slice(0, GAME_CONFIG.minBolehCards);
  const selectedJangan = shuffledJangan.slice(0, GAME_CONFIG.minJanganCards);

  // Sisa kartu untuk mencapai 10
  const remaining = GAME_CONFIG.cardsPerRound - selectedBoleh.length - selectedJangan.length;
  const remainingBoleh = shuffledBoleh.slice(GAME_CONFIG.minBolehCards);
  const remainingJangan = shuffledJangan.slice(GAME_CONFIG.minJanganCards);
  const allRemaining = [...remainingBoleh, ...remainingJangan].sort(() => Math.random() - 0.5);

  const selected = [
    ...selectedBoleh,
    ...selectedJangan,
    ...allRemaining.slice(0, remaining)
  ];

  // Shuffle final selection
  return selected.sort(() => Math.random() - 0.5);
}
