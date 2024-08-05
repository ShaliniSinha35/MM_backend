
const connection = require('./config/dbConfig');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors= require('cors');
const { port } = require('./config/config');
console.log("8",port)
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));


app.use('/uploads/', express.static("uploads/"));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true); 
  next();
});

function getCurrentDateTime() {
    let date_time = new Date();
    let date = ("0" + date_time.getDate()).slice(-2);
    let month = ("0" + (date_time.getMonth() + 1)).slice(-2);
    let year = date_time.getFullYear();
    let hours = ("0" + date_time.getHours()).slice(-2);
    let minutes = ("0" + date_time.getMinutes()).slice(-2);
    let seconds = ("0" + date_time.getSeconds()).slice(-2);
    let cdate_time = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
    return cdate_time;
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = 'uploads/';
      // Ensure the uploads folder exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const filePath = path.join('uploads', file.originalname);
      // Check if file exists and remove it before saving the new file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      cb(null, file.originalname);
    },
  });
  
  const upload = multer({ storage: storage });
  
  app.post('/upload', upload.single('image'), (req, res) => {
    console.log("upload api called");
    if (!req.file) {
      return res.status(400).send('No files were uploaded.');
    }
  
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    console.log(imageUrl);
  
    return res.status(200).send({ message: 'File uploaded successfully.', imageUrl: imageUrl });
  });

  app.post('/upload-images', upload.array('images', 10), (req, res) => {
    if (!req.files) {
      return res.status(400).send('No files were uploaded.');
    }
  
    // Get the file details
    const fileDetails = req.files.map(file => ({
      filename: file.filename,
      path: file.path
    }));
  
    res.status(200).json({
      message: 'Files uploaded successfully!',
      files: fileDetails
    });
  });
  

  
  


  
  app.get("/login",(req,res)=>{
    const {userId,password}= req.query
    console.log(userId,password)
    const sql= "SELECT * FROM `client_profile_account`  WHERE client_id=? && client_entry_code = ?"
  connection.query(sql, [userId, password], (err, result) => {
    if (err) {
        console.error('Error searching for user: ' + err.stack);
        res.status(500).send('Error searching for user');
        return;
    }

    if (result.length === 0) {
        console.log('User not found');
        res.status(404).send(null);
    } else {
        console.log('User found');
        res.status(200).json(result[0]); // Send the user data back as JSON
    }
});

  })

  app.get("/clientDetails",(req,res)=>{
    const {client_id}= req.query
    const sql = "SELECT * FROM `client_profile_personal` WHERE client_id=?"
    connection.query(sql, [client_id], (err, result) => {
        if (err) {
         
            res.status(500).send('ClientId not found');
            return;
        }
    
        if (result.length === 0) {
            res.status(404).send(null);
        } else {
            console.log('User found');
            res.status(200).json(result);
        }
    });

  })


  app.post('/updateProfile', (req, res) => {

    const cdate_time = getCurrentDateTime();
    const {
      first_name,
      m_dob,
      m_father_name,
      m_address,
      m_city,
      m_state,
      m_pin,
      m_country,
      m_mobile,
      m_email,
      photo,
      whatsapp,
      nominee_name,
      nominee_age,
      nominee_relation,
      nominee_mobile,
      bank_name,
      bank_ac_holder,
      bank_branch,
      bank_account_type,
      bank_ifsc_code,
      m_pan,
      client_id
    } = req.body;
  
    const query = `
      UPDATE client_profile_personal 
      SET first_name = ?, m_dob = ?, m_father_name = ?, m_address = ?, m_city = ?, m_state = ?, m_pin = ?, m_country = ?, m_mobile = ?, m_email = ?, photo = ?, created_at = ?, whatsapp = ? ,
      nominee_name=?, nominee_age=?,nominee_relation=?,nominee_mobile=?,bank_name=?,bank_ac_holder=?,bank_branch=?,bank_account_type=?,bank_ifsc_code=?,m_pan=?
      WHERE client_id = ?`;
  
    const values = [first_name, m_dob, m_father_name, m_address, m_city, m_state, m_pin, m_country, m_mobile, m_email, photo, cdate_time, whatsapp,nominee_name,nominee_age,nominee_relation,nominee_mobile,bank_name,bank_ac_holder,bank_branch, bank_account_type,bank_ifsc_code,m_pan, client_id];
  
    connection.query(query, values, (err, result) => {
      if (err) {
        console.error('Error updating profile:', err);
        res.status(500).send('Error updating profile');
      } else {
        res.send('Profile updated successfully');
      }
    });
  });

  // SELECT * FROM `nominee_relation` WHERE STATUS="1"
  app.get("/relation",(req,res)=>{

    const sql = "SELECT * FROM `nominee_relation` WHERE STATUS='1'"
    connection.query(sql, (err, result) => {
        if (err) {
         
            res.status(500).send('no relation');
            return;
        }
    
        if (result.length === 0) {
            res.status(404).send(null);
        } else {
          
            res.status(200).json(result);
        }
    });

  })

  app.post('/change-password', (req, res) => {
    console.log(req.body)
    const { client_id, newPassword,oldPassword } = req.body;
  
    const sql = `UPDATE client_profile_account SET client_entry_code = ? WHERE client_id = ? AND client_entry_code = ?`;
    connection.query(sql, [newPassword, client_id, oldPassword], (err, result) => {
      if (err) {
        console.error('Error changing password:', err);
        res.status(500).send('Error changing password');
        return;
      }
      
      if (result.affectedRows === 0) {
        console.log('No matching records found or no changes made');
        res.status(404).send('No matching records found or incorrect current password');
      } else {
        console.log('Password changed successfully');
        res.status(200).send('Password changed successfully');
      }
    });
  });

  app.post("/updateKyc",(req,res)=>{
    const {aadhar_front,aadhar_back,pan_card,bank_proof,client_id}=req.body
    const sql = 'UPDATE `client_profile_personal` SET `adhaar_front_image`=?,`adhaar_back_image`=?,`pan_image`=?,`cheque_image`=? WHERE client_id=?'
    connection.query(sql, [aadhar_front,aadhar_back,pan_card,bank_proof,client_id], (err, result) => {
      if (err) {
        console.error('Error updating profile:', err);
        res.status(500).send('Error updating profile');
      } else {
        res.send('Profile updated successfully');
      }
    });
  })

  app.get("/",(req,res)=>{
    res.send("Hello")
  })
  app.listen(port, () => {
    console.log("server is running", {port});
  })