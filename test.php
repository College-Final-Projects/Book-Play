<?php
include 'config/connection.php';
$reference = $database->getReference('users')->getValue(); // Replace with the path to your data


foreach ($reference as $key => $value){
    echo $value['fullName'];
    echo $value['password'];
}
?>