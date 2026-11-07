// ====== DATA VILA (tanpa back-end, semua data ada di sini) ======
const DATA_VILA = [
  {
    id: 1,
    nama: "Vila Pinus",
    tipe: "2 kamar tidur",
    lokasi: "Cisarua, Puncak",
    harga: 750000,
    kapasitas: 5,
    fasilitas: ["Wi-Fi", "Dapur", "Parkir 2 mobil"],
    status: "Tersedia",
    terpesan: [{ masuk: "2026-12-24", keluar: "2026-12-28" }]
  },
  {
    id: 2,
    nama: "Vila Kabut",
    tipe: "3 kamar tidur",
    lokasi: "Megamendung, Puncak",
    harga: 1100000,
    kapasitas: 8,
    fasilitas: ["Kolam renang", "Wi-Fi", "Area BBQ", "Dapur"],
    status: "Terbatas",
    terpesan: [{ masuk: "2026-12-31", keluar: "2027-01-02" }]
  },
  {
    id: 3,
    nama: "Vila Teh",
    tipe: "4 kamar tidur",
    lokasi: "Ciawi, dekat kebun teh",
    harga: 1500000,
    kapasitas: 10,
    fasilitas: ["Kolam renang", "Karaoke", "Wi-Fi", "Pemandangan kebun teh"],
    status: "Tersedia",
    terpesan: [{ masuk: "2026-11-20", keluar: "2026-11-23" }]
  }
];

const KUNCI_NAMA = "vilaPermai.namaTerakhir";
const KUNCI_PESANAN = "vilaPermai.pesanan";
const TAMU_DASAR = 4;               // tamu di atas ini kena biaya tambahan
const BIAYA_TAMBAHAN_TAMU = 50000;  // per tamu per malam

let daftarVila = [];
let daftarPesanan = [];

// ====== HELPER ======
function buatElemen(tag, kelas, teks) {
  const el = document.createElement(tag);
  if (kelas) el.className = kelas;
  if (teks !== undefined) el.textContent = teks;
  return el;
}

function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

function hariIni() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function hitungMalam(masuk, keluar) {
  return Math.round((Date.parse(keluar) - Date.parse(masuk)) / 86400000);
}

function formatTanggal(str) {
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function simpanLokal(kunci, nilai) {
  try {
    localStorage.setItem(kunci, JSON.stringify(nilai));
  } catch (e) {
    console.warn("Penyimpanan lokal tidak tersedia:", e.message);
  }
}

function bacaLokal(kunci, bawaan) {
  try {
    const mentah = localStorage.getItem(kunci);
    return mentah ? JSON.parse(mentah) : bawaan;
  } catch (e) {
    return bawaan;
  }
}

// ====== DATA ======
function ambilDataVila() {
  try {
    if (!Array.isArray(DATA_VILA) || DATA_VILA.length === 0) {
      throw new Error("Data vila kosong");
    }
    return DATA_VILA.map(function (v) { return Object.assign({}, v); });
  } catch (e) {
    tampilkanPesan("pesan-vila", "Data vila belum bisa dimuat. Coba muat ulang halaman.");
    return [];
  }
}

function cariVilaById(id) {
  return daftarVila.find(function (v) { return v.id === Number(id); });
}

function tampilkanPesan(idElemen, teks) {
  const el = document.getElementById(idElemen);
  if (el) el.textContent = teks;
}

// ====== RENDER KARTU VILA (createElement + appendChild) ======
function buatKartuVila(villa) {
  const kartu = buatElemen("article", "villa-card");

  kartu.appendChild(buatElemen("h3", "villa-card__name", villa.nama));
  kartu.appendChild(buatElemen("p", "villa-card__meta", villa.tipe + " · " + villa.lokasi));

  const harga = buatElemen("p", "villa-card__price", formatRupiah(villa.harga));
  harga.appendChild(buatElemen("small", "", " / malam"));
  kartu.appendChild(harga);

  kartu.appendChild(buatElemen("p", "villa-card__meta", "Maksimal " + villa.kapasitas + " tamu"));

  const ul = buatElemen("ul", "villa-card__facilities");
  villa.fasilitas.forEach(function (f) {
    ul.appendChild(buatElemen("li", "villa-card__facility", f));
  });
  kartu.appendChild(ul);

  const footer = buatElemen("div", "villa-card__footer");
  footer.appendChild(buatElemen("span", "badge badge--" + villa.status.toLowerCase(), villa.status));

  const tombol = buatElemen("button", "btn btn--outline btn--small", "Pilih vila ini");
  tombol.type = "button";
  tombol.addEventListener("click", function () {
    document.getElementById("unit").value = villa.id;
    document.getElementById("pesan").scrollIntoView({ behavior: "smooth" });
    perbaruiRingkasan();
  });
  footer.appendChild(tombol);

  kartu.appendChild(footer);
  return kartu;
}

function renderDaftarVila(kataKunci) {
  const wadah = document.getElementById("daftar-vila");
  wadah.textContent = "";
  const kunci = (kataKunci || "").trim().toLowerCase();

  const hasil = daftarVila.filter(function (v) {
    const teks = [v.nama, v.tipe, v.lokasi, v.fasilitas.join(" ")].join(" ").toLowerCase();
    return teks.indexOf(kunci) !== -1;
  });

  hasil.forEach(function (v) { wadah.appendChild(buatKartuVila(v)); });

  if (daftarVila.length === 0) return;
  tampilkanPesan(
    "pesan-vila",
    hasil.length === 0
      ? "Tidak ada vila yang cocok dengan \"" + kataKunci + "\". Coba kata lain."
      : "Menampilkan " + hasil.length + " dari " + daftarVila.length + " vila."
  );
}

function renderDropdown() {
  const select = document.getElementById("unit");
  select.textContent = "";
  daftarVila.forEach(function (v) {
    const opt = document.createElement("option");
    opt.value = v.id;
    opt.textContent = v.nama + " – " + formatRupiah(v.harga) + "/malam";
    select.appendChild(opt);
  });
}

// ====== LOGIKA PEMESANAN ======
function bacaForm() {
  return {
    nama: document.getElementById("nama").value.trim(),
    unit: document.getElementById("unit").value,
    masuk: document.getElementById("masuk").value,
    keluar: document.getElementById("keluar").value,
    tamu: Number(document.getElementById("tamu").value)
  };
}

function validasiForm(data) {
  const error = [];
  if (!data.nama) error.push("Nama tamu wajib diisi.");
  if (!data.masuk) error.push("Tanggal check-in wajib diisi.");
  if (!data.keluar) error.push("Tanggal check-out wajib diisi.");

  if (data.masuk && data.masuk < hariIni()) {
    error.push("Tanggal check-in tidak boleh di masa lalu.");
  }
  if (data.masuk && data.keluar && data.keluar <= data.masuk) {
    error.push("Tanggal check-out harus setelah tanggal check-in.");
  }
  if (!Number.isInteger(data.tamu) || data.tamu < 1 || data.tamu > 10) {
    error.push("Jumlah tamu harus antara 1 sampai 10 orang.");
  } else {
    const villa = cariVilaById(data.unit);
    if (villa && data.tamu > villa.kapasitas) {
      error.push(villa.nama + " hanya muat " + villa.kapasitas + " tamu. Kurangi jumlah tamu atau pilih vila lain.");
    }
  }
  return error;
}

function hitungTotalHarga(villa, malam, tamu) {
  const sewa = villa.harga * malam;
  const tambahan = Math.max(0, tamu - TAMU_DASAR) * BIAYA_TAMBAHAN_TAMU * malam;
  return { sewa: sewa, tambahan: tambahan, total: sewa + tambahan };
}

function adaBentrok(villa, masuk, keluar) {
  const semua = villa.terpesan.concat(
    daftarPesanan
      .filter(function (p) { return p.unit === villa.id; })
      .map(function (p) { return { masuk: p.masuk, keluar: p.keluar }; })
  );
  return semua.some(function (r) { return masuk < r.keluar && keluar > r.masuk; });
}

// ====== TAMPILAN HASIL ======
function tampilkanError(daftarError) {
  const isi = document.getElementById("hasil-isi");
  isi.textContent = "";
  const ul = buatElemen("ul", "error-list");
  daftarError.forEach(function (e) { ul.appendChild(buatElemen("li", "", e)); });
  isi.appendChild(ul);
  isi.className = "result__body result__body--baru";
}

function tampilkanRingkasan(villa, data, pesanStatus, jenisStatus) {
  const malam = hitungMalam(data.masuk, data.keluar);
  const biaya = hitungTotalHarga(villa, malam, data.tamu);
  const isi = document.getElementById("hasil-isi");
  isi.textContent = "";

  const baris = [
    ["Vila", villa.nama],
    ["Harga per malam", formatRupiah(villa.harga)],
    ["Jumlah malam", malam + " malam"],
    ["Biaya sewa", formatRupiah(biaya.sewa)]
  ];
  if (biaya.tambahan > 0) {
    baris.push(["Tambahan tamu (di atas " + TAMU_DASAR + " orang)", formatRupiah(biaya.tambahan)]);
  }
  baris.forEach(function (b) {
    const row = buatElemen("div", "result__row");
    row.appendChild(buatElemen("span", "", b[0]));
    row.appendChild(buatElemen("span", "", b[1]));
    isi.appendChild(row);
  });

  const total = buatElemen("div", "result__row result__row--total");
  total.appendChild(buatElemen("span", "", "Total"));
  total.appendChild(buatElemen("span", "", formatRupiah(biaya.total)));
  isi.appendChild(total);

  if (pesanStatus) {
    isi.appendChild(buatElemen("p", "result__status result__status--" + jenisStatus, pesanStatus));
  }
  isi.className = "result__body result__body--baru";
}

// Total langsung muncul saat form diubah, tanpa menekan tombol
function perbaruiRingkasan() {
  const data = bacaForm();
  const villa = cariVilaById(data.unit);
  const isi = document.getElementById("hasil-isi");
  const lengkap = villa && data.masuk && data.keluar && data.keluar > data.masuk && data.tamu >= 1;
  if (!lengkap) {
    isi.textContent = "";
    isi.appendChild(buatElemen("p", "result__hint", "Isi tanggal dan pilih vila. Total biaya akan muncul di sini."));
    return;
  }
  tampilkanRingkasan(villa, data);
}

function cekKetersediaan() {
  const data = bacaForm();
  const error = validasiForm(data);
  if (error.length > 0) {
    tampilkanError(error);
    return null;
  }
  const villa = cariVilaById(data.unit);
  if (adaBentrok(villa, data.masuk, data.keluar)) {
    tampilkanRingkasan(villa, data, "Maaf, tanggal ini sudah terisi. Coba tanggal lain atau vila lain.", "error");
    return null;
  }
  tampilkanRingkasan(villa, data, "Tanggal ini masih tersedia.", "ok");
  return { data: data, villa: villa };
}

function kirimPesanan(event) {
  event.preventDefault();
  const cek = cekKetersediaan();
  if (!cek) return;

  const pesanan = {
    id: Date.now(),
    nama: cek.data.nama,
    unit: cek.villa.id,
    namaVila: cek.villa.nama,
    masuk: cek.data.masuk,
    keluar: cek.data.keluar,
    tamu: cek.data.tamu,
    total: hitungTotalHarga(cek.villa, hitungMalam(cek.data.masuk, cek.data.keluar), cek.data.tamu).total
  };
  daftarPesanan.push(pesanan);
  simpanLokal(KUNCI_PESANAN, daftarPesanan);
  simpanLokal(KUNCI_NAMA, cek.data.nama);

  tampilkanRingkasan(cek.villa, cek.data, "Pesanan terkirim. Pak Hendra akan menghubungi Anda untuk konfirmasi.", "ok");
  renderPesanan();
}

// ====== DAFTAR PESANAN ======
function renderPesanan() {
  const ul = document.getElementById("daftar-pesanan");
  ul.textContent = "";
  tampilkanPesan("pesan-pesanan", daftarPesanan.length === 0 ? "Belum ada pesanan." : "");

  daftarPesanan.forEach(function (p) {
    const li = buatElemen("li", "order-item");
    const info = buatElemen("div");
    info.appendChild(buatElemen("p", "order-item__title", p.namaVila + " – " + p.nama));
    info.appendChild(buatElemen(
      "p", "order-item__detail",
      formatTanggal(p.masuk) + " s/d " + formatTanggal(p.keluar) + " · " + p.tamu + " tamu · " + formatRupiah(p.total)
    ));
    li.appendChild(info);

    const hapus = buatElemen("button", "btn btn--danger btn--small", "Batalkan");
    hapus.type = "button";
    hapus.addEventListener("click", function () {
      daftarPesanan = daftarPesanan.filter(function (x) { return x.id !== p.id; });
      simpanLokal(KUNCI_PESANAN, daftarPesanan);
      renderPesanan();
    });
    li.appendChild(hapus);
    ul.appendChild(li);
  });
}

// ====== INISIALISASI ======
function mulai() {
  daftarVila = ambilDataVila();
  daftarPesanan = bacaLokal(KUNCI_PESANAN, []);

  renderDaftarVila("");
  renderDropdown();
  renderPesanan();

  document.getElementById("nama").value = bacaLokal(KUNCI_NAMA, "");
  document.getElementById("masuk").min = hariIni();
  document.getElementById("keluar").min = hariIni();

  document.getElementById("cari-vila").addEventListener("input", function (e) {
    renderDaftarVila(e.target.value);
  });
  document.getElementById("form-pesan").addEventListener("submit", kirimPesanan);
  document.getElementById("tombol-cek").addEventListener("click", cekKetersediaan);
  ["unit", "masuk", "keluar", "tamu"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", perbaruiRingkasan);
  });
  document.getElementById("tamu").addEventListener("input", perbaruiRingkasan);
}

document.addEventListener("DOMContentLoaded", mulai);
