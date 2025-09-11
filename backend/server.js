require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); 
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');


const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

//path

  app.use(express.urlencoded({extended:true}))  
 

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Routes
app.use('/api/auth', authRoutes);


 // Serve frontend files
app.use(express.static(path.join(__dirname, 'frontend')));


 
app.get('/', (req, res) => {
     res.sendFile(path.join(__dirname, '..', 'frontend',  'auth.html'));
});

// Start server
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 ClearFlow API is running on port ${PORT}`);
});

