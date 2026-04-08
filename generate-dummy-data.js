const XLSX = require('xlsx');

const manufacturers = [
  'Toyota', 'Honda', 'Bosch', 'Denso', 'NGK', 'Gates', 'Brembo',
  'Monroe', 'Sachs', 'Valeo', 'Delphi', 'ACDelco', 'Mahle', 'Mann'
];

const categories = {
  Engine: [
    ['Piston Ring Set', 'Set of 4 piston rings for standard bore'],
    ['Timing Belt', 'OEM-spec timing belt for DOHC engines'],
    ['Timing Chain Kit', 'Complete kit includes chain, guides, tensioner'],
    ['Valve Cover Gasket', 'Rubber valve cover gasket set'],
    ['Head Gasket Set', 'Full head gasket set with bolts'],
    ['Camshaft', 'Remanufactured performance camshaft'],
    ['Crankshaft Pulley', 'Harmonic balancer crankshaft pulley'],
    ['Oil Pump', 'High-volume oil pump assembly'],
    ['Water Pump', 'Cast iron impeller water pump'],
    ['Intake Manifold Gasket', 'Multi-layer steel intake manifold gasket'],
    ['Exhaust Manifold Gasket', 'Graphite exhaust manifold gasket'],
    ['Engine Mount', 'Hydraulic engine mount, front'],
    ['Spark Plug Set', 'Iridium spark plug set of 4'],
    ['Ignition Coil', 'Individual cylinder ignition coil'],
    ['Throttle Body', 'Electronic throttle body assembly'],
    ['Fuel Injector', 'High-pressure direct fuel injector'],
    ['PCV Valve', 'Positive crankcase ventilation valve'],
    ['EGR Valve', 'Exhaust gas recirculation valve'],
    ['Variable Valve Timing Solenoid', 'VVT oil control solenoid'],
    ['Crankshaft Position Sensor', 'Hall-effect crank position sensor'],
  ],
  Transmission: [
    ['Clutch Kit', 'Clutch disc, pressure plate and bearing set'],
    ['Flywheel', 'Single-mass forged steel flywheel'],
    ['Shift Fork', 'Precision machined gear shift fork'],
    ['Transmission Filter Kit', 'ATF filter with pan gasket'],
    ['Torque Converter', 'Remanufactured lock-up torque converter'],
    ['Driveshaft CV Axle', 'Complete CV axle shaft assembly'],
    ['CV Joint Boot Kit', 'Outer CV boot with clamps and grease'],
    ['Differential Seal', 'Front differential pinion seal'],
    ['Gear Shift Bushing', 'Linkage bushing kit for shifter'],
    ['Transmission Mount', 'Rear transmission support mount'],
  ],
  Electrical: [
    ['Alternator', 'Remanufactured 120A alternator'],
    ['Starter Motor', 'Remanufactured direct-drive starter'],
    ['Battery 55Ah', 'Maintenance-free lead acid battery 55Ah'],
    ['Battery 75Ah', 'AGM start-stop battery 75Ah'],
    ['Radiator Fan Motor', 'Electric cooling fan motor assembly'],
    ['Window Regulator Motor', 'Front left power window motor'],
    ['Headlight Assembly', 'LED projector headlight, driver side'],
    ['Tail Light Assembly', 'Full LED tail light, passenger side'],
    ['Horn', 'Dual-tone disc horn 400/500 Hz'],
    ['Fuse Box', 'Engine bay fuse/relay box assembly'],
    ['ABS Wheel Speed Sensor', 'Front right ABS wheel speed sensor'],
    ['MAP Sensor', 'Manifold absolute pressure sensor'],
    ['Oxygen Sensor', 'Upstream wideband O2 sensor'],
    ['Knock Sensor', 'Piezoelectric knock/detonation sensor'],
    ['Coolant Temperature Sensor', 'NTC coolant temp sensor'],
    ['Mass Air Flow Sensor', 'Hot-wire MAF sensor with housing'],
    ['TPMS Sensor', 'Tire pressure monitoring sensor 433MHz'],
    ['Blower Motor', 'HVAC blower motor with fan cage'],
    ['AC Compressor', 'Remanufactured AC compressor with clutch'],
    ['Wiper Motor', 'Front windshield wiper motor assembly'],
  ],
  Brakes: [
    ['Front Brake Pad Set', 'Ceramic compound front brake pads'],
    ['Rear Brake Pad Set', 'Semi-metallic rear brake pads'],
    ['Front Brake Rotor', 'Vented cross-drilled front rotor'],
    ['Rear Brake Rotor', 'Solid rear brake rotor'],
    ['Front Brake Caliper', 'Remanufactured front caliper with bracket'],
    ['Rear Brake Caliper', 'Remanufactured rear caliper, driver side'],
    ['Brake Master Cylinder', 'Tandem brake master cylinder'],
    ['Brake Booster', 'Vacuum brake power booster'],
    ['Brake Hose Front', 'Stainless braided front brake hose'],
    ['Brake Drum', 'Cast iron rear brake drum'],
    ['Wheel Cylinder', 'Rear drum wheel cylinder kit'],
    ['Parking Brake Cable', 'Rear left parking brake cable'],
    ['ABS Module', 'ABS hydraulic control module'],
    ['Brake Proportioning Valve', 'Rear brake proportioning valve'],
  ],
  Suspension: [
    ['Front Shock Absorber', 'Gas-charged front shock absorber'],
    ['Rear Shock Absorber', 'Twin-tube rear shock absorber'],
    ['Front Coil Spring', 'Progressive rate front coil spring'],
    ['Rear Coil Spring', 'Standard rate rear coil spring'],
    ['Control Arm Upper', 'Forged upper control arm with ball joint'],
    ['Control Arm Lower', 'Stamped lower control arm assembly'],
    ['Ball Joint Lower', 'Greaseable lower ball joint'],
    ['Tie Rod End Outer', 'Adjustable outer tie rod end'],
    ['Tie Rod End Inner', 'Inner tie rod rack end'],
    ['Stabilizer Bar Link', 'Front sway bar link kit'],
    ['Stabilizer Bar Bushing', 'Polyurethane front sway bar bushings'],
    ['Strut Mount', 'Upper strut bearing mount'],
    ['Steering Rack', 'Remanufactured power steering rack'],
    ['Power Steering Pump', 'Remanufactured hydraulic PS pump'],
    ['Wheel Hub Bearing', 'Front wheel hub and bearing assembly'],
  ],
  Cooling: [
    ['Radiator', 'Aluminum core 3-row radiator'],
    ['Coolant Reservoir', 'Overflow/recovery coolant tank'],
    ['Radiator Hose Upper', 'Moulded upper radiator hose'],
    ['Radiator Hose Lower', 'Moulded lower radiator hose'],
    ['Thermostat', 'OEM-spec 80°C wax thermostat'],
    ['Thermostat Housing', 'Aluminium thermostat housing with sensor'],
    ['Coolant Flush Kit', 'Complete flush and fill kit'],
    ['Fan Clutch', 'Thermal fan clutch assembly'],
    ['Intercooler', 'Bar-and-plate front mount intercooler'],
    ['Heater Core', 'Replacement aluminium heater core'],
  ],
  Filters: [
    ['Oil Filter', 'Spin-on full-flow oil filter'],
    ['Air Filter', 'Dry panel air filter'],
    ['Cabin Air Filter', 'Carbon activated cabin/pollen filter'],
    ['Fuel Filter', 'Inline high-pressure fuel filter'],
    ['Transmission Filter', 'Automatic transmission fluid filter'],
    ['PCV Filter', 'Crankcase breather filter element'],
    ['Hydraulic Filter', 'Power steering hydraulic filter'],
    ['Breather Filter Kit', 'Air/oil separator filter kit'],
  ],
  Body: [
    ['Front Bumper Cover', 'Unpainted front bumper fascia'],
    ['Rear Bumper Cover', 'Unpainted rear bumper fascia'],
    ['Hood Strut', 'Gas-charged hood support strut (pair)'],
    ['Door Mirror Assembly', 'Power-fold door mirror, driver'],
    ['Windshield Wiper Blade', 'Beam-type front wiper blade 24"'],
    ['Rear Wiper Blade', 'Rear window wiper blade 14"'],
    ['Fog Light', 'LED fog lamp assembly with bezel'],
    ['Side Marker Light', 'Amber side marker lamp'],
    ['Wheel Arch Liner', 'Front inner wheel arch liner'],
    ['Grille Assembly', 'Front upper grille with emblem'],
    ['Trunk Strut', 'Rear trunk lid gas strut (pair)'],
    ['Hood Latch', 'Primary hood release latch'],
    ['Door Handle Exterior', 'Chrome outer door handle'],
    ['Antenna Mast', 'Fixed OEM-style roof antenna'],
  ],
  Interior: [
    ['Steering Wheel', 'Leather-wrapped 3-spoke steering wheel'],
    ['Floor Mat Set', 'Custom-fit rubber floor mats (4pc)'],
    ['Seat Belt', 'Front 3-point retractable seat belt'],
    ['Gear Shift Knob', 'Leather gear shift knob'],
    ['Dashboard Trim Kit', 'Carbon fibre dash trim overlay set'],
    ['Sun Visor', 'Fabric sun visor with mirror'],
    ['Dome Light', 'Interior LED dome light assembly'],
    ['Window Switch', 'Front left master window switch'],
    ['HVAC Control Panel', 'Climate control panel assembly'],
    ['Rearview Mirror', 'Auto-dimming interior rearview mirror'],
  ],
  Other: [
    ['Jack Stand Pair', 'Heavy-duty 3-tonne jack stands (pair)'],
    ['Tow Hook', 'Front/rear removable tow hook'],
    ['Lug Nut Set', '20pc conical seat lug nuts M12x1.5'],
    ['Wheel Lock Set', 'Security wheel lock nuts with key'],
    ['Touch-Up Paint Pen', 'OEM colour matched touch-up paint pen'],
    ['Engine Flush', '300ml engine internal flush solution'],
    ['Brake Cleaner', '500ml non-chlorinated brake parts cleaner'],
    ['Thread Repair Kit', 'M10 x 1.25 helicoil thread repair kit'],
  ],
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randFloat(min, max, dec = 0) {
  const v = Math.random() * (max - min) + min;
  return parseFloat(v.toFixed(dec));
}

const rows = [];
let sku = 1001;

for (const [category, products] of Object.entries(categories)) {
  for (const [name, description] of products) {
    const mfg = randChoice(manufacturers);
    const mfgCode = `${mfg.substring(0, 3).toUpperCase()}-${randInt(10000, 99999)}`;
    const cost = randFloat(20000, 800000);
    const selling = parseFloat((cost * randFloat(1.25, 1.8, 2)).toFixed(0));
    const yearStart = randInt(2010, 2020);
    const yearEnd = yearStart + randInt(2, 8);

    rows.push({
      'SKU': `NT-${sku++}`,
      'Name': name,
      'Manufacturer': mfg,
      'Manufacturer Code': mfgCode,
      'Category': category,
      'Qty': randInt(0, 50),
      'Location': `${randChoice(['A','B','C','D','E'])}${randInt(1,20)}`,
      'Selling Price': selling,
      'Cost': cost,
      'Reorder Level': randInt(3, 10),
      'Reorder Qty': randInt(5, 20),
      'Model Year Start': yearStart,
      'Model Year End': yearEnd,
      'Description': description,
      'Discontinued': randInt(0, 10) === 0 ? 'TRUE' : 'FALSE',
    });
  }
}

// Pad to exactly 200
while (rows.length < 200) {
  const dup = { ...rows[rows.length % rows.length] };
  dup['SKU'] = `NT-${sku++}`;
  dup['Qty'] = randInt(0, 30);
  dup['Location'] = `${randChoice(['A','B','C','D','E'])}${randInt(1,20)}`;
  rows.push(dup);
}

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(rows.slice(0, 200));

// Set column widths
ws['!cols'] = [
  { wch: 10 }, { wch: 35 }, { wch: 12 }, { wch: 18 }, { wch: 14 },
  { wch: 6 },  { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
  { wch: 12 }, { wch: 17 }, { wch: 15 }, { wch: 45 }, { wch: 12 },
];

XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
XLSX.writeFile(wb, 'dummy-inventory.xlsx');
console.log(`Generated ${rows.slice(0, 200).length} products → dummy-inventory.xlsx`);
