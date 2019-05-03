$(document).ready(function () {

    // firebase init ==========================
    var config = {
        apiKey: "AIzaSyAicdqjxs4oR2uVS3q5niz7bJFoGfq5ixk",
        authDomain: "bootcamp-group-project-jamg.firebaseapp.com",
        databaseURL: "https://bootcamp-group-project-jamg.firebaseio.com",
        projectId: "bootcamp-group-project-jamg",
        storageBucket: "bootcamp-group-project-jamg.appspot.com",
        messagingSenderId: "229343148076"
    };
    firebase.initializeApp(config);

    var database = firebase.database();

    // this is the group of listeners for the firebase database to update saved searches
    database.ref().on("child_added", function (snapshot) {
        var key = snapshot.key; // this is the unique node id for each record
        var citySearch = snapshot.val().city;
        var categorySearch = snapshot.val().category;

        // create a card with button in the saved search area
        var wrapperDiv = $("<div class='card text-center' style='width: 18rem;'>");
        wrapperDiv.attr("id", key);
        var bodyDiv = $("<div class='card text-center' style='width: 18rem'>");
        var headerTag = $("<h5 class='card-title'>");
        headerTag.attr("id, title" + key);
        headerTag.text(citySearch);
        var paragraphTag = $("<p class='card-text'>");
        paragraphTag.text(categorySearch);
        var closeButton = $("<button type='button' class='close align-self-end mr-1' aria-label='Close'>");
        closeButton.attr({ "data-key": key, "id": "delete-card" }); // will be used to delete this search from the database
        var closeAriaSpan = $("<span aria-hidden='true'>");
        closeAriaSpan.html("&times;");
        var searchButton = $("<button class='btn btn-primary'>");
        searchButton.attr({
            "id": "saved-search",
            "data-city": citySearch,
            "data-category": categorySearch,
            "data-saved": "true"
        });
        searchButton.text("Search");
        // build the card and append to the saved searches card
        closeButton.append(closeAriaSpan);
        bodyDiv.append(headerTag, paragraphTag, searchButton);
        wrapperDiv.append(closeButton, bodyDiv);
        $("#saved-searches").append(wrapperDiv);

    });

    // on delete listener to remove item from database when you click the "X"
    database.ref().on("child_removed", function (snapshot) {
        $("#" + snapshot.key).remove();
    });

    // onclick for clicking the x to delete the card, and to delete the database record
    $("body").on("click", "#delete-card", function () {
        var key = $(this).attr("data-key");
        database.ref(key).remove();
    });


    // heatmap code 
    var cfg = {
        // radius should be small ONLY if scaleRadius is true (or small radius is intended)
        // if scaleRadius is false it will be the constant radius used in pixels
        "radius": .004, // I had to make this really small. if it's 1 the whole state is red! 
        "maxOpacity": .8,
        // scales the radius based on map zoom
        "scaleRadius": true,
        // if set to false the heatmap uses the global maximum for colorization
        // if activated: uses the data maximum within the current map boundaries 
        //   (there will always be a red spot with useLocalExtremas true)
        "useLocalExtrema": true,
        // which field name in your data represents the latitude - default "lat"
        latField: 'latitude',
        // which field name in your data represents the longitude - default "lng"
        lngField: 'longitude',
        // which field name in your data represents the data value - default "value"
        valueField: 'count'
    };


    var heatmapLayer = new HeatmapOverlay(cfg); // check console.log to see that heatmapLayer is mutable!!! 

    // zomato code
    var zomatoKey = "c7db9a7567a1e0278cfd9829e1435aa1";
    var testData = {
        max: 100,
        data: []
    };
    var locationData = {
        max: 100,
        data: []
    };


    // this seems way more complex, but it demonstrates the use of the jQuery .when() method
    // which can be used to call a function after a response is returned, and get it out of the $.ajax() call
    var cityLat;
    var cityLong;
    var cityId;

    // onclick for the initial search button which DOES update the database
    $("body").on("click", "#search", function () {
        var isChecked = document.getElementById("search-save-checkbox").checked;
        testData.data.length = 0; // delete the lat/long data
        var thisElement = $(this).attr("id");
        var citySearch = $("#location-input").val().trim();
        var category = $("#category-input").val().trim();
        clickSearch(citySearch, category);
         

        // add to the database
        database.ref().push({
            city: citySearch,
            category: category
        });
        //console.log(testData);
        console.log(locationData);
     });

    // onclick for the saved search button which DOES NOT update the database
    $("body").on("click", "#saved-search", function () {
        testData.data.length = 0; // delete the lat/long data
        var thisElement = $(this).attr("id");
        var citySearch = $(this).attr("data-city");
        var category = $(this).attr("data-category");
        clickSearch(citySearch, category, thisElement);
        //console.log(testData);
        console.log(locationData);
        
     });
    
     var clickSearch = function (citySearch, category) {
       locationData.data = []
        $("#details-div").empty();
             
        map.remove();
        var newMap = $("<div>");
        newMap.attr("id", "map");
        newMap.attr("style", "height:500px");
        $("#add-map").append(newMap);
      
        $.ajax({
            method: "GET",
            url: "https://developers.zomato.com/api/v2.1/locations?query=" + citySearch,
            headers: { "user-key": "c7db9a7567a1e0278cfd9829e1435aa1" }
        }).then(function (response) {
            //console.log(response);
            var locationNum = response.location_suggestions.length;
            if (thisElement === "search") { // check to see if the clicked on element is the #search button
                if (response.location_suggestions.length > 0) {
                    $("small").css("display", "none");
                } else {
                    $("small").css("display", "block");
                }
            }
            if (thisElement === "search") { // check to see if the save this search checkbox is checked
                if (document.getElementById("search-save-checkbox").checked) {
                    // add to the database
                    database.ref().push({
                        city: response.location_suggestions[0].title,
                        category: category
                    });
                }
            }
            cityLat = response.location_suggestions[0].latitude;
            cityLong = response.location_suggestions[0].longitude;
            cityId = (response.location_suggestions[0].city_id).toString();
            console.log("response: ", response);
            console.log("city id: ", cityId);

        }).then(function () {

            var ajax1 = $.ajax({
                method: "GET",
                url: "https://developers.zomato.com/api/v2.1/search?entity_id=" + cityId + "&entity_type=city&q=" + category + "&start=0",
                headers: { "user-key": "c7db9a7567a1e0278cfd9829e1435aa1" }
            }),
                ajax2 = $.ajax({
                    method: "GET",
                    url: "https://developers.zomato.com/api/v2.1/search?entity_id=" + cityId + "&entity_type=city&q=" + category + "&start=20",
                    headers: { "user-key": "c7db9a7567a1e0278cfd9829e1435aa1" }
                }),
                ajax3 = $.ajax({
                    method: "GET",
                    url: "https://developers.zomato.com/api/v2.1/search?entity_id=" + cityId + "&entity_type=city&q=" + category + "&start=40",
                    headers: { "user-key": "c7db9a7567a1e0278cfd9829e1435aa1" }
                }),
                ajax4 = $.ajax({
                    method: "GET",
                    url: "https://developers.zomato.com/api/v2.1/search?entity_id=" + cityId + "&entity_type=city&q=" + category + "&start=60",
                    headers: { "user-key": "c7db9a7567a1e0278cfd9829e1435aa1" }
                }),
                ajax5 = $.ajax({
                    method: "GET",
                    url: "https://developers.zomato.com/api/v2.1/search?entity_id=" + cityId + "&entity_type=city&q=" + category + "&start=80",
                    headers: { "user-key": "c7db9a7567a1e0278cfd9829e1435aa1" }
                });


            $.when(ajax1, ajax2, ajax3, ajax4, ajax5).done(function (r1, r2, r3, r4, r5) {
                console.log("r1: ", r1);
                // r1 is the response, r1[0] is where the data is in a .when() call. 
                // check the log for the response 
                var responseArray = [];
                //console.log(responseArray);
                responseArray.push(r1[0], r2[0], r3[0], r4[0], r5[0]);
                responseArray.forEach(function (response) {
                    for (i = 0; i < response.restaurants.length; i++) {
                        var latString = response.restaurants[i].restaurant.location.latitude;
                        var longString = response.restaurants[i].restaurant.location.longitude;
                        var lat = parseFloat(latString);
                        var long = parseFloat(longString);
                        var latLong = { "latitude": lat, "longitude": long, "count": 1 };
                        testData.data.push(latLong);
                     
                    }
                    
                });
                var detailArray = [];
                console.log("detailArray: " + detailArray);
                detailArray.push(r1[0]);

              detailArray.forEach(function (response) {
                    for (i = 0; i < response.restaurants.length; i++) {
                        var name = response.restaurants[i].restaurant.name;
                        var address = response.restaurants[i].restaurant.location.address;
                        var nameAddress = { "Location": name, "Address": address, "count": 1 };
                        locationData.data.push(nameAddress);
                       $("#details-div" ).append(name, address);
                        addRow(response);
                       
                        
                      
                    }
                    function addRow(response) {
                      $("tbody").append("<tr><td>" + response.restaurants[i].restaurant.name + "</td><td>" +response.restaurants[i].restaurant.location.address  + "</td></tr>");
                    }
                });
               
                      
                // leaflet code
                var lat = cityLat;
                var long = cityLong;
                var zoom = 12;

                L.mapquest.key = 'FuQjru92zZdcmkhC0D99Fp9Ye0ZaEAGa';
                heatmapLayer.setData(testData);
                // 'map' refers to a <div> element with the ID map
                L.mapquest.map('map', {
                    center: [lat, long],
                    layers: [L.mapquest.tileLayer('map'), heatmapLayer],
                    zoom: zoom
                });
            });
        });
    }
});

