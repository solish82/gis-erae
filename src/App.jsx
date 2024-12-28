import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useRef } from "react";
import { Box, Card, CardContent, Grid2, Typography } from "@mui/material";
import { AccessTime, LocationOn, Thermostat, Air } from "@mui/icons-material";
import L from "leaflet";

function ClickEventHandler({ onClick }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      onClick(lat, lng);
    },
  });

  return null;
}

export default function Map() {
  const [clickedLocation, setClickedLocation] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [windSpeed, setWindSpeed] = useState(null);
  const abortControllerRef = useRef(null); // Reference to store the AbortController instance

  // Fetch data from the API for temperature and wind speed based on lat, long
  const fetchLocationData = async (lat, lng) => {
    // Abort the previous fetch request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController(); // Create a new AbortController
    abortControllerRef.current = controller;  // Store it in the ref

    try {
      const response = await fetch(`http://localhost:5000/location?lat=${lat.toFixed(2)}&long=${lng.toFixed(2)}`, {
        signal: controller.signal, // Pass the abort signal to the fetch request
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();

      // Parse the response data
      const tempInKelvin = data.temperature;
      const windSpeed = data.wind_speed;

      // Convert Kelvin to Celsius
      const tempInCelsius = tempInKelvin - 273.15;

      // Update state with parsed data
      setTemperature(tempInCelsius.toFixed(2)); // temperature in Celsius
      setWindSpeed(windSpeed.toFixed(2)); // wind speed in m/s
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error fetching location data:", error);
      }
    }
  };

  const handleMapClick = (lat, lng) => {
    setClickedLocation({ lat, lng });
    fetchLocationData(lat, lng);  // Fetch data on click
  };

  return (
    <>
      <MapContainer
        center={[35.675, 51.40]}
        zoom={10}
        maxZoom={20}
        minZoom={10}
        maxBounds={L.latLngBounds(L.latLng(35.47, 51.17), L.latLng(35.88, 51.63))}
        style={{ height: "100vh", width: "100vw" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
        />
        <ClickEventHandler onClick={handleMapClick} />
      </MapContainer>

      {clickedLocation && (
        <Box sx={{ position: "absolute", top: 20, right: 20, zIndex: 1000, maxWidth: 300 }}>
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Clicked Location
              </Typography>
              <Grid2 container spacing={1} alignItems="center" sx={{ marginTop: 1 }}>
                <Grid2>
                  <LocationOn sx={{ color: "primary.main" }} />
                </Grid2>
                <Grid2 xs>
                  <Typography variant="body2">Latitude: {clickedLocation.lat}</Typography>
                  <Typography variant="body2">Longitude: {clickedLocation.lng}</Typography>
                </Grid2>
              </Grid2>
              <Grid2 container spacing={1} alignItems="center" sx={{ marginTop: 2 }}>
                <Grid2>
                  <Thermostat sx={{ color: "primary.main" }} />
                </Grid2>
                <Grid2 xs>
                  <Typography variant="body2">
                    Temperature: {temperature ? `${temperature} °C` : "Loading..."}
                  </Typography>
                </Grid2>
              </Grid2>
              <Grid2 container spacing={1} alignItems="center" sx={{ marginTop: 2 }}>
                <Grid2>
                  <Air sx={{ color: "primary.main" }} />
                </Grid2>
                <Grid2 xs>
                  <Typography variant="body2">
                    Wind Speed: {windSpeed ? `${windSpeed} m/s` : "Loading..."}
                  </Typography>
                </Grid2>
              </Grid2>
            </CardContent>
          </Card>
        </Box>
      )}
    </>
  );
}
