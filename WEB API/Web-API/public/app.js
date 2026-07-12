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

const STATUS_TEXT = {
    101: 'Switching Protocols',
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
};

const getStatusText = (statusCode) => STATUS_TEXT[statusCode] || 'Unknown Status';

const showResponse = (value) => {
    elements.responseOutput.textContent = typeof value === 'string' ? value : formatJson(value);
};

const toErrorPayload = (error) => ({
    status: error.status || 500,
    status_text: getStatusText(error.status || 500),
    error: error.message || 'Request failed',
});

const buildUrl = () => {
    if (!routeState.detailRoute) {
        return routeState.endpoint;
    }

    const id = elements.resourceId.value.trim();

    if (!id) {
        const error = new Error('Enter a resource ID for the selected detail route.');
        error.status = 400;
        throw error;
    }

    return routeState.detailRoute.replace(':id', id);
};

const fetchJson = async (url) => {
    const response = await fetch(url);
    const payload = await response.json();

    if (!response.ok) {
        const error = new Error(payload.error || `Request failed with status ${response.status}`);
        error.status = payload.status || response.status;
        error.statusText = payload.status_text || getStatusText(error.status);
        throw error;
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
                showResponse(toErrorPayload(error));
                elements.routeHint.textContent = `Request failed (${error.status || 500})`;
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
            showResponse(toErrorPayload(error));
            elements.routeHint.textContent = `Request failed (${error.status || 500})`;
        }
    });

    elements.loadAllButton.addEventListener('click', async () => {
        try {
            await loadAllCollections();
            elements.routeHint.textContent = 'Current route: all collections';
        } catch (error) {
            showResponse(toErrorPayload(error));
            elements.routeHint.textContent = `Request failed (${error.status || 500})`;
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
            showResponse(toErrorPayload(error));
            elements.routeHint.textContent = `Request failed (${error.status || 500})`;
        }
    });

    elements.sampleLastPositionButton.addEventListener('click', async () => {
        try {
            const vehicles = await fetchJson('/vehicles');
            if (!vehicles.length) {
                const error = new Error('No vehicles are available in the data set.');
                error.status = 404;
                throw error;
            }

            elements.resourceId.value = vehicles[0].vehicle_id;
            elements.detailRoute.value = '/vehicles/:id/last-position';
            syncDetailHint();
            await loadSelection();
        } catch (error) {
            showResponse(toErrorPayload(error));
            elements.routeHint.textContent = `Request failed (${error.status || 500})`;
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
        showResponse(toErrorPayload(error));
        elements.routeHint.textContent = 'Check whether the server is running.';
    }
};

boot();