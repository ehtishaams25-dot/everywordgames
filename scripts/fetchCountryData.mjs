import fs from 'fs';

async function generateCountryData() {
  try {
    const coordsData = JSON.parse(fs.readFileSync('node_modules/country-json/src/country-by-geo-coordinates.json', 'utf-8'));
    const abbrevData = JSON.parse(fs.readFileSync('node_modules/country-json/src/country-by-abbreviation.json', 'utf-8'));
    
    console.log("Fetching flagcdn codes...");
    const flagRes = await fetch("https://flagcdn.com/en/codes.json");
    const flagData = await flagRes.json();

    const result = {};

    // Combine them
    const mapping = {};
    for (const item of coordsData) {
      const lat = (item.north + item.south) / 2;
      let lng = (item.east + item.west) / 2;
      // Handle the wrapping around 180/-180 longitude correctly
      if (item.west > 0 && item.east < 0) {
        lng = ((item.east + 360 + item.west) / 2) % 360;
        if (lng > 180) lng -= 360;
      }
      mapping[item.country] = { lat, lng };
    }
    for (const item of abbrevData) {
      if (mapping[item.country] && item.abbreviation) {
        mapping[item.country].code = item.abbreviation.toLowerCase();
      }
    }

    // Now populate result with all names we care about
    for (const [country, data] of Object.entries(mapping)) {
      if (data.code && !isNaN(data.lat)) {
        result[country.toLowerCase()] = data;
      }
    }

    // Add explicit overrides or mappings using flagcdn where possible
    Object.entries(flagData).forEach(([code, name]) => {
      const lowerName = name.toLowerCase();
      if (!result[lowerName]) {
        // try to find by code in mapping
        const match = Object.values(mapping).find(d => d.code === code);
        if (match && !isNaN(match.lat)) {
          result[lowerName] = match;
        }
      } else {
        // Also map to flagcdn code in case of mismatch
        result[lowerName].code = code;
      }
    });

    // Special cases for dataset.countries
    const datasetCountries = [
      "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
    ];

    const manualOverrides = {
      "czechia": { lat: 49.817492, lng: 15.472962, code: "cz" },
      "eswatini": { lat: -26.5225, lng: 31.4659, code: "sz" },
      "north macedonia": { lat: 41.6086, lng: 21.7453, code: "mk" },
      "timor-leste": { lat: -8.8742, lng: 125.7275, code: "tl" },
      "united states": { lat: 37.0902, lng: -95.7129, code: "us" },
      "united kingdom": { lat: 55.3781, lng: -3.4360, code: "gb" },
      "south korea": { lat: 35.9078, lng: 127.7669, code: "kr" },
      "north korea": { lat: 40.3399, lng: 127.5101, code: "kp" },
      "congo": { lat: -0.2280, lng: 15.8277, code: "cg" },
      "palestine": { lat: 31.9522, lng: 35.2332, code: "ps" },
      "taiwan": { lat: 23.6978, lng: 120.9605, code: "tw" },
      "vatican city": { lat: 41.9029, lng: 12.4534, code: "va" },
      "kosovo": { lat: 42.6026, lng: 20.9030, code: "xk" }
    };

    datasetCountries.forEach(c => {
      const lower = c.toLowerCase();
      if (manualOverrides[lower]) {
        result[lower] = manualOverrides[lower];
      }
      if (!result[lower]) {
        console.warn("Missing data for:", c);
      }
    });

    fs.writeFileSync('public/country-data.json', JSON.stringify(result, null, 2));
    console.log("Successfully wrote public/country-data.json with " + Object.keys(result).length + " entries.");
  } catch (err) {
    console.error("Error generating country data:", err);
  }
}

generateCountryData();
