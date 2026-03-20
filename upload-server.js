import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// 🌟 LA MAGIE EST ICI : On garde le fichier en RAM, on ne l'écrit plus sur le disque temporaire !
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload-local', upload.single('fichier'), async (req, res) => {
  try {
    const reference = req.body.reference.trim();
    const file = req.file;

    if (!file || !reference) {
      return res.status(400).json({ error: 'Fichier ou référence manquants.' });
    }

    // 1. Définir le dossier cible : src/assets/images/VELOS/{reference}
    const targetDir = path.resolve(__dirname, 'src', 'assets', 'images', 'VELOS', reference.trim());

    // 2. Créer le dossier s'il n'existe pas
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 3. Trouver le prochain numéro libre
    const files = fs.readdirSync(targetDir);
    let maxNum = 0;
    files.forEach(f => {
      const match = f.match(/^image_(\d+)\.webp$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (maxNum < num) maxNum = num;
      }
    });
    
    const nextNum = maxNum + 1;
    const newFileName = `image_${nextNum}.webp`;
    const targetPath = path.join(targetDir, newFileName);

    // 4. Convertir depuis la mémoire (file.buffer) et sauvegarder directement
    await sharp(file.buffer)
      .webp({ quality: 80 }) 
      .toFile(targetPath);

    // 🛑 PLUS AUCUN fs.unlinkSync() NÉCESSAIRE ! Le problème EBUSY n'existe plus.

    console.log(`✅ Fichier sauvegardé : ${targetPath}`);
    res.json({ message: 'Succès', fileName: newFileName, path: targetPath });

  } catch (error) {
    console.error("❌ Erreur d'upload :", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur local d'upload en mémoire démarré sur http://localhost:${PORT}`);
});