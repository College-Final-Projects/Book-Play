<?php
session_start();
require_once '../../../db.php';
$_SESSION['previous_page'] = $_SERVER['PHP_SELF'];
<<<<<<< HEAD
include  '../navbar.html';
include  '../sportsScroll.html';
=======
include  '../navbar.php';
include '../../../components/sports-scroll.php';  
>>>>>>> 959a443ed196a3edef798af351ee8d74e088b501
include  'BookVenue.html';
?>