


const express = require("express");
const app = express();
const mysql = require("mysql");
const port = process.env.port || 3002;
const bodyParser = require("body-parser");
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');


app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));


app.use('/upload', express.static(path.join(__dirname, 'upload')));
app.use('/upload', express.static(path.join(__dirname, '..', 'upload')));


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});



const connection = mysql.createPool({
  host: "119.18.55.247",
  user: "mahilamediplex_website_user",
  password: "vz}@z2*+M{3g",
  database: "mahilamediplex_website_db",
  timezone: 'Asia/Kolkata'
});





function handleDisconnect() {
  connection.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting MySQL connection:', err);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log('Connected to MySQL');

      connection.release();
    }
  });

}

handleDisconnect();

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
    const imgName = req.query.imgName;

    if (!imgName) {
      return cb(new Error('imgName query parameter is required'), null);
    }


    let uploadPath;
    if (imgName == "aadhaarFront") {
      uploadPath = path.join(__dirname, '..', 'upload', 'aadhaar', 'front');
    }
    else if (imgName == "aadhaarBack") {
      uploadPath = path.join(__dirname, '..', 'upload', 'aadhaar', 'back');
    }
    else if (imgName == "photo") {
      uploadPath = path.join(__dirname, '..', 'upload', 'photo');
    }
    else if (imgName == "slip") {
      uploadPath = path.join(__dirname, '..', 'upload', 'slip');
    }
    else {
      uploadPath = path.join(__dirname, '..', 'upload', imgName);
    }


    // Check if the subfolder exists; if not, create it
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Save the file with its original name
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only certain file types (e.g., images)
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});



app.post('/mediplex/uploadImage', upload.single('image'), (req, res) => {
  const imgName = req.query.imgName;

  if (!req.file) {
    return res.status(400).send('No files were uploaded.');
  }

  // Construct the image URL
  let imageUrl
  if (imgName == "aadhaarFront") {
    imageUrl = `${req.protocol}://${req.get('X-Forwarded-Host') || req.get('host')}/upload/aadhaar/front/${req.file.filename}`;

  }
  else if (imgName == "aadhaarBack") {
    imageUrl = `${req.protocol}://${req.get('X-Forwarded-Host') || req.get('host')}/upload/aadhaar/back/${req.file.filename}`;

  }


  else {
    imageUrl = `${req.protocol}://${req.get('X-Forwarded-Host') || req.get('host')}/upload/${imgName}/${req.file.filename}`;

  }

  console.log(imageUrl);

  return res.status(200).send({
    message: 'File uploaded successfully.',
    imageUrl: imageUrl,
    imageName: req.file.filename // Return the image name for consistency
  });
});


app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(500).json({ message: err.message });
  } else if (err) {
    return res.status(500).json({ message: err.message });
  }
  next();
});






app.post('/mediplex/upload-images', upload.array('images', 10), (req, res) => {
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

app.get("/mediplex/login", (req, res) => {
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
            cp.bank_name,
            cp.bank_ac_no,
            cp.bank_ifsc_code,
            cp.business_type AS business_type,
            cp.first_name AS first_name,
            cp.m_mobile AS mobile,
            cp.photo AS user_image

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

  connection.query(sql, [userId, password, businessType], (err, result) => {
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


app.get("/mediplex/clientDetails", (req, res) => {
  const { client_id } = req.query
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


app.post('/mediplex/updateProfile', (req, res) => {
  console.log(req.body)

  const cdate_time = getCurrentDateTime();
  const {
    first_name,
    m_dob,
    m_father_name,
    m_address,
    m_city,
    m_state,
    district,
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
    bank_account_number,
    m_pan,
    client_id
  } = req.body;




  const query = `
      UPDATE client_profile_personal 
      SET first_name = ?, m_dob = ?, m_father_name = ?, m_address = ?, m_city = ?, m_state = ?, district=?, m_pin = ?, m_country = ?, m_mobile = ?, m_email = ?, photo = ?, created_at = ?, whatsapp = ? ,
      nominee_name=?, nominee_age=?,nominee_relation=?,nominee_mobile=?,bank_name=?,bank_ac_holder=?,bank_branch=?,bank_account_type=?,bank_ifsc_code=?,m_pan=?,bank_ac_no=?
      WHERE client_id = ?`;

  const values = [first_name, m_dob, m_father_name, m_address, m_city, m_state, district, m_pin, m_country, m_mobile, m_email, photo, cdate_time, whatsapp, nominee_name, nominee_age, nominee_relation, nominee_mobile, bank_name, bank_ac_holder, bank_branch, bank_account_type, bank_ifsc_code, m_pan, bank_account_number, client_id];

  connection.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating profile:', err);
      res.status(500).send('Error updating profile');
    } else {
      res.send('Profile updated successfully');
    }
  });
});


app.get("/mediplex/relation", (req, res) => {

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

app.post('/mediplex/change-password', (req, res) => {
  console.log(req.body)
  const { client_id, newPassword, oldPassword } = req.body;

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

app.post("/mediplex/updateKyc", (req, res) => {
  const { aadhar_front, aadhar_back, pan_card, bank_proof, client_id } = req.body
  console.log(req.body)
  const sql = 'UPDATE `client_profile_personal` SET `adhaar_front_image`=?,`adhaar_back_image`=?,`pan_image`=?,`cheque_image`=? WHERE client_id=?'
  connection.query(sql, [aadhar_front, aadhar_back, pan_card, bank_proof, client_id], (err, result) => {
    if (err) {
      console.error('Error updating profile:', err);
      res.status(500).send('Error updating profile');
    } else {
      res.send('Profile updated successfully');
      console.log("updated")
    }
  });
})



app.get("/mediplex/allShops", (req, res) => {
  const sql = `SELECT 
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


app.get("/mediplex/defaultShops", (req, res) => {
  const sql = `SELECT 
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
   cpp.client_id = cpa.client_id WHERE cpp.business_type='Business' AND cpa.default_shop='1';
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

app.get("/mediplex/getProductId", (req, res) => {
  const { client_id } = req.query
  // console.log("clientid", client_id)
  const sql = 'SELECT distinct `pid` FROM `manage_lmc_order_details` WHERE cby=? AND status=3'
  connection.query(sql, [client_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('An error occurred while fetching products.');
      return;
    }
    res.json(results);
    console.log(results)
  });

})

app.get("/mediplex/products", (req, res) => {
  const { product_id } = req.query
  console.log(product_id, "productid")
  const sql = `SELECT 
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
    ms.prescription,
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

  connection.query(sql, [product_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('An error occurred while fetching products.');
      return;
    }
    res.json(results);
  });

})

app.post("/mediplex/orderDetails", (req, res) => {
  const cdate_time = getCurrentDateTime();
  const { uid, lmc_id, pid, qty, barcode, cby } = req.body;

  const query = `INSERT INTO manage_temp_sale(uid, lmc_id, pid, qty, barcode, cby, cdate, status) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  connection.query(query, [uid, lmc_id, pid, qty, barcode, cby, cdate_time, '1'], (err, result) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Failed to insert data' });
      return;
    }
    res.status(201).json({ message: 'Data inserted successfully', insertId: result.insertId });
  });

})

app.get("/mediplex/details", (req, res) => {
  const sql = "SELECT * FROM `client_profile_personal'"
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('An error occurred while fetching products.');
      return;
    }
    res.json(results);
  });
})

app.get("/mediplex/getKYCData", (req, res) => {
  const client_id = req.query.client_id; // Use req.query to access query parameters

  if (!client_id) {
    return res.status(400).send('client_id is required.');
  }

  const sql = "SELECT adhaar_front_image, adhaar_back_image, pan_image, cheque_image FROM client_profile_personal WHERE client_id = ?";

  connection.query(sql, [client_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('An error occurred while fetching KYC data.');
    }

    res.json(results);
  });
});


app.get("/mediplex/directIncome", (req, res) => {

  const { client_id } = req.body
  const sql = "SELECT `id`, `user_id`, `amount`, `tds`, `admin`, `payable`, `cdate`, `cby`, `status` FROM direct_income WHERE user_id=?"

  connection.query(sql, [client_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('An error occurred while fetching KYC data.');
    }

    res.json(results);
  })
})

app.get("/mediplex/sponsorIncome", (req, res) => {

  const { client_id } = req.query
  console.log(client_id)
  const sql = "SELECT * FROM client_payout WHERE user_id=? AND pay_status=1"
  connection.query(sql, [client_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('An error occurred while fetching KYC data.');
    }

    res.json(results);
  })
})

app.get("/mediplex/dailyIncome", (req, res) => {

  const { client_id } = req.query
  const sql = `SELECT * FROM direct_income where user_id=? AND status=1`
  connection.query(sql, [client_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('An error occurred while fetching KYC data.');
    }

    res.json(results);
  })
})


app.get("/mediplex/healthPackage", (req, res) => {
  const sql = "SELECT * FROM `manage_package` WHERE STATUS='1';"
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('An error occurred while fetching KYC data.');
    }

    res.json(results);
  })

})

app.get("/mediplex/state", (req, res) => {
  const sql = "SELECT id, state FROM `master_states` WHERE country_id=100"
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('An error occurred while fetching KYC data.');
    }

    res.json(results);
  })

})


app.get("/mediplex/district", (req, res) => {
  const { state_id } = req.query; // Extract state_id from the request body
  console.log('state_id', state_id);

  const sql = "SELECT name, district_code FROM master_district WHERE state_id = ?";
  connection.query(sql, [state_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      console.log(results)
      return res.status(500).send('An error occurred while fetching district data.');
    }

    res.json(results);
  });
});


app.get("/mediplex/subDivision", (req, res) => {
  const { district_id } = req.query; // Extract state_id from the request body
  console.log('district_id', district_id);

  const sql = "SELECT sub_div_id, name FROM sub_division WHERE district=?";
  connection.query(sql, [district_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      console.log(results)
      return res.status(500).send('An error occurred while fetching district data.');
    }

    res.json(results);
  });
});

app.get("/mediplex/block", (req, res) => {
  const { subDivision_id } = req.query; // Extract state_id from the request body
  console.log('subDivision_id', subDivision_id);

  const sql = "SELECT block_id, name FROM master_block WHERE sub_division=?";
  connection.query(sql, [subDivision_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      console.log(results)
      return res.status(500).send('An error occurred while fetching district data.');
    }

    res.json(results);
  });
});


app.get("/mediplex/block", (req, res) => {
  const { subDivision_id } = req.query; // Extract state_id from the request body
  console.log('subDivision_id', subDivision_id);

  const sql = "SELECT block_id, name FROM master_block WHERE sub_division=?";
  connection.query(sql, [subDivision_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      console.log(results)
      return res.status(500).send('An error occurred while fetching district data.');
    }

    res.json(results);
  });
});

app.get("/mediplex/bankDetails", (req, res) => {
  const sql = " SELECT * FROM master_company_account WHERE show_status = 1"
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('An error occurred while fetching bank data.');
    }

    res.json(results);
  });
})


app.post('/mediplex/fund-request', (req, res) => {
  // Extract only the required fields from the request body
  console.log(req.body)
  const {
    name,
    mobile_no,
    client_id,
    user_id,
    slip,
    paid_amt,
    txt_no,
    package
  } = req.body;


  const query = `INSERT INTO client_fund_request 
  (pay_type_id,name, mobile_no, client_id, user_id, slip, paid_amt, created_at, txt_no, package) 
  VALUES (0,?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const currentDateTime = getCurrentDateTime(); // Assuming this function is defined


  connection.query(query, [name, mobile_no, client_id, user_id, slip, paid_amt, currentDateTime, txt_no, package], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json({ message: 'Data inserted successfully', insertId: result.insertId });
  });
});



app.get("/mediplex/fund-request-status", (req, res) => {

  const { client_id } = req.query

  console.log(client_id, "852")

  const sql = "SELECT req_id, pay_type_id, name, mobile_no, client_id, user_id, user_type, slip, paid_amt, status, created_at, txt_no, package, `remarks` FROM `client_fund_request` WHERE client_id=?"
  connection.query(sql, [client_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('An error occurred while fetching bank data.');
    }

    res.json(results);
  });

})

app.get("/mediplex/plans", (req, res) => {
  const { balance } = req.query;

  console.log("balance", balance)


  if (isNaN(balance) || balance < 0) {
    return res.status(400).send('Invalid balance parameter.');
  }

  const sql = `SELECT package_id, name, price,shopping_wallet_cashback,sponsor FROM manage_package WHERE price <= ${balance}`;


  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('An error occurred while fetching plans.');
    }

    res.json(results);
    console.log(results)
  });
});


app.get("/mediplex/activeUser", (req, res) => {
  const sql = `SELECT cpa.client_id, cpp.first_name AS client_name FROM  client_profile_account cpa 
  JOIN client_profile_personal cpp ON  cpa.client_id= cpp.client_id WHERE activation_status=0`
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('An error occurred while fetching plans.');
    }


    res.json(results);
    console.log(results)
  });
})

app.get("/mediplex/updateMainWallet", (req, res) => {
  const { newBalance, client_id } = req.query;
  console.log(req.query);

  const updateSql = 'UPDATE `client_profile_account` SET mani_wallet=? WHERE client_id=?';

  connection.query(updateSql, [newBalance, client_id], (err, results) => {
    if (err) {
      console.error('Error executing update query:', err);
      return res.status(500).send('An error occurred while updating the wallet.');
    }

    // If the update was successful, fetch the updated row
    const selectSql = 'SELECT * FROM `client_profile_account` WHERE client_id=?';

    connection.query(selectSql, [client_id], (err, updatedRow) => {
      if (err) {
        console.error('Error executing select query:', err);
        return res.status(500).send('An error occurred while fetching the updated row.');
      }

      res.json(updatedRow[0]); // Return the updated row as JSON
    });
  });
});


app.post("/mediplex/mainWalletLog", (req, res) => {

  const { client_id, user_id, amount } = req.body
  console.log(req.body)
  const remarks = `Activation For user id- ${user_id}`
  const cdate_time = getCurrentDateTime()


  const sql = 'INSERT INTO `main_wallet_log`(`client_id`, `trans_type`, `amount`, `remarks`, `remark_status`, `status`, `pdate`) VALUES (?, ?, ?, ?, ?, ?, ?)';

  connection.query(sql, [client_id, 'Dr', amount, remarks, '0', '1', cdate_time], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('An error occurred while inserting the log.');
    }

    // Respond with the ID of the newly inserted log
    res.json({
      message: 'Log inserted successfully',
      logId: results.insertId
    });
  });



})

app.post("/mediplex/updateClientProfileAccount", (req, res) => {
  const { shopping_wallet, activate_package_id, client_id } = req.body
  const cdate_time = getCurrentDateTime()

  const sql = "UPDATE `client_profile_account` SET `activate_package_id`=?,`activation_status`=?,`activation_date`=?,`matching_bv`=?, shopping_wallet=? WHERE client_id=?"
  connection.query(sql, [activate_package_id, '1', cdate_time, 0, shopping_wallet, client_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('An error occurred while inserting the log.');
    }

    res.json({
      message: 'Log updated successfully'
    })
  })
})


app.get("/mediplex/getParentId", (req, res) => {
  const { userId } = req.query
  const sql = "SELECT parent_id FROM `client_profile_account` WHERE client_id=?"
  connection.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error executing select query:', err);
      return res.status(500).send('An error occurred while fetching the updated row.');
    }

    console.log(results)
    res.json(results); // Return the updated row as JSON
  });

})

app.post('/mediplex/client_payout', async (req, res) => {
  const cdate_time = getCurrentDateTime()
  const {
    income_type, user_id, ref_user_id, total_amt, total_commission, tds_charges,
    admin_charges, payable_income, pay_status
  } = req.body;

  console.log(req.body)

  // Prepare the SQL query
  const sqlInsertPayout = `
    INSERT INTO client_payout (
      income_type, user_id, ref_user_id, total_amt, total_commission,
      tds_charges, admin_charges, payable_income, payout_date,
      pay_status, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Execute the query
  try {
    connection.query(sqlInsertPayout, [
      income_type, user_id, ref_user_id, total_amt, total_commission,
      tds_charges, admin_charges, payable_income, cdate_time,
      pay_status, cdate_time
    ], (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return res.status(500).json({ error: 'Database error occurred' });
      }

      res.status(201).json({ message: 'Payout inserted successfully', payoutId: result.insertId });
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
});


app.get("/mediplex/clientAccountLog", (req, res) => {
  const sql = "SELECT * FROM `client_account_log` ORDER BY id DESC"

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error executing select query:', err);
      return res.status(500).send('An error occurred while fetching the updated row.');
    }


    res.json(results);
  });
})

app.get("/mediplex/clientName", (req, res) => {
  const { root, left, right } = req.query;
  console.log(req.query, "1052");

  // Collect all client IDs
  const clientIds = [root, left, right].filter(Boolean);

  if (clientIds.length === 0) {
    return res.status(400).send('No client IDs provided.');
  }


  // Prepare SQL query with placeholders
  const sql = `SELECT cpp.first_name, cpp.client_id, cpa.activation_status as active
  FROM client_profile_personal cpp
  JOIN client_profile_account AS cpa 
  ON cpa.client_id = cpp.client_id
  WHERE cpp.client_id IN (${clientIds.map(() => '?').join(',')})`;

  connection.query(sql, clientIds, (err, results) => {
    if (err) {
      console.error('Error executing select query:', err);
      return res.status(500).send('An error occurred while fetching the data.');
    }
    res.json(results);
  });
})

app.get("/mediplex/directMemberData", (req, res) => {
  const { parent_id } = req.query

  console.log(parent_id)

  const sql = `SELECT cpa.client_id, cpa.parent_id, cpa.position, cpa.join_date, cpa.activate_package_id, cpa.activate_product_id, cpa.activation_status, cpa.activation_date,
cpp.first_name as client_name,
mp.name as package_name
FROM client_profile_account cpa 
JOIN client_profile_personal AS cpp ON 
 cpa.client_id = cpp.client_id
 JOIN manage_package AS mp ON
 cpa.activate_package_id= mp.package_id
 
WHERE cpa.parent_id=? `

  connection.query(sql, [parent_id], (error, results) => {
    if (error) {
      console.error('Error executing select query:', error);
      return res.status(500).send('An error occurred while fetching the data.');
    }
    res.json(results);
  })


})


app.get("/mediplex/downlineList", (req, res) => {
  const { client_id } = req.query
  console.log(client_id)
  const sql = `SELECT 
    cpa.client_id, 
    cpa.parent_id, 
    cpa.position, 
    cpa.join_date, 
    cpa.activate_package_id, 
    cpa.activate_product_id, 
    cpa.activation_status, 
    cpa.activation_date,
    cpp.first_name as client_name,
    mp.name as package_name
FROM 
    client_profile_account cpa 
JOIN 
    client_profile_personal AS cpp 
    ON cpa.client_id = cpp.client_id
LEFT JOIN 
    manage_package AS mp 
    ON cpa.activate_package_id = mp.package_id 
WHERE 
    cpa.client_id = ?;
`

  connection.query(sql, [client_id], (error, results) => {
    if (error) {
      console.error('Error executing select query:', error);
      return res.status(500).send('An error occurred while fetching the data.');
    }
    res.json(results);
  })


})


app.get("/mediplex/clients", (req, res) => {
  const { client_id } = req.query
  console.log(client_id)
  const sql = "SELECT * FROM client_profile_account"

  connection.query(sql, (error, results) => {
    if (error) {
      console.error('Error executing select query:', error);
      return res.status(500).send('An error occurred while fetching the data.');
    }
    res.json(results);
  })


})


app.post("/mediplex/addWithdrawDetails", (req, res) => {

  const { user_id, total } = req.body
  console.log(req.body)
  const cdate_time = getCurrentDateTime()
  const sql = `INSERT INTO user_payment_history( user_id, total,cdate,status) VALUES (?,?,?,?) `
  connection.query(sql, [user_id, total, cdate_time, '9'], (error, results) => {
    if (error) {
      console.error('Error executing select query:', error);
      return res.status(500).send('An error occurred while fetching the data.');
    }
    res.status(200).json({ message: 'Inserted successfully', result: results });

  })
})



app.get("/mediplex/getWithdrawData", (req, res) => {
  const { client_id } = req.query

  const sql = "SELECT * FROM `user_payment_history` WHERE user_id=?"

  connection.query(sql, [client_id], (error, results) => {
    if (error) {
      console.error('Error executing select query:', error);
      return res.status(500).send('An error occurred while fetching the data.');
    }
    res.status(200).json(results);

  })


})


app.get("/mediplex/orderHistory",(req,res)=>{
  const {uid}= req.query
  const sql=`SELECT  
    mts.uid, 
    mts.lmc_id, 
    mts.pid, 
    mts.qty, 
    mts.barcode, 
    mts.cdate, 
    mts.status,
    ms.mrp,
    ms.price,mp.name,ms.image as sale_image, mp.image as product_image
FROM manage_temp_sale mts
JOIN master_sale ms
    ON mts.pid = ms.sale_id
JOIN
master_product mp
on ms.pcode= mp.pcode    
WHERE mts.uid =? ORDER BY mts.id DESC;`
  connection.query(sql,[uid],(err,result)=>{
    if(err){
     res.send(err.message)
    }

    res.send(result)
 })

})


app.get("/mediplex/master_sale",(req,res)=>{
  const sql="Select * from manage_temp_sale"
  connection.query(sql,(result,error)=>{
    if(error){
      res.send(error)
    }
    res.send(result)
  })
})



app.get("/mediplex", (req, res) => {
  res.send("Hello")
})
app.listen(port, () => {
  console.log("server is running", { port });
})