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

// POPRAVLJENO: Sigurnije učitavanje podataka
const ucitajPodatke = () => {
    try {
        const filePath = path.join(__dirname, 'podaci.json');
        if (!fs.existsSync(filePath)) {
            console.error("Fajl podaci.json ne postoji!");
            return { artikli: [] };
        }
        const data = fs.readFileSync(filePath, 'utf8');
        const parsedData = JSON.parse(data);
        return parsedData || { artikli: [] };
    } catch (err) {
        console.error("Greška pri čitanju JSON fajla:", err);
        return { artikli: [] };
    }
};

// Rute
app.get('/', (req, res) => {
    const podaci = ucitajPodatke();
    // Dodana provjera da artikli nisu undefined
    const listaArtikala = podaci.artikli || [];
    res.render('index', { artikli: listaArtikala });
});

app.get('/kategorija/:id', (req, res) => {
    const podaci = ucitajPodatke();
    const listaArtikala = podaci.artikli || [];
    const artikal = listaArtikala.find(a => a.id == req.params.id);
    
    if (artikal) {
        res.render('kategorija', { artikal });
    } else {
        res.status(404).send('Artikal nije pronađen');
    }
});

// Postavke za slanje emaila
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

app.post('/naruci', async (req, res) => {
    const { email, artikalId } = req.body;
    const podaci = ucitajPodatke();
    const listaArtikala = podaci.artikli || [];
    const artikal = listaArtikala.find(a => a.id == artikalId);

    if (!artikal) return res.status(400).send('Greška pri odabiru artikla.');

    const mailOptions = {
        from: `"CoreKeys Shop" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Vaš ključ za ${artikal.naslov}`,
        html: `
            <div style="background: #0a0a0a; color: white; padding: 20px; font-family: sans-serif; border: 2px solid red;">
                <h2 style="color: red;">Hvala na kupovini!</h2>
                <p>Vaš digitalni ključ za <b>${artikal.naslov}</b> je:</p>
                <div style="background: #1a1a1a; padding: 15px; border-left: 5px solid red; font-size: 20px; font-weight: bold; letter-spacing: 2px;">
                    ${artikal.kljuc}
                </div>
                <p style="font-size: 12px; color: gray; margin-top: 20px;">Ugodno igranje želi vam CoreKeys Shop.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.send('Uspješno! Provjerite svoj email (i spam folder).');
    } catch (error) {
        console.error("Greška kod slanja:", error);
        res.status(500).send('Greska kod servera: ' + error.message);
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server radi na portu ${PORT}`);
});