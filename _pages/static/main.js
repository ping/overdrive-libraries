/*! Copyright(c) 2021 https://github.com/ping

This software is released under the Reciprocal Public License 1.5.
https://opensource.org/licenses/RPL-1.5

*/

(function () {

    var prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;

    var attribution = '&copy; <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a target="_blank" href="https://carto.com/attributions">CARTO</a>'

    var darkLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: attribution,
        subdomains: "abcd",
        maxZoom: 19,
        detectRetina: false
    });
    var lightLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: attribution,
        subdomains: "abcd",
        maxZoom: 19,
        detectRetina: false
    });

    var _iconCreateFunction = function (cluster) {
        var childCount = cluster.getChildCount();

        var c = ' marker-cluster-';
        if (childCount < 10) {
            c += 'small';
        } else if (childCount < 100) {
            c += 'medium';
        } else {
            c += 'large';
        }
        if (childCount >= 1000) {
            childCount = (childCount / 1000).toPrecision(2) + "k"
        }
        if (childCount >= 100000) {
            childCount = (childCount / 1000).toPrecision(3) + "k"
        }

        return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', className: 'marker-cluster' + c, iconSize: new L.Point(40, 40) });
    }

    var markersAll = L.markerClusterGroup({ iconCreateFunction: _iconCreateFunction });
    var markersLarge = L.markerClusterGroup({ iconCreateFunction: _iconCreateFunction });
    var markersMedium = L.markerClusterGroup({ iconCreateFunction: _iconCreateFunction });
    var markersSmall = L.markerClusterGroup({ iconCreateFunction: _iconCreateFunction });

    var map = L.map('map',
        {
            minZoom: 2,
            // maxZoom: 16,
            tap: false,     // ref https://github.com/Leaflet/Leaflet/issues/7255
            zoomControl: false
        })
        .on('load', function () {
            fetch('libraries_branches.geojson')
                .then(response => response.json())
                .then(data => {
                    var markerTemplate = document.getElementById('marker-template').innerHTML;
                    ['small', 'medium', 'large'].forEach(size => {
                        var sourceData = { 'type': 'FeatureCollection' };
                        if (size == 'all') {
                            sourceData = data;
                        } else {
                            sourceData['features'] = data['features'].filter(f => f['properties']['marker-size'] == size);
                        }
                        var iconColour = '#eeeeee';
                        var markerShape = 'circle';
                        switch (size) {
                            case 'large':
                                iconColour = '#f73bbf';
                                markerShape = 'circle';
                                break;
                            case 'medium':
                                iconColour = '#3bf1f7';
                                markerShape = 'penta';
                                break;
                            case 'small':
                                iconColour = '#f7f73b';
                                markerShape = 'square';
                                break;
                            default:
                                break;
                        }
                        var customMarker = L.ExtraMarkers.icon({
                            icon: 'fa-circle',
                            prefix: 'fa',
                            svg: true,
                            markerColor: iconColour,
                            shape: markerShape,
                            iconColor: '#33333366',
                            extraClasses: 'od-marker-icon-' + size,
                            className: 'od-marker-' + size
                        });
                        var geoJsonLayer = L.geoJson(sourceData, {
                            pointToLayer: function (feature, latlng) {
                                return L.marker(latlng, { icon: customMarker });
                            },
                            onEachFeature: function (feature, layer) {
                                var content = Mustache.render(
                                    markerTemplate,
                                    feature
                                );
                                layer.bindPopup(content);
                            }
                        });
                        markersAll.addLayer(geoJsonLayer);
                        switch (size) {
                            case 'large':
                                markersLarge.addLayer(geoJsonLayer);
                                break;
                            case 'medium':
                                markersMedium.addLayer(geoJsonLayer);
                                break;
                            case 'small':
                                markersSmall.addLayer(geoJsonLayer);
                                break;
                            default:
                                break;
                        }
                    });
                    map.addLayer(markersAll);
                    var overlays = {
                        '<i class="fa fa-building fa-lg lib-all" aria-hidden="true"></i>': markersAll,
                        '<i class="fa fa-building-o lib-small" aria-hidden="true"></i>': markersSmall,
                        '<i class="fa fa-building-o fa-lg lib-medium" aria-hidden="true"></i>': markersMedium,
                        '<i class="fa fa-building-o fa-2x lib-large" aria-hidden="true"></i>': markersLarge
                    }
                    L.control.layers(overlays, {}, { collapsed: false, position: 'topright' }).addTo(map);
                    document.getElementsByClassName('lib-all')[0].parentElement.title = "All libraries";
                    document.getElementsByClassName('lib-small')[0].parentElement.title = "Small libraries (collection<50k)";
                    document.getElementsByClassName('lib-medium')[0].parentElement.title = "Medium libraries (50k≤collection<100k)";
                    document.getElementsByClassName('lib-large')[0].parentElement.title = "Large libraries (collection≥100k)";

                });
        });

    // toggle themes
    var enableTheme = function () {
        const currentTheme = localStorage.getItem("theme");
        if ((currentTheme === null && prefersDarkScheme) || currentTheme === "dark") {
            // set theme to dark
            document.body.classList.add("dark-mode");
            map.removeLayer(lightLayer);
            map.addLayer(darkLayer);
        } else {
            document.body.classList.remove("dark-mode");
            map.removeLayer(darkLayer);
            map.addLayer(lightLayer);
        }
    };

    enableTheme();

    // theme toggle control
    L.Control.themeToggle = L.Control.extend({
        onAdd: function (map) {
            const link = L.DomUtil.create("a");
            link.id = "theme-toggle";
            link.title = "Toggle theme";
            link.classList.add("leaflet-bar");
            link.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 118a22 22 0 01-22-22V48a22 22 0 0144 0v48a22 22 0 01-22 22zM256 486a22 22 0 01-22-22v-48a22 22 0 0144 0v48a22 22 0 01-22 22zM369.14 164.86a22 22 0 01-15.56-37.55l33.94-33.94a22 22 0 0131.11 31.11l-33.94 33.94a21.93 21.93 0 01-15.55 6.44zM108.92 425.08a22 22 0 01-15.55-37.56l33.94-33.94a22 22 0 1131.11 31.11l-33.94 33.94a21.94 21.94 0 01-15.56 6.45zM464 278h-48a22 22 0 010-44h48a22 22 0 010 44zM96 278H48a22 22 0 010-44h48a22 22 0 010 44zM403.08 425.08a21.94 21.94 0 01-15.56-6.45l-33.94-33.94a22 22 0 0131.11-31.11l33.94 33.94a22 22 0 01-15.55 37.56zM142.86 164.86a21.89 21.89 0 01-15.55-6.44l-33.94-33.94a22 22 0 0131.11-31.11l33.94 33.94a22 22 0 01-15.56 37.55zM256 358a102 102 0 11102-102 102.12 102.12 0 01-102 102z"/></svg>';
            link.addEventListener("click", function () {
                let currentTheme = localStorage.getItem("theme");
                if ((currentTheme === null && prefersDarkScheme) || currentTheme === "dark") {
                    currentTheme = "light";
                } else {
                    currentTheme = "dark";
                }
                localStorage.setItem("theme", currentTheme);
                enableTheme();
            });
            return link;
        }
    });
    L.control.themeToggle = function (opts) { return new L.Control.themeToggle(opts); }
    L.control.themeToggle({ position: "topright" }).addTo(map);

    L.control.locate(
        { position: 'topleft', flyTo: false, keepCurrentZoomLevel: true, initialZoomLevel: 12 }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    var search = L.Control.geocoder({
        position: 'topleft',
        collapsed: false,
        placeholder: 'Search by Location',
        defaultMarkGeocode: false
    }).on('markgeocode', function (e) {
        map.fitBounds(e.geocode.bbox);
    }).addTo(map);
    L.DomEvent.addListener(search._input, 'focus', () => {
        search._input.placeholder = 'Press enter/return to search';
    });
    L.DomEvent.addListener(search._input, 'dblclick', () => {
        search._input.value = '';
    });
    L.DomEvent.addListener(search._input, 'blur', () => {
        search._input.placeholder = 'Search by Location';
        // clear out the "Nothing found" message when out of the input field
        L.DomUtil.removeClass(search._errorElement, 'leaflet-control-geocoder-error');
        // clear out search results when moving away
        L.DomUtil.addClass(search._alts, 'leaflet-control-geocoder-alternatives-minimized');
    });

    // footer
    L.Control.footer = L.Control.extend({
        onAdd: function (map) {
            const text = L.DomUtil.create("div");
            // text.classList.add("fadeIn");
            text.id = "footer";
            text.innerHTML = '<a href="https://github.com/ping/overdrive-libraries/blob/master/libraries.csv">'
                + '<i class="fa fa-github" aria-hidden="true"></i></a> '
                + "Not affiliated to, endorsed or certified by OverDrive. "
                + '<a target="_blank" href="https://www.overdrive.com/libraries">'
                + 'Find a library <i class="fa fa-external-link" aria-hidden="true"></i ></a >';
            return text;
        }
    });
    L.control.footer = function (opts) { return new L.Control.footer(opts); };
    L.control.footer({ position: "bottomleft" }).addTo(map);

    map.setView([23.56399, 0], 2);
    map.setMaxBounds([[82.76537263027352, 244.68750000000003], [-73.12494524712693, -244.68750000000003]]);

})();
