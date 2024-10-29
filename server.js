// server.js
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route to save appointment data
app.post('/api/appointments', async (req, res) => {
    const { date, time, name, phone, email, message } = req.body;

    // Insert appointment data into the database
    const sql = 'INSERT INTO appointments (date, time, name, phone, email, message) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [date, time, name, phone, email, message];

    try {
        await db.promise().query(sql, values);

        // Setup Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS,
            },
        });

        // Email options
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Appointment Confirmation',
            text: `Dear Doctor,\n\nYou have a new appointment booked with the following details:\n\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nDate: ${date}\nTime: ${time}\nMessage: ${message}\n\nThank you!`,
        };

        // Send email
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Appointment booked successfully and confirmation email sent!' });
    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({ message: 'Error booking appointment' });
    }
});

app.get('/api/getappointments', async (req, res) => {
    const sql = 'SELECT * FROM appointments ORDER BY created_at DESC';

    try {
        const [rows, fields] = await db.promise().query(sql);
        res.status(200).json(rows); // Respond with the fetched data
    } catch (error) {
        console.error('Error retrieving appointments:', error);
        res.status(500).json({ message: 'Error retrieving appointments' });
    }
});

app.delete('/api/deleteappointments/:id', async (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM appointments WHERE id = ?';

    try {
        const [result] = await db.promise().query(sql, [id]);

        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Appointment not found' });
        } else {
            res.status(200).json({ message: 'Appointment deleted successfully' });
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ message: 'Error deleting appointment' });
    }
});


app.post('/api/send-email', async (req, res) => {
    const { email, emailSubject, emailBody } = req.body;

    try {
        // Setup Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS,
            },
        });

        // Email options
        const mailOptions = {
            from: process.env.EMAIL,
            to: email, // Recipient email
            subject: emailSubject, // Email subject from request body
            text: emailBody, // Email message from request body
        };

        // Send email
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Error sending email' });
    }
});

app.post('/api/add-video', async (req, res) => {
    const { title, description, videourl } = req.body;

    // SQL query to insert data into the videos table
    const sql = 'INSERT INTO videos (title, description, videourl) VALUES (?, ?, ?)';
    const values = [title, description, videourl];

    try {
        // Insert video data into the database
        await db.promise().query(sql, values);
        res.status(200).json({ message: 'Video added successfully!' });
    } catch (error) {
        console.error('Error adding video:', error);
        res.status(500).json({ message: 'Error adding video' });
    }
});



app.get('/api/get-videos', async (req, res) => {
    const sql = 'SELECT * FROM videos ORDER BY created_at DESC';

    try {
        // Fetch all videos from the database, ordered by the latest
        const [rows] = await db.promise().query(sql);
        res.status(200).json(rows); // Respond with the fetched video data
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ message: 'Error fetching videos' });
    }
});

app.delete('/api/delete-video/:id', async (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM videos WHERE id = ?';

    try {
        // Delete video by id from the database
        const [result] = await db.promise().query(sql, [id]);
        
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Video deleted successfully' });
        } else {
            res.status(404).json({ message: 'Video not found' });
        }
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ message: 'Error deleting video' });
    }
});



app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // Hash the provided password using SHA-256
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    const values = [email, hashedPassword];

    try {
        // Fetch the user from the database
        const [rows] = await db.promise().query(sql, values);

        if (rows.length > 0) {
            // User found, respond with success
            res.status(200).json({ message: 'Login successful!', user: rows[0] });
        } else {
            // No user found, respond with unauthorized
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});





app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
