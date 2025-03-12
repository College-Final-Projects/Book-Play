<?php
session_start();

// Check if the user is logged in and get their role
if (!isset($_SESSION['user_role'])) {
    header("Location: ../Login Page/index.php"); // Redirect to login if not logged in
    exit();
}

$user_role = $_SESSION['user_role']; // 'player' or 'owner'

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Home | Book&Play</title>
    <link rel="stylesheet" href="home.css">
</head>
<body>

    <?php include 'includes/navbar.php'; ?>

    <div class="container">
        <?php if ($user_role == 'player'): ?>
            <?php include 'dashboard_player.php'; ?>
        <?php elseif ($user_role == 'owner'): ?>
            <?php include 'dashboard_owner.php'; ?>
        <?php endif; ?>
    </div>

    <?php include 'includes/footer.php'; ?>

</body>
</html>
