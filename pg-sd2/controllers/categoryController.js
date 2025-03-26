const Category = require('../models/Category');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.getAll(req.session.userId);
    res.render('categories/index', {
      title: 'Categories',
      categories: categories
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Server Error');
    res.redirect('/dashboard');
  }
};

exports.getAddCategory = (req, res) => {
  res.render('categories/add', {
    title: 'Add Category'
  });
};

exports.postAddCategory = async (req, res) => {
  try {
    const { category_name, budget_limit } = req.body;
    
    // Validate input
    if (!category_name) {
      req.flash('error', 'Category name is required');
      return res.redirect('/categories/add');
    }
    
    const categoryData = {
      user_id: req.session.userId,
      category_name,
      budget_limit: budget_limit || null
    };
    
    await Category.create(categoryData);
    req.flash('success', 'Category added successfully');
    res.redirect('/categories');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Server Error');
    res.redirect('/categories/add');
  }
};

exports.getEditCategory = async (req, res) => {
  try {
    const category = await Category.getById(req.params.id, req.session.userId);
    
    if (!category) {
      req.flash('error', 'Category not found');
      return res.redirect('/categories');
    }
    
    res.render('categories/edit', {
      title: 'Edit Category',
      category: category
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Server Error');
    res.redirect('/categories');
  }
};

exports.postEditCategory = async (req, res) => {
  try {
    const { category_name, budget_limit } = req.body;
    
    // Validate input
    if (!category_name) {
      req.flash('error', 'Category name is required');
      return res.redirect(`/categories/edit/${req.params.id}`);
    }
    
    const categoryData = {
      category_name,
      budget_limit: budget_limit || null
    };
    
    const updated = await Category.update(req.params.id, categoryData, req.session.userId);
    
    if (!updated) {
      req.flash('error', 'Category not found or not authorized');
      return res.redirect('/categories');
    }
    
    req.flash('success', 'Category updated successfully');
    res.redirect('/categories');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Server Error');
    res.redirect(`/categories/edit/${req.params.id}`);
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.delete(req.params.id, req.session.userId);
    
    if (!deleted) {
      req.flash('error', 'Category not found, not authorized, or is in use');
      return res.redirect('/categories');
    }
    
    req.flash('success', 'Category deleted successfully');
    res.redirect('/categories');
  } catch (err) {
    console.error(err);
    if (err.message.includes('used in transactions')) {
      req.flash('error', 'Category cannot be deleted because it is used in transactions');
    } else {
      req.flash('error', 'Server Error');
    }
    res.redirect('/categories');
  }
};