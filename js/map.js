
//############################################################//
// Variables

var googlePlacesAPIService; // Service for API request executions

var userCoordinates;        // User's coordinates

var searchOptions = 0;      // Search options: 0 = no filter ; 1 = Bars ; 2 = Restaurants

var map;                    // The map generated by mapbox

var userPositionMarker;     // Marker associated with user's location

var placesRequest;          // Google places API request

var placeInformations;      // Informations about places: contains ID, latitude and longitude, adress, rating, name, etc...

var JSONSaveFileName = "";  // Name of the JSON data file

var JSONFile;               // File that store JSON data

var locationsMarkers = [];  // Array with allthe markers

var bars = "";              // JSON String with bars

var restaurants = "";       // JSON String with restaurants

var barsRestaurants = "";   // JSON String with all places

var requestItemsNumber;     // Number of items requested

var counter;                // Simple counter for tasks

var requestingInterval;     // Interval for requests

//############################################################//
//Main

init()

//############################################################//
//Functions

function init(){

// Initialisation of user's location with coordinates of Lyon near Bellecour

    userCoordinates = {

        userLatitude : 45.75717800533178,

        userLongitude : 4.83480298193669

    }

// Mapbox generation with API key authentication

    mapboxgl.accessToken = 'pk.eyJ1IjoiYWd0ZXJyYWwiLCJhIjoiY2pkMjRnbjJkNWYwZDJ4bGdwMWlxODJiYSJ9.4W9g-Go5vHpL9UZmjnGj4g';

    map = new mapboxgl.Map({

        container: 'map',

        center: [ userCoordinates.userLongitude, userCoordinates.userLatitude ],

        zoom: 16,

        style: 'mapbox://styles/mapbox/streets-v9'

    });

// Update user's location

    getUserLocation();

// Creation of user marker on map

    userPositionMarker = new mapboxgl.Marker().setLngLat([userCoordinates.userLongitude, userCoordinates.userLatitude]);

    var markerHeight = 50, markerRadius = 10, linearOffset = 25;

    var popupOffsets = {
        'top': [0, 0],
        'top-left': [0,0],
        'top-right': [0,0],
        'bottom': [0, -markerHeight],
        'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
        'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
        'left': [markerRadius, (markerHeight - markerRadius) * -1],
        'right': [-markerRadius, (markerHeight - markerRadius) * -1]
    };

    var popup = new mapboxgl.Popup({offset:popupOffsets})
        .setLngLat([userCoordinates.userLongitude, userCoordinates.userLatitude])
        .setHTML("<h3>Vous êtes ici</h3>")
        .addTo(map);

    userPositionMarker.setPopup( popup );

    userPositionMarker.addTo(map);

    googlePlacesAPIService = new google.maps.places.PlacesService( document.createElement('div') );

}

// getUserLocation : retrieves the user's location and watch location changes

function getUserLocation()
{

    if( navigator.geolocation )
    {

        navigator.geolocation.watchPosition(setUserCoordinates);

    }

}

// setUserCoordinates : fix the userCoordinates properties, center the map on the user's location and update the marker

function setUserCoordinates( position ) {

    userCoordinates.userLatitude = position.coords.latitude;

    userCoordinates.userLongitude = position.coords.longitude;

    map.setCenter([userCoordinates.userLongitude, userCoordinates.userLatitude]);

    userPositionMarker.setLngLat([userCoordinates.userLongitude, userCoordinates.userLatitude]);

    var location = new google.maps.LatLng( userCoordinates.userLatitude, userCoordinates.userLongitude );

    getPlaces( location, null, null, 3, 150, searchOptions);

}

function getPlaces( location, price, opened, rating, radius, type )
{
    placesRequest = {

        location : location,

        minPriceLevel : 0,

        maxPriceLevel : null,

        openNow : null,

        radius : radius,

        type : null

    };

    if( price != null )
        placesRequest.maxPriceLevel = price;

    if( opened != null )
        placesRequest.openNow = opened;

    switch (type){

        case 1:

            placesRequest.type = 'bar';

            break;

        case 2:

            placesRequest.type = 'restaurant';

            break;

        default:
            break;

    }

    if(type == 0)
    {

        placesRequest.type = 'bar';

        googlePlacesAPIService.nearbySearch( placesRequest, callbackBars );

        placesRequest.type = 'restaurant';

        googlePlacesAPIService.nearbySearch( placesRequest, callbackRestaurants );

    }
    else
    {

        googlePlacesAPIService.nearbySearch( placesRequest, callbackPlaces );

    }

}

// Callbacks

function callbackBars( results, status ) {

    if ( status == google.maps.places.PlacesServiceStatus.OK ) {

        bars = "[";

        for (var i = 0; i < results.length ; i++) {

            var actualPlace = results[i];

            placeInformations = {

                "id" : actualPlace['place_id'],

                "coordinates" : actualPlace['geometry']['location'],

                "adress" : actualPlace['vicinity'],

                "rating" : actualPlace['rating'],

                "opened" : "unknown",

                "name" : actualPlace ['name'],

                "type" : 'bar',

            };

            if( actualPlace['opening_hours'] )
                placeInformations.opened = actualPlace['opening_hours']['open_now'];

            if(i === results.length - 1)

                bars += JSON.stringify(placeInformations) ;
            else
                bars += JSON.stringify(placeInformations) + ",";

        }

        bars += "]";

        displayBars( bars );

    }

}

function callbackRestaurants(results, status) {

    if (status == google.maps.places.PlacesServiceStatus.OK) {

        restaurants = "[";

        for (var i = 0; i < results.length; i++) {

            var actualPlace = results[i];

            placeInformations = {

                "id": actualPlace['place_id'],

                "coordinates": actualPlace['geometry']['location'],

                "adress": actualPlace['vicinity'],

                "rating": actualPlace['rating'],

                "opened": "unknown",

                "name": actualPlace ['name'],

                "type": 'restaurant',

            };

            if (actualPlace['opening_hours'])
                placeInformations.opened = actualPlace['opening_hours']['open_now'];

            if (i === results.length - 1)
                restaurants += JSON.stringify(placeInformations);
            else
                restaurants += JSON.stringify(placeInformations) + ",";

        }

        restaurants += "]";

        displayRestaurant( restaurants );

    }

}

function callbackPlaces( results, status )
{

    barsRestaurants = "[";

    bars = "[";

    restaurants = "[";

    if (status === google.maps.places.PlacesServiceStatus.OK) {

        for (var i = 0; i < results.length ; i++) {

            var actualPlace = results[i];

            placeInformations = {

                "id" : actualPlace['place_id'],

                "coordinates" : actualPlace['geometry']['location'],

                "adress" : actualPlace['vicinity'],

                "rating" : actualPlace['rating'],

                "opened" : null,

                "name" : actualPlace ['name'],

                "type" : null,

            };

            if( actualPlace['opening_hours'] )
                placeInformations.opened = actualPlace['opening_hours']['open_now'];

            var isBar = checkIfPlaceIsBar(actualPlace);

            var isRestaurant = checkIfPlaceIsRestaurant(actualPlace);

            if( isBar && isRestaurant)
            {

                placeInformations.type = "Bar-restaurant";

            }
            else if ( isBar )
            {

                placeInformations.type = "Bar";

            }
            else if ( isRestaurant )
            {

                placeInformations.type = "Restaurant";

            }

            if(i === results.length - 1) {

                if (isBar && isRestaurant)
                    barsRestaurants += JSON.stringify(placeInformations);
                else if (isBar)
                    bars += JSON.stringify(placeInformations);
                else
                    restaurants += JSON.stringify(placeInformations);

            }
            else {

                if (isBar && isRestaurant)
                    barsRestaurants += JSON.stringify(placeInformations) + ",";
                else if (isBar)
                    bars += JSON.stringify(placeInformations) + ",";
                else
                    restaurants += JSON.stringify(placeInformations) + ",";

            }

        }

    }

    barsRestaurants += "]";

    bars += "]";

    restaurants += "]";

    displayPlaces( bars, restaurants );

}

// Map related functions

function displayPlaces( bars, restaurants )
{

    displayBars( bars );

    displayRestaurant( restaurants );

}

function displayRestaurant(restaurants)
{

    var restaurantsArray = JSON.parse(restaurants);

    for( var i = 0; i < restaurantsArray.length; i++)
    {

        var actualRestaurant = restaurantsArray[i];

        var marker = new  mapboxgl.Marker().setLngLat(JSON.parse(JSON.stringify(actualRestaurant['coordinates'])));

        var markerHeight = 50, markerRadius = 10, linearOffset = 25;

        var popupOffsets = {
            'top': [0, 0],
            'top-left': [0,0],
            'top-right': [0,0],
            'bottom': [0, -markerHeight],
            'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
            'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
            'left': [markerRadius, (markerHeight - markerRadius) * -1],
            'right': [-markerRadius, (markerHeight - markerRadius) * -1]
        };

        var popup = new mapboxgl.Popup({offset:popupOffsets})
            .setLngLat(actualRestaurant['coordinates'])
            .setHTML(createMarkerPopupHTML(actualRestaurant))
            .addTo(map);

        marker.setPopup( popup );

        locationsMarkers.push( marker );

        marker.addTo( map );

    }

}

function displayBars(bars)
{

    var barsArray = JSON.parse(bars);

    for( var i = 0; i < barsArray.length; i++)
    {

        var actualBar = barsArray[i];

        var marker = new  mapboxgl.Marker().setLngLat(JSON.parse(JSON.stringify(actualBar['coordinates'])));

        var markerHeight = 50, markerRadius = 10, linearOffset = 25;

        var popupOffsets = {
            'top': [0, 0],
            'top-left': [0,0],
            'top-right': [0,0],
            'bottom': [0, -markerHeight],
            'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
            'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
            'left': [markerRadius, (markerHeight - markerRadius) * -1],
            'right': [-markerRadius, (markerHeight - markerRadius) * -1]
        };

        var popup = new mapboxgl.Popup({offset:popupOffsets})
            .setLngLat(actualBar['coordinates'])
            .setHTML(createMarkerPopupHTML(actualBar))
            .addTo(map);

        marker.setPopup( popup );

        locationsMarkers.push( marker );

        marker.addTo( map );

    }

}

function createMarkerPopupHTML(place)
{

    var state = "fermé"

    if (place.opened)
    {

        state = "ouvert"

    }

    var html =
        "<h5>" + place.name + "</h5>"
        + "<br><a style='text-align: center'>" + place.type + "</a>"
        + "<br><a href='https://www.google.com/maps/dir/?api=1&origin=" + userCoordinates.userLatitude + ',' + userCoordinates.userLongitude + "&destination=QVB&destination_place_id=" + place.id + "&travelmode=walking'>" + place.adress + "</a>"

    if( place.opened != null )
        html += "<br><a>Actuellement : " + state + "</a>";

    if( place.rating != null )
        html += "<br><a>Note : " + place.rating + "/5</a>";

    return html;

}

function clearMap()
{

    for(var i = 0; i < locationsMarkers.length; i++)
    {

        locationsMarkers[i].remove();

    }

    locationsMarkers = [];

}

// Tests functions

function checkIfPlaceIsBar(place) {

    for(var i = 0; i < place.types.length; i++)
    {

        if ( place.types[i] === "bar" )
            return true;

    }

    return false;

}

function checkIfPlaceIsRestaurant(place) {

    for(var i = 0; i < place.types.length; i++)
    {

        if ( place.types[i] === "restaurant" )
            return true;

    }

    return false;

}

//############################################################//

/*
// updateJSONDataFile : update the JSON data file with nearby places

function getAllPlaceIDs() {

    requestItemsNumber = 0;

    counter = 0;

    var location = new google.maps.LatLng( userCoordinates.userLatitude, userCoordinates.userLongitude );

    placesRequest = {

        location : location,

        radius : 500,

        type : "bar"

    }

    googlePlacesAPIService.radarSearch(placesRequest, callbackPlacesID);

    placesRequest = {

        location : location,

        radius : 500,

        type : "restaurant"

    }

    googlePlacesAPIService.radarSearch(placesRequest, callbackPlacesID);

}

function callbackPlacesID( results, status, callback) {

    if (status === google.maps.places.PlacesServiceStatus.OK) {

        requestItemsaNumber += results.length;

        console.log(results.length);

        barsRestaurants = "[";

        bars = "[";

        restaurants = "[";

        for (var i = 0; i < results.length; i++)
        {

            var coordinates = JSON.stringify(results[i]['geometry']['location']);

            createSimpleMarker( coordinates );

            var detailsRequest = {

                placeId : results[i]["place_id"]

            };

            requestingInterval = setInterval(googlePlacesAPIService.getDetails( detailsRequest, getDetailsCallback ), 1000);

        }

    }

}

function closeJSONCallback(value)
{

    counter += value;

    console.log(counter);

    if( counter == requestItemsNumber )
    {

        window.clearInterval(requestingInterval);

        barsRestaurants += "]";

        bars += "]";

        restaurants += "]";

        console.log("a");

    }

}

function getDetailsCallback( result, status ) {

    if (status === google.maps.places.PlacesServiceStatus.OK) {

        console.log("test");

        var actualPlace = result;

        placeInformations = {

            "id" : actualPlace['place_id'],

            "coordinates" : actualPlace['geometry']['location'],

            "adress" : actualPlace['vicinity'],

            "rating" : actualPlace['rating'],

            "opened" : "unknown",

            "name" : actualPlace ['name'],

            "type" : 'bar',

            "website" : actualPlace['website'],

            "phone" : actualPlace['formatted_phone_number']

        };

        if( actualPlace['opening_hours'] )
            placeInformations.opened = actualPlace['opening_hours']['open_now'];

        var isBar = checkIfPlaceIsBar(actualPlace);

        var isRestaurant = checkIfPlaceIsRestaurant(actualPlace);

        if( isBar && isRestaurant)
        {

            placeInformations.type = "Bar-restaurant";

            barsRestaurants += JSON.stringify(placeInformations);

        }
        else if ( isBar )
        {

            placeInformations.type = "Bar";

            bars += JSON.stringify(placeInformations);

        }
        else if ( isRestaurant )
        {

            placeInformations.type = "Restaurant";

            restaurants += JSON.stringify(placeInformations);

        }

        closeJSONCallback(1);

    }

}

function createSimpleMarker( placeCoordinates )
{

    var marker = new  mapboxgl.Marker().setLngLat(JSON.parse( placeCoordinates ));

    var markerHeight = 50, markerRadius = 10, linearOffset = 25;

    var popupOffsets = {
        'top': [0, 0],
        'top-left': [0,0],
        'top-right': [0,0],
        'bottom': [0, -markerHeight],
        'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
        'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
        'left': [markerRadius, (markerHeight - markerRadius) * -1],
        'right': [-markerRadius, (markerHeight - markerRadius) * -1]
    };


    //marker.setPopup( popup );

    locationsMarkers.push( marker );

    marker.addTo( map );

}



// Location button by mapbox

map.addControl( new mapboxgl.GeolocateControl ({

   positionOptions: {

       enableHighAccuracy: true

   },

   trackUserLocation: true

}));*/