const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static('public'));

const getPodaci = () => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'podaci.json'), 'utf8');
        return JSON.parse(data);
    } catch (err) { return { kategorije: [] }; }
};

app.get('/', (req, res) => { res.render('index'); });

app.get('/kategorija/:ime', (req, res) => {
    const podaci = getPodaci();
    const trazena = req.params.ime.toLowerCase();
    const pronadjena = podaci.kategorije.find(k => k.ime.toLowerCase() === trazena);
    if (pronadjena) { res.render('kategorija', { kategorija: pronadjena }); }
    else { res.status(404).send("Kategorija nije pronadjena"); }
});

app.post('/naruci', (req, res) => {
    const { email, artikal, kliker } = req.body;
    const klikerKod = Array.isArray(kliker) ? kliker.join('') : kliker;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'arminarman022@gmail.com',
            pass: 'dysohsqsxejhesrf'
        }
    });

    const mailZaMene = {
        from: 'arminarman022@gmail.com',
        to: 'arminarman022@gmail.com',
        subject: `NOVA NARUDŽBA: ${artikal}`,
        text: `Artikal: ${artikal}\nKupac: ${email}\nKliker Bon Kod: ${klikerKod}`
    };

    const mailZaKupca = {
        from: 'arminarman022@gmail.com',
        to: email,
        subject: 'Hvala na ukazanom povjerenju - CoreKeys',
        text: `Hvala na ukazanom povjerenju, vas kod se provjerava ocekujte u narednim minutama vasu licencu.\n\nLp. vas tim CoreKeys`
    };

    transporter.sendMail(mailZaMene, (err) => {
        if (err) return res.send("Greska kod mene: " + err);
        transporter.sendMail(mailZaKupca, (err2) => {
            if (err2) return res.send("Greska kod kupca: " + err2);
            res.send(`
                <div style="background:#0a0a0a; color:#ff0000; padding:50px; text-align:center; font-family:sans-serif; border:2px solid #ff0000;">
                    <h1>NARUDŽBA POSLANA!</h1>
                    <p style="color:white;">Provjerite vaš email za potvrdu.</p>
                    <a href="/" style="color:#ff0000;">Povratak na početnu</a>
                </div>
            `);
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server radi na http://localhost:${PORT}`));