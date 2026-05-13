const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Postavke za EJS i statične fajlove
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// FUNKCIJA ZA UCITAVANJE PODATAKA (Popravljeno da ne izbacuje Error)
const ucitajPodatke = () => {
    try {
        const filePath = path.join(__dirname, 'podaci.json');
        if (!fs.existsSync(filePath)) {
            console.error("Fajl podaci.json nedostaje!");
            return { artikli: [] };
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Greska pri ucitavanju JSON-a:", err);
        return { artikli: [] };
    }
};

// RUTA ZA POCETNU STRANICU
app.get('/', (req, res) => {
    const podaci = ucitajPodatke();
    res.render('index', { artikli: podaci.artikli || [] });
});

// RUTA ZA DETALJE ARTIKLA (Rjesava problem "Artikal nije pronadjen")
app.get('/kategorija/:id', (req, res) => {
    const podaci = ucitajPodatke();
    const listaArtikala = podaci.artikli || [];
    // Koristimo == da poredimo ID bez obzira je li broj ili tekst
    const artikal = listaArtikala.find(a => a.id == req.params.id);
    
    if (artikal) {
        res.render('kategorija', { artikal });
    } else {
        res.status(404).send('Zao nam je, artikal sa tim ID-om nije pronadjen u podaci.json');
    }
});

// KONFIGURACIJA ZA EMAIL (Koristi tvoje podatke sa Rendera)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// RUTA ZA NARUDZBU
app.post('/naruci', async (req, res) => {
    const { email, artikalId } = req.body;
    const podaci = ucitajPodatke();
    const artikal = (podaci.artikli || []).find(a => a.id == artikalId);

    if (!artikal) return res.status(400).send('Greska: Artikal ne postoji.');

    const mailOptions = {
        from: `"CoreKeys Shop" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Vas kljuc: ${artikal.naslov}`,
        html: `
            <div style="background: #000; color: #fff; padding: 25px; border: 2px solid #0056b3; font-family: sans-serif;">
                <h1 style="color: #0056b3;">Uspjesna kupovina!</h1>
                <p>Kljuc za <b>${artikal.naslov}</b>:</p>
                <div style="background: #111; padding: 15px; border: 1px dashed #0056b3; font-size: 22px; font-weight: bold; text-align: center;">
                    ${artikal.kljuc}
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">Hvala vam na povjerenju, CoreKeys Shop.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.send('Uspjesno! Kljuc je poslan na vas email.');
    } catch (error) {
        console.error("Greska kod slanja maila:", error);
        res.status(500).send('Greska na serveru: ' + error.message);
    }
});

// POKRETANJE SERVERA
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server je spreman i radi na portu ${PORT}`);
});