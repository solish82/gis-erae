import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useRef, useEffect } from "react";
import { Box, Card, CardContent, CircularProgress, FormControl, Grid2, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { AccessTime, LocationOn, Thermostat, Air, ArrowUpward } from "@mui/icons-material";
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
  const [windDirection, setWindDirection] = useState(null); // New state for wind direction
  const [loading, setLoading] = useState(false); // Loading state for the API
  const [selectedTimestamp, setSelectedTimestamp] = useState(new Date('Sun, 22 Dec 2024 00:00:00 GMT'));

  const generateTimestamps = () => {
    const timestamps = [];
    const date = new Date('Sun, 22 Dec 2024 00:00:00 GMT');

    for (let i = 0; i < 24; i++) {
      const time = new Date(date.getTime() + i * 60 * 60 * 1000);
      timestamps.push(time.toUTCString());
    }

    return timestamps;
  };

  const timestamps = generateTimestamps();

  useEffect(() => {
    setSelectedTimestamp(timestamps[0]);
  }, []);

  const abortControllerRef = useRef(null);

  const fetchLocationData = async (lat, lng) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true); // Start loading
    try {
      const response = await fetch(`http://localhost:5000/location?lat=${lat.toFixed(2)}&long=${lng.toFixed(2)}&timestamp=${selectedTimestamp}`, {
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();

      const tempInKelvin = data.temperature;
      const windSpeed = data.wind_speed;
      const windDirection = data.wind_direction; // Get wind direction from API

      setTemperature((tempInKelvin - 273.15).toFixed(2));
      setWindSpeed(windSpeed.toFixed(2));
      setWindDirection(windDirection.toFixed(0)); // Store wind direction
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error fetching location data:", error);
      }
    } finally {
      setLoading(false); // End loading
    }
  };

  const handleMapClick = (lat, lng) => {
    setClickedLocation({ lat, lng });
    fetchLocationData(lat, lng);
  };

  const handleTimestampChange = (event) => {
    setSelectedTimestamp(event.target.value);
  };

  return (
    <>
      <MapContainer
        center={[35.675, 51.40]}
        zoom={5}
        maxZoom={20}
        minZoom={5}
        maxBounds={L.latLngBounds(L.latLng(25.00, 44.00), L.latLng(39.00, 61.00))}
        style={{ height: "100vh", width: "100vw" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
        />
        <ClickEventHandler onClick={handleMapClick} />
      </MapContainer>

      {clickedLocation && (
        <Box sx={{ position: "absolute", top: 100, right: 20, zIndex: 1000, maxWidth: 300, minWidth: 275 }}>
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
                    Temperature: {loading ? <CircularProgress size={14} /> : `${temperature} °C`}
                  </Typography>
                </Grid2>
              </Grid2>
              <Grid2 container spacing={1} alignItems="center" sx={{ marginTop: 2 }}>
                <Grid2>
                  <Air sx={{ color: "primary.main" }} />
                </Grid2>
                <Grid2 xs>
                  <Typography variant="body2">
                    Wind Speed: {loading ? <CircularProgress size={14} /> : `${windSpeed} m/s`}
                  </Typography>
                </Grid2>
              </Grid2>
              <Grid2 container spacing={1} alignItems="center" sx={{ marginTop: 2 }}>
                <Grid2>
                  <ArrowUpward
                    sx={{
                      color: "primary.main",
                      transform: `rotate(${windDirection}deg)`, // Rotate based on wind direction
                      transition: "transform 0.3s ease",
                    }}
                  />
                </Grid2>
                <Grid2 xs>
                  <Typography variant="body2">
                    Wind Direction: {loading ? <CircularProgress size={14} /> : `${windDirection}°`}
                  </Typography>
                </Grid2>
              </Grid2>
            </CardContent>
          </Card>
        </Box>
      )}

      <FormControl sx={{ position: "absolute", top: 20, right: 20, zIndex: 1000, maxWidth: 300, minWidth: 275, marginTop: 2, bgcolor: 'white' }}>
        <InputLabel>Time</InputLabel>
        <Select value={selectedTimestamp} onChange={handleTimestampChange} label="Timestamp">
          {timestamps.map((timestamp, index) => (
            <MenuItem key={index} value={timestamp}>
              {timestamp.substring(timestamp.indexOf(":") - 2, timestamp.indexOf(":"))}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
}
