import sharp from "sharp";
import formidable from "formidable";
import fs from "fs";

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
      const file = files.file;

      if (!file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const fileBuffer = fs.readFileSync(file.filepath);

      // 🔥 compressão com sharp
      const compressed = await sharp(fileBuffer)
        .resize(200, 200)
        .jpeg({ quality: 60 })
        .toBuffer();

      // 👉 aqui você pode salvar (Mongo, S3, etc)
      // por enquanto só retorna sucesso

      return res.status(200).json({
        message: "Imagem comprimida com sucesso!",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao processar imagem" });
    }
  });
}
