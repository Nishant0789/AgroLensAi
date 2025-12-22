export type Scan = {
  id: string;
  imageUrl: string;
  imageHint: string;
  date: string;
  disease: string;
  confidence: number;
  solution: string;
  location: {
    lat: number;
    lng: number;
  };
};

export type Alert = {
  id: string;
  disease: string;
  location: string;
  distance: number;
  date: string;
};

export type WeatherData = {
  day: string;
  temp: number;
  icon: 'sun' | 'cloud' | 'rain' | 'snow' | 'wind' | 'cloud-sun';
  description: string;
};
