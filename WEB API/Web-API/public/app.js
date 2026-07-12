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

const formatJson = (value) => JSON.stringify(value, null, 2);

const showResponse = (value) => {
    elements.responseOutput.textContent = typeof value === 'string' ? value : formatJson(value);
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

const fetchJson = async (url) => {
    const response = await fetch(url);
    const payload = await response.json();

    if (!response.ok) {
        throw new Error(payload.error || `Request failed with status ${response.status}`);
    }

    return payload;
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
    elements.apiStatus.textContent = `${status.status.toUpperCase()} · ${status.session}`;
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
        elements.apiStatus.textContent = 'API unavailable';
        showResponse({ error: error.message });
        elements.routeHint.textContent = 'Check whether the server is running.';
    }
};

boot();