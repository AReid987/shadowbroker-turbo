import { NextResponse } from "next/server";

const cameras = [
  { id: "cam_001", url: "https://images-webcams.windy.com/01/1462048754/current/full/1462048754.jpg", country_code: "US", country: "United States", city: "New York", type: "outdoor", label: "Manhattan Skyline" },
  { id: "cam_002", url: "https://images-webcams.windy.com/01/1462048755/current/full/1462048755.jpg", country_code: "GB", country: "United Kingdom", city: "London", type: "outdoor", label: "London Eye" },
  { id: "cam_003", url: "https://images-webcams.windy.com/01/1462048756/current/full/1462048756.jpg", country_code: "FR", country: "France", city: "Paris", type: "outdoor", label: "Eiffel Tower" },
  { id: "cam_004", url: "https://images-webcams.windy.com/01/1462048757/current/full/1462048757.jpg", country_code: "JP", country: "Japan", city: "Tokyo", type: "outdoor", label: "Shibuya Crossing" },
  { id: "cam_005", url: "https://images-webcams.windy.com/01/1462048758/current/full/1462048758.jpg", country_code: "AU", country: "Australia", city: "Sydney", type: "beach", label: "Bondi Beach" },
  { id: "cam_006", url: "https://images-webcams.windy.com/01/1462048759/current/full/1462048759.jpg", country_code: "DE", country: "Germany", city: "Berlin", type: "outdoor", label: "Brandenburg Gate" },
  { id: "cam_007", url: "https://images-webcams.windy.com/01/1462048760/current/full/1462048760.jpg", country_code: "IT", country: "Italy", city: "Rome", type: "outdoor", label: "Colosseum" },
  { id: "cam_008", url: "https://images-webcams.windy.com/01/1462048761/current/full/1462048761.jpg", country_code: "ES", country: "Spain", city: "Barcelona", type: "beach", label: "Barceloneta Beach" },
  { id: "cam_009", url: "https://images-webcams.windy.com/01/1462048762/current/full/1462048762.jpg", country_code: "BR", country: "Brazil", city: "Rio de Janeiro", type: "beach", label: "Copacabana" },
  { id: "cam_010", url: "https://images-webcams.windy.com/01/1462048763/current/full/1462048763.jpg", country_code: "CA", country: "Canada", city: "Vancouver", type: "outdoor", label: "Stanley Park" },
  { id: "cam_011", url: "https://images-webcams.windy.com/01/1462048764/current/full/1462048764.jpg", country_code: "NL", country: "Netherlands", city: "Amsterdam", type: "outdoor", label: "Dam Square" },
  { id: "cam_012", url: "https://images-webcams.windy.com/01/1462048765/current/full/1462048765.jpg", country_code: "CH", country: "Switzerland", city: "Zurich", type: "outdoor", label: "Lake Zurich" },
  { id: "cam_013", url: "https://images-webcams.windy.com/01/1462048766/current/full/1462048766.jpg", country_code: "SE", country: "Sweden", city: "Stockholm", type: "outdoor", label: "Gamla Stan" },
  { id: "cam_014", url: "https://images-webcams.windy.com/01/1462048767/current/full/1462048767.jpg", country_code: "NO", country: "Norway", city: "Oslo", type: "outdoor", label: "Oslo Fjord" },
  { id: "cam_015", url: "https://images-webcams.windy.com/01/1462048768/current/full/1462048768.jpg", country_code: "DK", country: "Denmark", city: "Copenhagen", type: "outdoor", label: "Nyhavn" },
  { id: "cam_016", url: "https://images-webcams.windy.com/01/1462048769/current/full/1462048769.jpg", country_code: "FI", country: "Finland", city: "Helsinki", type: "outdoor", label: "Helsinki Cathedral" },
  { id: "cam_017", url: "https://images-webcams.windy.com/01/1462048770/current/full/1462048770.jpg", country_code: "RU", country: "Russia", city: "Moscow", type: "outdoor", label: "Red Square" },
  { id: "cam_018", url: "https://images-webcams.windy.com/01/1462048771/current/full/1462048771.jpg", country_code: "CN", country: "China", city: "Shanghai", type: "outdoor", label: "The Bund" },
  { id: "cam_019", url: "https://images-webcams.windy.com/01/1462048772/current/full/1462048772.jpg", country_code: "IN", country: "India", city: "Mumbai", type: "outdoor", label: "Marine Drive" },
  { id: "cam_020", url: "https://images-webcams.windy.com/01/1462048773/current/full/1462048773.jpg", country_code: "ZA", country: "South Africa", city: "Cape Town", type: "beach", label: "Camps Bay" },
  { id: "cam_021", url: "https://images-webcams.windy.com/01/1462048774/current/full/1462048774.jpg", country_code: "EG", country: "Egypt", city: "Cairo", type: "outdoor", label: "Pyramids of Giza" },
  { id: "cam_022", url: "https://images-webcams.windy.com/01/1462048775/current/full/1462048775.jpg", country_code: "AE", country: "United Arab Emirates", city: "Dubai", type: "outdoor", label: "Burj Khalifa" },
  { id: "cam_023", url: "https://images-webcams.windy.com/01/1462048776/current/full/1462048776.jpg", country_code: "SG", country: "Singapore", city: "Singapore", type: "outdoor", label: "Marina Bay" },
  { id: "cam_024", url: "https://images-webcams.windy.com/01/1462048777/current/full/1462048777.jpg", country_code: "TH", country: "Thailand", city: "Bangkok", type: "outdoor", label: "Khao San Road" },
  { id: "cam_025", url: "https://images-webcams.windy.com/01/1462048778/current/full/1462048778.jpg", country_code: "KR", country: "South Korea", city: "Seoul", type: "outdoor", label: "Gangnam District" },
  { id: "cam_026", url: "https://images-webcams.windy.com/01/1462048779/current/full/1462048779.jpg", country_code: "MX", country: "Mexico", city: "Mexico City", type: "outdoor", label: "Zocalo" },
  { id: "cam_027", url: "https://images-webcams.windy.com/01/1462048780/current/full/1462048780.jpg", country_code: "AR", country: "Argentina", city: "Buenos Aires", type: "outdoor", label: "Obelisco" },
  { id: "cam_028", url: "https://images-webcams.windy.com/01/1462048781/current/full/1462048781.jpg", country_code: "TR", country: "Turkey", city: "Istanbul", type: "outdoor", label: "Taksim Square" },
  { id: "cam_029", url: "https://images-webcams.windy.com/01/1462048782/current/full/1462048782.jpg", country_code: "GR", country: "Greece", city: "Athens", type: "outdoor", label: "Acropolis" },
  { id: "cam_030", url: "https://images-webcams.windy.com/01/1462048783/current/full/1462048783.jpg", country_code: "PT", country: "Portugal", city: "Lisbon", type: "outdoor", label: "Belem Tower" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  let result = cameras.map((c) => ({ ...c, status: "live", timestamp: new Date().toISOString() }));
  if (country) {
    result = result.filter((c) => c.country_code === country || c.country === country);
  }
  result = result.slice(0, Math.min(limit, 100));

  return NextResponse.json({ cameras: result, total: result.length, timestamp: new Date().toISOString() });
}
