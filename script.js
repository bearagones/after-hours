"use strict";

document.addEventListener("DOMContentLoaded", function () {
    // determine which page we are on
    const path = window.location.pathname;
    console.log("Current path:", path);

    // filter cards based on assigned category
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

    // sort cards based on chosen option
    const sortOptions = document.getElementById("sort-options");

    sortOptions.addEventListener("change", function () {
        const selectedSort = sortOptions.value;
        sortData(selectedSort);
    });
});

let displayData = [];

// function to grab the cards from AirTable
async function getRecords(category) {
    const options = {
        method: "GET",
        headers: {
            Authorization: `Bearer patIZYOlRFbGjc1Ui.5607506c1754731bc8eaec2841138a14e9c6ad4c5a454672c3cd83afd449339a`,
        },
    };

    console.log("Fetching data for category:", category);

    try {
        const response = await fetch(
            `https://api.airtable.com/v0/appvNBPsv8txKEdOb/Late%20Night%20Establishments`,
            options
        );
        const data = await response.json();

        const filteredData = data.records.filter((record) => {
            return record.fields.Type.some((type) => type === category);
        });

        const recordsWithClosingTimes = await Promise.all(
            filteredData.map(async (record) => {
                const closingTimeLink = record.fields["Closing Time"];

                if (closingTimeLink && closingTimeLink.length > 0) {
                    const closingTimeId = closingTimeLink[0];
                    const closingTimeResponse = await fetch(
                        `https://api.airtable.com/v0/appvNBPsv8txKEdOb/Closing%20Times/${closingTimeId}`,
                        options
                    );
                    const closingTimeData = await closingTimeResponse.json();

                    return {
                        ...record,
                        closingTime: closingTimeData.fields,
                    };
                } else {
                    console.log("No closing time linked for this record.");
                    return { ...record, closingTime: null };
                }
            })
        );

        displayData = recordsWithClosingTimes.map((record) => {
            const closingTimes = getClosingTimes(record.closingTime);
            return { ...record, closingTimes };
        });

        displayCards(displayData);
    } catch (error) {
        console.error("Error fetching data", error);
    }
}

function displayCards(data) {
    const container = document.getElementById("cards-container");
    console.log("Displaying cards:", data);

    container.innerHTML = "";

    let row = document.createElement("div");
    row.className = "row g-3 justify-content-center";

    data.forEach((record, index) => {
        const cardWrapper = document.createElement("div");
        cardWrapper.className = "col-12 col-md-4 d-flex justify-content-center";

        // display the star icons
        const stars = displayStars(record.fields.Stars);
        // display the rating 
        const rating = record.fields.Rating;

        // HTML for the cards themselves
        cardWrapper.innerHTML = `
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
                                <a href="${record.fields["Yelp Page"]}" class="btn btn-primary" target="_blank">Yelp Page</a>
                                <a href="${record.fields.Directions}" class="btn btn-primary" target="_blank">Directions</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // three cards per row
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

// function that displays the correct number of stars 
function displayStars(stars) {
    const fullStars = Math.floor(stars);
    const halfStar = stars % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    let starIcons = "";

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

// display proper closing times
function getClosingTimes(record) {
    if (!record) return "No closing times available";

    const daysOfWeek = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ];

    // get the current day of the week in SF's time zone 
    const currentDay = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "America/Los_Angeles",
    }).format(new Date());

    let formattedTimes = [];

    daysOfWeek.forEach((day) => {
        const time = record[day];

        // display closing time for each weekday
        let timeText = "";
        if (time) {
            timeText = `${day}: ${time}`;
        } else {
            timeText = `${day}: Not Available`;
        }

        // highlight the current weekday for the user
        if (day === currentDay) {
            timeText = `<span class="highlighted">${timeText}</span>`;
        }

        formattedTimes.push(timeText);
    });

    return formattedTimes.join("<br>");
}

// Convert the time strings to minutes
function convertTo24Hour(time) {

    console.log("Time to convert: ", time);
    const [timeString, modifier] = time.split(" ");
    const [hours, minutes] = timeString.split(":").map(Number);
    let hours24 = hours;

    if (modifier === "PM" && hours !== 12) {
        hours24 += 12;
    } else if (modifier === "AM" && hours === 12) {
        hours24 = 0;
    }

    const totalMinutes = hours24 * 60 + minutes;

    const adjustedMinutes = hours24 < 10 ? totalMinutes + 24 * 60 : totalMinutes;

    console.log("Converted to 24-hour time:", totalMinutes);
    console.log("Adjusted time (next day for early morning):", adjustedMinutes);
    return adjustedMinutes;
}

// sort the cards based on user selection 
function sortData(selectedSort) {
    let sortedData;

    // get the current day of the week in SF's time zone 
    const currentDay = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "America/Los_Angeles",
    }).format(new Date());

    const extractCurrentDayTime = (record) => {
        const time = record.closingTime ? record.closingTime[currentDay] : null;
        if (time === "Closed") return Infinity;
        return time ? convertTo24Hour(time) : -1; // Return -1 if no valid time
    };

    switch (selectedSort) {
        case "alphabetical-asc":
            sortedData = displayData.sort((a, b) => a.fields.Name.localeCompare(b.fields.Name));
            break;
        case "alphabetical-desc":
            sortedData = displayData.sort((a, b) => b.fields.Name.localeCompare(a.fields.Name));
            break;
        case "rating-asc":
            sortedData = displayData.sort((a, b) => a.fields.Rating - b.fields.Rating);
            break;
        case "rating-desc":
            sortedData = displayData.sort((a, b) => b.fields.Rating - a.fields.Rating);
            break;
        case "closing-asc":
            sortedData = displayData.sort((a, b) => {
                const timeA = extractCurrentDayTime(a);
                const timeB = extractCurrentDayTime(b);
                
                if (timeA === Infinity) return 1;  
                if (timeB === Infinity) return -1;
                return timeA - timeB;
            });
            break;
        case "closing-desc":
            sortedData = displayData.sort((a, b) => {
                const timeA = extractCurrentDayTime(a);
                const timeB = extractCurrentDayTime(b);
                
                if (timeA === Infinity) return 1;  
                if (timeB === Infinity) return -1; 
                return timeB - timeA;
            });
            break;
        default:
            sortedData = displayData;
    }

    displayCards(sortedData);
}

// button to scroll back to the top
var mybutton = document.getElementById("scrollToTopBtn");

window.onscroll = function () {
    if (
        document.body.scrollTop > 100 ||
        document.documentElement.scrollTop > 100
    ) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
};

mybutton.onclick = function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
};
