<?php
declare(strict_types=1);

// Set timezone for booking flow
date_default_timezone_set('Asia/Jerusalem');

// Booking flow constants (guarded in case file is included twice)
if (!defined('DEPOSIT_PERCENT')) define('DEPOSIT_PERCENT', 0.20);
if (!defined('DEPOSIT_WINDOW_HOURS')) define('DEPOSIT_WINDOW_HOURS', 2);
if (!defined('LAST_24H_BUFFER_HOURS')) define('LAST_24H_BUFFER_HOURS', 24);

// Helper function for server time
function serverNow(): DateTimeImmutable {
    return new DateTimeImmutable('now', new DateTimeZone('Asia/Jerusalem'));
}

// Database connection (PDO for transactions)
try {
    $db = new PDO('mysql:host=127.0.0.1;port=3307;dbname=bookplay;charset=utf8mb4', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
} catch (PDOException $e) {
    die("❌ Database connection failed: " . $e->getMessage());
}

/**
 * PHP 7.4-compatible BookingStatus (replace enum)
 */
final class BookingStatus {
    public const PENDING_DEPOSIT       = 'pending_deposit';
    public const ACTIVE_PAYMENT_WINDOW = 'active_payment_window';
    public const CANCELED              = 'canceled';
    public const PAID_IN_FULL          = 'paid_in_full';
}

// Sample booking data structure (kept your field names)
$booking = [
    'id'               => 123,
    'venue_name'       => 'Sample Sports Center',
    'total_price'      => 500.00,
    'booking_datetime' => '2025-01-15 18:00:00',
    'created_at'       => '2025-01-09 10:00:00',
    'status'           => BookingStatus::PENDING_DEPOSIT,
    'deposit_paid_at'  => null,
    'deposit_deadline' => '2025-01-09 12:00:00', // created_at + 2 hours
    'payment_deadline' => '2025-01-14 18:00:00', // booking_datetime - 24 hours
];

// Sample participants data structure
$participants = [
    ['user_id' => 'player1', 'required_payment' => 125.00, 'paid_amount' => 0.00, 'left_at' => null],
    ['user_id' => 'player2', 'required_payment' => 125.00, 'paid_amount' => 0.00, 'left_at' => null],
    ['user_id' => 'player3', 'required_payment' => 125.00, 'paid_amount' => 0.00, 'left_at' => null],
    ['user_id' => 'player4', 'required_payment' => 125.00, 'paid_amount' => 0.00, 'left_at' => null],
];

// Time helper functions (PHP 7.4-safe)
function computeDepositDeadline(string $createdAt): DateTimeImmutable {
    $created = new DateTimeImmutable($createdAt, new DateTimeZone('Asia/Jerusalem'));
    return $created->add(new DateInterval('PT' . (int)DEPOSIT_WINDOW_HOURS . 'H'));
}

function computePaymentDeadline(string $bookingDateTime): DateTimeImmutable {
    $booking = new DateTimeImmutable($bookingDateTime, new DateTimeZone('Asia/Jerusalem'));
    return $booking->sub(new DateInterval('PT' . (int)LAST_24H_BUFFER_HOURS . 'H'));
}

function isInsideLast24h(string $bookingDateTime): bool {
    $paymentDeadline = computePaymentDeadline($bookingDateTime);
    $now = serverNow();
    return $now >= $paymentDeadline;
}

/**
 * @param array<int,array{required_payment:float,paid_amount:float}> $participants
 * @return array{total_price:float,total_required:float,total_paid:float,deposit_required:float,remaining:float}
 */
function totals(array $participants, float $totalPrice): array {
    $totalRequired   = 0.0;
    $totalPaid       = 0.0;

    foreach ($participants as $p) {
        $totalRequired += isset($p['required_payment']) ? (float)$p['required_payment'] : 0.0;
        $totalPaid     += isset($p['paid_amount']) ? (float)$p['paid_amount'] : 0.0;
    }

    $depositRequired = (float)$totalPrice * (float)DEPOSIT_PERCENT;
    $remaining       = max(0.0, (float)$totalPrice - (float)$totalPaid);

    return [
        'total_price'      => (float)$totalPrice,
        'total_required'   => (float)$totalRequired,
        'total_paid'       => (float)$totalPaid,
        'deposit_required' => (float)$depositRequired,
        'remaining'        => (float)$remaining,
    ];
}

/**
 * Compute current window state and seconds left
 * @param array $booking
 * @return array{window:string, seconds_left:int}
 */
function windowState(array $booking): array {
    $now = serverNow();
    $window = 'none';
    $seconds = 0;

    if ($booking['status'] === BookingStatus::PENDING_DEPOSIT) {
        $window = 'deposit';
        $deadline = computeDepositDeadline($booking['created_at']);
        $seconds = max(0, $deadline->getTimestamp() - $now->getTimestamp());
    } elseif ($booking['status'] === BookingStatus::ACTIVE_PAYMENT_WINDOW) {
        $window = 'payment';
        $deadline = computePaymentDeadline($booking['event_start']); // use database field name
        $seconds = max(0, $deadline->getTimestamp() - $now->getTimestamp());
    }

    return ['window' => $window, 'seconds_left' => (int)$seconds];
}

/**
 * Parse participants parameter from request
 * Accepts either repeated participants[]=u1&participants[]=u2 OR JSON string
 * @param array $request
 * @return array
 */
function parseParticipantsParam(array $request): array {
    // Check for repeated participants[] parameters
    if (isset($request['participants']) && is_array($request['participants'])) {
        return array_values($request['participants']);
    }
    
    // Check for JSON string in participants parameter
    if (isset($request['participants']) && is_string($request['participants'])) {
        $decoded = json_decode($request['participants'], true);
        if (is_array($decoded)) {
            return array_values($decoded);
        }
    }
    
    return [];
}

// ============================================================================
// DATABASE PERSISTENCE
// ============================================================================

/**
 * Create database tables if they don't exist
 */
function migrateIfNeeded(PDO $db): void {
    $tables = [
        'bookings' => "
            CREATE TABLE IF NOT EXISTS bookings (
                id VARCHAR(64) PRIMARY KEY,
                host_user_id VARCHAR(64) NOT NULL,
                venue_name VARCHAR(191) NULL,
                event_start DATETIME NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                status ENUM('pending_deposit','active_payment_window','canceled','paid_in_full') NOT NULL DEFAULT 'pending_deposit',
                created_at DATETIME NOT NULL,
                deposit_deadline DATETIME NOT NULL,
                deposit_paid_at DATETIME NULL,
                payment_deadline DATETIME NOT NULL,
                amount_paid_total DECIMAL(10,2) DEFAULT 0,
                INDEX idx_host_user_id (host_user_id),
                INDEX idx_status (status),
                INDEX idx_event_start (event_start)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'booking_participants' => "
            CREATE TABLE IF NOT EXISTS booking_participants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id VARCHAR(64) NOT NULL,
                user_id VARCHAR(64) NOT NULL,
                email VARCHAR(191) NULL,
                owed_amount DECIMAL(10,2) NOT NULL,
                paid_amount DECIMAL(10,2) DEFAULT 0,
                left_at DATETIME NULL,
                INDEX idx_booking_id (booking_id),
                INDEX idx_user_id (user_id),
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'booking_payments' => "
            CREATE TABLE IF NOT EXISTS booking_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id VARCHAR(64) NOT NULL,
                user_id VARCHAR(64) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                paid_at DATETIME NOT NULL,
                INDEX idx_booking_id (booking_id),
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'email_log' => "
            CREATE TABLE IF NOT EXISTS email_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id VARCHAR(64) NULL,
                user_id VARCHAR(64) NULL,
                subject VARCHAR(191) NOT NULL,
                body TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                INDEX idx_booking_id (booking_id),
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        "
    ];
    
    foreach ($tables as $tableName => $sql) {
        try {
            $db->exec($sql);
        } catch (PDOException $e) {
            error_log("Failed to create table $tableName: " . $e->getMessage());
            throw new Exception("Database migration failed for table $tableName");
        }
    }
}

/**
 * Load booking from database
 */
function loadBooking(string $id): ?array {
    global $db;
    
    $stmt = $db->prepare("SELECT * FROM bookings WHERE id = ?");
    $stmt->execute([$id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $result ?: null;
}

/**
 * Save booking to database
 */
function saveBooking(array $booking): void {
    global $db;
    
    $sql = "
        INSERT INTO bookings (
            id, host_user_id, venue_name, event_start, total_amount, status,
            created_at, deposit_deadline, deposit_paid_at, payment_deadline, amount_paid_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            host_user_id = VALUES(host_user_id),
            venue_name = VALUES(venue_name),
            event_start = VALUES(event_start),
            total_amount = VALUES(total_amount),
            status = VALUES(status),
            deposit_deadline = VALUES(deposit_deadline),
            deposit_paid_at = VALUES(deposit_paid_at),
            payment_deadline = VALUES(payment_deadline),
            amount_paid_total = VALUES(amount_paid_total)
    ";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $booking['id'],
        $booking['host_user_id'],
        $booking['venue_name'] ?? null,
        $booking['event_start'],
        $booking['total_amount'],
        $booking['status'],
        $booking['created_at'],
        $booking['deposit_deadline'],
        $booking['deposit_paid_at'] ?? null,
        $booking['payment_deadline'],
        $booking['amount_paid_total'] ?? 0
    ]);
}

/**
 * Load participants from database
 */
function loadParticipants(string $booking_id): array {
    global $db;
    
    $stmt = $db->prepare("SELECT * FROM booking_participants WHERE booking_id = ? ORDER BY id");
    $stmt->execute([$booking_id]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convert to expected format
    $participants = [];
    foreach ($results as $row) {
        $participants[] = [
            'user_id' => $row['user_id'],
            'required_payment' => (float)$row['owed_amount'],
            'paid_amount' => (float)$row['paid_amount'],
            'left_at' => $row['left_at']
        ];
    }
    
    return $participants;
}

/**
 * Replace all participants for a booking
 */
function replaceParticipants(string $booking_id, array $participants): void {
    global $db;
    
    $db->beginTransaction();
    try {
        // Delete existing participants
        $stmt = $db->prepare("DELETE FROM booking_participants WHERE booking_id = ?");
        $stmt->execute([$booking_id]);
        
        // Insert new participants
        if (!empty($participants)) {
            $stmt = $db->prepare("
                INSERT INTO booking_participants (booking_id, user_id, email, owed_amount, paid_amount, left_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($participants as $participant) {
                $stmt->execute([
                    $booking_id,
                    $participant['user_id'],
                    $participant['email'] ?? null,
                    $participant['required_payment'],
                    $participant['paid_amount'] ?? 0,
                    $participant['left_at'] ?? null
                ]);
            }
        }
        
        $db->commit();
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Upsert a single participant
 */
function upsertParticipant(string $booking_id, string $user_id, array $fields): void {
    global $db;
    
    $sql = "
        INSERT INTO booking_participants (booking_id, user_id, email, owed_amount, paid_amount, left_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            email = VALUES(email),
            owed_amount = VALUES(owed_amount),
            paid_amount = VALUES(paid_amount),
            left_at = VALUES(left_at)
    ";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $booking_id,
        $user_id,
        $fields['email'] ?? null,
        $fields['required_payment'] ?? 0,
        $fields['paid_amount'] ?? 0,
        $fields['left_at'] ?? null
    ]);
}

/**
 * Add payment and update totals
 */
function addPayment(string $booking_id, string $user_id, float $amount): void {
    global $db;
    
    $db->beginTransaction();
    try {
        // Insert payment record
        $stmt = $db->prepare("
            INSERT INTO booking_payments (booking_id, user_id, amount, paid_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$booking_id, $user_id, $amount]);
        
        // Update participant's paid amount
        $stmt = $db->prepare("
            UPDATE booking_participants 
            SET paid_amount = paid_amount + ? 
            WHERE booking_id = ? AND user_id = ?
        ");
        $stmt->execute([$amount, $booking_id, $user_id]);
        
        // Recompute booking's total paid amount
        $stmt = $db->prepare("
            UPDATE bookings 
            SET amount_paid_total = (
                SELECT COALESCE(SUM(paid_amount), 0) 
                FROM booking_participants 
                WHERE booking_id = ?
            )
            WHERE id = ?
        ");
        $stmt->execute([$booking_id, $booking_id]);
        
        $db->commit();
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Log email to database
 */
function logEmail(?string $booking_id, ?string $user_id, string $subject, string $body): void {
    global $db;
    
    $stmt = $db->prepare("
        INSERT INTO email_log (booking_id, user_id, subject, body, created_at)
        VALUES (?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$booking_id, $user_id, $subject, $body]);
}

// ============================================================================
// EMAIL SYSTEM
// ============================================================================

/**
 * Send email (logs to file and database, optionally echoes in debug mode)
 */
function sendEmail(string $to, string $subject, string $body): void {
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] TO:<$to> | $subject\n$body\n---\n";
    
    // Try to write to /tmp/mail.log (or fallback to current directory)
    $logFile = '/tmp/mail.log';
    $fallbackLogFile = __DIR__ . '/mail.log';
    
    if (is_writable(dirname($logFile)) || is_writable($logFile)) {
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    } elseif (is_writable(__DIR__)) {
        file_put_contents($fallbackLogFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    // Log to database
    try {
        logEmail(null, $to, $subject, $body);
    } catch (Exception $e) {
        error_log("Failed to log email to database: " . $e->getMessage());
    }
    
    // Echo in debug mode
    global $debug_mode;
    if ($debug_mode) {
        echo "<pre style='margin-top:20px; padding:10px; background:#f5f5f5; border:1px solid #ddd;'>";
        echo htmlspecialchars($logEntry);
        echo "</pre>";
    }
}

/**
 * Build email for deposit missed cancellation
 */
function buildEmailDepositMissed(array $booking): array {
    $venue = $booking['venue_name'] ?? 'Sports Venue';
    $eventDate = $booking['booking_datetime'] ?? 'TBD';
    $totalAmount = number_format($booking['total_price'] ?? 0, 2);
    
    $subject = 'Booking Canceled — Deposit Not Paid';
    $body = "Your booking has been automatically canceled because the deposit was not paid within the required timeframe.\n\n";
    $body .= "Booking Details:\n";
    $body .= "- Venue: $venue\n";
    $body .= "- Event Date: $eventDate\n";
    $body .= "- Total Amount: \$$totalAmount\n\n";
    $body .= "Reason: The 20% deposit was not paid within 2 hours of booking creation.\n\n";
    $body .= "Next Steps: You can create a new booking if the venue is still available.\n\n";
    $body .= "Thank you for using our booking system.";
    
    return ['subject' => $subject, 'body' => $body];
}

/**
 * Build email for payment deadline missed cancellation
 */
function buildEmailPaymentMissed(array $booking): array {
    $venue = $booking['venue_name'] ?? 'Sports Venue';
    $eventDate = $booking['booking_datetime'] ?? 'TBD';
    $totalAmount = number_format($booking['total_price'] ?? 0, 2);
    
    $subject = 'Booking Canceled — Payment Deadline Missed';
    $body = "Your booking has been automatically canceled because the full payment was not completed by the deadline.\n\n";
    $body .= "Booking Details:\n";
    $body .= "- Venue: $venue\n";
    $body .= "- Event Date: $eventDate\n";
    $body .= "- Total Amount: \$$totalAmount\n\n";
    $body .= "Reason: The full payment was not completed 24 hours before the event.\n\n";
    $body .= "Next Steps: You can create a new booking if the venue is still available.\n\n";
    $body .= "Thank you for using our booking system.";
    
    return ['subject' => $subject, 'body' => $body];
}

/**
 * Build email for user leaving with refund
 */
function buildEmailLeftWithRefund(array $booking, string $user_id, float $amount): array {
    $venue = $booking['venue_name'] ?? 'Sports Venue';
    $eventDate = $booking['booking_datetime'] ?? 'TBD';
    $refundAmount = number_format($amount, 2);
    
    $subject = 'You Left the Booking — Refund Notice';
    $body = "You have left the group booking and will receive a refund for your payment.\n\n";
    $body .= "Booking Details:\n";
    $body .= "- Venue: $venue\n";
    $body .= "- Event Date: $eventDate\n";
    $body .= "- Refund Amount: \$$refundAmount\n\n";
    $body .= "Your refund will be processed within 3-5 business days and returned to your original payment method.\n\n";
    $body .= "Next Steps: You can join other available bookings or create your own.\n\n";
    $body .= "Thank you for using our booking system.";
    
    return ['subject' => $subject, 'body' => $body];
}

// ============================================================================
// HTTP METHOD & CSRF PROTECTION
// ============================================================================

/**
 * Check if request is in demo mode
 */
function isDemoMode(): bool {
    return isset($_GET['demo']) && $_GET['demo'] === '1';
}

/**
 * Enforce POST method for mutations (allow GET only in demo mode)
 */
function enforcePostMethod(): void {
    if (!isDemoMode() && $_SERVER['REQUEST_METHOD'] !== 'POST') {
        fail('Method not allowed. Use POST for mutations.', 'METHOD_NOT_ALLOWED', 405);
    }
}

/**
 * Get parameter from POST or GET with fallback
 */
function getParam(string $key, string $default = '', array $source = null): string {
    if ($source === null) {
        $source = array_merge($_POST, $_GET);
    }
    return (string)($source[$key] ?? $default);
}

/**
 * Generate CSRF token if not exists
 */
function ensureCsrfToken(): string {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Validate CSRF token (skip in demo mode)
 */
function validateCsrfToken(): void {
    if (isDemoMode()) {
        return; // Skip CSRF validation in demo mode
    }
    
    $provided = getParam('csrf_token');
    $expected = ensureCsrfToken();
    
    if (!hash_equals($expected, $provided)) {
        fail('Invalid CSRF token', 'CSRF_FAILED', 403);
    }
}

// ============================================================================
// MONEY PRECISION HELPERS
// ============================================================================

/**
 * Add two money amounts with 2-decimal precision
 */
function money_add(string $a, string $b): string {
    if (function_exists('bcadd')) {
        return bcadd($a, $b, 2);
    }
    // Fallback to float with rounding
    return number_format((float)$a + (float)$b, 2, '.', '');
}

/**
 * Subtract two money amounts with 2-decimal precision
 */
function money_sub(string $a, string $b): string {
    if (function_exists('bcsub')) {
        return bcsub($a, $b, 2);
    }
    // Fallback to float with rounding
    return number_format((float)$a - (float)$b, 2, '.', '');
}

/**
 * Compare two money amounts
 * Returns: -1 if $a < $b, 0 if $a == $b, 1 if $a > $b
 */
function money_cmp(string $a, string $b): int {
    if (function_exists('bccomp')) {
        return bccomp($a, $b, 2);
    }
    // Fallback to float comparison
    $diff = (float)$a - (float)$b;
    if (abs($diff) < 0.005) return 0; // Consider equal if within 0.5 cents
    return $diff > 0 ? 1 : -1;
}

/**
 * Format money amount to 2 decimal places
 */
function money_format(string $amount): string {
    return number_format((float)$amount, 2, '.', '');
}

/**
 * Validate and coerce money amount
 */
function validateMoneyAmount(string $amount): string {
    $value = (float)$amount;
    if ($value < 0) {
        fail('Amount must be non-negative', 'BAD_REQUEST', 400);
    }
    return money_format($amount);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if booking is canceled and fail if so
 */
function validateNotCanceled(): void {
    global $booking;
    if ($booking['status'] === BookingStatus::CANCELED) {
        fail('Booking is canceled', 'CANCELED', 409);
    }
}

/**
 * Validate deposit payment timing
 */
function validateDepositTiming(): void {
    global $booking;
    $now = serverNow();
    $deposit_deadline = new DateTimeImmutable($booking['deposit_deadline'], new DateTimeZone('Asia/Jerusalem'));
    
    if ($booking['status'] !== BookingStatus::PENDING_DEPOSIT) {
        fail('Invalid status for deposit payment', 'INVALID_STATUS', 422);
    }
    
    if ($now > $deposit_deadline) {
        fail('Deposit deadline has passed', 'DEADLINE_PASSED', 422);
    }
}

/**
 * Validate payment timing
 */
function validatePaymentTiming(): void {
    global $booking;
    $now = serverNow();
    $payment_deadline = new DateTimeImmutable($booking['payment_deadline'], new DateTimeZone('Asia/Jerusalem'));
    
    if ($booking['status'] !== BookingStatus::ACTIVE_PAYMENT_WINDOW) {
        fail('Invalid status for payment', 'INVALID_STATUS', 422);
    }
    
    if ($now > $payment_deadline) {
        fail('Payment deadline has passed', 'DEADLINE_PASSED', 422);
    }
}

/**
 * Validate split operations timing
 */
function validateSplitTiming(): void {
    global $booking;
    if ($booking['status'] === BookingStatus::CANCELED) {
        fail('Cannot modify split - booking is canceled', 'CANCELED', 409);
    }
    if ($booking['status'] === BookingStatus::PAID_IN_FULL) {
        fail('Cannot modify split - booking is fully paid', 'PAID_IN_FULL', 409);
    }
}

// ============================================================================
// JSON RESPONSE HELPERS
// ============================================================================

/**
 * Send JSON response with proper headers
 */
function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

/**
 * Send success response
 */
function ok(array $data = []): void {
    $response = array_merge(['ok' => true], $data);
    jsonResponse($response);
}

/**
 * Send error response
 */
function fail(string $message, string $code = 'BAD_REQUEST', int $status = 400): void {
    jsonResponse([
        'ok' => false,
        'error' => $message,
        'code' => $code
    ], $status);
}

// ============================================================================
// BOOKING ACTIONS ROUTER
// ============================================================================

/**
 * Action: Create a new booking
 */
function create_booking(string $host_id, string $event_start_iso, float $total_amount, array $participants): void {
    global $db;
    
    $now = serverNow();
    
    // Generate unique booking ID if not provided
    $booking_id = uniqid('b_', true);
    
    // Validate and set event start time
    try {
        $event_start = new DateTimeImmutable($event_start_iso, new DateTimeZone('Asia/Jerusalem'));
    } catch (Exception $e) {
        // Default to 2 days from now at 18:00
        $event_start = $now->add(new DateInterval('P2D'))->setTime(18, 0, 0);
    }
    
    // Ensure event is in the future
    if ($event_start <= $now) {
        $event_start = $now->add(new DateInterval('P2D'))->setTime(18, 0, 0);
    }
    
    // Calculate deadlines
    $deposit_deadline = $now->add(new DateInterval('PT' . (int)DEPOSIT_WINDOW_HOURS . 'H'));
    $payment_deadline = $event_start->sub(new DateInterval('PT' . (int)LAST_24H_BUFFER_HOURS . 'H'));
    
    // Ensure payment deadline is after deposit deadline
    if ($payment_deadline <= $deposit_deadline) {
        $payment_deadline = $deposit_deadline->add(new DateInterval('PT1H'));
    }
    
    // Build new booking
    $booking = [
        'id' => $booking_id,
        'host_user_id' => $host_id,
        'venue_name' => 'Sample Sports Center',
        'event_start' => $event_start->format('Y-m-d H:i:s'),
        'total_amount' => $total_amount,
        'status' => BookingStatus::PENDING_DEPOSIT,
        'created_at' => $now->format('Y-m-d H:i:s'),
        'deposit_deadline' => $deposit_deadline->format('Y-m-d H:i:s'),
        'deposit_paid_at' => null,
        'payment_deadline' => $payment_deadline->format('Y-m-d H:i:s'),
        'amount_paid_total' => 0
    ];
    
    // Initialize participants with even split
    $per_person = count($participants) > 0 ? $total_amount / count($participants) : 0;
    $participant_rows = [];
    foreach ($participants as $user_id) {
        $participant_rows[] = [
            'user_id' => $user_id,
            'required_payment' => $per_person,
            'paid_amount' => 0.0,
            'left_at' => null
        ];
    }
    
    try {
        // Save booking and participants in transaction
        $db->beginTransaction();
        
        saveBooking($booking);
        replaceParticipants($booking_id, $participant_rows);
        
        $db->commit();
        
        // Load the created booking and participants for response
        $booking = loadBooking($booking_id);
        $participants = loadParticipants($booking_id);
        
        $totals_data = totals($participants, $booking['total_amount']);
        $window_state = windowState($booking);
        
        ok(array_merge([
            'booking_id' => $booking_id,
            'status' => $booking['status'],
            'totals' => $totals_data,
            'participants' => $participants
        ], $window_state));
        
    } catch (Exception $e) {
        $db->rollBack();
        fail('Database error: ' . $e->getMessage(), 'DB_ERROR', 500);
    }
}

/**
 * Action: Pay deposit (host only)
 */
function pay_deposit(int $booking_id, string $host_id): void {
    global $db;
    
    // Load booking and participants from database
    $booking = loadBooking((string)$booking_id);
    if (!$booking) {
        fail('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    
    $participants = loadParticipants((string)$booking_id);
    
    validateNotCanceled();
    validateDepositTiming();
    
    $now = serverNow();
    
    try {
        // Update booking status and deposit paid time
        $stmt = $db->prepare("
            UPDATE bookings 
            SET status = ?, deposit_paid_at = ? 
            WHERE id = ?
        ");
        $stmt->execute([
            BookingStatus::ACTIVE_PAYMENT_WINDOW,
            $now->format('Y-m-d H:i:s'),
            $booking_id
        ]);
        
        // Reload updated booking
        $booking = loadBooking((string)$booking_id);
        $participants = loadParticipants((string)$booking_id);
        
        $totals_data = totals($participants, $booking['total_amount']);
        $window_state = windowState($booking);
        
        ok(array_merge([
            'status' => $booking['status'],
            'totals' => $totals_data,
            'participants' => $participants
        ], $window_state));
        
    } catch (Exception $e) {
        fail('Database error: ' . $e->getMessage(), 'DB_ERROR', 500);
    }
}

/**
 * Action: Pay individual share
 */
function pay_share(int $booking_id, string $user_id, float $amount): void {
    global $db;
    
    // Load booking and participants from database
    $booking = loadBooking((string)$booking_id);
    if (!$booking) {
        fail('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    
    $participants = loadParticipants((string)$booking_id);
    
    validateNotCanceled();
    validatePaymentTiming();
    
    if ($amount <= 0) {
        fail('Amount must be positive', 'INVALID_AMOUNT', 400);
    }
    
    // Find user and validate payment
    $user_found = false;
    foreach ($participants as $participant) {
        if ($participant['user_id'] === $user_id) {
            $user_found = true;
            
            // Check if user has left
            if ($participant['left_at'] !== null) {
                fail('Cannot pay - user has left the booking', 'USER_LEFT', 409);
            }
            
            $max_payment = $participant['required_payment'] - $participant['paid_amount'];
            
            if ($amount > $max_payment) {
                fail('Cannot pay more than owed amount', 'AMOUNT_TOO_HIGH', 400);
            }
            break;
        }
    }
    
    if (!$user_found) {
        fail('User not found in booking', 'USER_NOT_FOUND', 404);
    }
    
    try {
        // Add payment using the helper function
        addPayment((string)$booking_id, $user_id, $amount);
        
        // Check if fully paid and update status
        $participants = loadParticipants((string)$booking_id);
        $totals_data = totals($participants, $booking['total_amount']);
        
        if ($totals_data['remaining'] <= 0.01) {
            $stmt = $db->prepare("UPDATE bookings SET status = ? WHERE id = ?");
            $stmt->execute([BookingStatus::PAID_IN_FULL, $booking_id]);
        }
        
        // Reload updated booking and participants
        $booking = loadBooking((string)$booking_id);
        $participants = loadParticipants((string)$booking_id);
        
        $totals_data = totals($participants, $booking['total_amount']);
        $window_state = windowState($booking);
        
        ok(array_merge([
            'status' => $booking['status'],
            'totals' => $totals_data,
            'participants' => $participants
        ], $window_state));
        
    } catch (Exception $e) {
        fail('Database error: ' . $e->getMessage(), 'DB_ERROR', 500);
    }
}

/**
 * Action: Leave group
 */
function leave_group(int $booking_id, string $user_id): void {
    global $db;
    
    // Load booking and participants from database
    $booking = loadBooking((string)$booking_id);
    if (!$booking) {
        fail('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    
    $participants = loadParticipants((string)$booking_id);
    
    validateNotCanceled();
    
    $now = serverNow();
    $payment_deadline = new DateTimeImmutable($booking['payment_deadline'], new DateTimeZone('Asia/Jerusalem'));
    $inside_last_24h = $now >= $payment_deadline;
    
    $refund_amount = 0.0;
    $note = '';
    $user_found = false;
    $participant = null;
    
    // Find user and validate they exist and haven't already left
    foreach ($participants as $p) {
        if ($p['user_id'] === $user_id) {
            $user_found = true;
            $participant = $p;
            
            // Check if user has already left
            if ($p['left_at'] !== null) {
                fail('User has already left the booking', 'USER_ALREADY_LEFT', 409);
            }
            break;
        }
    }
    
    if (!$user_found) {
        fail('User not found in booking', 'USER_NOT_FOUND', 404);
    }
    
    // Branch on booking status first
    if ($booking['status'] === BookingStatus::PENDING_DEPOSIT) {
        // Rule A: No one has paid yet during deposit phase
        $note = 'No refund (deposit not paid yet)';
        
    } elseif ($booking['status'] === BookingStatus::ACTIVE_PAYMENT_WINDOW) {
        // Rule B: Check if inside last 24h
        if ($inside_last_24h) {
            // Inside last 24h - no refund
            $note = 'No refund (inside last 24h)';
        } else {
            // Outside last 24h - check if user paid anything
            if ($participant['paid_amount'] > 0) {
                // User paid > 0: refund that exact amount
                $refund_amount = $participant['paid_amount'];
                $note = 'Refund queued: $' . number_format($refund_amount, 2);
                
                // Send refund email to user
                $emailData = buildEmailLeftWithRefund($booking, $user_id, $refund_amount);
                sendEmail($user_id, $emailData['subject'], $emailData['body']);
            } else {
                // User paid = 0: no refund
                $note = 'No refund';
            }
        }
    } else {
        // For other statuses (canceled, paid_in_full)
        $note = 'No refund (booking ' . $booking['status'] . ')';
    }
    
    try {
        // Mark user as left in database
        $stmt = $db->prepare("
            UPDATE booking_participants 
            SET left_at = ?, owed_amount = 0 
            WHERE booking_id = ? AND user_id = ?
        ");
        $stmt->execute([
            $now->format('Y-m-d H:i:s'),
            $booking_id,
            $user_id
        ]);
        
        // Update booking's total paid amount
        $stmt = $db->prepare("
            UPDATE bookings 
            SET amount_paid_total = (
                SELECT COALESCE(SUM(paid_amount), 0) 
                FROM booking_participants 
                WHERE booking_id = ? AND left_at IS NULL
            )
            WHERE id = ?
        ");
        $stmt->execute([$booking_id, $booking_id]);
        
        // Reload updated booking and participants
        $booking = loadBooking((string)$booking_id);
        $participants = loadParticipants((string)$booking_id);
        
        $totals_data = totals($participants, $booking['total_amount']);
        $window_state = windowState($booking);
        
        ok(array_merge([
            'status' => $booking['status'],
            'totals' => $totals_data,
            'participants' => $participants,
            'note' => $note
        ], $window_state));
        
    } catch (Exception $e) {
        fail('Database error: ' . $e->getMessage(), 'DB_ERROR', 500);
    }
}

/**
 * Action: Smart split remaining amount
 */
function smart_split(int $booking_id): void {
    global $db;
    
    // Load booking and participants from database
    $booking = loadBooking((string)$booking_id);
    if (!$booking) {
        fail('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    
    $participants = loadParticipants((string)$booking_id);
    
    validateSplitTiming();
    
    $active_participants = array_filter($participants, function($p) {
        return $p['left_at'] === null;
    });
    
    if (empty($active_participants)) {
        fail('No active participants', 'NO_ACTIVE', 422);
    }
    
    // Calculate remaining amount from active participants only
    $active_paid_total = 0;
    foreach ($active_participants as $p) {
        $active_paid_total += $p['paid_amount'];
    }
    $remaining = $booking['total_amount'] - $active_paid_total;
    
    if ($remaining <= 0) {
        fail('No remaining amount to split', 'NO_REMAINING', 422);
    }
    
    $active_count = count($active_participants);
    $even_share = round($remaining / $active_count, 2);
    
    // Calculate rounding remainder
    $total_distributed = $even_share * $active_count;
    $rounding_delta = round($remaining - $total_distributed, 2);
    
    try {
        $db->beginTransaction();
        
        // Update owed amounts for active participants
        $stmt = $db->prepare("
            UPDATE booking_participants 
            SET owed_amount = ? 
            WHERE booking_id = ? AND user_id = ? AND left_at IS NULL
        ");
        
        $active_user_ids = array_column($active_participants, 'user_id');
        
        // Apply even share to all active participants
        foreach ($active_user_ids as $user_id) {
            $stmt->execute([$even_share, $booking_id, $user_id]);
        }
        
        // Distribute rounding remainder to first few participants
        if (abs($rounding_delta) >= 0.01) {
            $adjustment_per_person = $rounding_delta > 0 ? 0.01 : -0.01;
            $adjustments_needed = abs(round($rounding_delta / 0.01));
            
            for ($i = 0; $i < min($adjustments_needed, count($active_user_ids)); $i++) {
                $stmt = $db->prepare("
                    UPDATE booking_participants 
                    SET owed_amount = owed_amount + ? 
                    WHERE booking_id = ? AND user_id = ? AND left_at IS NULL
                ");
                $stmt->execute([$adjustment_per_person, $booking_id, $active_user_ids[$i]]);
            }
        }
        
        // Ensure owed_amount >= paid_amount for all active participants
        $stmt = $db->prepare("
            UPDATE booking_participants 
            SET owed_amount = GREATEST(owed_amount, paid_amount) 
            WHERE booking_id = ? AND left_at IS NULL
        ");
        $stmt->execute([$booking_id]);
        
        $db->commit();
        
        // Reload updated participants
        $participants = loadParticipants((string)$booking_id);
        
        $totals_data = totals($participants, $booking['total_amount']);
        $window_state = windowState($booking);
        
        ok(array_merge([
            'status' => $booking['status'],
            'totals' => $totals_data,
            'participants' => $participants
        ], $window_state));
        
    } catch (Exception $e) {
        $db->rollBack();
        fail('Database error: ' . $e->getMessage(), 'DB_ERROR', 500);
    }
}

/**
 * Action: Manage split (host only)
 */
function manage_split(int $booking_id, array $edits): void {
    global $db;
    
    // Load booking and participants from database
    $booking = loadBooking((string)$booking_id);
    if (!$booking) {
        fail('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    
    $participants = loadParticipants((string)$booking_id);
    
    validateSplitTiming();
    
    // TODO: Add host validation - check if current user is the host
    // For now, allow any user to call this (demo mode)
    
    if (empty($edits)) {
        fail('No edits provided', 'NO_EDITS', 400);
    }
    
    // Get active participants
    $active_participants = array_filter($participants, function($p) {
        return $p['left_at'] === null;
    });
    
    if (empty($active_participants)) {
        fail('No active participants', 'NO_ACTIVE', 422);
    }
    
    // Process edits
    $processed_edits = [];
    foreach ($edits as $edit) {
        if (is_array($edit) && isset($edit['user_id']) && isset($edit['owed'])) {
            $processed_edits[$edit['user_id']] = round((float)$edit['owed'], 2);
        } elseif (is_string($edit)) {
            // Handle string format if needed
            $parts = explode(':', $edit);
            if (count($parts) === 2) {
                $processed_edits[$parts[0]] = round((float)$parts[1], 2);
            }
        }
    }
    
    try {
        $db->beginTransaction();
        
        // Apply edits to active participants only
        $stmt = $db->prepare("
            UPDATE booking_participants 
            SET owed_amount = ? 
            WHERE booking_id = ? AND user_id = ? AND left_at IS NULL
        ");
        
        $active_owed_total = 0;
        $active_paid_total = 0;
        
        foreach ($active_participants as $participant) {
            $active_paid_total += $participant['paid_amount'];
            
            if (isset($processed_edits[$participant['user_id']])) {
                $new_owed = $processed_edits[$participant['user_id']];
                
                // Ensure owed_amount >= paid_amount
                if ($new_owed < $participant['paid_amount']) {
                    $new_owed = $participant['paid_amount'];
                }
                
                $stmt->execute([$new_owed, $booking_id, $participant['user_id']]);
                $active_owed_total += $new_owed;
            } else {
                $active_owed_total += $participant['required_payment'];
            }
        }
        
        // Calculate expected total and adjust for rounding if needed
        $expected_total = $booking['total_amount'];
        $delta = round($expected_total - $active_owed_total, 2);
        
        if (abs($delta) >= 0.01) {
            // Find the participant with the largest owed amount and adjust
            $stmt = $db->prepare("
                SELECT user_id, owed_amount 
                FROM booking_participants 
                WHERE booking_id = ? AND left_at IS NULL 
                ORDER BY owed_amount DESC 
                LIMIT 1
            ");
            $stmt->execute([$booking_id]);
            $max_participant = $stmt->fetch();
            
            if ($max_participant) {
                $new_amount = $max_participant['owed_amount'] + $delta;
                // Ensure it doesn't go below paid amount
                $stmt = $db->prepare("
                    UPDATE booking_participants 
                    SET owed_amount = GREATEST(?, paid_amount) 
                    WHERE booking_id = ? AND user_id = ? AND left_at IS NULL
                ");
                $stmt->execute([$new_amount, $booking_id, $max_participant['user_id']]);
            }
        }
        
        $db->commit();
        
        // Reload updated participants
        $participants = loadParticipants((string)$booking_id);
        
        $totals_data = totals($participants, $booking['total_amount']);
        $window_state = windowState($booking);
        
        ok(array_merge([
            'status' => $booking['status'],
            'totals' => $totals_data,
            'participants' => $participants
        ], $window_state));
        
    } catch (Exception $e) {
        $db->rollBack();
        fail('Database error: ' . $e->getMessage(), 'DB_ERROR', 500);
    }
}

/**
 * Action: Enforce deadlines
 */
function enforce_deadlines(int $booking_id): void {
    global $db;
    
    // Load booking and participants from database
    $booking = loadBooking((string)$booking_id);
    if (!$booking) {
        fail('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    
    $participants = loadParticipants((string)$booking_id);
    
    $now = serverNow();
    
    // Always recompute deadlines
    $created_at = new DateTimeImmutable($booking['created_at'], new DateTimeZone('Asia/Jerusalem'));
    $event_start = new DateTimeImmutable($booking['booking_datetime'], new DateTimeZone('Asia/Jerusalem'));
    
    $deposit_deadline = $created_at->add(new DateInterval('PT' . DEPOSIT_WINDOW_HOURS . 'H'));
    $payment_deadline = $event_start->sub(new DateInterval('PT' . LAST_24H_BUFFER_HOURS . 'H'));
    
    $reason = null;
    $status_changed = false;
    
    try {
        // Always update deadlines in database
        $stmt = $db->prepare("
            UPDATE bookings 
            SET deposit_deadline = ?, payment_deadline = ? 
            WHERE id = ?
        ");
        $stmt->execute([
            $deposit_deadline->format('Y-m-d H:i:s'),
            $payment_deadline->format('Y-m-d H:i:s'),
            $booking_id
        ]);
        
        // Check deposit deadline
        if ($booking['status'] === BookingStatus::PENDING_DEPOSIT && $now > $deposit_deadline) {
            $stmt = $db->prepare("UPDATE bookings SET status = ? WHERE id = ?");
            $stmt->execute([BookingStatus::CANCELED, $booking_id]);
            $status_changed = true;
            $reason = 'deposit_missed';
            
            // Send emails to host and all participants
            $emailData = buildEmailDepositMissed($booking);
            $allUsers = array_merge(
                [$booking['host_user_id'] ?? 'host@example.com'], 
                array_filter(array_column($participants, 'user_id'))
            );
            foreach ($allUsers as $userEmail) {
                if (!empty($userEmail)) {
                    sendEmail($userEmail, $emailData['subject'], $emailData['body']);
                }
            }
        }
        // Check payment deadline
        elseif ($booking['status'] === BookingStatus::ACTIVE_PAYMENT_WINDOW && $now > $payment_deadline) {
            $totals_data = totals($participants, $booking['total_amount']);
            if ($totals_data['remaining'] > 0.01) {
                $stmt = $db->prepare("UPDATE bookings SET status = ? WHERE id = ?");
                $stmt->execute([BookingStatus::CANCELED, $booking_id]);
                $status_changed = true;
                $reason = 'payment_missed';
                
                // Send emails to host and all participants
                $emailData = buildEmailPaymentMissed($booking);
                $allUsers = array_merge(
                    [$booking['host_user_id'] ?? 'host@example.com'], 
                    array_filter(array_column($participants, 'user_id'))
                );
                foreach ($allUsers as $userEmail) {
                    if (!empty($userEmail)) {
                        sendEmail($userEmail, $emailData['subject'], $emailData['body']);
                    }
                }
            }
        }
        
        // Reload updated booking if status changed
        if ($status_changed) {
            $booking = loadBooking((string)$booking_id);
        }
        
        $totals_data = totals($participants, $booking['total_amount']);
        $window_state = windowState($booking);
        
        $response = array_merge([
            'status' => $booking['status'],
            'totals' => $totals_data,
            'participants' => $participants
        ], $window_state);
        
        // Add reason if booking was canceled
        if ($reason) {
            $response['reason'] = $reason;
        }
        
        ok($response);
        
    } catch (Exception $e) {
        fail('Database error: ' . $e->getMessage(), 'DB_ERROR', 500);
    }
}

/**
 * Action: Get booking details (read-only)
 */
function get_booking(string $booking_id): void {
    // Load booking and participants from database
    $booking = loadBooking($booking_id);
    if (!$booking) {
        fail('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    
    $participants = loadParticipants($booking_id);
    
    $totals_data = totals($participants, $booking['total_amount']);
    $window_state = windowState($booking);
    
    ok(array_merge([
        'booking_id' => $booking_id,
        'status' => $booking['status'],
        'totals' => $totals_data,
        'participants' => $participants
    ], $window_state));
}

// ============================================================================
// AJAX ROUTER
// ============================================================================

if (isset($_GET['ajax']) && $_GET['ajax'] === '1') {
    $action = $_REQUEST['action'] ?? '';
    
    // Always enforce deadlines before handling any action (except enforce_deadlines itself)
    if ($action !== 'enforce_deadlines' && $action !== 'create_booking') {
        $booking_id = (int)($_REQUEST['booking_id'] ?? 0);
        if ($booking_id > 0) {
            enforce_deadlines($booking_id);
        }
    }
    
    try {
        switch ($action) {
            case 'create_booking':
                $host_id = $_REQUEST['host_id'] ?? '';
                $event_start_iso = $_REQUEST['event_start_iso'] ?? '';
                $total_amount = (float)($_REQUEST['total_amount'] ?? 0);
                $participants_list = parseParticipantsParam($_REQUEST);
                
                if (empty($host_id) || $total_amount <= 0) {
                    fail('Missing required parameters (host_id, total_amount)', 'MISSING_PARAMETERS', 400);
                } else {
                    create_booking($host_id, $event_start_iso, $total_amount, $participants_list);
                }
                break;
                
            case 'pay_deposit':
                $booking_id = (int)($_REQUEST['booking_id'] ?? 0);
                $host_id = $_REQUEST['host_id'] ?? '';
                pay_deposit($booking_id, $host_id);
                break;
                
            case 'pay_share':
                $booking_id = (int)($_REQUEST['booking_id'] ?? 0);
                $user_id = $_REQUEST['user_id'] ?? '';
                $amount = (float)($_REQUEST['amount'] ?? 0);
                pay_share($booking_id, $user_id, $amount);
                break;
                
            case 'leave_group':
                $booking_id = (int)($_REQUEST['booking_id'] ?? 0);
                $user_id = $_REQUEST['user_id'] ?? '';
                leave_group($booking_id, $user_id);
                break;
                
            case 'smart_split':
                $booking_id = (int)($_REQUEST['booking_id'] ?? 0);
                smart_split($booking_id);
                break;
                
            case 'manage_split':
                $booking_id = (int)($_REQUEST['booking_id'] ?? 0);
                $edits = $_REQUEST['edits'] ?? [];
                
                // Parse edits parameter (can be JSON string or array)
                if (is_string($edits)) {
                    $decoded = json_decode($edits, true);
                    if (is_array($decoded)) {
                        $edits = $decoded;
                    }
                }
                
                manage_split($booking_id, $edits);
                break;
                
            case 'enforce_deadlines':
                $booking_id = (int)($_REQUEST['booking_id'] ?? 0);
                enforce_deadlines($booking_id);
                break;
                
            case 'get_booking':
                $booking_id = $_REQUEST['booking_id'] ?? '';
                if (empty($booking_id)) {
                    fail('Missing booking_id parameter', 'MISSING_BOOKING_ID', 400);
                } else {
                    get_booking($booking_id);
                }
                break;
                
            default:
                fail('Unknown action', 'UNKNOWN_ACTION', 400);
        }
    } catch (Exception $e) {
        fail('Server error: ' . $e->getMessage(), 'SERVER_ERROR', 500);
    }
}

// On page load, enforce deadlines once (silent - no output)
if (!isset($_GET['ajax'])) {
    try {
        $now = serverNow();
        $deposit_deadline = new DateTimeImmutable($booking['deposit_deadline'], new DateTimeZone('Asia/Jerusalem'));
        $payment_deadline = new DateTimeImmutable($booking['payment_deadline'], new DateTimeZone('Asia/Jerusalem'));
        
        // Check deposit deadline
        if ($booking['status'] === BookingStatus::PENDING_DEPOSIT && $now > $deposit_deadline) {
            $booking['status'] = BookingStatus::CANCELED;
        }
        
        // Check payment deadline
        if ($booking['status'] === BookingStatus::ACTIVE_PAYMENT_WINDOW && $now > $payment_deadline) {
            $totals_data = totals($participants, $booking['total_price']);
            if ($totals_data['remaining'] > 0.01) {
                $booking['status'] = BookingStatus::CANCELED;
            }
        }
    } catch (Exception $e) {
        // Silent fail on page load
    }
}

// Debug flag (disabled by default; enable with ?debug=1)
$debug_mode = isset($_GET['debug']) && $_GET['debug'] === '1';

// Debug output (only if debug mode is enabled)
if ($debug_mode) {
    echo "<h3>Debug Information</h3>";
    echo "<pre>";

    // Original constants
    var_dump([
        'DEPOSIT_PERCENT'        => DEPOSIT_PERCENT,
        'DEPOSIT_WINDOW_HOURS'   => DEPOSIT_WINDOW_HOURS,
        'LAST_24H_BUFFER_HOURS'  => LAST_24H_BUFFER_HOURS,
        'server_time'            => serverNow()->format('Y-m-d H:i:s T'),
    ]);

    // Time calculations
    $depositDeadline = computeDepositDeadline($booking['created_at']);
    $paymentDeadline = computePaymentDeadline($booking['booking_datetime']);
    $insideLast24h   = isInsideLast24h($booking['booking_datetime']);
    $totalsData      = totals($participants, (float)$booking['total_price']);

    echo "\n=== TIME CALCULATIONS ===\n";
    echo "Deposit Deadline: " . $depositDeadline->format('Y-m-d H:i:s T') . "\n";
    echo "Payment Deadline: " . $paymentDeadline->format('Y-m-d H:i:s T') . "\n";
    echo "Inside Last 24h: " . ($insideLast24h ? 'YES' : 'NO') . "\n";

    echo "\n=== TOTALS ===\n";
    var_dump($totalsData);

    echo "\n=== BOOKING STATUS ===\n";
    echo "Current Status: " . $booking['status'] . "\n";

    // Quick invariants sanity check
    echo "\n=== INVARIANTS ===\n";
    $createdAtDT = new DateTimeImmutable($booking['created_at'], new DateTimeZone('Asia/Jerusalem'));
    echo "deposit_deadline > created_at ? " . (($depositDeadline > $createdAtDT) ? 'OK' : 'FAIL') . "\n";
    $eventStartDT = new DateTimeImmutable($booking['booking_datetime'], new DateTimeZone('Asia/Jerusalem'));
    $expectedPaymentDeadline = $eventStartDT->sub(new DateInterval('PT' . (int)LAST_24H_BUFFER_HOURS . 'H'));
    echo "payment_deadline == event_start - 24h ? " . (($paymentDeadline == $expectedPaymentDeadline) ? 'OK' : 'FAIL') . "\n";

    echo "</pre>";
    echo "<hr>";
}

session_start();
require_once '../../../db.php';
$currentUsername = $_SESSION['username'] ?? '';

// Run database migration
try {
    migrateIfNeeded($db);
} catch (Exception $e) {
    die("❌ Database migration failed: " . $e->getMessage());
}

// Check if this is a view-only mode (from JoinGroup image click)
$viewOnly = isset($_GET['view_only']) && $_GET['view_only'] === 'true';

// Enforce deadlines on page load (non-AJAX) - only if we have a booking_id parameter
if (isset($_GET['booking_id']) && !empty($_GET['booking_id'])) {
    try {
        enforce_deadlines((int)$_GET['booking_id']);
    } catch (Exception $e) {
        // Silent fail on page load - booking might not exist yet
    }
}

include 'BookingDetails.html';

// expose the l
// ogged in user and view_ only status to JavaScript

echo "<script>window.currentUsername = " . json_encode($currentUsername) . ";</script>";
echo "<script>window.viewOnly = " . json_encode($viewOnly) . ";</script>";

exit();

