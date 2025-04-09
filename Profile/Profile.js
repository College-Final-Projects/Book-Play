function previewImage() {
    const fileInput = document.getElementById("profileImage");
    const preview = document.getElementById("profileImagePreview");
    const removeBtn = document.getElementById("removeImageBtn");
    
    // Check if a file is selected
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        // Show the image
        preview.style.display = "block";
        preview.src = event.target.result;
        
        // Show the remove button
        removeBtn.style.display = "inline-block";
      };
      // Read the file as a data URL
      reader.readAsDataURL(file);
    }
  }

  function removeImage() {
    const fileInput = document.getElementById("profileImage");
    const preview = document.getElementById("profileImagePreview");
    const removeBtn = document.getElementById("removeImageBtn");
    
    // Clear the file input
    fileInput.value = "";
    
    // Reset and hide the preview
    preview.src = "#";
    preview.style.display = "none";
    
    // Hide the remove button
    removeBtn.style.display = "none";
  }