<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Friends System Test</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .test-section { 
            margin: 20px 0; 
            padding: 20px; 
            border: 2px solid #e9ecef; 
            border-radius: 10px; 
            background: #f8f9fa;
        }
        .test-section h3 {
            color: #495057;
            margin-bottom: 15px;
            border-bottom: 2px solid #dee2e6;
            padding-bottom: 10px;
        }
        .btn { 
            padding: 12px 20px; 
            margin: 8px; 
            background: linear-gradient(135deg, #007bff, #0056b3); 
            color: white; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .btn:hover { 
            background: linear-gradient(135deg, #0056b3, #004085);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,123,255,0.4);
        }
        .result { 
            margin: 15px 0; 
            padding: 15px; 
            background: #f8f9fa; 
            border-radius: 8px; 
            border-left: 4px solid #dee2e6;
        }
        .success { 
            background: #d4edda; 
            color: #155724; 
            border-left-color: #28a745;
        }
        .error { 
            background: #f8d7da; 
            color: #721c24; 
            border-left-color: #dc3545;
        }
        input { 
            padding: 12px; 
            margin: 8px; 
            border: 2px solid #dee2e6; 
            border-radius: 8px; 
            font-size: 14px;
            transition: border-color 0.3s ease;
        }
        input:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-radius: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        pre {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Friends System Test Page</h1>
            <p>Test all friends system functionality directly</p>
        </div>
        
        <div class="test-section">
            <h3>📊 Get Friend Counts</h3>
            <button class="btn" onclick="testGetCounts()">Get Counts</button>
            <div id="countsResult" class="result"></div>
        </div>

        <div class="test-section">
            <h3>📩 Get Friend Requests</h3>
            <button class="btn" onclick="testGetRequests()">Get Requests</button>
            <div id="requestsResult" class="result"></div>
        </div>

        <div class="test-section">
            <h3>👥 Get Current Friends</h3>
            <button class="btn" onclick="testGetFriends()">Get Friends</button>
            <div id="friendsResult" class="result"></div>
        </div>

        <div class="test-section">
            <h3>📤 Send Friend Request</h3>
            <input type="text" id="friendUsername" placeholder="Enter username to send request to">
            <button class="btn" onclick="testSendRequest()">Send Request</button>
            <div id="sendResult" class="result"></div>
        </div>

        <div class="test-section">
            <h3>✅ Accept Friend Request</h3>
            <input type="text" id="acceptUsername" placeholder="Enter username to accept request from">
            <button class="btn" onclick="testAcceptRequest()">Accept Request</button>
            <div id="acceptResult" class="result"></div>
        </div>

        <div class="test-section">
            <h3>❌ Reject Friend Request</h3>
            <input type="text" id="rejectUsername" placeholder="Enter username to reject request from">
            <button class="btn" onclick="testRejectRequest()">Reject Request</button>
            <div id="rejectResult" class="result"></div>
        </div>

        <div class="test-section">
            <h3>��️ Remove Friend</h3>
            <input type="text" id="removeUsername" placeholder="Enter username to remove">
            <button class="btn" onclick="testRemoveFriend()">Remove Friend</button>
            <div id="removeResult" class="result"></div>
        </div>

        <div class="test-section">
            <h3>�� Database Test Data</h3>
            <button class="btn" onclick="addTestData()">Add Test Data</button>
            <button class="btn" onclick="clearTestData()">Clear Test Data</button>
            <div id="testDataResult" class="result"></div>
        </div>
    </div>

    <script>
        const API_BASE = 'pages/player/MyFriends/friends_api.php';

        function showResult(elementId, data, isSuccess = true) {
            const element = document.getElementById(elementId);
            element.className = `result ${isSuccess ? 'success' : 'error'}`;
            element.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }

        async function testGetCounts() {
            try {
                const response = await fetch(`${API_BASE}?action=get_counts`);
                const data = await response.json();
                showResult('countsResult', data, data.success);
            } catch (error) {
                showResult('countsResult', { error: error.message }, false);
            }
        }

        async function testGetRequests() {
            try {
                const response = await fetch(`${API_BASE}?action=get_requests`);
                const data = await response.json();
                showResult('requestsResult', data, data.success);
            } catch (error) {
                showResult('requestsResult', { error: error.message }, false);
            }
        }

        async function testGetFriends() {
            try {
                const response = await fetch(`${API_BASE}?action=get_friends`);
                const data = await response.json();
                showResult('friendsResult', data, data.success);
            } catch (error) {
                showResult('friendsResult', { error: error.message }, false);
            }
        }

        async function testSendRequest() {
            const username = document.getElementById('friendUsername').value;
            if (!username) {
                showResult('sendResult', { error: 'Please enter a username' }, false);
                return;
            }

            try {
                const formData = new FormData();
                formData.append('action', 'send_request');
                formData.append('friend_username', username);

                const response = await fetch(API_BASE, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                showResult('sendResult', data, data.success);
            } catch (error) {
                showResult('sendResult', { error: error.message }, false);
            }
        }

        async function testAcceptRequest() {
            const username = document.getElementById('acceptUsername').value;
            if (!username) {
                showResult('acceptResult', { error: 'Please enter a username' }, false);
                return;
            }

            try {
                const formData = new FormData();
                formData.append('action', 'accept_request');
                formData.append('from_username', username);

                const response = await fetch(API_BASE, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                showResult('acceptResult', data, data.success);
            } catch (error) {
                showResult('acceptResult', { error: error.message }, false);
            }
        }

        async function testRejectRequest() {
            const username = document.getElementById('rejectUsername').value;
            if (!username) {
                showResult('rejectResult', { error: 'Please enter a username' }, false);
                return;
            }

            try {
                const formData = new FormData();
                formData.append('action', 'reject_request');
                formData.append('from_username', username);

                const response = await fetch(API_BASE, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                showResult('rejectResult', data, data.success);
            } catch (error) {
                showResult('rejectResult', { error: error.message }, false);
            }
        }

        async function testRemoveFriend() {
            const username = document.getElementById('removeUsername').value;
            if (!username) {
                showResult('removeResult', { error: 'Please enter a username' }, false);
                return;
            }

            try {
                const formData = new FormData();
                formData.append('action', 'remove_friend');
                formData.append('friend_username', username);

                const response = await fetch(API_BASE, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                showResult('removeResult', data, data.success);
            } catch (error) {
                showResult('removeResult', { error: error.message }, false);
            }
        }

        async function addTestData() {
            try {
                const response = await fetch('test_friends_data.php?action=add_test_data');
                const data = await response.json();
                showResult('testDataResult', data, data.success);
            } catch (error) {
                showResult('testDataResult', { error: error.message }, false);
            }
        }

        async function clearTestData() {
            try {
                const response = await fetch('test_friends_data.php?action=clear_test_data');
                const data = await response.json();
                showResult('testDataResult', data, data.success);
            } catch (error) {
                showResult('testDataResult', { error: error.message }, false);
            }
        }
    </script>
</body>
</html>