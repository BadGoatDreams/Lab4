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

    // Call findCemeteriesWithinRadius after geolocation
    findCemeteriesWithinRadius(userLocation, 'data/graveyard_memorials.geojson', 5)
        .then(cemeteries => {
            displayCemeteriesInMapbox(cemeteries);
        })
        .catch(error => {
            console.error("Error finding cemeteries:", error);
        });
});

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

function findCemeteriesWithinRadius(userLocation, geojsonPath, bufferRadiusMiles) {
    return fetch(geojsonPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(geojsonData => {
            const buffer = turf.buffer(turf.point(userLocation), bufferRadiusMiles, { units: 'miles' });
            const cemeteriesWithinBuffer = turf.pointsWithinPolygon(geojsonData, buffer);
            console.log('Cemeteries within', bufferRadiusMiles, 'miles:', cemeteriesWithinBuffer);
            return cemeteriesWithinBuffer;
        })
        .catch(error => {
            console.error('Error fetching or processing GeoJSON data:', error);
            throw error; // Or return empty feature collection
        });
}

async function generatePoem(prompt) {
    const apiKey = 'YOUR_GEMINI_API_KEY';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateText?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    const data = await response.json();

    if (!data || !data.candidates || data.candidates.length === 0) {
        console.error("Error: Invalid API response", data);
        return "Oops! No poem was generated.";
    }

    return data.candidates[0].content; // Adjust this based on the actual response format
}


map.on('click', 'graveyards-layer', async (e) => {
    const features = e.features[0];
    if (!features) return;

    const coordinates = features.geometry.coordinates[0][0]; // Adjust for multipolygon
    const properties = features.properties;

    const prompt = `Write a short, reflective poem about a graveyard named ${properties.name}.`;
    const poem = await generatePoem(prompt);

    new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<h3>${properties.name}</h3><p>${poem}</p>`) // Populate with poem
        .addTo(map);
});

// Change cursor to pointer on hover
map.on('mouseenter', 'graveyards-layer', () => {
    map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', 'graveyards-layer', () => {
    map.getCanvas().style.cursor = '';
});
