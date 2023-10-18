package your.package.name;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import java.io.IOException;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class LocationForegroundService extends Service {

    private String deviceID;
    private LocationManager locationManager;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        deviceID = intent.getStringExtra("deviceID");

        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);

        // Request location updates
        try {
            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 10000, 10, locationListener);
        } catch (SecurityException e) {
            e.printStackTrace();
        }

        return START_STICKY;
    }

    private final LocationListener locationListener = new LocationListener() {
        public void onLocationChanged(Location location) {
            // Emit location to React Native side
            WritableMap map = Arguments.createMap();
            map.putDouble("latitude", location.getLatitude());
            map.putDouble("longitude", location.getLongitude());
            ForegroundServiceModule.emitDeviceEvent("locationUpdate", map);

            // Send location to the server
            sendLocationToServer(location);
        }

        public void onStatusChanged(String provider, int status, Bundle extras) {}
        public void onProviderEnabled(String provider) {}
        public void onProviderDisabled(String provider) {}
    };

    private void sendLocationToServer(Location location) {
        OkHttpClient client = new OkHttpClient();

        String jsonPayload = String.format(
            "{\"locationObj\": {\"lat\": %f, \"lng\": %f}}",
            location.getLatitude(),
            location.getLongitude()
        );

        RequestBody body = RequestBody.create(jsonPayload, okhttp3.MediaType.parse("application/json; charset=utf-8"));

        Request request = new Request.Builder()
            .url("https://miluim-server.onrender.com/locations/" + deviceID)
            .put(body)
            .build();

        try (Response response = client.newCall(request).execute()) {
            // Handle server response if needed
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();

        // Stop location updates to save battery
        if (locationManager != null) {
            try {
                locationManager.removeUpdates(locationListener);
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }
}
