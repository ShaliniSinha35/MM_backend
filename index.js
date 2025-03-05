


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





app.post("/mediplex/register", (req, res) => {
  const cdate_time = getCurrentDateTime();
  const { name, mobile, password } = req.body.data;
  
  console.log(req.body);
  const random = Math.floor(1000 + Math.random() * 9000);

  const client_id = `EMM${random}`;

  


  // Query to check if the mobile number already exists
  const checkQuery = `SELECT mobile FROM user_register_account WHERE mobile = ?`;

  connection.query(checkQuery, [mobile], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Failed to check existing data" });
      return;
    }

    // If mobile number exists, return a message
    if (results.length > 0) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    // Query to insert new user
    const insertQuery = `
      INSERT INTO user_register_account (client_id, client_entry_name, mobile, client_entry_code, user_type, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(
      insertQuery,
      [client_id, name, mobile, password, "user App", cdate_time, "Active"],
      (err, result) => {
        if (err) {
          console.error("Error executing query:", err);
          res.status(500).json({ error: "Failed to insert data" });
          return;
        }

        // Query to fetch the inserted row using the mobile number
        const fetchQuery = `
          SELECT * FROM user_register_account WHERE mobile = ?
        `;

        connection.query(fetchQuery, [mobile], (err, insertedRow) => {
          if (err) {
            console.error("Error fetching inserted row:", err);
            res.status(500).json({ error: "Failed to fetch inserted data" });
            return;
          }

          console.log("User registered successfully:", insertedRow[0]);

          res.status(201).json({
            message: "User registered successfully",
            user: insertedRow[0], // Return the inserted row
          });
        });
      }
    );
  });
});


app.get("/mediplex/userlogin", (req, res) => {
  const { mobile, password} = req.query;
  console.log(req)

  // Query to check if the mobile number exists
  const checkQuery = `SELECT * FROM user_register_account WHERE mobile = ? AND client_entry_code = ?`;

  connection.query(checkQuery, [mobile, password], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Failed to check existing data' });
      return;
    }

    // If mobile number exists, return the user data
    if (results.length > 0) {
      res.status(200).json(results[0]);
      return;
    }

    res.status(404).json({ message: 'User not found' });
  });
})

app.get("/mediplex/verify", (req, res) => {
  const { client_id } = req.query;
  const sql = "SELECT COUNT(*) AS count FROM `user_register_account` WHERE client_id=?";
  connection.query(sql, [client_id], (err, result) => {
    if (err) {
      res.status(500).send("ClientId not found");
      return;
    }

    const count = result[0].count; 
    console.log("Count:", count);

    if (count === 0) {
      res.status(404).send(null);
    } else {
      console.log("User verify");
      res.status(200).json(result);
    }
  });
});




app.get("/mediplex/clientDetails", (req, res) => {
  const { client_id } = req.query
  const sql = "SELECT * FROM `user_register_account` WHERE client_id=?"
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
    m_address,
    m_mobile,
    m_email,
    photo,
    client_id
  } = req.body;




  const query = `
      UPDATE user_register_account
      SET client_entry_name = ?, address = ?, mobile = ?, email = ?, image = ?, updated_at = ?
      WHERE client_id = ?`;

  const values = [first_name, m_address, m_mobile, m_email, photo, cdate_time, client_id];

  connection.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating profile:', err);
      res.status(500).send('Error updating profile');
    } else {
      res.send('Profile updated successfully');
    }
  });
});




app.post('/mediplex/change-password', (req, res) => {
  console.log(req.body)
  const { client_id, newPassword, oldPassword } = req.body;

  const sql = `UPDATE user_register_account SET client_entry_code = ? WHERE client_id = ? AND client_entry_code = ?`;
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





app.get("/mediplex/allShops", (req, res) => {
  const sql = `SELECT 
     
    cpp.client_id, 
    cpp.m_name, 
    cpp.first_name, 
    cpp.last_name, 
    cpp.m_mobile,  
    cpp.business_name, 
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
    cpp.client_id, 
    cpp.m_name, 
    cpp.first_name, 
    cpp.last_name, 
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
    cpp.photo, 
    cpp.business_name, 
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
    ms.batch_no,
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
  const { uid, order_id, lmc_id, wallet_type, shoppingWallet, mainWallet,  cby,  payment_type, location, address,coupon_code,coupon_value } = req.body;

  console.log(order_id, payment_type)


  const query = `INSERT INTO user_orders(uid,order_id, lmc_id,wallet_type,shopping_wallet_used,main_wallet_used, cby,payment_type, cdate, status,location,address,coupon_code,coupon_value) 
                   VALUES (?,?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?)`;

  connection.query(query, [uid, order_id, lmc_id,wallet_type, shoppingWallet, mainWallet, uid, payment_type, cdate_time, '1', location,address,coupon_code,coupon_value], (err, result) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Failed to insert data' });
      return;
    }
    res.status(201).json({ message: 'Data inserted successfully', insertId: result.insertId });
  });

})

app.post("/mediplex/orderProductDetails", (req, res) => {
  const cdate_time = getCurrentDateTime();
  const { uid, order_id, pid, qty, barcode, cby, image, mrp, offer_price } = req.body;

  const query = `INSERT INTO user_orders_details(uid,order_id,pid, mrp,offer_price,qty, barcode, cby, prescription, cdate, status) 
                   VALUES (?,?, ?, ?, ?, ?, ?, ?, ?,?,?)`;

  connection.query(query, [uid, order_id, pid,mrp, offer_price, qty,  barcode,uid, image,cdate_time, '1'], (err, result) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Failed to insert data' });
      return;
    }
    res.status(201).json({ message: 'Data inserted successfully', insertId: result.insertId });
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



app.get("/mediplex/updateMainWallet", (req, res) => {
  const { newBalance, client_id } = req.query;
  console.log(req.query);

  const updateSql = 'UPDATE `user_register_account` SET mani_wallet=? WHERE client_id=?';

  connection.query(updateSql, [newBalance, client_id], (err, results) => {
    if (err) {
      console.error('Error executing update query:', err);
      return res.status(500).send('An error occurred while updating the wallet.');
    }

    // If the update was successful, fetch the updated row
    const selectSql = 'SELECT * FROM `user_register_account` WHERE client_id=?';

    connection.query(selectSql, [client_id], (err, updatedRow) => {
      if (err) {
        console.error('Error executing select query:', err);
        return res.status(500).send('An error occurred while fetching the updated row.');
      }

      res.json(updatedRow[0]); // Return the updated row as JSON
    });
  });
});

app.get("/mediplex/updateShoppingWallet", (req, res) => {
  const { newBalance, client_id } = req.query;


  const updateSql = 'UPDATE `user_register_account` SET shopping_wallet=? WHERE client_id=?';

  connection.query(updateSql, [newBalance, client_id], (err, results) => {
    if (err) {
      console.error('Error executing update query:', err);
      return res.status(500).send('An error occurred while updating the wallet.');
    }

    // If the update was successful, fetch the updated row
    const selectSql = 'SELECT * FROM `user_register_account` WHERE client_id=?';

    connection.query(selectSql, [client_id], (err, updatedRow) => {
      if (err) {
        console.error('Error executing select query:', err);
        return res.status(500).send('An error occurred while fetching the updated row.');
      }

      res.json(updatedRow[0]); // Return the updated row as JSON
    });
  });
});




app.get("/mediplex/clients", (req, res) => {
  const { client_id } = req.query
  console.log(client_id)
  const sql = "SELECT * FROM user_register_account"

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



app.get("/mediplex/master_sale", (req, res) => {
  const sql = "Select * from user_orders"
  connection.query(sql, (result, error) => {
    if (error) {
      res.send(error)
    }
    res.send(result)
  })
})


app.get("/mediplex/bannerImage", (req, res) => {
  const sql = `SELECT id, image, status FROM app_banner where status= "Publish" `

  connection.query(sql, (err, result) => {
    if (err) {
      res.send(err)
    }
    res.send(result)
  })
})



app.get("/mediplex/verifyCart", (req, res) => {
  const { product_id } = req.query;

  const sql = `SELECT  COUNT(*) FROM master_sale WHERE sale_id=?`

  connection.query(sql, [product_id], (err, result) => {
    if (err) {

      res.status(500).send('ClientId not found');
      return;
    }

    if (result.length === 0) {
      res.status(404).send(null);
    } else {
      console.log('item verify');
      res.status(200).json(result);
    }
  })
})



app.get("/mediplex/wallet_amt", (req, res) => {
  console.log(req.query)
  const { client_id } = req.query
  console.log(client_id)
  const sql = "SELECT mani_wallet, shopping_wallet FROM user_register_account where client_id=?"

  connection.query(sql, [client_id], (error, results) => {
    if (error) {
      console.error('Error executing select query:', error);
      return res.status(500).send('An error occurred while fetching the data.');
    }
    res.json(results);
  })


})


app.post("/mediplex/cancelOrder", (req, res) => {
  const cdate_time = getCurrentDateTime();
  const { user_id, order_id, pid, price,type} = req.body;
  console.log(req.body);

  // Query to fetch `main_wallet_used` and `shopping_wallet_used` from `user_orders`
  const selectWalletQuery = `
    SELECT main_wallet_used, shopping_wallet_used, payment_type
    FROM user_orders
    WHERE uid = ? AND order_id = ? 
  `;

  connection.query(selectWalletQuery, [user_id, order_id], (err, results) => {
    if (err) {
      console.error("Error fetching wallet data:", err);
      return res.status(500).json({ error: "Database query failed" });
    }

    // Check if the order exists
    if (results.length === 0) {
      return res.status(404).json({ error: "No order found for this uid and order_id" });
    }

    const { main_wallet_used, shopping_wallet_used,payment_type } = results[0];

    // Query to update the status of the order
    const updateOrderStatusQuery = `
      UPDATE user_orders_details
      SET 
        status = 2,
        cdate = ?,
        type= ?
      WHERE uid = ? AND order_id = ? AND pid = ?
    `;

    connection.query(updateOrderStatusQuery, [cdate_time, type, user_id, order_id, pid], (updateOrderErr) => {
      if (updateOrderErr) {
        console.error("Error updating order status:", updateOrderErr);
        return res.status(500).json({ error: "Failed to update order status" });
      }

      // If payment type is "cash," skip wallet updates
      if (payment_type.toLowerCase() === "cash") {
        return res.status(200).json({
          message: "Order canceled successfully. No wallet updates required for cash payment.",
        });
      }

      // Query to add wallet values back to the `user_register_account` table
      const updateProfileQuery = `
        UPDATE user_register_account
        SET 
          shopping_wallet = shopping_wallet + ?,
          updated_at = ?
        WHERE client_id = ?
      `;

      connection.query(updateProfileQuery, [price, cdate_time, user_id], (updateProfileErr, updateResults) => {
        if (updateProfileErr) {
          console.error("Error updating client profile:", updateProfileErr);
          return res.status(500).json({ error: "Failed to update client profile" });
        }

        // Check if any rows were affected
        if (updateResults.affectedRows === 0) {
          return res.status(404).json({ error: "No client profile found for the given client_id" });
        }

        // Fetch the updated wallet values
        const fetchUpdatedWalletQuery = `
          SELECT mani_wallet, shopping_wallet 
          FROM user_register_account 
          WHERE client_id = ?
        `;

        connection.query(fetchUpdatedWalletQuery, [user_id], (fetchErr, fetchResults) => {
          if (fetchErr) {
            console.error("Error fetching updated wallet values:", fetchErr);
            return res.status(500).json({ error: "Failed to fetch updated wallet values" });
          }

          if (fetchResults.length === 0) {
            return res.status(404).json({ error: "Client profile not found after update" });
          }

          const { mani_wallet, shopping_wallet } = fetchResults[0];
          return res.status(200).json({
            message: "Order canceled and wallet values added successfully",
            added_main_wallet: mani_wallet,
            added_shopping_wallet: shopping_wallet,
          });
        });
      });
    });
  });
});


app.post("/mediplex/updateOrderDetails", (req, res) => {
  const cdate_time = getCurrentDateTime();
  const { user_id, order_id } = req.body;

  // Validate input
  if (!user_id || !order_id) {
    return res.status(400).json({ error: "Missing required fields: user_id or order_id" });
  }

  console.log("Request body:", req.body);

  const updateOrderStatusQuery = `
    UPDATE user_orders
    SET 
      status = 2,
      cdate = ?   
    WHERE uid = ? AND order_id = ? 
  `;

  connection.query(updateOrderStatusQuery, [cdate_time, user_id, order_id], (updateOrderErr, results) => {
    if (updateOrderErr) {
      console.error("Error updating order status:", updateOrderErr);
      return res.status(500).json({ error: "Failed to update order status" });
    }

    if (results.affectedRows === 0) {
      // No rows were updated, possibly due to an invalid user_id or order_id
      return res.status(404).json({ error: "Order not found or already updated" });
    }

    console.log("Order status updated successfully");
    res.status(200).json({ message: "Order updated successfully", affectedRows: results.affectedRows });
  });
});

   

app.post('/mediplex/validateCoupon', (req, res) => {
  const { couponCode, cartValue } = req.body;



  if (!couponCode) {
    return res.status(400).json({ error: 'Invalid input. Provide couponCode.' });
  }

  const sql = 'SELECT * FROM `coupon_code` WHERE `coupon_code` = ? AND status = "active"';

  connection.query(sql, [couponCode], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Failed to check existing data.' });
    }

    // Check if the coupon exists
    if (results.length === 0) {
      return res.status(404).json({ error: 'Coupon code does not exist.' });
    }

    const coupon = results[0];

    // Check if the coupon is active
    const currentDate = new Date();
    const startDate = new Date(coupon.start_date);
    const endDate = new Date(coupon.end_date);

    if (currentDate < startDate || currentDate > endDate || coupon.status !== 'active') {
      return res.status(400).json({ error: 'Coupon code is not valid or has expired.' });
    }

    // Check if the minimum cart value is met
    if (cartValue < coupon.minimum_cart_value) {
      return res.status(400).json({
        error: 'Cart value does not meet the requirement for this coupon, Total amount must be at least Rs ' + coupon.minimum_cart_value,
        minimumCartValue: coupon.minimum_cart_value,
      });
    }

    // Successful validation
    return res.json({
      message: coupon.success_msg || 'Coupon applied successfully!',
      discountValue: coupon.discount_value,
      maxDiscount: coupon.max_discount,
      couponUsedType: coupon.coupon_type,
      type:coupon.type
    });
  });
});

app.get("/mediplex/coupons", (req, res) => {  

  const sql="SELECT * FROM `coupon_code` WHERE status='active'"

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('An error occurred while fetching the data.');
    }
    res.json(results);
  });

})




app.get("/mediplex/allProductOrders", (req, res) => {
  const { uid } = req.query;
  if (!uid) {
    return res.status(400).send({ error: "User ID (uid) is required" });
  }


  const sql = `
      SELECT  
        mts.uid, 
        mts.cdate, 
        mts.status,
        mts.location,
        mts.delivery_date,
        mts.delivery_status,
        mts.address,
        mts.order_id,
        mts.payment_type,
        cpp.business_name

      FROM user_orders mts
JOIN client_profile_personal cpp 
        ON mts.lmc_id = cpp.client_id
      WHERE mts.uid = ? 
      ORDER BY mts.id DESC;
    `;

  connection.query(sql, [uid], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send({ error: "Database query failed" });
    }

    res.status(200).send(result);
  });
});



app.get("/mediplex/allProductDetails", (req, res) => {
  const { uid,order_id } = req.query;



  const sql = `
  SELECT uod.id, uod.order_id, uod.uid, uod.pid,
   uod.qty, uod.mrp, uod.offer_price, uod.prescription, 
   uod.barcode, uod.batch_details, uod.status, uod.cby, uod.cdate,ms.price,mp.name 
  FROM user_orders_details as uod
   JOIN master_sale ms
        ON uod.pid = ms.sale_id
      JOIN master_product mp
        ON ms.pcode = mp.pcode  
  WHERE uid = ? AND order_id = ?
  ORDER BY id DESC;
`;


  connection.query(sql, [uid,order_id], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send({ error: "Database query failed" });
    }

    res.status(200).send(result);
  });
});


// API to insert data into shopping_wallet_log
app.post('/mediplex/shopping-wallet-log', (req, res) => {
  console.log(req.body.params)
  const cdate=getCurrentDateTime()
  const { order_id,product_id,shopping_wallet,user_id, reason,status } = req.body.params;



  const query = 'INSERT INTO shopping_wallet_log (order_id,product_id,shopping_wallet, cdate, user_id, reason,status) VALUES (?, ?, ?, ?, ?,?,?)';
  const values = [order_id,product_id, shopping_wallet, cdate, user_id, reason,status];

  connection.query(query, values, (err, result) => {
      if (err) {
          console.error('Error inserting data:', err);
          return res.status(500).json({ error: 'Database insertion failed' });
      }
      res.json({ success: true, message: 'Data inserted successfully', insertId: result.insertId });
  });
});


app.get("/mediplex/shoppingWalletDetails",(req,res)=>{
  const query="SELECT * FROM `shopping_wallet_log`"
  connection.query(query, (err, result) => {
    if (err) {
        console.error('Error inserting data:', err);
    }
    res.json(result)
});
})


app.get("/mediplex/searchProducts", (req, res) => {
  let { search, client_id } = req.query;


  if (!client_id || client_id.trim() === "") {
    return res.status(400).json({ error: "client_id is required" });
  }

  search = search && search.trim() !== "" ? `%${search.trim().toLowerCase()}%` : null;

  let sql = `
    SELECT 
    DISTINCT ms.id, ms.sale_id, ms.barcode, ms.batch_no, 
      ms.pcode, ms.mrp, ms.price, ms.todays_offer, 
      ms.best_selling, ms.cart_limit, ms.stock_status, 
      ms.first_purchase, ms.pincode, ms.image AS sale_image, 
      ms.main_product, mp.name AS product_name, mp.category, 
      mp.sub_category, mp.sub_sub_category, mp.brand, 
      mp.details, mc.name AS category_name, 
      mb.name AS brand_name, mp.image AS product_image
    FROM master_sale ms
    JOIN manage_lmc_order_details lod ON ms.sale_id = lod.pid 
    JOIN master_product mp ON ms.pcode = mp.pcode
    JOIN manage_category mc ON mp.category = mc.cat_id
    JOIN manage_brand mb ON mp.brand = mb.brand_id
    WHERE lod.cby IS NOT NULL AND lod.status = 3`;

  let values = [];

  if (search) {
    sql += ` AND LOWER(mp.name) LIKE ?`;
    values.push(search);
  }

  // console.log("Executing SQL:", sql, "Values:", values);

  connection.query(sql, values, (err, results) => {
    if (err) {
      console.error("SQL Execution Error:", err);
      return res.status(500).json({ error: "Database query failed." });
    }
    res.json(results);
  });
});






// app.post("/mediplex/save-token", (req, res) => {
//   const cdate_time = getCurrentDateTime();
//   const { token } = req.body;
  
//   // Query to check if the mobile number already exists
//   const checkQuery = `SELECT token FROM user_app_token WHERE token = ?`;

//   connection.query(checkQuery, [token], (err, results) => {
//     if (err) {
//       console.error("Error executing query:", err);
//       res.status(500).json({ error: "Failed to check existing data" });
//       return;
//     }

//     // If mobile number exists, return a message
//     if (results.length > 0) {
//       return;
//     }

//     // Query to insert new user
//     const insertQuery = `
//       INSERT INTO user_app_token (token,c_date) VALUES (?,?)`;

//     connection.query(
//       insertQuery,[token,cdate_time],
//       (err, result) => {
//         if (err) {
//           console.error("Error executing query:", err);
//           res.status(500).json({ error: "Failed to insert data" });
//           return;
//         }
 
//       }
//     );
//   });
// });


// // Send Notification to All Users
// app.post('/mediplex/send-to-all', async (req, res) => {
//   const { title, body, data } = req.body;

//   // Fetch all tokens
//   connection.query('SELECT token FROM user_app_token', async (err, results) => {
//       if (err) {
//           return res.status(500).send({ success: false, error: err.message });
//       }

//       if (results.length === 0) {
//           return res.status(404).send({ success: false, message: 'No tokens found' });
//       }

//       const expoPushTokens = results.map((row) => row.expo_push_token);

//       // Create messages for each token
//       const messages = expoPushTokens.map((token) => ({
//           to: token,
//           sound: 'default',
//           title: title || 'Notification',
//           body: body || 'You have a new message!',
//           data: data || {},
//       }));

//       try {
//           // Send notifications in batches
//           const responses = await Promise.all(
//               messages.map((message) =>
//                   fetch('https://exp.host/--/api/v2/push/send', {
//                       method: 'POST',
//                       headers: {
//                           Accept: 'application/json',
//                           'Content-Type': 'application/json',
//                       },
//                       body: JSON.stringify(message),
//                   })
//               )
//           );

//           res.status(200).send({
//               success: true,
//               message: 'Notifications sent to all users!',
//               responses,
//           });
//       } catch (error) {
//           res.status(500).send({
//               success: false,
//               error: error.message,
//           });
//       }
//   });
// });


// Start the server


app.listen(3000, () => {
  console.log("Server is running on port 3000");
});


app.get("/mediplex", (req, res) => {
  res.send("Hello")
})
app.listen(port, () => {
  console.log("server is running", { port });
})