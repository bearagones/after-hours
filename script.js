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

    // Get the sort dropdown element
    const sortOptions = document.getElementById("sort-options");

    // Add default option (No sorting) to the dropdown
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Sort by...";
    defaultOption.selected = true;
    defaultOption.disabled = true;
    sortOptions.prepend(defaultOption); // Add it as the first option

    // Add event listener to sort dropdown
    sortOptions.addEventListener("change", function () {
        const selectedSort = sortOptions.value;
        sortData(selectedSort);
    });

    if (category) {
        getRecords(category);
    }
});

let displayData = [];  // Store the fetched data globally so we can sort it

async function getRecords(category) {
    const options = {
        method: "GET",
        headers: {
            Authorization: `Bearer patIZYOlRFbGjc1Ui.5607506c1754731bc8eaec2841138a14e9c6ad4c5a454672c3cd83afd449339a`,
        },
    };

    console.log("Fetching data for category:", category);

    try {
        const response = await fetch(`https://api.airtable.com/v0/appvNBPsv8txKEdOb/Late%20Night%20Establishments`, options);
        const data = await response.json();

        const filteredData = data.records.filter(record => {
            return record.fields.Type.some(type => type === category);
        });

        // Fetch Closing Time data for each record
        const recordsWithClosingTimes = await Promise.all(filteredData.map(async (record) => {
            const closingTimeLink = record.fields['Closing Time'];

            if (closingTimeLink && closingTimeLink.length > 0) {
                const closingTimeId = closingTimeLink[0];
                const closingTimeResponse = await fetch(`https://api.airtable.com/v0/appvNBPsv8txKEdOb/Closing%20Times/${closingTimeId}`, options);
                const closingTimeData = await closingTimeResponse.json();

                console.log('Closing Time Data:', closingTimeData);

                return {
                    ...record,
                    closingTime: closingTimeData.fields,
                };
            } else {
                console.log("No closing time linked for this record.");
                return { ...record, closingTime: null }; // Handle case where there's no linked Closing Time
            }
        }));

        // Process records and format closing times
        displayData = recordsWithClosingTimes.map((record) => {
            const closingTimes = getClosingTimes(record.closingTime); // Get formatted closing times string
            return { ...record, closingTimes };
        });

        // Initially display the cards
        displayCards(displayData);
        console.log("Filtered data with closing times:", displayData);
    } catch (error) {
        console.error("Error fetching data", error);
    }
}

function displayCards(data) {
    const container = document.getElementById("cards-container");
    console.log("Displaying cards:", data);

    container.innerHTML = '';  // Clear the container before displaying new data

    let row = document.createElement("div");
    row.className = "row g-3 justify-content-center";

    data.forEach((record, index) => {
        const cardWrapper = document.createElement("div");
        cardWrapper.className = "col-12 col-md-4 d-flex justify-content-center";

        const stars = displayStars(record.fields.Stars);
        const rating = record.fields.Rating;

        cardWrapper.innerHTML =
            `
            <div class="card" style="width: 350px; margin: 10px;">
                <div class="card-inner">
                    <div class="card-front">
                        <img src="${record.fields.Thumbnail[0].url}" class="card-img-top" alt="${record.fields.Name}">
                        <div class="card-body d-flex flex-column align-items-center text-center">
                            <h5 class="card-title">${record.fields.Name}</h5>
                            <p>${record.fields.Description}</p>
                            <div class="d-flex align-items-center justify-content-center">
                                <div class="stars">${stars}</div>
                                <span class="ms-2">${rating}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-back">
                        <div class="closing-times">
                            <img src="${record.fields.Thumbnail[0].url}" class="card-img-top" alt="${record.fields.Name}">
                            <div class="text-overlay">${record.closingTimes}</div>
                        </div>
                        <div class="card-body d-flex flex-column align-items-center text-center">
                            <h5 class="card-title">${record.fields.Name}</h5>
                            <div class="badges">
                                <span class="badge district">${record.fields.District}</span>
                                <span class="badge neighborhood">${record.fields.Neighborhood}</span>
                            </div>
                            <p>${record.fields.Address}</p>
                            <div class="button-group d-flex justify-content-center">
                                <a href="${record.fields['Yelp Page']}" class="btn btn-primary" target="_blank">Yelp Page</a>
                                <a href="${record.fields.Directions}" class="btn btn-primary" target="_blank">Directions</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (index % 3 === 0) {
            row = document.createElement("div");
            row.className = "row g-3 justify-content-center";
        }

        row.appendChild(cardWrapper);

        if ((index + 1) % 3 === 0 || index === data.length - 1) {
            container.appendChild(row);
        }
    });
}

function displayStars(stars) {
    const fullStars = Math.floor(stars);
    const halfStar = stars % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    let starIcons = '';

    for (let i = 0; i < fullStars; i++) {
        starIcons += `<i class="fa-solid fa-star" style="color: #FFD43B;"></i>`;
    }

    if (halfStar === 1) {
        starIcons += `<i class="fa-solid fa-star-half-stroke" style="color: #FFD43B;"></i>`;
    }

    for (let i = 0; i < emptyStars; i++) {
        starIcons += `<i class="fa-regular fa-star" style="color: #FFD43B;"></i>`;
    }

    return starIcons;
}

function getClosingTimes(record) {
    if (!record) return "No closing times available";

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const currentDay = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        timeZone: 'America/Los_Angeles'
    }).format(new Date());

    let formattedTimes = [];

    daysOfWeek.forEach(day => {
        const time = record[day];
        console.log(`Closing time for ${day}:`, time);

        let timeText = '';
        if (time) {
            timeText = `${day}: ${time}`;
        } else {
            timeText = `${day}: Not Available`;
        }

        if (day === currentDay) {
            timeText = `<span class="highlighted">${timeText}</span>`;
        }

        formattedTimes.push(timeText);
    });

    return formattedTimes.join('<br>');
}

// Helper function to convert 12-hour time to 24-hour time for sorting
function convertTo24Hour(time) {
    if (time === "Closed") return -1;  // Handle 'Closed' as the latest possible time

    const [timeString, modifier] = time.split(" ");
    const [hours, minutes] = timeString.split(":").map(Number);
    let hours24 = hours;

    if (modifier === "PM" && hours !== 12) {
        hours24 += 12;  // Convert PM to 24-hour format
    } else if (modifier === "AM" && hours === 12) {
        hours24 = 0;  // Convert 12 AM to 00
    }

    return hours24 * 60 + minutes;  // Return the time in minutes for easier comparison
}

function sortData(selectedSort) {
    let sortedData;

    switch (selectedSort) {
        case 'alphabetical-asc':
            sortedData = displayData.sort((a, b) => a.fields.Name.localeCompare(b.fields.Name));
            break;
        case 'alphabetical-desc':
            sortedData = displayData.sort((a, b) => b.fields.Name.localeCompare(a.fields.Name));
            break;
        case 'rating-asc':
            sortedData = displayData.sort((a, b) => a.fields.Rating - b.fields.Rating);
            break;
        case 'rating-desc':
            sortedData = displayData.sort((a, b) => b.fields.Rating - a.fields.Rating);
            break;
        case 'closing-time-asc':
            sortedData = displayData.sort((a, b) => convertTo24Hour(a.closingTime) - convertTo24Hour(b.closingTime));
            break;
        case 'closing-time-desc':
            sortedData = displayData.sort((a, b) => convertTo24Hour(b.closingTime) - convertTo24Hour(a.closingTime));
            break;
        default:
            sortedData = displayData;
    }

    displayCards(sortedData);
}

var mybutton = document.getElementById("scrollToTopBtn");

window.onscroll = function () {
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
};

mybutton.onclick = function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};