const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const User = require('../models/User');

exports.getDashboard = async (req, res) => {

  
  
  try {
    const userId = req.session.user_id;
    // console.log({userId});

    // Get current date information
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-11

    // Get monthly income and expenses
    const monthlyIncome = await Transaction.getMonthlySum(userId, 'income', currentYear, currentMonth);
    const monthlyExpenses = await Transaction.getMonthlySum(userId, 'expense', currentYear, currentMonth);
    const remainingBalance = monthlyIncome - monthlyExpenses;

    // Get categories with spending for budget tracking
    const categories = await Category.getCategoriesWithSpending(userId, currentYear, currentMonth);

    // Get recent transactions
    const transactions = await Transaction.getRecentTransactions(userId, 5);

    // Get user information
    const user = await User.findById(userId);
    // console.log({
    //   title: 'Dashboard',
    //   monthlyIncome,
    //   monthlyExpenses,
    //   remainingBalance,
    //   categories,
    //   transactions,
    //   user,
    //   currentMonth: currentDate.toLocaleString('default', { month: 'long' }),
    //   currentYear
    // });

    // Render the dashboard view with data
    res.render('dashboard/index', {
      title: 'Dashboard',
      monthlyIncome,
      monthlyExpenses,
      remainingBalance,
      categories,
      transactions,
      user,
      currentMonth: currentDate.toLocaleString('default', { month: 'long' }),
      currentYear
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Server Error');
    res.render('dashboard/index', {
      title: 'Dashboard',
      monthlyIncome: 0,
      monthlyExpenses: 0,
      remainingBalance: 0,
      categories: [],
      transactions: [],
      user: null,
      currentMonth: new Date().toLocaleString('default', { month: 'long' }),
      currentYear: new Date().getFullYear()
    });
  }
};