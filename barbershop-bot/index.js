const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');
const pino = require('pino');
const express = require('express');
const cors = require('cors');

require('dotenv').config();

const app = express();
app.use(cors()); 
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yzrdpwsfqsazxvwsjobf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cmRwd3NmcXNhenh2d3Nqb2JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE0Njc2MSwiZXhwIjoyMDk1NzIyNzYxfQ.t_NcCLfrSmjWXeMnY5FUGbLSu59Qos7Snn5SI5avr5E';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let sock;
let qrCodeData = null;
let qrCodeRaw = null;
let connectionStatus = 'offline';

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
            try {
                qrCodeRaw = qr;
                qrCodeData = await QRCode.toDataURL(qr);
                connectionStatus = 'pairing';
                console.log('\n⏳ Novo QR Code gerado. Aceda a http://localhost:3001/api/qr ou http://localhost:3001/api/qr.png');
            } catch (err) {
                console.error('❌ Erro a gerar o QR Code:', err);
            }
        }

        if (connection === 'open') {
            console.log('\n✅ Bot connected successfully!');
            connectionStatus = 'connected';
            qrCodeData = null; 
            qrCodeRaw = null;
        }

        if (connection === 'close') {
            connectionStatus = 'offline';
            const codigoErro = lastDisconnect?.error?.output?.statusCode;
            const deveriaReiniciar = codigoErro !== DisconnectReason.loggedOut;
            
            console.log(`\n⚠️ Bot desconectado. Código de erro: ${codigoErro}`);
            
            if (deveriaReiniciar) {
                iniciarBot();
            } else {
                console.log('\n🛑 Sessão terminada. Um novo QR code será necessário.');
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

app.get('/api/qr', (req, res) => {
    if (connectionStatus === 'connected') {
        return res.status(200).json({ status: 'connected', message: 'Bot already connected!' });
    }
    
    if (qrCodeData && connectionStatus === 'pairing') {
        return res.status(200).json({ status: 'pairing', qr: qrCodeData });
    }

    return res.status(200).json({ status: 'loading', message: 'Generating QR code or bot offline...' });
});

app.get('/api/qr.png', async (req, res) => {
    if (connectionStatus === 'connected') {
        return res.status(404).send('Bot já conectado. Não é necessário QR Code.');
    }
    
    if (qrCodeRaw && connectionStatus === 'pairing') {
        try {
            const buffer = await QRCode.toBuffer(qrCodeRaw);
            res.type('png');
            return res.send(buffer);
        } catch (err) {
            return res.status(500).send('Erro a gerar imagem do QR Code.');
        }
    }

    return res.status(404).send('QR code ainda não está disponível. Aguarde uns segundos.');
});

app.post('/api/webhook-agendamento', async (req, res) => {
    const { barbearia_id, cliente_id, servico_id, data_hora, numero_cliente, nome_cliente, nome_servico } = req.body;

    if (!numero_cliente || !data_hora || !barbearia_id || !servico_id) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (!sock || connectionStatus !== 'connected') {
        return res.status(503).json({ error: 'Bot is not ready or offline.' });
    }

    try {
        console.log(`\n📬 New appointment received for number ${numero_cliente}...`);

        const { data: novoAgendamento, error: erroSupabase } = await supabase
            .from('agendamentos')
            .insert([{
                barbearia_id,
                cliente_id: cliente_id || null,
                servico_id,
                data_hora,
                aviso_confirmacao_enviado: true,
                status: 'agendado'
            }])
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
            message: 'Appointment saved and WhatsApp sent!',
            agendamento: novoAgendamento[0]
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

app.post("/api/restart", async (req, res) => {
  console.log("🔄 A reiniciar o bot a pedido do dashboard...");
  botStatus = "loading";
  currentQrUrl = null;auth_info_baileys
  res.json({ success: true, message: "A reiniciar..." });
  
  try {
    await client.destroy();
    client.initialize();
  } catch (error) {
    console.error("Erro ao reiniciar:", error);
    botStatus = "offline";
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server started! http://localhost:${PORT}`);
    iniciarBot();
});