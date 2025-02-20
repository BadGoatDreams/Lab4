mapboxgl.accessToken = 'pk.eyJ1IjoiYmFkZ29hdGRyZWFtcyIsImEiOiJjbTZpdzJlZzQwZDdxMmpvbzMzYm5zZHpwIn0.FS149B5ltQdbRgLL7ctZkQ';

const magDisplay = document.getElementById('mag');
const locDisplay = document.getElementById('loc');
const dateDisplay = document.getElementById('date');

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/badgoatdreams/cm6iw4j8i00ag01rf3l668k6q',
    center: [-123, 45],
    zoom: 9
});

const geolocate = new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: false,
    showUserHeading: false
});

map.addControl(geolocate);

map.on('load', () => {
    geolocate.trigger();
    getData('data/graveyard_memorials.geojson');
});

geolocate.on('geolocate', (position) => {
    const userLocation = [position.coords.longitude, position.coords.latitude];
    console.log('User location:', userLocation);

    map.flyTo({
        center: userLocation,
        zoom: 11,
        essential: true
    });

    new mapboxgl.Marker()
        .setLngLat(userLocation)
        .addTo(map);

})
function getData(data_path) {
    fetch(data_path)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(json => {
            map.addSource('graveyards', {
                type: 'geojson',
                data: json
            });

            map.addLayer({
                id: 'graveyards-layer',
                type: 'fill',
                source: 'graveyards',
                paint: {
                    'fill-color': '#080808'
                }
            });

            map.addLayer({
                id: 'graveyards-labels',
                type: 'symbol',
                source: 'graveyards',
                layout: {
                    'text-field': ['get', 'name'],
                    'text-size': 12,
                    'text-offset': [0, 1],
                    'text-anchor': 'top'
                },
                paint: {
                    'text-color': '#000000',
                    'text-halo-color': '#FFFFFF',
                    'text-halo-width': 1
                }
            });
        })
        .catch(error => {
            console.log("Error fetching GeoJSON data: ", error);
        });
}


// Global variable to store the poems
let graveyardPoems = [];

// Load the JSON file
fetch('data/graveyard_poems.json')
    .then(response => response.json())
    .then(data => {
        graveyardPoems = data;
        console.log(graveyardPoems)
    })
    .catch(error => console.error('Error loading poems:', error));

function generatePoem() {
    if (graveyardPoems.length === 0) {
        return "Poems not loaded yet.";
    }
    const randomIndex = Math.floor(Math.random() * graveyardPoems.length);
    return graveyardPoems[randomIndex].poem;
}

map.on('click', 'graveyards-layer', async (e) => {
    const features = e.features[0];
    if (!features) return;

    const coordinates = features.geometry.coordinates[0][0];
    const properties = features.properties;

    const poem = generatePoem(); // Get a random poem
    new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<h3>${properties.name}</h3><p>${poem}</p>`)
        .addTo(map);
});

// Change cursor to pointer on hover
map.on('mouseenter', 'graveyards-layer', () => {
    map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', 'graveyards-layer', () => {
    map.getCanvas().style.cursor = '';
});