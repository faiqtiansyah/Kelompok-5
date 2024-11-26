// Mengambil elemen DOM untuk digunakan dalam aplikasi
const form = document.getElementById("transaction-form"); // Form input transaksi
const transactionList = document.getElementById("transaction-list"); // Daftar transaksi dalam tabel
const tipeUang = document.getElementById("tipe_uang"); // Dropdown untuk memilih tipe uang (Pemasukan/Pengeluaran)
const kategori = document.getElementById("kategori"); // Dropdown kategori berdasarkan tipe uang
const summary = document.getElementById("summary"); // Ringkasan total pemasukan, pengeluaran, dan saldo

// Kategori untuk Pemasukan dan Pengeluaran
const kategoriPemasukan = [
  "Uang Bulanan",
  "Gaji",
  "Investasi",
  "Bonus",
  "Hadiah",
  "Lainnya",
];

const kategoriPengeluaran = [
  "Makan",
  "Hiburan",
  "Transportasi",
  "Kesehatan",
  "Tagihan",
  "Lainnya",
];

/* Fungsi untuk memperbarui dropdown kategori berdasarkan pilihan tipe uang */
function updateKategoriOptions() {
  const tipe = tipeUang.value; // Mengambil nilai yang dipilih dari tipe uang
  let options = "";

  // Jika tipe Pemasukan dipilih, tampilkan kategori Pemasukan
  if (tipe === "Pemasukan") {
    options = kategoriPemasukan.map((item) => `<option value="${item}">${item}</option>`).join("");
  }
  // Jika tipe Pengeluaran dipilih, tampilkan kategori Pengeluaran
  else if (tipe === "Pengeluaran") {
    options = kategoriPengeluaran.map((item) => `<option value="${item}">${item}</option>`).join("");
  }

  // Memperbarui dropdown kategori dengan opsi yang sesuai
  kategori.innerHTML = options;
}

// Tambahkan event listener untuk memperbarui pilihan kategori saat tipe uang berubah
tipeUang.addEventListener("change", updateKategoriOptions);

/* Fungsi untuk memformat angka ke format Rupiah */
function formatToRupiah(amount) {
  return `Rp ${parseFloat(amount).toLocaleString("id-ID", { minimumFractionDigits: 0 })}`;
}

/* Fungsi untuk mengambil dan menampilkan ringkasan transaksi (total pemasukan, pengeluaran, dan saldo) */
async function fetchSummary() {
  const response = await fetch("http://localhost:3000/api/summary"); // Mengambil data ringkasan dari server
  const { totalPemasukan, totalPengeluaran, saldo } = await response.json(); // Parsing data dari respons

  // Menampilkan ringkasan pemasukan, pengeluaran, dan saldo dalam elemen summary
  summary.innerHTML = `
    <div class="summary-item">
      <h3>Total Pemasukan</h3>
      <p>${formatToRupiah(totalPemasukan)}</p>
    </div>
    <div class="summary-item">
      <h3>Total Pengeluaran</h3>
      <p>${formatToRupiah(totalPengeluaran)}</p>
    </div>
    <div class="summary-item">
      <h3>Saldo Terbaru</h3>
      <p>${formatToRupiah(saldo)}</p>
    </div>
  `;
}

/* Fungsi untuk mengambil data transaksi dan memperbarui tabel */
async function fetchTransactions() {
  const response = await fetch("http://localhost:3000/api/transactions"); // Mengambil data transaksi dari server
  const transactions = await response.json(); // Parsing data transaksi dari respons

  // Memperbarui tabel transaksi dengan data yang diambil
  transactionList.innerHTML = transactions
    .map(
      (t) => `
    <tr>
      <td>${t.id}</td>
      <td>${t.tanggal}</td>
      <td>${t.kategori}</td>
      <td>${t.deskripsi || "-"}</td>
      <td>${t.tipe_uang}</td>
      <td>${formatToRupiah(t.jumlah)}</td>
    </tr>`
    )
    .join("");
}

/* Event listener untuk menambahkan transaksi baru ketika form disubmit */
form.addEventListener("submit", async (e) => {
  e.preventDefault(); // Mencegah reload halaman saat form disubmit

  // Mengambil data dari form
  const data = {
    tanggal: form.tanggal.value,
    kategori: form.kategori.value,
    deskripsi: form.deskripsi.value,
    tipe_uang: form.tipe_uang.value,
    jumlah: form.jumlah.value,
  };

  // Mengirim data transaksi baru ke server menggunakan metode POST
  await fetch("http://localhost:3000/api/transactions", {
    method: "POST", // Metode HTTP POST untuk menambahkan data
    headers: { "Content-Type": "application/json" }, // Konten tipe JSON
    body: JSON.stringify(data), // Mengirim data sebagai JSON
  });

  form.reset(); // Mengosongkan form setelah data dikirim
  
  // Setelah transaksi ditambahkan, panggil fungsi untuk memperbarui ringkasan dan tabel transaksi
  fetchSummary();
  fetchTransactions();
});

/* Inisialisasi untuk memuat transaksi dan ringkasan saat halaman pertama kali dibuka */
fetchTransactions(); // Mengambil dan menampilkan data transaksi saat halaman dimuat
fetchSummary(); // Mengambil dan menampilkan ringkasan saat halaman dimuat

// Event listener untuk tombol menuju halaman grafik pengeluaran
document.getElementById("go-to-chart").addEventListener("click", () => {
  window.location.href = "chart.html"; // Mengarahkan ke halaman chart.html
});


//------------------------------ Bagian menampilkan data dan grafik pada chart.html ------------------------------//





//------------------------------ Bagian edit dan hapus data yang sudah di submit ------------------------------//



