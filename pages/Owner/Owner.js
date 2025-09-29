// Logout function
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = '../../logout.php';
  }
}

function openModal() {
  document.getElementById("adminModal").style.display = "block";
  fetchExistingUsers();
}

function closeModal() {
  document.getElementById("adminModal").style.display = "none";
}

function openAdminsModal() {
  document.getElementById("adminsModal").style.display = "block";
  fetchAdmins();
}
function closeAdminsModal() {
  document.getElementById("adminsModal").style.display = "none";
}
function fetchAdmins() {
  fetch('./OwnerAPI.php?action=admins_list')
    .then(response => response.json())
    .then(data => {
      const adminsList = document.getElementById('adminsList');
      adminsList.innerHTML = '';
      if (data.success && data.admins.length > 0) {
        data.admins.forEach(admin => {
          const row = document.createElement('div');
          row.className = 'admin-row';
          row.innerHTML = `<span>${admin.username}</span> <button class='remove-admin-btn' onclick=\"removeAdmin('${admin.username}')\">Remove</button>`;
          adminsList.appendChild(row);
        });
      } else {
        adminsList.innerHTML = '<div>No admins found.</div>';
      }
    })
    .catch(error => {
      console.error('Error fetching admins:', error);
      document.getElementById('adminsList').innerHTML = '<div>Error loading admins.</div>';
    });
}
function removeAdmin(username) {
  if (!confirm('Are you sure you want to remove admin rights from ' + username + '?')) return;
  fetch('./OwnerAPI.php?action=admins_remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=' + encodeURIComponent(username)
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        fetchAdmins();
      } else {
        alert('Failed to remove admin: ' + (data.message || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('Error removing admin:', error);
      alert('Error removing admin. Please try again.');
    });
}

function fetchExistingUsers() {
  fetch('./OwnerAPI.php?action=admins_get_users')
    .then(response => response.json())
    .then(data => {
      const input = document.getElementById('newAdminInput');
      if (data.success && data.users.length > 0) {
        // Create a datalist for autocomplete
        let datalist = document.getElementById('usersList');
        if (!datalist) {
          datalist = document.createElement('datalist');
          datalist.id = 'usersList';
          input.setAttribute('list', 'usersList');
          input.parentNode.appendChild(datalist);
        }
        datalist.innerHTML = '';
        data.users.forEach(user => {
          const option = document.createElement('option');
          option.value = user.username;
          option.textContent = user.username + ' (' + user.email + ')';
          datalist.appendChild(option);
        });
      }
    })
    .catch(error => {
      console.error('Error fetching users:', error);
    });
}

function addAdmin() {
  const username = document.getElementById('newAdminInput').value.trim();
  if (!username) {
    alert('Please enter a username');
    return;
  }
  
  fetch('./OwnerAPI.php?action=admins_add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=' + encodeURIComponent(username)
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('User promoted to admin successfully!');
        document.getElementById('newAdminInput').value = '';
        closeModal();
        // Refresh the admins list
        if (document.getElementById('adminsModal').style.display === 'block') {
          fetchAdmins();
        }
      } else {
        alert('Failed to promote user: ' + (data.message || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('Error adding admin:', error);
      alert('Error promoting user. Please try again.');
    });
}

// Admin Requests Logic
function fetchAdminRequests() {
  fetch('./OwnerAPI.php?action=admin_requests_list')
    .then(response => response.json())
    .then(data => {
      const tbody = document.querySelector('.table-container tbody');
      tbody.innerHTML = '';
      if (data.success && data.requests.length > 0) {
        data.requests.forEach(req => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${req.username}</td>
            <td>${req.email}</td>
            <td>
              <button class='accept' onclick=\"acceptAdminRequest('${req.username}')\">✔ Accept</button>
              <button class='reject' onclick=\"rejectAdminRequest('${req.username}')\">✖ Reject</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="3">No admin requests found.</td></tr>';
      }
    })
    .catch(error => {
      console.error('Error fetching admin requests:', error);
      document.querySelector('.table-container tbody').innerHTML = '<tr><td colspan="3">Error loading requests.</td></tr>';
    });
}
function acceptAdminRequest(username) {
  fetch('OwnerAPI.php?action=admin_requests_accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=' + encodeURIComponent(username)
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        fetchAdminRequests();
      } else {
        alert('Failed to accept request: ' + (data.message || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('Error accepting request:', error);
      alert('Error accepting request. Please try again.');
    });
}
function rejectAdminRequest(username) {
  fetch('OwnerAPI.php?action=admin_requests_reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=' + encodeURIComponent(username)
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        fetchAdminRequests();
      } else {
        alert('Failed to reject request: ' + (data.message || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request. Please try again.');
    });
}
// Call fetchAdminRequests on page load
window.onload = function() {
  fetchAdminRequests();
};
