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
      const file = files.file?.[0] || files.file;

      if (!file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const filePath = file.filepath || file.path;

      if (!filePath) {
        return res.status(400).json({ error: "Arquivo inválido" });
      }

      const fileBuffer = fs.readFileSync(filePath);

      const compressed = await sharp(fileBuffer)
        .resize(200, 200, { fit: "cover" })
        .jpeg({ quality: 60 })
        .toBuffer();

      return res.status(200).json({
        message: "Imagem comprimida com sucesso!",
        size: compressed.length,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao processar imagem" });
    }
  });
}
