const routeState = {
    endpoint: '/provinces',
    detailRoute: '',
};

const elements = {
    apiStatus: document.getElementById('apiStatus'),
    provinceCount: document.getElementById('provinceCount'),
    districtCount: document.getElementById('districtCount'),
    stationCount: document.getElementById('stationCount'),
    vehicleCount: document.getElementById('vehicleCount'),
    responseOutput: document.getElementById('responseOutput'),
    routeHint: document.getElementById('routeHint'),
    resourceId: document.getElementById('resourceId'),
    detailRoute: document.getElementById('detailRoute'),
    loadSelectionButton: document.getElementById('loadSelectionButton'),
    loadAllButton: document.getElementById('loadAllButton'),
    clearButton: document.getElementById('clearButton'),
    sampleVehiclesButton: document.getElementById('sampleVehiclesButton'),
    sampleLastPositionButton: document.getElementById('sampleLastPositionButton'),
    endpointButtons: Array.from(document.querySelectorAll('.endpoint-button')),
};

let seedData = null;

const formatJson = (value) => JSON.stringify(value, null, 2);

const showResponse = (value) => {
    elements.responseOutput.textContent = typeof value === 'string' ? value : formatJson(value);
};

const getLatestPingForVehicle = (vehicleId) => {
    const latestPing = seedData.pings
        .filter((ping) => ping.vehicle_id === vehicleId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null;

    return latestPing;
};

const toPingShape = (ping) => ({
    ping_id: ping.id,
    vehicle_id: ping.vehicle_id,
    timestamp: ping.timestamp,
    lat: ping.latitude,
    lng: ping.longitude,
    speed: 0,
});

const notFound = (message) => {
    const error = new Error(message);
    error.status = 404;
    throw error;
};

const ensureSeedData = async () => {
    if (seedData) {
        return seedData;
    }

    const response = await fetch('./WEB%20API/Web-API/seedTuk.json');
    if (!response.ok) {
        throw new Error('Could not load seed data for GitHub Pages mode.');
    }

    seedData = await response.json();
    return seedData;
};

const getById = (collection, id) => collection.find((item) => item.id === id);

const handleVirtualRoute = (url) => {
    const cleanUrl = url.split('?')[0];

    if (cleanUrl === '/api') {
        return { status: 'ok', session: 'NB6007CEM S2 (GitHub Pages static mode)' };
    }

    if (cleanUrl === '/provinces') {
        return seedData.provinces.map((p) => ({ province_id: p.id, name: p.name }));
    }

    const provinceMatch = cleanUrl.match(/^\/provinces\/(\d+)$/);
    if (provinceMatch) {
        const province = getById(seedData.provinces, Number(provinceMatch[1]));
        if (!province) {
            notFound('Province not found');
        }
        return { province_id: province.id, name: province.name };
    }

    if (cleanUrl === '/districts') {
        return seedData.districts.map((d) => ({ district_id: d.id, name: d.name, province_id: d.province_id }));
    }

    const districtMatch = cleanUrl.match(/^\/districts\/(\d+)$/);
    if (districtMatch) {
        const district = getById(seedData.districts, Number(districtMatch[1]));
        if (!district) {
            notFound('District not found');
        }
        return { district_id: district.id, name: district.name, province_id: district.province_id };
    }

    if (cleanUrl === '/stations') {
        return seedData.stations.map((s) => ({ station_id: s.id, name: s.name, district_id: s.district_id }));
    }

    const stationMatch = cleanUrl.match(/^\/stations\/(\d+)$/);
    if (stationMatch) {
        const station = getById(seedData.stations, Number(stationMatch[1]));
        if (!station) {
            notFound('Station not found');
        }
        return { station_id: station.id, name: station.name, district_id: station.district_id };
    }

    if (cleanUrl === '/vehicles') {
        return seedData.vehicles.map((v) => ({
            vehicle_id: v.id,
            reg_number: v.register_number,
            device_id: v.device_id,
            station_id: v.station_id,
        }));
    }

    const vehicleMatch = cleanUrl.match(/^\/vehicles\/(\d+)$/);
    if (vehicleMatch) {
        const vehicleId = Number(vehicleMatch[1]);
        const vehicle = getById(seedData.vehicles, vehicleId);
        if (!vehicle) {
            notFound('Vehicle not found');
        }

        const latestPing = getLatestPingForVehicle(vehicle.id);

        return {
            vehicle_id: vehicle.id,
            reg_number: vehicle.register_number,
            device_id: vehicle.device_id,
            station_id: vehicle.station_id,
            last_ping: latestPing ? toPingShape(latestPing) : null,
        };
    }

    const vehiclePingsMatch = cleanUrl.match(/^\/vehicles\/(\d+)\/pings$/);
    if (vehiclePingsMatch) {
        const vehicleId = Number(vehiclePingsMatch[1]);
        const vehicle = getById(seedData.vehicles, vehicleId);
        if (!vehicle) {
            notFound('Vehicle not found');
        }

        return seedData.pings
            .filter((p) => p.vehicle_id === vehicle.id)
            .map((p) => toPingShape(p));
    }

    const vehicleLastPositionMatch = cleanUrl.match(/^\/vehicles\/(\d+)\/last-position$/);
    if (vehicleLastPositionMatch) {
        const vehicleId = Number(vehicleLastPositionMatch[1]);
        const vehicle = getById(seedData.vehicles, vehicleId);
        if (!vehicle) {
            notFound('Vehicle not found');
        }

        const latestPing = getLatestPingForVehicle(vehicle.id);
        if (!latestPing) {
            notFound('No pings found for this vehicle');
        }

        return {
            vehicle_id: latestPing.vehicle_id,
            timestamp: latestPing.timestamp,
            lat: latestPing.latitude,
            lng: latestPing.longitude,
            speed: 0,
        };
    }

    notFound('Route not found');
};

const fetchJson = async (url) => {
    await ensureSeedData();

    try {
        return handleVirtualRoute(url);
    } catch (error) {
        throw new Error(error.message || 'Request failed');
    }
};

const buildUrl = () => {
    if (!routeState.detailRoute) {
        return routeState.endpoint;
    }

    const id = elements.resourceId.value.trim();

    if (!id) {
        throw new Error('Enter a resource ID for the selected detail route.');
    }

    return routeState.detailRoute.replace(':id', id);
};

const loadStats = async () => {
    const [provinces, districts, stations, vehicles] = await Promise.all([
        fetchJson('/provinces'),
        fetchJson('/districts'),
        fetchJson('/stations'),
        fetchJson('/vehicles'),
    ]);

    elements.provinceCount.textContent = provinces.length;
    elements.districtCount.textContent = districts.length;
    elements.stationCount.textContent = stations.length;
    elements.vehicleCount.textContent = vehicles.length;
};

const loadApiStatus = async () => {
    const status = await fetchJson('/api');
    elements.apiStatus.textContent = `${status.status.toUpperCase()} · static mode`;
};

const setRoute = (endpoint) => {
    routeState.endpoint = endpoint;
    routeState.detailRoute = '';
    elements.detailRoute.value = '';
    elements.routeHint.textContent = `Current route: ${endpoint}`;

    elements.endpointButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.endpoint === endpoint);
    });
};

const syncDetailHint = () => {
    const route = elements.detailRoute.value;
    routeState.detailRoute = route;
    elements.routeHint.textContent = route ? `Current route: ${route}` : `Current route: ${routeState.endpoint}`;
};

const loadSelection = async () => {
    const url = buildUrl();
    elements.routeHint.textContent = `Loading ${url} ...`;
    const payload = await fetchJson(url);
    showResponse(payload);
    elements.routeHint.textContent = `Current route: ${url}`;
};

const loadAllCollections = async () => {
    const payload = await Promise.all([
        fetchJson('/provinces'),
        fetchJson('/districts'),
        fetchJson('/stations'),
        fetchJson('/vehicles'),
    ]);

    showResponse({
        provinces: payload[0],
        districts: payload[1],
        stations: payload[2],
        vehicles: payload[3],
    });
};

const wireEndpointButtons = () => {
    elements.endpointButtons.forEach((button) => {
        button.addEventListener('click', async () => {
            setRoute(button.dataset.endpoint);
            try {
                const payload = await fetchJson(button.dataset.endpoint);
                showResponse(payload);
                elements.routeHint.textContent = `Current route: ${button.dataset.endpoint}`;
            } catch (error) {
                showResponse({ error: error.message });
            }
        });
    });
};

const wireControls = () => {
    elements.detailRoute.addEventListener('change', syncDetailHint);

    elements.loadSelectionButton.addEventListener('click', async () => {
        try {
            await loadSelection();
        } catch (error) {
            showResponse({ error: error.message });
            elements.routeHint.textContent = 'Fix the route selection and try again.';
        }
    });

    elements.loadAllButton.addEventListener('click', async () => {
        try {
            await loadAllCollections();
            elements.routeHint.textContent = 'Current route: all collections';
        } catch (error) {
            showResponse({ error: error.message });
        }
    });

    elements.clearButton.addEventListener('click', () => {
        elements.resourceId.value = '';
        elements.detailRoute.value = '';
        routeState.detailRoute = '';
        elements.routeHint.textContent = `Current route: ${routeState.endpoint}`;
        showResponse('Select an endpoint to begin.');
    });

    elements.sampleVehiclesButton.addEventListener('click', async () => {
        try {
            const vehicles = await fetchJson('/vehicles');
            showResponse(vehicles);
            setRoute('/vehicles');
        } catch (error) {
            showResponse({ error: error.message });
        }
    });

    elements.sampleLastPositionButton.addEventListener('click', async () => {
        try {
            const vehicles = await fetchJson('/vehicles');
            if (!vehicles.length) {
                throw new Error('No vehicles are available in the data set.');
            }

            elements.resourceId.value = vehicles[0].vehicle_id;
            elements.detailRoute.value = '/vehicles/:id/last-position';
            syncDetailHint();
            await loadSelection();
        } catch (error) {
            showResponse({ error: error.message });
        }
    });
};

const boot = async () => {
    wireEndpointButtons();
    wireControls();

    try {
        await Promise.all([loadApiStatus(), loadStats()]);
        const provinces = await fetchJson('/provinces');
        showResponse(provinces);
        elements.routeHint.textContent = 'Current route: /provinces';
    } catch (error) {
        elements.apiStatus.textContent = 'Static mode unavailable';
        showResponse({ error: error.message });
        elements.routeHint.textContent = 'Could not load the data set.';
    }
};

boot();
