export default async function handler(req, res) {
  // CORS biar bisa dipanggil dari InfinityFree
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;
    const message = body?.message?.trim();

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const model = "models/gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;

    const rules = `
Kamu adalah chatbot untuk website butik kebaya bernama "Tiasafara" yang berlokasi di Ciamis.

Aturan:
1. Jawab dalam Bahasa Indonesia, ramah, lembut, sopan.
2. Panggil pengguna "kak", sebut dirimu "aku".
3. Fokus bantu soal produk kebaya Tiasafara, rekomendasi model, ukuran (S–XL & custom), cara checkout, pengiriman & pembayaran, kontak admin WA.
4. Jika ditanya di luar topik butik, jawab sopan bahwa kamu fokus pada produk dan layanan Tiasafara.
5. Jawaban singkat 3–5 kalimat, jelas, persuasif supaya user tertarik checkout.
6. Bisa beri contoh kata-kata seperti:
   - "Model ini cocok banget buat kak..."
   - "Kalau kak butuh bantuan pilih ukuran, aku bantu banget ya..."
   - "Boleh kak checkout langsung di website biar barangnya aman kebooking."
7. Ingatkan bahwa stok dan harga bisa berubah dan bisa hubungi admin via WhatsApp.
`;

    const payload = {
      contents: [
        {
          parts: [
            { text: rules },
            { text: "Pertanyaan dari pengguna: " + message }
          ]
        }
      ]
    };

    const apiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      return res
        .status(apiRes.status)
        .json({ error: "api_error", status: apiRes.status });
    }

    const data = await apiRes.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Maaf kak, aku lagi kesulitan menjawab. Coba lagi sebentar ya.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server_error" });
  }
}
