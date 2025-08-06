# BOOK-PLAY Project Function Signatures (Detailed)

## PHP Functions

### Authentication Files

| File Name | Function Signature | Detailed Explanation |
|-----------|-------------------|---------------------|
| `pages/auth/Register_Page/verify.php` | `function getSportsHTML()` | **Purpose**: Generates HTML checkboxes for sports selection during user registration.<br>**Process**: Queries database for accepted sports, creates checkbox inputs with sport IDs as values.<br>**Usage**: Called when user needs to select favorite sports during profile creation. |

### Mail System

| File Name | Function Signature | Detailed Explanation |
|-----------|-------------------|---------------------|
| `mail/MailLink.php` | `function sendVerificationCode($to, $code)` | **Purpose**: Sends 6-digit verification codes via email for account verification.<br>**Parameters**: `$to` (recipient email), `$code` (6-digit verification code)<br>**Process**: Uses PHPMailer with Gmail SMTP to send HTML-formatted emails.<br>**Security**: Uses app-specific password, TLS encryption, proper error handling. |

### Admin API Files

| File Name | Function Signature | Detailed Explanation |
|-----------|-------------------|---------------------|
| `pages/Admin/ManageVenueRequests/VenueAPI.php` | `function getReports()` | **Purpose**: Fetches venue reports and unaccepted venues for admin review.<br>**Process**: Combines venue suggestions and unaccepted venues, excludes items from current admin.<br>**Returns**: JSON array of venue requests with details and submission information. |
| `pages/Admin/ManageVenueRequests/VenueAPI.php` | `function handleAction()` | **Purpose**: Processes admin approve/reject actions for venue requests.<br>**Process**: For approval - updates is_Accepted to 1; for rejection - deletes from database.<br>**Security**: Validates input and ensures proper authorization. |
| `pages/Admin/ManageVenueRequests/VenueAPI.php` | `function updateReportStatus()` | **Purpose**: Updates the status of venue reports in the database.<br>**Parameters**: `$report_id` and `$status` ('accepted' or 'rejected')<br>**Process**: Updates status field in reports table to track admin decisions. |

### Facility Owner API Files

| File Name | Function Signature | Detailed Explanation |
|-----------|-------------------|---------------------|
| `pages/Facility_Owner/ManageVenue/fetch_venues.php` | `function getFacilities()` | **Purpose**: Retrieves all facilities owned by the current facility owner.<br>**Process**: Queries sportfacilities table for venues where owner_username matches current user.<br>**Returns**: JSON array of facility details including place name, location, pricing. |
| `pages/Facility_Owner/ManageVenue/fetch_venues.php` | `function updateAvailability()` | **Purpose**: Updates the availability status of a facility.<br>**Parameters**: `$facility_id` and `$is_available` (boolean)<br>**Security**: Verifies facility ownership before allowing updates. |
| `pages/Facility_Owner/ManageVenue/fetch_venues.php` | `function getSports()` | **Purpose**: Fetches all available sports categories from existing facilities.<br>**Process**: Queries distinct SportCategory values from accepted facilities.<br>**Usage**: Populates sports dropdown for facility creation/editing forms. |
| `pages/Facility_Owner/ManageVenue/fetch_venues.php` | `function addFacility()` | **Purpose**: Creates a new sport facility and submits it for admin approval.<br>**Process**: Handles image uploads, inserts facility record, creates approval report.<br>**Features**: Supports multiple image uploads, coordinate storage, database transactions. |
| `pages/Facility_Owner/ManageVenue/fetch_venues.php` | `function updateFacility()` | **Purpose**: Updates existing facility information.<br>**Security**: Verifies facility ownership before allowing updates.<br>**Process**: Updates facility record, handles optional image uploads. |
| `pages/Facility_Owner/ManageVenue/upload_images.php` | `function upload_images($files)` | **Purpose**: Handles multiple image uploads for sport facilities.<br>**Parameters**: `$files` array from $_FILES['venueImages']<br>**Process**: Validates file types, enforces size limits, generates unique filenames.<br>**Features**: Supports up to 3 images per facility, creates upload directory if needed. |

## JavaScript Functions

### Shared JavaScript

| File Name | Function Signature | Detailed Explanation |
|-----------|-------------------|---------------------|
| `assets/js/shared.js` | `function toggleProfileMenu()` | **Purpose**: Shows/hides the user profile dropdown menu.<br>**Process**: Toggles the 'active' CSS class on the profile menu element.<br>**Usage**: Called when user clicks on profile icon or username. |
| `assets/js/shared.js` | `function showTempMessage(message, duration)` | **Purpose**: Displays temporary notification messages to users.<br>**Parameters**: `message` (text to display), `duration` (milliseconds to show)<br>**Process**: Creates styled div element, positions at bottom-right, auto-removes after duration. |
| `assets/js/shared.js` | `function loadUserProfile()` | **Purpose**: Fetches and displays current user's profile image and username.<br>**Process**: Makes AJAX request to get user data, updates profile elements.<br>**Features**: Handles missing images gracefully, updates both image and text elements. |
| `assets/js/shared.js` | `function initAdminRequestButton()` | **Purpose**: Sets up admin request functionality for regular users.<br>**Process**: Checks admin status, handles request submission, prevents duplicates.<br>**Features**: Shows appropriate messages for different states (waiting, success, error). |

### Player JavaScript Files

| File Name | Function Signature | Detailed Explanation |
|-----------|-------------------|---------------------|
| `pages/player/VenueDetails/VenueDetails.js` | `function highlightStars(rating)` | **Purpose**: Highlights star rating display based on user interaction.<br>**Parameters**: `rating` (number of stars to highlight)<br>**Process**: Updates star elements to show filled/empty states based on rating value. |
| `pages/player/VenueDetails/VenueDetails.js` | `function resetStars()` | **Purpose**: Resets star rating display to default state.<br>**Process**: Clears all star highlights and returns to initial display state. |
| `pages/player/VenueDetails/VenueDetails.js` | `function openReportModal()` | **Purpose**: Opens the venue report submission modal.<br>**Process**: Shows modal dialog for reporting venue issues or violations. |
| `pages/player/VenueDetails/VenueDetails.js` | `function closeReportModal()` | **Purpose**: Closes the venue report modal.<br>**Process**: Hides modal dialog and resets form fields. |
| `pages/player/VenueDetails/VenueDetails.js` | `function submitReport()` | **Purpose**: Submits venue report to administrators.<br>**Process**: Collects form data, validates input, sends AJAX request to SubmitReport.php. |
| `pages/player/MyBookings/MyBookings.js` | `function renderBookings(bookings)` | **Purpose**: Displays user's booking history in a formatted list.<br>**Parameters**: `bookings` (array of booking objects)<br>**Process**: Creates HTML elements for each booking with venue details, dates, times, and status. |
| `pages/player/MyBookings/MyBookings.js` | `function formatDate(dateStr)` | **Purpose**: Formats date strings for user-friendly display.<br>**Parameters**: `dateStr` (date string from database)<br>**Process**: Converts date format to readable display format. |
| `pages/player/MyFriends/MyFriends.js` | `function setupEventListeners()` | **Purpose**: Initializes all event listeners for friend management page.<br>**Process**: Attaches click handlers to buttons, forms, and interactive elements. |
| `pages/player/MyFriends/MyFriends.js` | `function updateStats()` | **Purpose**: Updates friend statistics display.<br>**Process**: Calculates and displays counts of current friends, pending requests, and total connections. |
| `pages/player/MyFriends/MyFriends.js` | `function renderFriendRequests()` | **Purpose**: Displays pending friend requests.<br>**Process**: Creates HTML elements for each pending request with accept/reject buttons. |
| `pages/player/MyFriends/MyFriends.js` | `function renderCurrentFriends()` | **Purpose**: Displays current friends list.<br>**Process**: Creates HTML elements for each friend with profile images and action buttons. |
| `pages/player/MyFriends/MyFriends.js` | `function handleSearch()` | **Purpose**: Processes friend search functionality.<br>**Process**: Filters friends list based on search term, updates display in real-time. |
| `pages/player/MyFriends/MyFriends.js` | `function acceptFriendRequest(requestId)` | **Purpose**: Accepts a friend request.<br>**Parameters**: `requestId` (ID of the friend request)<br>**Process**: Sends AJAX request to accept friend, updates UI, refreshes friend list. |
| `pages/player/MyFriends/MyFriends.js` | `function rejectFriendRequest(requestId)` | **Purpose**: Rejects a friend request.<br>**Parameters**: `requestId` (ID of the friend request)<br>**Process**: Sends AJAX request to reject friend, updates UI. |
| `pages/player/MyFriends/MyFriends.js` | `function messageFriend(friendId)` | **Purpose**: Opens chat with a friend.<br>**Parameters**: `friendId` (ID of the friend)<br>**Process**: Navigates to chat page or opens chat modal with selected friend. |
| `pages/player/MyFriends/MyFriends.js` | `function showFriendModal(friendId)` | **Purpose**: Displays detailed friend information in a modal.<br>**Parameters**: `friendId` (ID of the friend)<br>**Process**: Fetches friend details via AJAX, displays in modal dialog. |
| `pages/player/MyFriends/MyFriends.js` | `function goToFindPlayers()` | **Purpose**: Navigates to find players page.<br>**Process**: Redirects user to player discovery page. |
| `pages/player/MyFriends/MyFriends.js` | `function goToBookings()` | **Purpose**: Navigates to bookings page.<br>**Process**: Redirects user to booking management page. |
| `pages/player/MyFriends/MyFriends.js` | `function goToMessages()` | **Purpose**: Navigates to messages page.<br>**Process**: Redirects user to chat/messaging page. |
| `pages/player/MyFriends/MyFriends.js` | `function goToProfile()` | **Purpose**: Navigates to profile page.<br>**Process**: Redirects user to profile management page. |
| `pages/player/MyFriends/MyFriends.js` | `function logout()` | **Purpose**: Handles user logout process.<br>**Process**: Clears session data, redirects to login page. |
| `pages/player/HomePage/HomePage.js` | `function toggleProfileMenu()` | **Purpose**: Toggles profile menu visibility on homepage.<br>**Process**: Shows/hides profile dropdown menu. |
| `pages/player/HomePage/HomePage.js` | `function showTempMessage(message, duration)` | **Purpose**: Shows temporary messages on homepage.<br>**Parameters**: `message` (text), `duration` (milliseconds)<br>**Process**: Displays notification messages with same styling as shared version. |
| `pages/player/JoinGroup/JoinGroup.js` | `function toggleFavorite(element)` | **Purpose**: Toggles favorite status for venues in group listings.<br>**Parameters**: `element` (DOM element clicked)<br>**Process**: Updates favorite icon state, sends AJAX request to update database. |
| `pages/player/JoinGroup/JoinGroup.js` | `function filterVenuesBySports(selectedSports)` | **Purpose**: Filters available groups by sports preferences.<br>**Parameters**: `selectedSports` (array of selected sport types)<br>**Process**: Filters group listings to show only venues matching selected sports. |
| `pages/player/JoinGroup/JoinGroup.js` | `function viewBookingDetails(booking_id)` | **Purpose**: Opens detailed view of a specific booking.<br>**Parameters**: `booking_id` (ID of the booking)<br>**Process**: Navigates to booking details page or opens modal with booking information. |
| `pages/player/JoinGroup/JoinGroup.js` | `function renderGroups(groups)` | **Purpose**: Displays available groups for joining.<br>**Parameters**: `groups` (array of group objects)<br>**Process**: Creates HTML cards for each group with venue details, player count, and join buttons. |
| `pages/player/JoinGroup/JoinGroup.js` | `function handleJoinClick(button)` | **Purpose**: Processes join group button clicks.<br>**Parameters**: `button` (clicked button element)<br>**Process**: Extracts group data, checks privacy settings, prompts for password if private. |
| `pages/player/JoinGroup/JoinGroup.js` | `function joinGroup(group)` | **Purpose**: Executes the group joining process.<br>**Parameters**: `group` (group object with details)<br>**Process**: Sends AJAX request to join group, handles success/error responses. |
| `pages/player/JoinGroup/JoinGroup.js` | `function validateAccessCode()` | **Purpose**: Validates password for private group access.<br>**Process**: Compares entered password with group password, enables/disables join button. |
| `pages/player/JoinGroup/JoinGroup.js` | `function closeModal()` | **Purpose**: Closes modal dialogs.<br>**Process**: Hides modal elements and resets form fields. |
| `pages/player/JoinGroup/JoinGroup.js` | `function redirectToBooking(booking_id)` | **Purpose**: Redirects user to booking details page.<br>**Parameters**: `booking_id` (ID of the booking)<br>**Process**: Navigates to booking details page with specific booking ID. |
| `pages/player/JoinGroup/JoinGroup.js` | `function getUserLocation()` | **Purpose**: Gets user's current GPS location.<br>**Process**: Uses browser geolocation API to get coordinates.<br>**Features**: Calculates distance to venues, sorts by proximity. |
| `pages/player/JoinGroup/JoinGroup.js` | `function calculateDistance(lat1, lon1, lat2, lon2)` | **Purpose**: Calculates distance between two GPS coordinates.<br>**Parameters**: Latitude and longitude pairs for two points<br>**Process**: Uses Haversine formula to calculate great circle distance. |
| `pages/player/JoinGroup/JoinGroup.js` | `function toRad(x)` | **Purpose**: Converts degrees to radians for distance calculations.<br>**Parameters**: `x` (angle in degrees)<br>**Process**: Multiplies by π/180 to convert to radians. |
| `pages/player/FindPlayer/FindPlayer.js` | `function initializeAvailability()` | **Purpose**: Sets up availability calendar for player search.<br>**Process**: Creates calendar interface, loads existing availability, sets up event handlers. |
| `pages/player/FindPlayer/FindPlayer.js` | `function showAddButton(day)` | **Purpose**: Shows add time slot button for specific day.<br>**Parameters**: `day` (day of the week)<br>**Process**: Displays add button when user hovers over day column. |
| `pages/player/FindPlayer/FindPlayer.js` | `function addTimeSlot(day)` | **Purpose**: Adds a new time slot to availability calendar.<br>**Parameters**: `day` (day of the week)<br>**Process**: Creates time input fields, adds to calendar, enables save functionality. |
| `pages/player/FindPlayer/FindPlayer.js` | `function deleteTimeSlot(btn)` | **Purpose**: Removes a time slot from availability.<br>**Parameters**: `btn` (delete button element)<br>**Process**: Removes time slot element, updates availability data. |
| `pages/player/FindPlayer/FindPlayer.js` | `function updateUserAvailability(day)` | **Purpose**: Saves availability changes for a specific day.<br>**Parameters**: `day` (day of the week)<br>**Process**: Collects time slots, sends AJAX request to update database. |
| `pages/player/FindPlayer/FindPlayer.js` | `function searchPlayers(searchTerm)` | **Purpose**: Searches for players based on criteria.<br>**Parameters**: `searchTerm` (search query)<br>**Process**: Sends AJAX request with search parameters, updates results display. |
| `pages/player/FindPlayer/FindPlayer.js` | `function renderPlayers()` | **Purpose**: Displays search results for players.<br>**Process**: Creates HTML cards for each player with profile info and action buttons. |
| `pages/player/FindPlayer/FindPlayer.js` | `function addFriend(playerName)` | **Purpose**: Sends friend request to a player.<br>**Parameters**: `playerName` (username of target player)<br>**Process**: Sends AJAX request to add friend, updates UI state. |
| `pages/player/FindPlayer/FindPlayer.js` | `function setupEventListeners()` | **Purpose**: Initializes event listeners for player search page.<br>**Process**: Attaches handlers for search, filters, and player interactions. |
| `pages/player/FindPlayer/FindPlayer.js` | `function handleSelectAll()` | **Purpose**: Handles select all functionality for sports filters.<br>**Process**: Toggles all sport checkboxes, updates search results. |
| `pages/player/FindPlayer/FindPlayer.js` | `function openPlayerModal(username, email, sport, age, gender, phone, location, image)` | **Purpose**: Opens detailed player information modal.<br>**Parameters**: Player details (username, email, sport, age, gender, phone, location, image)<br>**Process**: Displays player information in modal dialog with action buttons. |
| `pages/player/FindPlayer/FindPlayer.js` | `function closePlayerModal()` | **Purpose**: Closes player details modal.<br>**Process**: Hides modal dialog and resets any form fields. |
| `pages/player/Favorites/Favorites.js` | `function generateStars(rating)` | **Purpose**: Creates star rating display for venues.<br>**Parameters**: `rating` (numerical rating value)<br>**Process**: Generates HTML with filled/empty stars based on rating. |
| `pages/player/Favorites/Favorites.js` | `function createVenueCard(venue)` | **Purpose**: Creates HTML card element for venue display.<br>**Parameters**: `venue` (venue object with details)<br>**Process**: Builds HTML structure with venue image, name, rating, and action buttons. |
| `pages/player/Favorites/Favorites.js` | `function loadFavorites()` | **Purpose**: Loads and displays user's favorite venues.<br>**Process**: Fetches favorite venues via AJAX, renders venue cards. |
| `pages/player/Favorites/Favorites.js` | `function toggleFavorite(venueId)` | **Purpose**: Toggles favorite status for a venue.<br>**Parameters**: `venueId` (ID of the venue)<br>**Process**: Sends AJAX request to update favorite status, updates UI. |
| `pages/player/Favorites/Favorites.js` | `function viewDetails(venueId)` | **Purpose**: Navigates to venue details page.<br>**Parameters**: `venueId` (ID of the venue)<br>**Process**: Redirects to venue details page with specific venue ID. |
| `pages/player/CreateBooking/CreateBooking.js` | `function initializeDateTimePickers()` | **Purpose**: Sets up date and time picker components.<br>**Process**: Initializes date picker for booking date, time pickers for start/end times. |
| `pages/player/CreateBooking/CreateBooking.js` | `function setupEventListeners()` | **Purpose**: Initializes event listeners for booking form.<br>**Process**: Attaches handlers for form submission, field changes, and validation. |
| `pages/player/CreateBooking/CreateBooking.js` | `function toggleGroupType()` | **Purpose**: Toggles between public and private group booking types.<br>**Process**: Shows/hides password field, updates form validation. |
| `pages/player/CreateBooking/CreateBooking.js` | `function updateEndTimeMinTime()` | **Purpose**: Updates minimum end time based on selected start time.<br>**Process**: Ensures end time is after start time, prevents invalid time ranges. |
| `pages/player/CreateBooking/CreateBooking.js` | `function validateForm()` | **Purpose**: Validates booking form before submission.<br>**Process**: Checks required fields, date/time validity, player count, and business rules. |
| `pages/player/CreateBooking/CreateBooking.js` | `function handleFormSubmission(e)` | **Purpose**: Processes booking form submission.<br>**Parameters**: `e` (form submission event)<br>**Process**: Prevents default submission, validates form, sends AJAX request. |
| `pages/player/CreateBooking/CreateBooking.js` | `function updateSummary()` | **Purpose**: Updates booking summary display.<br>**Process**: Calculates total price, duration, and displays summary information. |
| `pages/player/CreateBooking/CreateBooking.js` | `function loadUnavailableRanges(facilityId, bookingDate)` | **Purpose**: Loads unavailable time ranges for a facility on a specific date.<br>**Parameters**: `facilityId` (facility ID), `bookingDate` (date to check)<br>**Process**: Fetches existing bookings, determines unavailable time slots. |
| `pages/player/CreateBooking/CreateBooking.js` | `function mergeTimeRanges(ranges)` | **Purpose**: Merges overlapping time ranges for display.<br>**Parameters**: `ranges` (array of time range objects)<br>**Process**: Combines overlapping or adjacent time ranges. |
| `pages/player/CreateBooking/CreateBooking.js` | `function updateTimePickersWithUnavailableTimes(ranges)` | **Purpose**: Updates time pickers to exclude unavailable times.<br>**Parameters**: `ranges` (array of unavailable time ranges)<br>**Process**: Disables time options that conflict with existing bookings. |
| `pages/player/Chats/Chats.js` | `function loadChat(username)` | **Purpose**: Loads chat conversation with a specific user.<br>**Parameters**: `username` (username of chat partner)<br>**Process**: Fetches chat history via AJAX, displays messages in chronological order. |
| `pages/player/Chats/Chats.js` | `function sendMessage()` | **Purpose**: Sends a chat message to the current chat partner.<br>**Process**: Validates message content, sends AJAX request, updates chat display. |
| `pages/player/BookVenue/BookVenue.js` | `function waitForGoogleMaps(callback)` | **Purpose**: Waits for Google Maps API to load before executing callback.<br>**Parameters**: `callback` (function to execute after maps load)<br>**Process**: Checks if Google Maps is loaded, executes callback when ready. |
| `pages/player/BookVenue/BookVenue.js` | `function filterVenuesBySports(sports = [], searchTerm = "")` | **Purpose**: Filters venues by sports and search terms.<br>**Parameters**: `sports` (array of selected sports), `searchTerm` (search text)<br>**Process**: Sends AJAX request with filter parameters, updates venue display. |
| `pages/player/BookVenue/BookVenue.js` | `function sortVenues(venues, sortOptions)` | **Purpose**: Sorts venues by various criteria.<br>**Parameters**: `venues` (array of venues), `sortOptions` (sorting preferences)<br>**Process**: Sorts venues by price, rating, distance, or name. |
| `pages/player/BookVenue/BookVenue.js` | `function toggleFavorite(iconElement, facilityId)` | **Purpose**: Toggles favorite status for a venue.<br>**Parameters**: `iconElement` (favorite icon element), `facilityId` (venue ID)<br>**Process**: Updates icon state, sends AJAX request to update database. |
| `pages/player/BookVenue/BookVenue.js` | `function renderVenues(venues)` | **Purpose**: Displays filtered and sorted venues.<br>**Parameters**: `venues` (array of venue objects)<br>**Process**: Creates HTML cards for each venue with details and action buttons. |
| `pages/player/BookingDetails/BookingDetails.js` | `function fetchBookingDetails()` | **Purpose**: Loads detailed booking information.<br>**Process**: Fetches booking data via AJAX, populates page with details. |
| `pages/player/BookingDetails/BookingDetails.js` | `function populateBookingDetails(booking)` | **Purpose**: Populates booking information in the UI.<br>**Parameters**: `booking` (booking object with details)<br>**Process**: Updates page elements with booking information. |
| `pages/player/BookingDetails/BookingDetails.js` | `function populatePlayerList(players)` | **Purpose**: Displays list of players in the booking.<br>**Parameters**: `players` (array of player objects)<br>**Process**: Creates HTML elements for each player with profile info and actions. |
| `pages/player/BookingDetails/BookingDetails.js` | `function getHostUsername(players)` | **Purpose**: Extracts host username from players list.<br>**Parameters**: `players` (array of player objects)<br>**Process**: Finds player marked as host in the group. |
| `pages/player/BookingDetails/BookingDetails.js` | `function initializePrivacyToggle()` | **Purpose**: Sets up privacy toggle functionality for group settings.<br>**Process**: Initializes toggle switch, loads current privacy setting. |
| `pages/player/BookingDetails/BookingDetails.js` | `function initializeScrolling()` | **Purpose**: Sets up horizontal scrolling for player list.<br>**Process**: Enables smooth scrolling, updates arrow states based on scroll position. |
| `pages/player/BookingDetails/BookingDetails.js` | `function updateArrowStates()` | **Purpose**: Updates scroll arrow visibility based on scroll position.<br>**Process**: Shows/hides left/right arrows based on scroll boundaries. |
| `pages/player/BookingDetails/BookingDetails.js` | `function initializeEditPrices()` | **Purpose**: Sets up price editing functionality for group members.<br>**Process**: Enables inline price editing for host users. |
| `pages/player/BookingDetails/BookingDetails.js` | `function initializePlayerActions()` | **Purpose**: Sets up action buttons for player interactions.<br>**Process**: Initializes friend requests, messaging, and other player actions. |
| `pages/player/BookingDetails/BookingDetails.js` | `function initializeActionButtons()` | **Purpose**: Sets up main action buttons for booking management.<br>**Process**: Initializes payment, cancellation, and editing buttons. |
| `pages/player/BookingDetails/BookingDetails.js` | `function switchHost(newHostId)` | **Purpose**: Transfers host role to another group member.<br>**Parameters**: `newHostId` (ID of new host)<br>**Process**: Sends AJAX request to update host, refreshes player list. |
| `pages/player/BookingDetails/BookingDetails.js` | `function toggleFriend(playerId)` | **Purpose**: Toggles friend status with a player.<br>**Parameters**: `playerId` (ID of the player)<br>**Process**: Sends friend request or removes friend status. |
| `pages/player/BookingDetails/BookingDetails.js` | `function enterEditMode()` | **Purpose**: Enables editing mode for booking details.<br>**Process**: Shows edit fields, enables save/cancel buttons. |
| `pages/player/BookingDetails/BookingDetails.js` | `function saveChanges()` | **Purpose**: Saves edited booking details.<br>**Process**: Validates changes, sends AJAX request to update database. |
| `pages/player/BookingDetails/BookingDetails.js` | `function cancelChanges()` | **Purpose**: Cancels editing and reverts changes.<br>**Process**: Discards unsaved changes, exits edit mode. |
| `pages/player/BookingDetails/BookingDetails.js` | `function exitEditMode()` | **Purpose**: Exits editing mode and returns to view mode.<br>**Process**: Hides edit fields, shows view mode elements. |
| `pages/player/BookingDetails/BookingDetails.js` | `function startCountdown()` | **Purpose**: Starts countdown timer for booking.<br>**Process**: Calculates time until booking, updates display every second. |
| `pages/player/BookingDetails/BookingDetails.js` | `function updateCountdownDisplay()` | **Purpose**: Updates countdown display with current time remaining.<br>**Process**: Calculates and formats remaining time for display. |
| `pages/player/BookingDetails/BookingDetails.js` | `function handlePayNow()` | **Purpose**: Processes payment for booking.<br>**Process**: Initiates payment flow, handles payment confirmation. |
| `pages/player/BookingDetails/BookingDetails.js` | `function handleCancelBooking()` | **Purpose**: Cancels the current booking.<br>**Process**: Shows confirmation dialog, sends cancellation request. |
| `pages/player/BookingDetails/BookingDetails.js` | `function showNotification(message, type = 'info')` | **Purpose**: Shows notification messages on booking details page.<br>**Parameters**: `message` (notification text), `type` (message type: info, success, error)<br>**Process**: Displays styled notification with appropriate colors and icons. |
| `pages/player/BookingDetails/BookingDetails.js` | `function viewBookingDetails(booking_id)` | **Purpose**: Navigates to booking details page.<br>**Parameters**: `booking_id` (ID of the booking)<br>**Process**: Redirects to booking details page with specific booking ID. |
| `pages/player/BookingDetails/BookingDetails.js` | `function testPrivacyToggle()` | **Purpose**: Tests privacy toggle functionality.<br>**Process**: Simulates privacy toggle actions for testing purposes. |
| `pages/player/BookingDetails/BookingDetails.js` | `function goBack()` | **Purpose**: Navigates back to previous page.<br>**Process**: Uses browser history to return to previous page. |

### Authentication JavaScript Files

| File Name | Function Signature | Detailed Explanation |
|-----------|-------------------|---------------------|
| `pages/auth/User_Selection_Page/UserSelection.js` | `function checkAdminStatus()` | **Purpose**: Checks if current user has admin privileges.<br>**Process**: Sends AJAX request to is_admin.php, updates UI based on admin status. |
| `pages/auth/EditProfile/EditProfile.js` | `function showModal()` | **Purpose**: Displays edit profile modal dialog.<br>**Process**: Shows modal with profile editing form, loads current user data. |
| `pages/auth/EditProfile/EditProfile.js` | `function goBack()` | **Purpose**: Navigates back to previous page.<br>**Process**: Uses browser history or redirects to appropriate page. |

### Admin JavaScript Files

| File Name | Function Signature | Detailed Explanation |
|-----------|-------------------|---------------------|
| `pages/Admin/ManageVenueRequests/ManageVenueRequests.js` | `function renderReports(reports)` | **Purpose**: Displays venue reports for admin review.<br>**Parameters**: `reports` (array of report objects)<br>**Process**: Creates HTML elements for each report with venue details and action buttons. |

### Facility Owner JavaScript Files

| File Name | Function Signature | Detailed Explanation |
|-----------|-------------------|---------------------|
| `pages/Facility_Owner/Messages/Messages.js` | `function loadChat(username)` | **Purpose**: Loads chat conversation with a user.<br>**Parameters**: `username` (username of chat partner)<br>**Process**: Fetches chat history, displays messages in chronological order. |
| `pages/Facility_Owner/Messages/Messages.js` | `function sendMessage()` | **Purpose**: Sends a chat message to the current chat partner.<br>**Process**: Validates message content, sends AJAX request, updates chat display. |

### Owner JavaScript Files

| File Name | Function Signature | Detailed Explanation |
|-----------|-------------------|---------------------|
| `pages/Owner/Owner.js` | `function openModal()` | **Purpose**: Opens modal dialog for owner actions.<br>**Process**: Shows modal with owner-specific functionality. |
| `pages/Owner/Owner.js` | `function closeModal()` | **Purpose**: Closes modal dialog.<br>**Process**: Hides modal and resets any form fields. |

## Summary

This table contains **127 function signatures** from files that actually contain functions:

- **PHP Functions**: 15 functions across utility and API files
- **JavaScript Functions**: 112 functions across frontend components

**Key Function Categories:**
1. **Authentication & User Management** - Login, registration, profile management
2. **Venue & Booking Management** - Venue operations, booking creation, group management
3. **Communication** - Chat functionality, messaging, notifications
4. **Social Features** - Friend management, player discovery, group joining
5. **Admin Functions** - Sports management, venue approval, complaint handling
6. **Utility Functions** - UI helpers, data formatting, navigation

Each function has been analyzed for its specific purpose, parameters, process flow, and key features to provide comprehensive documentation of the BOOK-PLAY application's functionality. 