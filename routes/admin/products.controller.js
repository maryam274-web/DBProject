const express = require("express");
const multer = require("multer");
const path = require("path");
let router = express.Router();
let Product = require("../../models/products.model")
let Category = require("../../models/categories.model");


//product details from db
router.get('/admin/products/create', async (req, res) => {
  const categories = await Category.find();
  res.render('admin/products/create', {
    layout: 'adminlayout',
    categories, 
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images"); // Path to save images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with original extension
  },
});
const upload = multer({ storage: storage });

// Handle new product form data
router.post('/admin/products/create', upload.single('productImage'), async (req, res) => {
  try {
    let data = req.body;
    if (req.file) {
      data.image = `/images/${req.file.filename}`;
    }
    const newProduct = new Product(data);
    await newProduct.save();
        
    // Finding the associated category and adding the new product to it
    let category = await Category.findById(data.categoryId);
    category.products.push(newProduct._id);
    await category.save();

    // return res.send(newProduct);                                           --displaying the newly created product's details.
    // return res.render("admin/product-form", { layout: "adminlayout" });    --allowing user to see the form again 
    
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error saving product.");
  }
});


router.get('/admin/products/:page?', async (req, res) => {
  try {
    //adding pagination
    let page = req.params.page;
    page = page ? Number(page) : 1;
    let pageSize = 12;
    let totalRecords = await Product.countDocuments();
    let totalPages = Math.ceil(totalRecords / pageSize);

      let products = await Product.find().populate('category')
      .limit(pageSize)
      .skip((page - 1) * pageSize);

      res.render('admin/products/index', {
          layout: 'adminlayout',
          pageTitle: 'Manage Products',
          products,
          page:page,
          pageSize:pageSize,
          totalPages:totalPages,
          totalRecords:totalRecords,
      });
  } catch (err) {
      console.error(err);
      res.status(500).send("Error retrieving products.");
  }
});


router.get('/admin/products/edit/:id', async(req, res) => {
  try {
    let product = await Product.findById(req.params.id).populate('category');
    const categories = await Category.find();

    res.render("admin/products/edit", {
      layout: "adminlayout",
      product,
      categories,
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading product edit page.');
  }
});

router.post('/admin/products/edit/:id', upload.single('productImage'), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    let data = req.body; 
    if (req.file) {
      data.image = `/images/${req.file.filename}`;
    }
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    res.redirect('/admin/products');
    
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating product.");
  }
});

router.post("/admin/products/delete/:id", async(req, res) => {
  try{
    let product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).send("Product not found.");
    }

    res.redirect('/admin/products');
    
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting product.");
  }
});

module.exports = router;
