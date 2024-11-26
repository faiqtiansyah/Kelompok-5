// Import modul yang diperlukan
const express = require("express"); // Framework untuk membuat aplikasi web
const bodyParser = require("body-parser"); // Middleware untuk parsing JSON request body
const cors = require("cors"); // Middleware untuk mengizinkan akses antar domain (CORS)
const mysql = require("mysql2"); // Modul untuk koneksi ke MySQL

// Inisialisasi aplikasi
const app = express();
app.use(cors()); // Mengizinkan permintaan dari semua asal (CORS)
app.use(bodyParser.json()); // Parsing request body dalam format JSON

// Koneksi ke database MySQL
const db = mysql.createConnection({
  host: "localhost", // Host database
  user: "root", // Username MySQL
  password: "", // Password MySQL (kosong untuk default)
  database: "keuangan_db", // Nama database yang digunakan
});

// Membuka koneksi ke database MySQL
db.connect((err) => {
  if (err) {
    // Menangani kesalahan koneksi database
    console.error("Koneksi database gagal:", err);
    process.exit(1); // Keluar dari aplikasi jika koneksi gagal
  }
  console.log("Terhubung ke database MySQL");
});

// Endpoint: Mendapatkan semua transaksi
app.get("/api/transactions", (req, res) => {
  const query = "SELECT * FROM transactions"; // Query untuk mengambil semua transaksi
  db.query(query, (err, results) => {
    if (err) {
      // Menangani kesalahan saat query
      console.error("Error saat mengambil data:", err);
      return res.status(500).json({ error: "Gagal mengambil data" });
    }

    // Format tanggal dan jumlah sebelum mengirim data ke frontend
    const formattedResults = results.map((transaction) => {
      const date = new Date(transaction.tanggal); // Ubah tanggal menjadi objek Date
      const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
      return {
        ...transaction,
        tanggal: date.toLocaleDateString("id-ID", options), // Format tanggal ke format lokal Indonesia
        jumlah: transaction.jumlah, // Tetap hanya angka input
      };
    });

    res.json(formattedResults); // Kirim data transaksi yang diformat ke frontend
  });
});

// Endpoint: Menambahkan transaksi baru
app.post("/api/transactions", (req, res) => {
  // Ambil data transaksi dari request body
  const { tanggal, kategori, deskripsi, tipe_uang, jumlah } = req.body;

  // Validasi input: semua field wajib harus terisi dan jumlah harus valid
  if (!tanggal || !kategori || !tipe_uang || !jumlah || isNaN(jumlah)) {
    return res.status(400).json({ error: "Field wajib tidak boleh kosong atau jumlah tidak valid!" });
  }

  // Query untuk menambahkan transaksi baru ke database
  const query = "INSERT INTO transactions (tanggal, kategori, deskripsi, tipe_uang, jumlah) VALUES (?, ?, ?, ?, ?)";
  const values = [tanggal, kategori, deskripsi, tipe_uang, parseFloat(jumlah)]; // Nilai transaksi yang akan dimasukkan

  db.query(query, values, (err, result) => {
    if (err) {
      // Menangani kesalahan saat menambahkan transaksi
      console.error("Error saat menambahkan transaksi:", err);
      return res.status(500).json({ error: "Gagal menambahkan transaksi" });
    }

    // Kirim respon berisi data transaksi yang baru ditambahkan
    res.json({
      id: result.insertId, // ID dari transaksi yang baru saja ditambahkan
      tanggal,
      kategori,
      deskripsi,
      tipe_uang,
      jumlah,
    });
  });
});

// Endpoint: Mendapatkan ringkasan transaksi (pemasukan, pengeluaran, saldo)
app.get("/api/summary", (req, res) => {
  const query = "SELECT tipe_uang, SUM(jumlah) AS total FROM transactions GROUP BY tipe_uang"; // Query untuk mendapatkan total berdasarkan tipe_uang
  db.query(query, (err, results) => {
    if (err) {
      // Menangani kesalahan saat query
      console.error("Error saat mengambil data:", err);
      return res.status(500).json({ error: "Gagal mengambil data ringkasan" });
    }

    // Menghitung total pemasukan dan pengeluaran
    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    results.forEach((row) => {
      if (row.tipe_uang === "Pemasukan") {
        totalPemasukan = row.total;
      } else if (row.tipe_uang === "Pengeluaran") {
        totalPengeluaran = row.total;
      }
    });

    // Menghitung saldo (pemasukan dikurangi pengeluaran)
    const saldo = totalPemasukan - totalPengeluaran;

    // Kirim data ringkasan ke frontend
    res.json({
      totalPemasukan,
      totalPengeluaran,
      saldo,
    });
  });
});

// Menjalankan server di port yang ditentukan
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

// Endpoint: Mendapatkan pengeluaran berdasarkan kategori
app.get("/api/pengeluaran-kategori", (req, res) => {
  const query = `
    SELECT kategori, SUM(jumlah) AS total
    FROM transactions
    WHERE tipe_uang = 'Pengeluaran'
    GROUP BY kategori
  `; // Query untuk mendapatkan total pengeluaran berdasarkan kategori

  db.query(query, (err, results) => {
    if (err) {
      // Menangani kesalahan saat query
      console.error("Error saat mengambil data pengeluaran per kategori:", err);
      return res.status(500).json({ error: "Gagal mengambil data pengeluaran" });
    }

    // Kirim data pengeluaran per kategori ke frontend
    res.json(results);
  });
});


//------------------------------ Bikin tabel data terurut di bawah grafik ------------------------------//

// Endpoint: Mendapatkan pengeluaran berdasarkan kategori terurut
app.get("/api/pengeluaran-kategori-sorted", (req, res) => {
  const query = `
    SELECT kategori, SUM(jumlah) AS total
    FROM transactions
    WHERE tipe_uang = 'Pengeluaran'
    GROUP BY kategori
    ORDER BY total DESC
  `; // Query untuk mendapatkan total pengeluaran berdasarkan kategori dan diurutkan dari terbesar

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error saat mengambil data pengeluaran per kategori:", err);
      return res.status(500).json({ error: "Gagal mengambil data pengeluaran" });
    }

    res.json(results); // Kirim data yang diurutkan ke frontend
  });
});


//------------------------------ Bagian edit dan hapus data yang sudah di submit ------------------------------//



