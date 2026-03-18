import sharp from "sharp";
import formidable from "formidable";
import fs from "fs";
import connectToDatabase from "../../lib/db";
import User from "../../lib/models/User";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Erro no upload" });
    }

    try {
      const file = files.file?.[0] || files.file;

      if (!file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const filePath = file.filepath || file.path;

      if (!filePath) {
        return res.status(400).json({ error: "Arquivo inválido" });
      }

      const fileBuffer = fs.readFileSync(filePath);

      // 🔥 compressão
      const compressed = await sharp(fileBuffer)
        .resize(200, 200, { fit: "cover" })
        .jpeg({ quality: 60 })
        .toBuffer();

      // 🔥 converte para base64
      const base64 = compressed.toString("base64");

      // 🔥 conecta no banco
      await connectToDatabase();

      // ⚠️ TEMPORÁRIO: pega qualquer usuário
      const user = await User.findOne();

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // 🔥 salva avatar
      user.avatar = base64;
      await user.save();

      return res.status(200).json({
        message: "Imagem comprimida e salva com sucesso!",
        size: compressed.length,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao processar imagem" });
    }
  });
}
