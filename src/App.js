import React, { useState, useCallback, useRef } from 'react';
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import { formatRelative } from 'date-fns';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from '@reach/combobox';
import '@reach/combobox/styles.css';
import mapStyles from './mapStyles';
// Components
import CameraIcon from './components/CameraIcon/index';

const libraries = ['places'];

const mapContainerStyle = {
  width: '100vw',
  height: '100vh',
};

// Buenos Aires
const center = {
  lat: -34.61315,
  lng: -58.37723,
};

const options = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true,
};

const App = () => {
  const { isLoaded, loadError } = useLoadScript({
    /* Google API Key must be enabled for Maps and Places API */
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const [markers, setMarkers] = useState([]);
  const [selected, setSelected] = useState(null);

  const handleMapClick = useCallback((e) => {
    setMarkers((current) => [
      ...current,
      {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
        time: new Date(),
      },
    ]);
  }, []);

  const mapRef = useRef();
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const panTo = useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(14);
  }, []);

  if (loadError) return 'Error loading map.';

  if (!isLoaded) return 'Loading map...';

  return (
    <div>
      <div className="relative flex justify-center w-full">
        <h1 className="absolute z-10 top-0 left-0 p-0 m-0 mt-4 ml-4 text-2xl">
          Film Here <CameraIcon />
        </h1>

        <Search panTo={panTo} />

        <Locate panTo={panTo} />
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={10}
        center={center}
        options={options}
        onClick={handleMapClick}
        onLoad={onMapLoad}>
        {markers.map((marker) => (
          <Marker
            key={marker.time.toISOString()}
            position={{ lat: marker.lat, lng: marker.lng }}
            icon={{
              url: '/clapper.svg',
              scaledSize: new window.google.maps.Size(30, 30),
              origin: new window.google.maps.Point(0, 0),
              anchor: new window.google.maps.Point(15, 15),
            }}
            onClick={() => {
              setSelected(marker);
            }}
          />
        ))}

        {selected ? (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => {
              setSelected(null);
            }}>
            <div>
              <h2>Hi Peeps</h2>
              <p>This is a good place to shoot!</p>
              <p>
                Verified last{' '}
                {formatRelative(selected.time, new Date())}
              </p>
            </div>
          </InfoWindow>
        ) : null}
      </GoogleMap>
    </div>
  );
};

const Search = ({ panTo }) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => -34.61315, lng: () => -58.37723 },
      radius: 200 * 1000,
    },
  });
  return (
    <div className="absolute leading-loose z-10 top-0 p-0 mt-4 w-1/3 text-xl">
      <Combobox
        onSelect={async (address) => {
          setValue(address, false);
          clearSuggestions();

          try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);
            panTo({ lat, lng });
          } catch (error) {
            console.log('error!');
          }
        }}>
        <ComboboxInput
          className="w-full px-2"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready}
          placeholder="Enter an address..."
        />
        <ComboboxPopover>
          <ComboboxList>
            {status === 'OK' &&
              data.map(({ id, description }) => (
                <ComboboxOption
                  key={'address-' + id}
                  value={description}
                />
              ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  );
};

const Locate = ({ panTo }) => {
  const handleLocateClick = () => {
    const onLocationSuccess = (position) => {
      panTo({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        onLocationSuccess,
        () => {},
        options
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };
  return (
    <button
      className="absolute z-10 top-0 right-0 p-0 m-0 mt-4 mr-4 w-12 h-12"
      onClick={handleLocateClick}>
      <img src="compass.svg" alt="compass - Locate me" />
    </button>
  );
};

export default App;
