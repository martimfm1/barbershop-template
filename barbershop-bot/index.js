const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const { createClient } = require('@supabase/supabase-js'); // Importar Supabase
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const express = require('express');

require('dotenv').config();

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let sock;

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sessao_whatsapp');

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Chrome'),
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
            console.log('\nbot conectado com sucesso!');
        }

        if (connection === 'close') {
            const codigoErro = lastDisconnect?.error?.output?.statusCode;
            const deveriaReiniciar = codigoErro !== DisconnectReason.loggedOut;
            if (deveriaReiniciar) {
                iniciarBot();
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

app.post('/api/webhook-agendamento', async (req, res) => {
    const { barbearia_id, cliente_id, servico_id, data_hora, numero_cliente, nome_cliente, nome_servico } = req.body;

    if (!numero_cliente || !data_hora || !barbearia_id || !servico_id) {
        return res.status(400).json({ error: 'Faltam dados obrigatórios (numero_cliente, data_hora, barbearia_id, servico_id).' });
    }

    if (!sock) {
        return res.status(503).json({ error: 'O bot ainda não está pronto.' });
    }

    try {
        console.log(`\n📬 Novo agendamento recebido para o número ${numero_cliente}...`);

        const { data: novoAgendamento, error: erroSupabase } = await supabase
            .from('agendamentos')
            .insert([
                {
                    barbearia_id: barbearia_id,
                    cliente_id: cliente_id || null,
                    servico_id: servico_id,
                    data_hora: data_hora,
                    aviso_confirmacao_enviado: true,
                    status: 'agendado'
                }
            ])
            .select();

        if (erroSupabase) {
            console.error('❌ ERRO DO SUPABASE:', erroSupabase);
            return res.status(500).json({ error: erroSupabase.message });
        }

        console.log(`Guardado no Supabase! ID do Agendamento: ${novoAgendamento[0].id}`);

        const dataObj = new Date(data_hora);
        const dataFormatada = dataObj.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
        const horaFormatada = dataObj.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

        const jid = `${numero_cliente}@s.whatsapp.net`;
        const mensagem = {
            text: `💈 *Agendamento Confirmado!* 💈\n\nOlá ${nome_cliente || 'Cliente'},\n\nO teu corte foi marcado com sucesso!\n\n💇‍♂️ *Serviço:* ${nome_servico || 'Cabelo/Barba'}\n📅 *Data:* ${dataFormatada}\n⏰ *Hora:* ${horaFormatada}\n\nObrigado pela preferência! 🔥`
        };

        await sock.sendMessage(jid, mensagem);

        return res.status(200).json({ 
            success: true, 
            message: 'Agendamento guardado no Supabase e WhatsApp enviado!',
            agendamento: novoAgendamento[0]
        });

    } catch (error) {
        console.error('❌ Erro geral no servidor:', error);
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`O servidor ligou! http://localhost:${PORT}`);
    iniciarBot();
});