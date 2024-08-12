
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


app.use('/upload/', express.static("upload/"));

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
      const uploadPath = 'upload/';
      // Ensure the uploads folder exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const filePath = path.join('upload', file.originalname);
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
  
    const imageUrl = `${req.protocol}://${req.get('host')}/upload/${req.file.filename}`;
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
  

  
  


  
  app.get("/login", (req, res) => {
    const { userId, password } = req.query;
    console.log(userId, password);

    const sql = `
        SELECT 
            cpa.id, 
            cpa.client_id, 
            cpa.client_intro_id, 
            cpa.parent_id, 
            cpa.position, 
            cpa.join_date, 
            cpa.client_entry_name, 
            cpa.client_entry_code, 
            cpa.client_account_code, 
            cpa.repurchase_wallet, 
            cpa.level_wallet, 
            cpa.cashback_wallet, 
            cpa.activated_pin, 
            cpa.activated_pin_cost, 
            cpa.activate_package_id, 
            cpa.activate_product_id, 
            cpa.activation_status, 
            cpa.activation_date, 
            cpa.activation_time, 
            cpa.blocked_status, 
            cpa.current_badge, 
            cpa.gpg_done, 
            cpa.current_club, 
            cpa.level, 
            cpa.level_paid, 
            cpa.reward_id, 
            cpa.reward_name, 
            cpa.task_assigned_date, 
            cpa.user_by, 
            cpa.user_type, 
            cpa.created_at, 
            cpa.updated_at, 
            cpa.mani_wallet, 
            cpa.shopping_wallet, 
            cpa.matching_bv, 
            cpa.scooty_wallet, 
            cpa.business_approval, 
            cp.business_type AS business_type
        FROM 
            client_profile_account AS cpa
        LEFT JOIN 
            client_profile_personal AS cp 
        ON 
            cp.client_id = cpa.client_id
        WHERE 
            cpa.client_id = ? 
        AND 
            cpa.client_entry_code = ? 
        AND 
            cp.business_type != ?
    `;

    const businessType = "Business"; // Assuming you're looking for this specific business type

    connection.query(sql, [userId, password,businessType], (err, result) => {
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
});


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


// app.get('/products', (req, res) => {

//   const {product_id}= req.query
//     const sql = `
//         SELECT 
//             mp.id, 
//             mp.pcode, 
//             mp.name, 
//             mp.category, 
//             mp.sub_category, 
//             mp.sub_sub_category, 
//             mp.brand, 
//             mp.details, 
//             mp.config_data, 
//             mp.old_image, 
//             mp.cby, 
//             mp.cdate, 
//             mp.status, 
//             mp.varient, 
//             mp.image, 
//             mc.name AS category_name, 
//             mb.name AS brand_name, 
//             ms.image AS image_sale,
//             ms.mrp AS mrp,
//             ms.price AS price,
//             ms.cart_limit AS cart_limit
//         FROM 
//             master_product mp
//         LEFT JOIN 
//             manage_category mc ON mp.category = mc.cat_id
//         LEFT JOIN 
//             manage_brand mb ON mp.brand = mb.brand_id
//         LEFT JOIN 
//             master_sale ms ON mp.pcode = ms.pcode
//         WHERE 
//            mp.pcode = ?
//     `;

//     connection.query(sql,[product_id], (err, results) => {
//         if (err) {
//             console.error('Error executing query:', err);
//             res.status(500).send('An error occurred while fetching products.');
//             return;
//         }
//         res.json(results);
//     });
// });


app.get("/allShops",(req,res)=>{
  const sql= `SELECT 
    cpp.auto_id, 
    cpp.client_id, 
    cpp.m_name, 
    cpp.first_name, 
    cpp.last_name, 
    cpp.m_dob, 
    cpp.m_sex, 
    cpp.m_father_name, 
    cpp.m_address, 
    cpp.m_city, 
    cpp.m_state, 
    cpp.district, 
    cpp.sub_division, 
    cpp.block, 
    cpp.panchayat, 
    cpp.m_pin, 
    cpp.m_country, 
    cpp.m_mobile, 
    cpp.m_email, 
    cpp.m_pan, 
    cpp.m_adhar_no, 
    cpp.bank_name, 
    cpp.bank_ac_holder, 
    cpp.bank_ac_no, 
    cpp.bank_branch, 
    cpp.bank_account_type, 
    cpp.bank_ifsc_code, 
    cpp.nominee_name, 
    cpp.nominee_relation, 
    cpp.nominee_age, 
    cpp.nominee_mobile, 
    cpp.wallet_type, 
    cpp.wallet_holder_name, 
    cpp.wallet_no, 
    cpp.photo, 
    cpp.adhaar_front_image, 
    cpp.adhaar_back_image, 
    cpp.pan_image, 
    cpp.cheque_image, 
    cpp.kyc_status, 
    cpp.kyc_remark, 
    cpp.kyc_date, 
    cpp.created_at, 
    cpp.updated_at, 
    cpp.whatsapp, 
    cpp.otp, 
    cpp.business_name, 
    cpp.licence, 
    cpp.licence_img, 
    cpp.gst, 
    cpp.pan, 
    cpp.street, 
    cpp.business_type,
    cpa.business_approval
FROM 
    client_profile_personal cpp
JOIN 
    client_profile_account cpa 
ON 
   cpp.client_id = cpa.client_id WHERE cpp.business_type='Business' AND cpa.business_approval='1';
`
connection.query(sql, (err, results) => {
  if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('An error occurred while fetching products.');
      return;
  }
  res.json(results);
});


})


app.get("/getProductId",(req,res)=>{
  const {client_id}= req.query
  console.log("clientid",client_id)
  const sql='SELECT distinct `pid` FROM `manage_lmc_order_details` WHERE cby=?'
  connection.query(sql,[client_id], (err, results) => {
    if (err) {
        console.error('Error executing query:', err);
        res.status(500).send('An error occurred while fetching products.');
        return;
    }
    res.json(results);
    console.log(results)
  });

})

app.get("/products",(req,res)=>{
   const {product_id}= req.query
   console.log(product_id,"productid")
   const sql=`SELECT 
    ms.id, 
    ms.sale_id, 
    ms.barcode, 
    ms.pcode, 
    ms.mrp, 
    ms.price, 
    ms.todays_offer, 
    ms.best_selling, 
    ms.cart_limit,  
    ms.stock_status, 
    ms.first_purchase, 
    ms.pincode, 
    ms.image AS sale_image, 
    ms.main_product, 
    mp.name, 
    mp.category, 
    mp.sub_category, 
    mp.sub_sub_category, 
    mp.brand, 
    mp.details, 
    mc.name AS category_name, 
    mb.name AS brand_name, 
    mp.image AS product_image
FROM 
    master_sale ms
JOIN 
    master_product mp  ON  ms.pcode = mp.pcode
JOIN 
  manage_category mc ON mp.category = mc.cat_id
JOIN 
 manage_brand mb ON mp.brand = mb.brand_id   

WHERE 
    ms.sale_id = ?;`

   connection.query(sql,[product_id], (err, results) => {
    if (err) {
        console.error('Error executing query:', err);
        res.status(500).send('An error occurred while fetching products.');
        return;
    }
    res.json(results);
  });

})

  app.get("/",(req,res)=>{
    res.send("Hello")
  })
  app.listen(port, () => {
    console.log("server is running", {port});
  })