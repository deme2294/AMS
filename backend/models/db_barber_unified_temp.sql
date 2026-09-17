-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: db_barber
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `db_barber`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `db_barber` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `db_barber`;

--
-- Table structure for table `active_sessions`
--

DROP TABLE IF EXISTS `active_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `active_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `jti` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `last_activity` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `active_sessions`
--

LOCK TABLES `active_sessions` WRITE;
/*!40000 ALTER TABLE `active_sessions` DISABLE KEYS */;
INSERT INTO `active_sessions` VALUES (28,83,'b808c2e6-1dc0-4db6-b5f6-19a4af2b49f4','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-30 10:11:41','2026-03-30 11:04:52');
/*!40000 ALTER TABLE `active_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `approvalhierarchy`
--

DROP TABLE IF EXISTS `approvalhierarchy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `approvalhierarchy` (
  `id` int(11) NOT NULL,
  `role_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `next_role_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approvalhierarchy`
--

LOCK TABLES `approvalhierarchy` WRITE;
/*!40000 ALTER TABLE `approvalhierarchy` DISABLE KEYS */;
/*!40000 ALTER TABLE `approvalhierarchy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `entity` varchar(50) DEFAULT NULL,
  `entity_id` varchar(50) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,3,'LOGOUT','User','3',NULL,'127.0.0.1','2026-01-02 10:15:10'),(2,3,'LOGIN','User','3','{\"username\":\"onerrr@gmail.com\"}','127.0.0.1','2026-01-02 10:15:11'),(3,3,'UPDATE_STATUS','User',NULL,'{\"status\":0}','127.0.0.1','2026-01-02 10:22:58'),(4,3,'CREATE','User',NULL,'{\"fname\":\"hayal\",\"lname\":\"tamrat\",\"user_name\":\"hayalt\",\"email\":\"hayaltamrat@gmail.com\",\"phone\":\"+25191222112\",\"department_id\":\"1\",\"role_id\":\"1\"}','127.0.0.1','2026-01-02 10:27:54'),(5,3,'LOGOUT','User','3',NULL,'127.0.0.1','2026-01-02 10:28:18'),(6,35,'LOGIN','User','35','{\"username\":\"hayalt\"}','127.0.0.1','2026-01-02 10:28:23'),(7,3,'UPDATE','User',NULL,'{\"fname\":\"some one\",\"lname\":\"agent\",\"user_name\":\"agent@lonche.com\",\"email\":\"agent@lonche.com\",\"phone\":\"itp@123\",\"department_id\":\"1\",\"role_id\":\"6\"}','127.0.0.1','2026-01-02 11:31:54'),(8,3,'UPDATE','User',NULL,'{\"fname\":\"some one\",\"lname\":\"agent\",\"user_name\":\"agent@lonche.com\",\"email\":\"agent@lonche.com\",\"phone\":\"itp@123\",\"department_id\":\"1\",\"role_id\":\"4\"}','127.0.0.1','2026-01-02 11:33:43'),(9,3,'UPDATE','User',NULL,'{\"fname\":\"some one\",\"lname\":\"agent\",\"user_name\":\"agent@lonche.com\",\"email\":\"agent@lonche.com\",\"phone\":\"itp@123\",\"department_id\":\"1\",\"role_id\":\"4\"}','127.0.0.1','2026-01-02 11:35:03'),(10,3,'UPDATE','User',NULL,'{\"fname\":\"some one\",\"lname\":\"some one\",\"user_name\":\"agent@lonche.com\",\"email\":\"agent@lonche.com\",\"phone\":\"itp@123\",\"department_id\":\"1\",\"role_id\":\"4\"}','127.0.0.1','2026-01-02 11:35:17'),(11,3,'LOGOUT','User','3',NULL,'127.0.0.1','2026-01-02 11:41:15'),(12,35,'LOGIN','User','35','{\"username\":\"hayalt\"}','127.0.0.1','2026-01-02 11:41:57'),(13,35,'LOGOUT','User','35',NULL,'127.0.0.1','2026-01-02 11:45:34'),(14,3,'LOGIN','User','3','{\"username\":\"onerrr@gmail.com\"}','127.0.0.1','2026-01-02 12:43:34'),(15,3,'LOGOUT','User','3',NULL,'127.0.0.1','2026-01-02 12:45:41'),(16,3,'LOGIN','User','3','{\"username\":\"onerrr@gmail.com\"}','127.0.0.1','2026-01-02 12:59:24'),(17,3,'LOGOUT','User','3',NULL,'127.0.0.1','2026-01-02 13:02:54'),(18,3,'LOGIN','User','3','{\"username\":\"onerrr@gmail.com\"}','127.0.0.1','2026-01-02 13:12:26'),(19,3,'LOGOUT','User','3',NULL,'127.0.0.1','2026-01-02 13:14:49'),(20,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"onerrr@gmail.com\",\"attempts\":1}','127.0.0.1','2026-01-02 13:26:28'),(21,3,'LOGIN','User','3','{\"username\":\"onerrr@gmail.com\"}','127.0.0.1','2026-01-02 13:26:45'),(22,3,'LOGOUT','User','3',NULL,'127.0.0.1','2026-01-02 13:28:03'),(23,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"onerrr@gmail.com\",\"attempts\":1}','127.0.0.1','2026-01-02 13:28:07'),(24,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"onerrr@gmail.com\",\"attempts\":2}','127.0.0.1','2026-01-02 13:28:11'),(25,128,'LOGOUT','User','128',NULL,'127.0.0.1','2026-01-02 13:35:54'),(26,35,'LOGIN','User','35','{\"username\":\"hayalt\"}','127.0.0.1','2026-01-02 13:36:02'),(27,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"hayalt\",\"attempts\":1}','127.0.0.1','2026-01-02 13:48:55'),(28,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"hayalt\",\"attempts\":2}','127.0.0.1','2026-01-02 13:48:58'),(29,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"hayalt\",\"attempts\":3}','127.0.0.1','2026-01-02 13:49:01'),(30,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"hayalt\",\"attempts\":4}','127.0.0.1','2026-01-02 13:49:04'),(31,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"hayalt\",\"attempts\":5}','127.0.0.1','2026-01-02 13:49:08'),(32,3,'LOGIN','User','3','{\"username\":\"onerrr@gmail.com\"}','127.0.0.1','2026-01-02 13:53:53'),(33,3,'LOGOUT','User','3',NULL,'127.0.0.1','2026-01-02 13:53:57'),(34,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"hayalt\",\"attempts\":1}','127.0.0.1','2026-01-02 13:54:22'),(35,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"hayalt\",\"attempts\":2}','127.0.0.1','2026-01-02 13:54:26'),(36,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"hayalt\",\"attempts\":3}','127.0.0.1','2026-01-02 13:54:29'),(37,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"hayalt\",\"attempts\":4}','127.0.0.1','2026-01-02 13:54:32'),(38,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"hayalt\",\"attempts\":5}','127.0.0.1','2026-01-02 13:54:35'),(39,3,'LOGIN','User','3','{\"username\":\"onerrr@gmail.com\"}','127.0.0.1','2026-01-02 14:03:48'),(40,3,'LOGOUT','User','3',NULL,'127.0.0.1','2026-01-02 14:03:51'),(41,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"hayalt\",\"attempts\":1}','127.0.0.1','2026-01-02 14:03:59'),(42,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"hayalt\",\"attempts\":2}','127.0.0.1','2026-01-02 14:04:02'),(43,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"hayalt\",\"attempts\":3}','127.0.0.1','2026-01-02 14:04:05'),(44,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"hayalt\",\"attempts\":4}','127.0.0.1','2026-01-02 14:04:08'),(45,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"hayalt\",\"attempts\":5}','127.0.0.1','2026-01-02 14:04:12'),(46,35,'LOGOUT','User','35',NULL,'127.0.0.1','2026-01-02 14:21:23'),(47,35,'LOGIN','User','35','{\"username\":\"hayalt\"}','127.0.0.1','2026-01-02 14:21:48'),(48,35,'LOGOUT','User','35',NULL,'127.0.0.1','2026-01-02 14:22:45'),(49,35,'LOGIN','User','35','{\"username\":\"hayalt\"}','127.0.0.1','2026-01-03 10:34:17'),(50,36,'LOGOUT','User','36',NULL,'127.0.0.1','2026-01-03 11:09:08'),(51,35,'LOGIN','User','35','{\"username\":\"hayalt\"}','127.0.0.1','2026-01-03 11:09:25'),(52,35,'CREATE','Media','6','{\"title\":\"our leaders \",\"count\":4}','127.0.0.1','2026-01-03 11:10:52'),(53,35,'DELETE','Media','9',NULL,'127.0.0.1','2026-01-03 11:11:02'),(54,3,'CREATE','User',NULL,'{\"fname\":\"yossef\",\"lname\":\"knfe\",\"user_name\":\"yossef\",\"email\":\"yosef@gmail.com\",\"phone\":\"0913566735\",\"department_id\":\"2\",\"role_id\":\"4\"}','127.0.0.1','2026-01-03 14:04:12'),(55,3,'LOGOUT','User','3',NULL,'127.0.0.1','2026-01-03 14:04:19'),(56,3,'LOGIN','User','3','{\"username\":\"onerrr@gmail.com\"}','127.0.0.1','2026-01-03 14:04:51'),(57,3,'LOGOUT','User','3',NULL,'127.0.0.1','2026-01-03 14:05:07'),(58,36,'LOGIN','User','36','{\"username\":\"yossef\"}','127.0.0.1','2026-01-03 14:05:17'),(59,36,'LOGOUT','User','36',NULL,'127.0.0.1','2026-01-03 14:05:47'),(60,3,'LOGIN','User','3','{\"username\":\"onerrr@gmail.com\"}','127.0.0.1','2026-01-03 14:05:56'),(61,3,'LOGOUT','User','3',NULL,'127.0.0.1','2026-01-03 14:06:21'),(62,36,'LOGIN','User','36','{\"username\":\"yossef\"}','127.0.0.1','2026-01-03 14:06:32'),(63,36,'LOGOUT','User','36',NULL,'127.0.0.1','2026-01-03 14:06:51'),(64,35,'LOGOUT','User','35',NULL,'127.0.0.1','2026-01-03 17:53:30'),(65,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"yossef\",\"attempts\":1}','127.0.0.1','2026-01-03 17:54:00'),(66,35,'LOGIN','User','35','{\"username\":\"hayalt\"}','127.0.0.1','2026-01-03 17:54:09'),(67,35,'LOGOUT','User','35',NULL,'127.0.0.1','2026-01-03 17:54:29'),(68,NULL,'LOGIN_FAILED','User',NULL,'{\"username\":\"yossef\",\"attempts\":2}','127.0.0.1','2026-01-03 17:54:41'),(69,36,'LOGIN','User','36','{\"username\":\"yossef\"}','127.0.0.1','2026-01-03 17:55:01'),(70,36,'LOGIN','User','36','{\"username\":\"yossef\"}','127.0.0.1','2026-01-03 18:17:13'),(71,36,'LOGIN','User','36','{\"username\":\"yossef\"}','127.0.0.1','2026-01-04 07:15:06'),(72,36,'LOGOUT','User','36',NULL,'127.0.0.1','2026-01-04 07:15:28'),(73,35,'LOGIN','User','35','{\"username\":\"hayalt\"}','127.0.0.1','2026-01-04 07:15:41'),(74,35,'LOGOUT','User','35',NULL,'127.0.0.1','2026-01-04 07:21:19'),(75,35,'LOGIN','User','35','{\"username\":\"hayalt\"}','127.0.0.1','2026-01-04 07:21:21'),(76,35,'LOGOUT','User','35',NULL,'127.0.0.1','2026-01-04 07:29:35'),(77,36,'LOGIN','User','36','{\"username\":\"yossef\"}','127.0.0.1','2026-01-04 07:29:40'),(78,36,'LOGOUT','User','36',NULL,'127.0.0.1','2026-01-04 07:30:26'),(79,35,'LOGIN','User','35','{\"username\":\"hayalt\"}','127.0.0.1','2026-01-04 07:30:31'),(80,35,'LOGOUT','User','35',NULL,'127.0.0.1','2026-01-04 07:43:30'),(81,35,'LOGIN','User','35','{\"username\":\"hayalt\"}','127.0.0.1','2026-01-04 07:43:31'),(82,35,'LOGOUT','User','35',NULL,'127.0.0.1','2026-01-04 07:47:57'),(83,36,'LOGIN','User','36','{\"username\":\"yossef\"}','127.0.0.1','2026-01-04 07:48:10'),(84,36,'LOGOUT','User','36',NULL,'127.0.0.1','2026-01-04 07:53:42'),(85,35,'LOGIN','User','35','{\"username\":\"hayalt\"}','127.0.0.1','2026-01-04 07:53:48'),(86,36,'LOGIN','User','36','{\"username\":\"yossef\"}','127.0.0.1','2026-01-04 08:29:21'),(87,3,'LOGOUT','User','3',NULL,'196.189.144.152','2026-01-05 05:55:25'),(88,35,'LOGIN','User','35','{\"username\":\"hayalt\"}','196.189.144.152','2026-01-05 11:47:33'),(128,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-01-30 07:56:46'),(129,84,'LOGOUT','User','84',NULL,'::1','2026-01-30 08:04:03'),(130,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-01-30 08:04:06'),(131,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-02 11:50:29'),(132,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-02 11:52:43'),(133,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-02 11:59:07'),(134,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-02 11:59:37'),(135,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-02 12:01:43'),(136,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-02 12:15:17'),(137,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-02 12:26:29'),(138,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-02 12:34:36'),(139,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-02 12:50:08'),(140,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-02 12:51:19'),(141,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-02 14:00:44'),(142,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-02 14:20:22'),(143,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-03 06:10:45'),(144,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::ffff:127.0.0.1','2026-02-16 12:39:46'),(145,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::ffff:127.0.0.1','2026-02-16 17:45:49'),(146,83,'CREATE','User',NULL,'{\"fname\":\"content\",\"lname\":\"tets1\",\"user_name\":\"contenttest1\",\"email\":\"contenttest1@gmail.com\",\"phone\":\"0917266671\",\"department_id\":\"1\",\"role_id\":\"3\"}','::ffff:127.0.0.1','2026-02-16 19:16:16'),(147,83,'LOGOUT','User','83',NULL,'::ffff:127.0.0.1','2026-02-16 19:16:22'),(148,90,'LOGIN','User','90','{\"username\":\"contenttest1\"}','::ffff:127.0.0.1','2026-02-16 19:16:47'),(149,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-16 19:18:43'),(150,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-16 20:24:22'),(151,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-17 06:47:55'),(152,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::ffff:127.0.0.1','2026-02-17 07:29:41'),(153,83,'LOGOUT','User','83',NULL,'::ffff:127.0.0.1','2026-02-17 07:34:22'),(154,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::ffff:127.0.0.1','2026-02-17 07:34:25'),(155,83,'LOGOUT','User','83',NULL,'::ffff:127.0.0.1','2026-02-17 07:38:28'),(156,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::ffff:127.0.0.1','2026-02-17 07:39:49'),(157,83,'LOGOUT','User','83',NULL,'::ffff:127.0.0.1','2026-02-17 07:57:44'),(158,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::ffff:127.0.0.1','2026-02-17 07:57:46'),(159,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::ffff:127.0.0.1','2026-02-17 08:18:21'),(160,83,'LOGOUT','User','83',NULL,'::ffff:127.0.0.1','2026-02-17 08:29:11'),(161,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::ffff:127.0.0.1','2026-02-17 08:29:13'),(162,83,'CREATE','News','7','{\"title\":\"Test News\"}','::ffff:127.0.0.1','2026-02-17 08:46:00'),(163,83,'CREATE','News','8','{\"title\":\"Test News\"}','::ffff:127.0.0.1','2026-02-17 08:47:40'),(164,83,'CREATE','News','9','{\"title\":\"Test News\"}','::ffff:127.0.0.1','2026-02-17 08:48:01'),(165,83,'CREATE','News','10','{\"title\":\"Test News\"}','::ffff:127.0.0.1','2026-02-17 08:49:05'),(166,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-17 09:10:37'),(167,83,'LOGOUT','User','83',NULL,'::1','2026-02-17 09:10:44'),(168,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-17 09:10:47'),(169,83,'LOGOUT','User','83',NULL,'::1','2026-02-17 10:54:14'),(170,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-17 10:54:18'),(171,83,'CREATE','News','11','{\"title\":\"test\"}','::1','2026-02-17 11:09:25'),(172,83,'UPDATE','News','11','{\"title\":\"test\"}','::1','2026-02-17 11:09:53'),(173,83,'CREATE','Media','9','{\"title\":\"Field Test Singular\",\"count\":1}','::1','2026-02-17 11:22:24'),(174,83,'CREATE','Media','10','{\"title\":\"Field Test Plural\",\"count\":1}','::1','2026-02-17 11:22:24'),(175,83,'CREATE','Media','11','{\"title\":\"Field Test Singular\",\"count\":1}','::1','2026-02-17 11:22:43'),(176,83,'CREATE','Media','12','{\"title\":\"Field Test Plural\",\"count\":1}','::1','2026-02-17 11:22:43'),(177,83,'CREATE','Media','13','{\"title\":\"Field Test Singular\",\"count\":1}','::1','2026-02-17 11:27:40'),(178,83,'CREATE','Media','14','{\"title\":\"Field Test Plural\",\"count\":1}','::1','2026-02-17 11:27:40'),(179,83,'CREATE','Media','15','{\"title\":\"test\",\"count\":1}','::1','2026-02-17 11:32:01'),(180,83,'DELETE','Media','15',NULL,'::1','2026-02-17 11:32:08'),(181,83,'DELETE','Media','14',NULL,'::1','2026-02-17 11:33:27'),(182,83,'UPDATE','Media','13','{\"title\":\"Field Test Singular\"}','::1','2026-02-17 11:33:50'),(183,83,'DELETE','Media','13',NULL,'::1','2026-02-17 11:33:57'),(184,83,'DELETE','Media','11',NULL,'::1','2026-02-17 11:39:10'),(185,83,'DELETE','Media','12',NULL,'::1','2026-02-17 11:39:13'),(186,83,'DELETE','Media','10',NULL,'::1','2026-02-17 11:49:50'),(187,83,'DELETE','Media','9',NULL,'::1','2026-02-17 11:49:53'),(188,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-17 12:45:43'),(189,83,'DELETE','News','10',NULL,'::1','2026-02-17 12:47:16'),(190,83,'DELETE','News','9',NULL,'::1','2026-02-17 12:47:19'),(191,83,'DELETE','News','8',NULL,'::1','2026-02-17 12:47:22'),(192,83,'DELETE','News','7',NULL,'::1','2026-02-17 12:47:24'),(193,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-17 12:47:58'),(194,83,'CREATE','Event','2','{\"title\":\"test\"}','::1','2026-02-17 12:54:52'),(195,83,'DELETE','Event','2',NULL,'::1','2026-02-17 13:01:04'),(196,83,'CREATE','Event','3','{\"title\":\"test\"}','::1','2026-02-17 13:01:32'),(197,83,'UPDATE','News','11','{\"title\":\"test2\"}','::1','2026-02-17 13:05:37'),(198,83,'UPDATE','News','11','{\"title\":\"test2\"}','::1','2026-02-17 13:19:40'),(199,83,'UPDATE','News','11','{\"title\":\"test2\"}','::1','2026-02-17 13:20:51'),(200,83,'UPDATE','News','11','{\"title\":\"test2\"}','::1','2026-02-17 13:21:20'),(201,83,'UPDATE','News','11','{\"title\":\"test2\"}','::1','2026-02-17 13:21:34'),(202,83,'UPDATE','News','11','{\"title\":\"test2\"}','::1','2026-02-17 13:21:44'),(203,83,'UPDATE','News','11','{\"title\":\"test2\"}','::1','2026-02-17 13:22:07'),(204,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::ffff:127.0.0.1','2026-02-17 13:47:33'),(205,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-17 13:48:55'),(206,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-17 13:50:57'),(207,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-17 13:52:06'),(208,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-17 13:53:50'),(209,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-17 13:54:12'),(210,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-17 13:55:41'),(211,83,'LOGOUT','User','83',NULL,'::1','2026-02-17 14:05:12'),(212,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-17 14:05:15'),(213,83,'UPDATE','Event','3','{\"title\":\"test\"}','::1','2026-02-17 14:06:00'),(214,83,'UPDATE','Event','3','{\"title\":\"test\"}','::1','2026-02-17 14:06:40'),(215,83,'DELETE','Event','3',NULL,'::1','2026-02-17 14:06:56'),(216,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-17 14:27:13'),(217,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-18 06:11:32'),(218,83,'DELETE','News','11',NULL,'::1','2026-02-18 06:12:04'),(219,83,'CREATE','User',NULL,'{\"fname\":\"test\",\"lname\":\"test\",\"user_name\":\"test@gmail.com\",\"email\":\"test@gmail.com\",\"phone\":\"98893219831298\",\"department_id\":\"1\",\"role_id\":\"1\"}','::1','2026-02-18 07:01:04'),(220,83,'UPDATE','User',NULL,'{\"fname\":\"test\",\"lname\":\"some one\",\"user_name\":\"test@lonche.com\",\"email\":\"agent@lonche.com\",\"phone\":\"itp@123\",\"department_id\":\"1\",\"role_id\":\"4\"}','::1','2026-02-18 07:01:55'),(221,83,'UPDATE_STATUS','User',NULL,'{\"status\":1}','::1','2026-02-18 07:02:04'),(222,83,'UPDATE_STATUS','User',NULL,'{\"status\":0}','::1','2026-02-18 07:03:45'),(223,83,'UPDATE_STATUS','User',NULL,'{\"status\":1}','::1','2026-02-18 07:03:46'),(224,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-18 08:28:04'),(225,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-18 11:24:27'),(226,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-18 12:29:16'),(227,83,'CREATE','User',NULL,'{\"fname\":\"Security\",\"lname\":\"Auditor\",\"email\":\"audit_1771417756741@example.com\",\"phone\":\"0900000000\",\"department_id\":1,\"role_id\":1,\"user_name\":\"auditor_1771417756741\"}','::1','2026-02-18 12:29:16'),(228,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-18 12:47:08'),(229,83,'CREATE','User',NULL,'{\"fname\":\"Security\",\"lname\":\"Auditor\",\"email\":\"audit_1771418828658@example.com\",\"phone\":\"0900000000\",\"department_id\":1,\"role_id\":1,\"user_name\":\"auditor_1771418828658\"}','::1','2026-02-18 12:47:08'),(230,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::ffff:127.0.0.1','2026-02-18 12:48:41'),(231,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-18 12:52:40'),(232,83,'CREATE','User',NULL,'{\"fname\":\"Security\",\"lname\":\"Auditor\",\"email\":\"audit_1771419160931@example.com\",\"phone\":\"0900000000\",\"department_id\":1,\"role_id\":1,\"user_name\":\"auditor_1771419160931\"}','::1','2026-02-18 12:52:41'),(233,83,'UPDATE_STATUS','User',NULL,'{\"status\":0}','::1','2026-02-18 13:21:53'),(234,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::ffff:127.0.0.1','2026-02-18 14:22:46'),(235,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-19 07:52:24'),(236,83,'CREATE','User',NULL,'{\"fname\":\"tets\",\"lname\":\"tets\",\"user_name\":\"tets27\",\"email\":\"tets113@gmail.com\",\"phone\":\"0917122712\",\"department_id\":\"2\",\"role_id\":\"4\"}','::1','2026-02-19 07:53:52'),(237,83,'LOGOUT','User','83',NULL,'::1','2026-02-19 07:54:03'),(238,1002,'LOGIN','User','1002','{\"username\":\"tets27\"}','::1','2026-02-19 07:54:05'),(239,1002,'LOGOUT','User','1002',NULL,'::1','2026-02-19 07:55:37'),(240,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-19 07:57:12'),(241,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-19 08:18:38'),(242,83,'LOGOUT','User','83',NULL,'::1','2026-02-19 08:18:44'),(243,1002,'LOGIN','User','1002','{\"username\":\"tets27\"}','::1','2026-02-19 08:18:47'),(244,1002,'LOGOUT','User','1002',NULL,'::1','2026-02-19 08:29:23'),(245,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::ffff:127.0.0.1','2026-02-19 08:46:14'),(246,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-19 08:48:16'),(247,83,'LOGOUT','User','83',NULL,'::1','2026-02-19 08:50:33'),(248,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-19 08:50:38'),(249,83,'LOGOUT','User','83',NULL,'::1','2026-02-19 08:59:15'),(250,1002,'LOGIN','User','1002','{\"username\":\"tets27\"}','::1','2026-02-19 08:59:50'),(251,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-19 09:00:11'),(252,1002,'LOGOUT','User','1002',NULL,'::1','2026-02-19 09:03:31'),(253,1002,'LOGIN','User','1002','{\"username\":\"tets27\"}','::1','2026-02-19 09:03:34'),(254,1002,'LOGOUT','User','1002',NULL,'::1','2026-02-19 09:06:21'),(255,1002,'LOGIN','User','1002','{\"username\":\"tets27\"}','::1','2026-02-19 09:06:28'),(256,83,'LOGOUT','User','83',NULL,'::1','2026-02-19 10:38:50'),(257,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-19 10:38:55'),(258,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-20 06:55:15'),(259,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-20 12:04:18'),(260,83,'CREATE','User',NULL,'{\"fname\":\"contet\",\"lname\":\"contet\",\"user_name\":\"contet1\",\"email\":\"contet1@gmail.com\",\"phone\":\"+251913566735\",\"department_id\":\"1\",\"role_id\":\"3\"}','::1','2026-02-20 12:05:05'),(261,83,'LOGOUT','User','83',NULL,'::1','2026-02-20 12:05:10'),(262,1003,'LOGIN','User','1003','{\"username\":\"contet1\"}','::1','2026-02-20 12:05:13'),(263,1003,'LOGOUT','User','1003',NULL,'::1','2026-02-20 12:37:06'),(264,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-20 12:37:14'),(265,83,'LOGOUT','User','83',NULL,'::1','2026-02-20 12:54:10'),(266,1003,'LOGIN','User','1003','{\"username\":\"contet1\"}','::1','2026-02-20 12:54:14'),(267,1003,'LOGOUT','User','1003',NULL,'::1','2026-02-20 13:00:46'),(268,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-20 13:00:52'),(269,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::ffff:127.0.0.1','2026-02-20 13:10:37'),(270,83,'DELETE','Comment','8',NULL,'::1','2026-02-20 13:58:21'),(271,83,'DELETE','Comment','10',NULL,'::1','2026-02-20 13:58:26'),(272,83,'DELETE','Comment','15',NULL,'::1','2026-02-20 13:58:31'),(273,83,'APPROVE','Comment','169',NULL,'::1','2026-02-20 14:02:06'),(274,83,'APPROVE','Comment','169',NULL,'::1','2026-02-20 14:02:46'),(275,83,'APPROVE','Comment','174',NULL,'::1','2026-02-20 14:05:53'),(276,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-20 16:35:44'),(277,83,'LOGOUT','User','83',NULL,'::1','2026-02-20 18:05:50'),(278,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-02-20 18:05:56'),(279,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-26 07:40:47'),(280,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-26 07:41:47'),(281,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-26 07:42:25'),(282,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-26 07:52:02'),(283,84,'LOGIN','User','84','{\"username\":\"test_admin\"}','::1','2026-02-26 09:51:22'),(284,84,'LOGOUT','User','84',NULL,'::1','2026-02-26 09:51:24'),(285,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::ffff:127.0.0.1','2026-03-05 03:39:32'),(286,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-05 03:42:22'),(287,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 07:04:02'),(288,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 09:57:41'),(289,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 11:24:38'),(290,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 12:01:07'),(291,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 12:32:28'),(292,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 12:48:21'),(293,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 13:03:25'),(294,83,'LOGOUT','User','83',NULL,'::1','2026-03-26 13:06:45'),(295,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 13:06:47'),(296,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 13:21:25'),(297,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 13:45:44'),(298,83,'UPDATE_STATUS','User',NULL,'{\"status\":0}','::1','2026-03-26 14:05:09'),(299,83,'UPDATE_STATUS','User',NULL,'{\"status\":1}','::1','2026-03-26 14:05:10'),(300,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 14:09:16'),(301,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 14:15:49'),(302,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 15:26:00'),(303,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 15:43:46'),(304,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 16:54:27'),(305,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 17:32:22'),(306,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-26 18:50:00'),(307,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-27 06:16:36'),(308,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-27 06:35:28'),(309,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-27 06:53:34'),(310,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-27 07:17:58'),(311,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-27 12:34:27'),(312,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-27 13:21:41'),(313,83,'LOGOUT','User','83',NULL,'::1','2026-03-27 13:21:41'),(314,83,'LOGOUT','User','83',NULL,'::1','2026-03-27 13:21:41'),(315,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-27 13:22:07'),(316,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-27 14:07:00'),(317,83,'LOGIN','User','83','{\"username\":\"nathan27\"}','::1','2026-03-30 07:11:41');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blocked_ips`
--

DROP TABLE IF EXISTS `blocked_ips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blocked_ips` (
  `id` int(11) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `blocked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reason` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blocked_ips`
--

LOCK TABLES `blocked_ips` WRITE;
/*!40000 ALTER TABLE `blocked_ips` DISABLE KEYS */;
/*!40000 ALTER TABLE `blocked_ips` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `category_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_attachments`
--

DROP TABLE IF EXISTS `complaint_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `complaint_attachments` (
  `attachment_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `complaint_id` int(11) DEFAULT NULL,
  `file_url` text NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`attachment_id`),
  KEY `fk_attachment_complaint` (`complaint_id`),
  CONSTRAINT `fk_attachment_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_attachments`
--

LOCK TABLES `complaint_attachments` WRITE;
/*!40000 ALTER TABLE `complaint_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaint_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_comments`
--

DROP TABLE IF EXISTS `complaint_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `complaint_comments` (
  `comment_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `complaint_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`comment_id`),
  KEY `fk_complaint_comment` (`complaint_id`),
  KEY `fk_comment_user` (`user_id`),
  CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_complaint_comment` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_comments`
--

LOCK TABLES `complaint_comments` WRITE;
/*!40000 ALTER TABLE `complaint_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaint_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_feedback`
--

DROP TABLE IF EXISTS `complaint_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `complaint_feedback` (
  `feedback_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `complaint_id` int(11) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` between 1 and 5),
  `feedback_comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`feedback_id`),
  KEY `fk_feedback_complaint` (`complaint_id`),
  CONSTRAINT `fk_feedback_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_feedback`
--

LOCK TABLES `complaint_feedback` WRITE;
/*!40000 ALTER TABLE `complaint_feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaint_feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_history`
--

DROP TABLE IF EXISTS `complaint_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `complaint_history` (
  `history_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `complaint_id` int(11) DEFAULT NULL,
  `status_before` varchar(50) DEFAULT NULL,
  `status_after` varchar(50) DEFAULT NULL,
  `changed_by` int(11) DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`history_id`),
  KEY `fk_history_complaint` (`complaint_id`),
  KEY `fk_history_user` (`changed_by`),
  CONSTRAINT `fk_history_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_history`
--

LOCK TABLES `complaint_history` WRITE;
/*!40000 ALTER TABLE `complaint_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaint_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaints`
--

DROP TABLE IF EXISTS `complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `complaints` (
  `complaint_id` int(11) NOT NULL AUTO_INCREMENT,
  `reference_number` varchar(50) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category_id` bigint(20) unsigned DEFAULT NULL,
  `subcategory` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `priority` varchar(20) DEFAULT 'Medium',
  `assigned_to` int(11) DEFAULT NULL,
  `assignment_comment` text DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `attachment_url` text DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`complaint_id`),
  UNIQUE KEY `reference_number` (`reference_number`),
  KEY `fk_user` (`user_id`),
  KEY `fk_category` (`category_id`),
  CONSTRAINT `fk_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaints`
--

LOCK TABLES `complaints` WRITE;
/*!40000 ALTER TABLE `complaints` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('new','read','replied') DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
INSERT INTO `contact_messages` VALUES (1,'Beki Tame','berekettamrat2015@gmail.com','+251913566735','test','read','2025-12-19 11:32:58'),(2,'Bereket Tamrat','berekettamrat2015@gmail.com','+251913566735','test','read','2026-01-05 07:38:32'),(3,'Beki Tame','berekettamrat2015@gmail.com','+251913566735','test','read','2026-01-05 09:19:18'),(4,'Beki Tame','berekettamrat2015@gmail.com','+251913566735','test','read','2026-01-05 09:31:32'),(5,'Hayal','onerrr@gmail.com','','Tets','read','2026-01-10 05:48:42'),(6,'Mesfin Tsegaye','mesfin@mevinai.com','+251911522902','Hello, this is Mesfin, Founder of Mevinai PLC. I’m interested in renting a workspace for our company and would appreciate guidance on the next steps. We’re a growing startup and are looking for an environment that can support our team’s expansion and innovation.','read','2026-01-12 13:19:08'),(7,'Mesfin Tsegaye','mesfin@mevinai.com','+251911522902','Hello, this is Mesfin, Founder of Mevinai PLC. I’m interested in renting a workspace for our company and would appreciate guidance on the next steps. We’re a growing startup and are looking for an environment that can support our team’s expansion and innovation.','read','2026-01-12 13:19:35'),(8,'Hayal Tamrat Girum','hayaltamrat3@gmail.com','+251976180462','this is test from hayal\n','replied','2026-01-19 15:09:36'),(9,'Dagim Mathewos','dmathewos529@gmail.com','+251903918129','Subject: Cooperative Training Placement Request – 5 Web Development & Database Students (Teferi Mekonnen Polytechnic College)\n\nTo:  Ethiopian IT Park (ICT Park) Addis Ababa, Ethiopia\n\nDear Sir/Madam,\n\nWe are writing to formally express our keen interest in undertaking our Cooperative Training (Internship) at the Ethiopian IT Park. We are a group of five (5) dedicated students currently completing our Level 3 certification in Web Development and Database Management at Teferi Mekonnen Polytechnic College.\n\nAs students of one of Ethiopia’s most historic technical institutions, we are eager to bridge the gap between our academic studies and the real-world digital ecosystem. We believe that the Ethiopian IT Park, as the nation\'s premier technology hub, offers the ideal environment for us to refine our technical skills while contributing to the Park\'s digital objectives.\n\nDuring our placement, we are prepared to assist resident companies or the Park administration in the following areas:\n\nWeb Development: Assisting in front-end updates, UI/UX maintenance, and basic web programming (HTML, CSS, JavaScript).\n\nDatabase Management: Supporting data entry, SQL queries, database cleaning, and documentation.\n\nTechnical Support: Aiding in IT infrastructure maintenance and general technical troubleshooting within the Special Economic Zone.\n\nWe are highly motivated, disciplined, and ready to adapt to the fast-paced professional environment of the IT Park. We have attached our institutional recommendation letter from Teferi Mekonnen Polytechnic College for your review.\n\nWe would welcome the opportunity to discuss how we can contribute to your organization during our training period. Thank you for considering our request and for your commitment to empowering the next generation of Ethiopian IT professionals.\n\nSincerely,\n\nStudent Representative Name: Dagim Mathewos Phone Number: +251-903-918-129 College: Teferi Mekonnen Polytechnic College','read','2026-01-26 14:34:42'),(10,'<script>alert(\'XSS\')</script>','test@gmail.com','<script>alert(\'XSS\')</script>','<script>alert(\'XSS\')</script>','read','2026-01-29 13:53:36'),(11,'Habtam Habtam','hayaltamrat@gmail.com','+359933499097','test','new','2026-01-29 19:35:27'),(12,'John Doe','test@example.com',NULL,'Normal message','read','2026-02-02 13:41:27'),(13,'Contact Tester','tester@example.com','0988776655','This is a valid test message','new','2026-02-18 12:08:01'),(14,'Contact Tester','tester@example.com','0988776655','This is a valid test message','new','2026-02-18 12:08:57'),(15,'Test','test@test.com',NULL,'Hello','new','2026-02-18 14:00:57'),(16,'Tester','test@test.com',NULL,'text','new','2026-02-18 14:01:46'),(17,'Tester','test@test.com',NULL,'text','new','2026-02-18 14:01:46'),(18,'Tester','test@test.com',NULL,'x','new','2026-02-18 14:01:47'),(19,'Tester','test@test.com',NULL,'text','new','2026-02-18 14:01:47'),(20,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(21,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(22,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(23,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(24,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(25,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(26,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(27,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(28,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(29,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(30,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(31,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(32,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(33,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(34,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(35,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(36,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(37,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(38,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 07:59:53'),(39,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 08:06:23'),(40,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 08:06:23'),(41,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 08:06:56'),(42,'Spam Bot','spam@itpark.com',NULL,'This is automated spam.','new','2026-02-21 08:06:56'),(43,'John Doe','john@verified.com','0912345678','Legitimate message.','new','2026-02-21 08:48:39'),(44,'John Doe','john@verified.com','0912345678','Legitimate message.','new','2026-02-21 08:49:41'),(45,'John Doe','john@verified.com','0912345678','Legitimate message.','new','2026-02-21 08:52:56');
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `departments` (
  `department_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'IT','Information Technology Department','2026-01-02 10:25:30'),(2,'HR','Human Resources','2026-01-02 10:25:30'),(3,'Finance','Finance and Accounts','2026-01-02 10:25:30'),(4,'Marketing','Marketing and Public Relations','2026-01-02 10:25:30');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_positions`
--

DROP TABLE IF EXISTS `employee_positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employee_positions` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `org_node_id` int(11) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `is_delegation` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_positions`
--

LOCK TABLES `employee_positions` WRITE;
/*!40000 ALTER TABLE `employee_positions` DISABLE KEYS */;
INSERT INTO `employee_positions` VALUES (1,151,13,1,0,'2026-03-19 11:10:44'),(2,151,15,0,1,'2026-03-19 11:11:39'),(3,151,16,0,1,'2026-03-19 11:11:50'),(4,146,11,1,0,'2026-03-19 11:12:47'),(5,149,52,1,0,'2026-03-19 11:21:25'),(6,109,55,1,0,'2026-03-20 05:31:29'),(7,152,14,1,1,'2026-03-20 05:38:43'),(8,152,17,0,1,'2026-03-20 05:39:19'),(9,152,18,0,1,'2026-03-20 05:39:35'),(10,143,10,1,0,'2026-03-20 05:40:11'),(11,142,9,1,0,'2026-03-20 05:41:17'),(12,139,52,1,0,'2026-03-20 11:47:21'),(13,72,10,1,0,'2026-03-20 14:00:50'),(14,146,14,1,0,'2026-03-23 06:56:06'),(15,117,19,1,0,'2026-03-23 06:56:06'),(17,109,55,1,0,'2026-03-23 08:48:56'),(18,139,26,1,0,'2026-03-23 08:48:56');
/*!40000 ALTER TABLE `employee_positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employees` (
  `employee_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `supervisor_id` int(11) DEFAULT NULL,
  `fname` varchar(255) DEFAULT NULL,
  `lname` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `sex` enum('M','F') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (21,'www www',1,1,NULL,'hayal','tamrat',NULL,'0916048977',NULL),(34,'hayaltame',NULL,2,21,'ggg','ggg','beki@gmail.com','0934556621','F'),(36,'hayaltame',NULL,2,0,'some','one','bekeei@gmail.com','0934556621','M'),(37,'hayaltame111',1,NULL,NULL,'some11','tame','oneq@gmail.com','0934556688','M'),(38,'hayaltame3333',1,NULL,NULL,'aaa','a','one1a111@gmail.com','0934556111','M'),(39,'hayaltame1114444',1,NULL,NULL,'some00','one11','one222@gmail.com','0934556688','M'),(40,'hayaltame1114444444',1,NULL,NULL,'yeab444','one4444','beki444@gmail.com','0934556444','M'),(41,'hayaltame444',1,NULL,NULL,'yeabeee','eeee','eeeee@gmail.com','0934556644','M'),(43,'rtttttt44',1,NULL,NULL,'yeabeee','eeee','eeee44e@gmail.com','0934556677','M'),(45,'tttttttttttt111',1,NULL,NULL,'yeabrrr','tamer','onerrr@gmail.com','0934556655','M'),(46,'bekele woya',8,NULL,NULL,'bekele','woya','woya@gmail.com','0933499094','M'),(47,'admin admin',1,2,1,'admin','admin','admin@email.com','123-456-7890','M'),(48,'hylt',8,NULL,0,'hl','tm','hl@gmail.com','0934556644','M'),(49,'yonas',2,NULL,NULL,'yonas','ceo','yonas@itp.org','0933499093','M'),(50,'simegn',5,2,49,'geter','geter','simegn@itp.org','0933499094','M'),(51,'hayal@itp.org',8,2,50,'hayal','hayal','hayal@itp.org','0933499097','M'),(54,'hayalt@itp.org',8,2,0,'hayalt','hayalt','hayalt@itp.org','0933499097','M'),(55,'abebe',4,NULL,0,'abebe','abe','abe@itp.et','0934556624','M'),(56,'333333333',4,2,49,'some00333333','one333333','beki33333333333@gmail.com','0934556333','M'),(57,'staf',8,2,56,'staf','staf','staf@gmail.com','0934556688','M'),(58,'nebyat',6,2,50,'nebyat','nebyat','nebyat@itp.et','093455444','F'),(59,'ewunetu',7,2,58,'ewunetu','ewunetu','ewunetu@itp.et','0934556453','M'),(60,'general',3,NULL,49,'general','manager','manager@itp.et','0933499366','M'),(62,'staf1',8,2,66,'staf1','staf1','staf1@itp.et','0934556688','M'),(63,'hayalta4444',6,2,50,'some','one','berrrrrki@gmail.com','0934556555','M'),(64,'yeabeeeee',1,NULL,NULL,'some','one','eeee@gmail.com','0934556688','M'),(65,'team leader',7,2,58,'teaml','teaml','teaml@gmail.com','09373773333','M'),(66,'team leader',7,2,58,'teamleader','teamleader','teamleader@gmail.com','09373773333','M'),(67,'hayal',1,NULL,NULL,'hayal','tamrat','hayal@itp.it','0916048977','M'),(68,'hayal',8,2,65,'hayal','tamrat','hayalt@itp.it','0916048977','M'),(69,'registrar@gmail.com',5,NULL,NULL,'registrar','registrar','registrar@gmail.com','0916048977','M'),(70,'Nathan',1,NULL,NULL,'Hayal','Girum','nathan@itp.et','0976180462','M'),(71,'Hayal Tamrat Girum',3,NULL,NULL,'Hayal','Girum','hayal@gmai.com','0976180462','M'),(72,'nathay tamrat',5,NULL,70,'hayal','tamrat','regist@bus.com','0916048977','M'),(73,'hayal tamrat',1,NULL,NULL,'nathay','tamrat','astu@nathayblog.com','0916048977','M'),(75,'hayal tamrat',4,NULL,70,'nathay','tamrat','hager@temechain.com','0916048977','M'),(78,'hayal tamrat',4,NULL,70,'nathay','tamrat','hager1@temechain.com','0916048977','M'),(82,'hayal tamrat',4,1,49,'hayal','tamrat','hager22@temechain.com','0916048977','M'),(83,'Hayal Tamrat',5,NULL,NULL,'Hayal','Tamrat','Hayalt@hu.edu.et','0916048977','M'),(84,'Hayal ',1,NULL,NULL,'Nathay ','Nathay ','Nathantamrat50@gmail.com','90188837377','M'),(85,'nathay tamrat',5,NULL,NULL,'nathay','tamrat','astu@nathayblog.et','0916048977','M'),(86,'agent',6,1,50,'test','some one','agent@lonche.com','itp@123','M'),(87,'hayal tamrat',1,1,NULL,'hayal','tamrat','hayaltamrat@gmail.com','+25191222112',NULL),(88,'yossef knfe',4,2,NULL,'yossef','knfe','yosef@gmail.com','0913566735',NULL),(89,'test21 test21',3,1,NULL,'test21','test21','test21@gmail.com','',NULL),(90,'Hayal Tamrat',1,1,NULL,'Hayal','Tamrat','kidoastu1993@gmail.com','0913566735',NULL),(91,'nathan tame',1,1,NULL,'nathan','tame','hayaltamrat3@gmail.com','0909090909',NULL),(92,'test admin',1,1,NULL,'test','admin','testadmin@gmail.com','0913566735',NULL),(93,'test hr',4,2,NULL,'test','hr','testhr@gmail.com','',NULL),(94,'test Leasing',0,1,NULL,'test','Leasing','testleasing@gmail.com','0913566735',NULL),(95,'test conten',3,1,NULL,'test','conten','testcontent@gmail.com','0913566735',NULL),(96,'test event',5,1,NULL,'test','event','testevent@gmail.com','0913566735',NULL),(97,'test follow_up',2,1,NULL,'test','follow_up','testfollowup@gmail.com','0913566735',NULL),(98,'content tets1',3,1,NULL,'content','tets1','contenttest1@gmail.com','0917266671',NULL),(99,'test test',1,1,NULL,'test','test','test@gmail.com','98893219831298',NULL),(100,'Security Auditor',1,1,NULL,'Security','Auditor','audit_1771417756741@example.com','0900000000',NULL),(5000,'Security Auditor',1,1,NULL,'Security','Auditor','audit_1771418828658@example.com','0900000000',NULL),(5001,'Security Auditor',1,1,NULL,'Security','Auditor','audit_1771419160931@example.com','0900000000',NULL),(5002,'tets tets',4,2,NULL,'tets','tets','tets113@gmail.com','0917122712',NULL),(5003,'contet contet',3,1,NULL,'contet','contet','contet1@gmail.com','+251913566735',NULL);
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization_structure`
--

DROP TABLE IF EXISTS `organization_structure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization_structure` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `name_amharic` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `level` int(11) DEFAULT 1,
  `description` text DEFAULT NULL,
  `head_employee_id` int(11) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization_structure`
--

LOCK TABLES `organization_structure` WRITE;
/*!40000 ALTER TABLE `organization_structure` DISABLE KEYS */;
/*!40000 ALTER TABLE `organization_structure` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `status` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'admin',1),(2,'barber',1),(3,'customer',1);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_categories`
--

DROP TABLE IF EXISTS `service_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category_image` varchar(500) DEFAULT NULL,
  `category_icon` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_categories`
--

LOCK TABLES `service_categories` WRITE;
/*!40000 ALTER TABLE `service_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `user_name` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `status` enum('1','0') DEFAULT '1',
  `online_flag` tinyint(1) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `role_id` int(11) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `failed_login_attempts` int(11) DEFAULT 0,
  `account_locked_until` datetime DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `redemption_token` varchar(255) DEFAULT NULL,
  `redemption_token_expires` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (9001,9001,'nathan27','$2a$10$UnLS/LqxPeKfzlQOR6Fi1eHtdb7K9Q64iKo3UYo1r/Qbn0GhOLdW.','2026-07-28 05:54:50','1',0,'2026-07-28 05:54:50',1,NULL,0,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'db_barber'
--

--
-- Dumping routines for database 'db_barber'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-27 23:33:27
