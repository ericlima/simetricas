// Importando módulos necessários
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const crypto = require('crypto');
require('dotenv').config();

// Recuperando chave e IV do ficheiro .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Chave de 32 bytes
const INIT_VECTOR = process.env.INIT_VECTOR; // IV de 16 bytes

if (!ENCRYPTION_KEY || !INIT_VECTOR) {
    throw new Error('Por favor, configure ENCRYPTION_KEY e INIT_VECTOR no ficheiro .env');
}

// Função para criptografar o ficheiro
function encryptFile(inputFilePath, outputFilePath) {
    const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(INIT_VECTOR, 'hex'));

    const input = fs.createReadStream(inputFilePath);
    const output = fs.createWriteStream(outputFilePath);

    return new Promise((resolve, reject) => {
        input.pipe(cipher).pipe(output);

        output.on('finish', () => resolve(outputFilePath));
        output.on('error', (err) => reject(err));
    });
}

// Função para enviar o ficheiro criptografado
async function sendEncryptedFile(filePath) {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        const response = await axios.post('http://localhost:3000/decrypt', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        console.log('Resposta do servidor:', response.data);
    } catch (err) {
        console.error('Erro ao enviar o ficheiro:', err.message);
    }
}

// Caminhos de entrada e saída do ficheiro
const inputFilePath = 'ficheiro_original.txt'; // Substitua pelo caminho do seu ficheiro
const encryptedFilePath = 'ficheiro_encriptado.txt';

// Processo de criptografia e envio
(async () => {
    try {
        console.log('Criptografando o ficheiro...');
        await encryptFile(inputFilePath, encryptedFilePath);

        console.log('Enviando o ficheiro criptografado...');
        await sendEncryptedFile(encryptedFilePath);

        // Remover o ficheiro criptografado após envio
        fs.unlinkSync(encryptedFilePath);
        console.log('ficheiro criptografado enviado e removido com sucesso.');
    } catch (err) {
        console.error('Erro no processo:', err.message);
    }
})();
