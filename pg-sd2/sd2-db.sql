-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Apr 02, 2025 at 10:15 AM
-- Server version: 8.2.0
-- PHP Version: 8.2.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `smartbudget`
--

-- --------------------------------------------------------

--
-- Table structure for table `Users`
--

CREATE TABLE `Users` (
  `user_id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Users`
--

INSERT INTO `Users` (`user_id`, `username`, `email`, `password`, `created_at`) VALUES
(1, 'testuser', 'test@example.com', 'password123', '2025-04-02 10:00:00'),
(2, 'johndoe', 'john.doe@example.com', 'password123', '2025-04-02 10:00:00'),
(3, 'janesmith', 'jane.smith@example.com', 'password123', '2025-04-02 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `Categories`
--

CREATE TABLE `Categories` (
  `category_id` int NOT NULL,
  `user_id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `type` enum('income','expense') NOT NULL DEFAULT 'expense',
  `budget_limit` decimal(10,2) NOT NULL DEFAULT '0.00',
  `color` varchar(20) DEFAULT '#3498db',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Categories`
--

INSERT INTO `Categories` (`category_id`, `user_id`, `name`, `type`, `budget_limit`, `color`, `created_at`) VALUES
(1, 1, 'Salary', 'income', '0.00', '#2ecc71', '2025-04-02 10:00:00'),
(2, 1, 'Freelance', 'income', '0.00', '#27ae60', '2025-04-02 10:00:00'),
(3, 1, 'Food', 'expense', '500.00', '#e74c3c', '2025-04-02 10:00:00'),
(4, 1, 'Transportation', 'expense', '150.00', '#3498db', '2025-04-02 10:00:00'),
(5, 1, 'Entertainment', 'expense', '200.00', '#f39c12', '2025-04-02 10:00:00'),
(6, 1, 'Housing', 'expense', '1000.00', '#9b59b6', '2025-04-02 10:00:00'),
(7, 1, 'Utilities', 'expense', '300.00', '#1abc9c', '2025-04-02 10:00:00'),
(8, 2, 'Salary', 'income', '0.00', '#2ecc71', '2025-04-02 10:00:00'),
(9, 2, 'Food', 'expense', '600.00', '#e74c3c', '2025-04-02 10:00:00'),
(10, 2, 'Rent', 'expense', '1200.00', '#9b59b6', '2025-04-02 10:00:00'),
(11, 3, 'Salary', 'income', '0.00', '#2ecc71', '2025-04-02 10:00:00'),
(12, 3, 'Groceries', 'expense', '400.00', '#e74c3c', '2025-04-02 10:00:00'),
(13, 3, 'Shopping', 'expense', '300.00', '#f39c12', '2025-04-02 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `Transactions`
--

CREATE TABLE `Transactions` (
  `transaction_id` int NOT NULL,
  `user_id` int NOT NULL,
  `category_id` int DEFAULT NULL,
  `date` date NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Transactions`
--

INSERT INTO `Transactions` (`transaction_id`, `user_id`, `category_id`, `date`, `description`, `amount`, `created_at`) VALUES
(1, 1, 1, '2025-04-01', 'Monthly Salary', 2500.00, '2025-04-02 10:00:00'),
(2, 1, 3, '2025-04-02', 'Grocery Shopping', -78.50, '2025-04-02 10:00:00'),
(3, 1, 4, '2025-04-02', 'Bus Ticket', -15.00, '2025-04-02 10:00:00'),
(4, 1, 5, '2025-04-01', 'Movie Night', -35.00, '2025-04-02 10:00:00'),
(5, 1, 6, '2025-04-01', 'Monthly Rent', -950.00, '2025-04-02 10:00:00'),
(6, 1, 7, '2025-04-01', 'Electricity Bill', -85.30, '2025-04-02 10:00:00'),
(7, 1, 7, '2025-04-01', 'Water Bill', -45.75, '2025-04-02 10:00:00'),
(8, 1, 3, '2025-04-02', 'Restaurant Dinner', -65.80, '2025-04-02 10:00:00'),
(9, 2, 8, '2025-04-01', 'Monthly Salary', 3200.00, '2025-04-02 10:00:00'),
(10, 2, 9, '2025-04-02', 'Supermarket', -120.45, '2025-04-02 10:00:00'),
(11, 2, 10, '2025-04-01', 'Apartment Rent', -1150.00, '2025-04-02 10:00:00'),
(12, 3, 11, '2025-04-01', 'Monthly Salary', 2800.00, '2025-04-02 10:00:00'),
(13, 3, 12, '2025-04-02', 'Weekly Groceries', -95.60, '2025-04-02 10:00:00'),
(14, 3, 13, '2025-04-02', 'New Clothes', -175.00, '2025-04-02 10:00:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `Categories`
--
ALTER TABLE `Categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `unique_category_per_user` (`user_id`,`name`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `Transactions`
--
ALTER TABLE `Transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `category_id` (`category_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Users`
--
ALTER TABLE `Users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `Categories`
--
ALTER TABLE `Categories`
  MODIFY `category_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `Transactions`
--
ALTER TABLE `Transactions`
  MODIFY `transaction_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Categories`
--
ALTER TABLE `Categories`
  ADD CONSTRAINT `Categories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `Transactions`
--
ALTER TABLE `Transactions`
  ADD CONSTRAINT `Transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Transactions_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `Categories` (`category_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;