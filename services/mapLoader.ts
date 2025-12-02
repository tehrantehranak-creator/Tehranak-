let googleMapsPromise: Promise<any> | null = null;

export const loadGoogleMaps = (): Promise<any> => {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google && (window as any).google.maps) {
      resolve((window as any).google);
      return;
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      reject(new Error("API_KEY not set"));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve((window as any).google);
    };
    script.onerror = (err) => {
      reject(err);
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

// ... unused styles ...
export const darkMapStyles = [];