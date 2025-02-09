// Importando módulos necessários
require('dotenv').config(); // Para carregar variáveis do .env
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Configuração do Multer para upload de ficheiros
const upload = multer({ dest: 'uploads/' });

// Recuperando chave e IV do ficheiro .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Chave de 32 bytes
const INIT_VECTOR = process.env.INIT_VECTOR; // IV de 16 bytes

if (!ENCRYPTION_KEY || !INIT_VECTOR) {
    throw new Error('Por favor, configure ENCRYPTION_KEY e INIT_VECTOR no ficheiro .env');
}

// Endpoint para upload e decifragem do ficheiro
app.post('/decrypt', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const outputFilePath = `decrypted_${req.file.originalname}`;

    // Criando o decipher
    const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(INIT_VECTOR, 'hex'));

    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(path.join(__dirname, outputFilePath));

    // Realizando a decifragem
    input.pipe(decipher).pipe(output);

    output.on('finish', () => {
        // Removendo o ficheiro original após decifragem
        fs.unlinkSync(filePath);

        res.download(outputFilePath, (err) => {
            if (err) {
                console.error('Erro ao enviar o ficheiro decifrado:', err);
                res.status(500).send('Erro ao processar o ficheiro.');
            }

            // Removendo o ficheiro decifrado após o download
            fs.unlinkSync(outputFilePath);
        });
    });

    output.on('error', (err) => {
        console.error('Erro ao decifrar o ficheiro:', err);
        res.status(500).send('Erro ao processar o ficheiro.');
    });
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
