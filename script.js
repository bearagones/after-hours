"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const path = window.location.pathname;
    console.log("Current path:", path);

    let category;
    if (path.includes("restaurants")) {
        category = "Restaurant";
    } else if (path.includes("desserts")) {
        category = "Dessert";
    } else if (path.includes("bars")) {
        category = "Bar";
    } else if (path.includes("clubs")) {
        category = "Club";
    }

    console.log("Category determined:", category);

    if (category) {
        getRecords(category);
    }
});

async function getRecords(category) {
    const options = {
        method: "GET",
        headers: {
            Authorization: `Bearer patIZYOlRFbGjc1Ui.5607506c1754731bc8eaec2841138a14e9c6ad4c5a454672c3cd83afd449339a`,
        },
    };

    console.log("Fetching data for category:", category);

    await fetch(`https://api.airtable.com/v0/appvNBPsv8txKEdOb/Late%20Night%20Establishments`, options)
        .then((response) => response.json())
        .then((data) => {
            console.log("Fetched data:", data);

            const filteredData = data.records.filter(record => {
                console.log("Record Type:", record.fields.Type);
                return record.fields.Type.some(type => type === category);
            });

            displayCards(filteredData);
            console.log("Filtered data:", filteredData);
        })
        .catch(error => console.error("Error fetching data", error));
}

function displayCards(data) {
    const container = document.getElementById("cards-container");
    console.log("Displaying cards:", data);

    // Initialize a row for the first set of cards
    let row = document.createElement("div");
    row.className = "row g-3 justify-content-center"; // Add row and justify-content-center

    data.forEach((record, index) => {
        // Create a wrapper for each card
        const cardWrapper = document.createElement("div");
        cardWrapper.className = "col-12 col-md-4 d-flex justify-content-center"; // Center each card in the column

        // Get the stars HTML from the `stars` field
        const stars = displayStars(record.fields.Stars); // Assuming `stars` is the field with the number of stars
        const rating = record.fields.Rating; // Rating to be displayed next to the stars

        cardWrapper.innerHTML = `
            <div class="card" style="width: 350px; margin: 10px;">
                <div class="card-inner">
                <!-- Front of the card -->
                <div class="card-front">
                    <img src="${record.fields.Thumbnail[0].url}" class="card-img-top" alt="${record.fields.Name}">
                    <div class="card-body d-flex flex-column align-items-center text-center">
                        <h5 class="card-title">${record.fields.Name}</h5>
                        <div class="d-flex align-items-center justify-content-center">
                            <div class="stars">${stars}</div>
                                <span class="ms-2">${rating}</span>
                        </div>
                    </div>
                </div>

                <!-- Back of the card -->
                <div class="card-back">
                    <img src="${record.fields.Thumbnail[0].url}" class="card-img-top" alt="${record.fields.Name}">
                    <div class="card-body d-flex flex-column align-items-center text-center">
                        <p><strong>Address:</strong> ${record.fields.Address}</p>
                        <p><strong>Closing Time:</strong> ${record.fields['Closing Time']}</p>
                        <a href="${record.fields['Yelp Page']}" class="btn btn-primary">Yelp Page</a>
                    </div>
                </div>
                </div>
            </div>
        `;


        // If we're starting a new row (first card or after 3 cards), create a new row element
        if (index % 3 === 0) {
            // Only create a new row if it's the first card or after 3 cards
            row = document.createElement("div");
            row.className = "row g-3 justify-content-center"; // Create a new row and center the cards
        }

        // Append the card to the current row
        row.appendChild(cardWrapper);

        // If 3 cards are added, push the row to the container and create a new row
        if ((index + 1) % 3 === 0 || index === data.length - 1) {
            container.appendChild(row); // Add the current row to the container
        }
    });
}

function displayStars(stars) {
    const fullStars = Math.floor(stars); // Whole stars
    const halfStar = stars % 1 >= 0.5 ? 1 : 0; // Check if it's a half-star
    const emptyStars = 5 - fullStars - halfStar;

    let starIcons = '';

    // Add the full stars
    for (let i = 0; i < fullStars; i++) {
        starIcons += `<i class="fa-solid fa-star" style="color: #FFD43B;"></i>`;
    }

    // Add the half star if applicable
    if (halfStar === 1) {
        starIcons += `<i class="fa-solid fa-star-half-stroke" style="color: #FFD43B;"></i>`;
    }

    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
        starIcons += `<i class="fa-regular fa-star" style="color: #FFD43B;"></i>`;
    }

    // Return the generated stars
    return starIcons;
}

