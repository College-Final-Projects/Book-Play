const modal = document.getElementById("venueModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.querySelector(".cancel-btn");

let map;
let marker;

function initMap() {
  const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // New York

  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 13,
  });

  marker = new google.maps.Marker({
    position: defaultLocation,
    map: map,
    draggable: true,
  });

  const input = document.getElementById("locationInput");
  const autocomplete = new google.maps.places.Autocomplete(input, {
    fields: ["geometry", "formatted_address"],
    types: ["geocode"] // يجعل النتائج عامة للعناوين
  });
  
  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
  
    if (!place.geometry || !place.geometry.location) {
      alert("No location found.");
      return;
    }
  
    // تحديث الخريطة
    map.setCenter(place.geometry.location);
    map.setZoom(15);
    marker.setPosition(place.geometry.location);
  
    // تحديث الحقل
    input.value = place.formatted_address;
  });

  const geocoder = new google.maps.Geocoder();
  marker.addListener("dragend", function () {
    const position = marker.getPosition();
    geocoder.geocode({ location: position }, function (results, status) {
      if (status === "OK" && results[0]) {
        input.value = results[0].formatted_address;
      }
    });
  });
}

// فتح المودال وتهيئة الخريطة
document.querySelectorAll(".add-venue-btn, .edit").forEach(button => {
  button.addEventListener("click", () => {
    modal.style.display = "flex";

    setTimeout(() => {
      if (!map) {
        initMap(); // تهيئة أول مرة
      } else {
        google.maps.event.trigger(map, "resize");
      }
    }, 300);
  });
});

// إغلاق المودال
closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

cancelBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});
function previewImages(event) {
    const files = event.target.files;
    const previewContainer = document.getElementById("imagePreview");
    previewContainer.innerHTML = "";
  
    if (files.length > 3) {
      alert("You can only upload up to 3 images.");
      event.target.value = ""; // reset input
      return;
    }
  
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        previewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }
  