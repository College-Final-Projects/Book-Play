<?php
session_start();
$_SESSION['previous_page'] = $_SERVER['PHP_SELF'];
include '../../../components/navbar.php';
include  'Favorites.html';
?> 