<?php
session_start();
$htmlPath = __DIR__ . "/Reset_Password.html";

if (file_exists($htmlPath)) {
    readfile($htmlPath);
} else {
    echo "❌ Reset_Password.html not found!";
}
/*if(isset($_POST['reset'])){
	$newPassword = $_POST['password'];
    $confirmPassword = $_POST['confirmPassword'];
	$username = $_SESSION['username'];
	if($newPassword == $confirmPassword){
        $password = password_hash($newPassword, PASSWORD_DEFAULT);
		$updatePssword = "UPDATE `users` SET `password`= '$password',WHERE username = '$username'";
		$conn->query($updatePssword);
		header("Location: index.php");
		exit;
	}else{
		echo "you dont write the same password in the fileds";
	}
}*/
?>
