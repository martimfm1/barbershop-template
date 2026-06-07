const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const { createClient } = require('@supabase/supabase-js'); // Import Supabase
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
                console.log('\nBot connected successfully!');
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
        return res.status(400).json({ error: 'Missing required fields (numero_cliente, data_hora, barbearia_id, servico_id).' });
    }

    if (!sock) {
        return res.status(503).json({ error: 'Bot is not ready yet.' });
    }

    try {
        console.log(`\n📬 New appointment received for number ${numero_cliente}...`);

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
            console.error('❌ SUPABASE ERROR:', erroSupabase);
            return res.status(500).json({ error: erroSupabase.message });
        }

        console.log(`Saved to Supabase! Appointment ID: ${novoAgendamento[0].id}`);

        const dataObj = new Date(data_hora);
        const dataFormatada = dataObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        const horaFormatada = dataObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        const jid = `${numero_cliente}@s.whatsapp.net`;
        const mensagem = {
            text: `💈 *Appointment Confirmed!* 💈\n\nHello ${nome_cliente || 'Customer'},\n\nYour haircut has been scheduled successfully!\n\n💇‍♂️ *Service:* ${nome_servico || 'Hair/Beard'}\n📅 *Date:* ${dataFormatada}\n⏰ *Time:* ${horaFormatada}\n\nThanks for choosing us! 🔥`
        };

        await sock.sendMessage(jid, mensagem);

        return res.status(200).json({ 
            success: true, 
            message: 'Appointment saved to Supabase and WhatsApp sent!',
            agendamento: novoAgendamento[0]
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server started! http://localhost:${PORT}`);
    iniciarBot();
});