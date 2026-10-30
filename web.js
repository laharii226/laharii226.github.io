// --- Application State ---
const state = {
  profile: 'c-channel',
  dims: { h: 150, b: 75, tf: 8, tw: 6, r: 50 }, // Dimensions in mm
  mat: { E: 200, G: 77, yield: 250 },
  load: { L: 2.0, V: 15, e: 0 },
  animateDeform: false
};

// --- Calculations Engine ---
function computeMechanics() {
  const { h, b, tf, tw, r } = state.dims;
  const { E, G } = state.mat;
  const { L, V, e } = state.load;

  let Ix = 1, J = 1, e_sc = 0;

  if (state.profile === 'c-channel') {
    // C-Channel Shear Center Approximation: e_sc = (3 * b^2 * tf) / (h * tw + 6 * b * tf)
    const h_c = h - tf;
    e_sc = (3 * Math.pow(b, 2) * tf) / (h_c * tw + 6 * b * tf);
    Ix = (tw * Math.pow(h_c, 3)) / 12 + 2 * ((b * Math.pow(tf, 3)) / 12 + b * tf * Math.pow(h_c / 2, 2));
    J = (2 * b * Math.pow(tf, 3) + h * Math.pow(tw, 3)) / 3;
  } else if (state.profile === 'hollow-rect') {
    e_sc = 0; // Double symmetric
    const b_i = b - 2 * tw;
    const h_i = h - 2 * tf;
    Ix = (b * Math.pow(h, 3) - b_i * Math.pow(h_i, 3)) / 12;
    const Am = (b - tw) * (h - tf);
    const ds = (2 * (b - tw) / tf) + (2 * (h - tf) / tw);
    J = (4 * Math.pow(Am, 2)) / ds;
  } else if (state.profile === 'pipe') {
    e_sc = 0;
    const r_i = r - tw;
    Ix = (Math.PI / 4) * (Math.pow(r, 4) - Math.pow(r_i, 4));
    J = (Math.PI / 2) * (Math.pow(r, 4) - Math.pow(r_i, 4));
  } else if (state.profile === 'i-beam') {
    e_sc = 0;
    const h_c = h - tf;
    Ix = (tw * Math.pow(h_c, 3)) / 12 + 2 * ((b * Math.pow(tf, 3)) / 12 + b * tf * Math.pow(h_c / 2, 2));
    J = (2 * b * Math.pow(tf, 3) + h * Math.pow(tw, 3)) / 3;
  }

  // Torque due to eccentricity relative to shear center
  // e is load offset from web centerline; net eccentricity = (e - e_sc)
  const netEccentricity = (e - e_sc) / 1000; // meters
  const Torque = V * 1000 * Math.abs(netEccentricity); // N*m

  // Twist angle at free end (rad)
  const G_pa = G * 1e9;
  const twistRad = (Torque * L) / (G_pa * (J * 1e-12));
  const twistDeg = twistRad * (180 / Math.PI);

  // Maximum Bending Moment (Fixed End)
  const maxM = V * L; // kN*m

  // Stress calculation (MPa)
  const maxBendingStress = ((maxM * 1000) * ((h / 2) / 1000)) / (Ix * 1e-12) / 1e6;
  const maxShearStress = (Torque * ((b / 2) / 1000)) / (J * 1e-12) / 1e6;
  const vonMises = Math.sqrt(Math.pow(maxBendingStress, 2) + 3 * Math.pow(maxShearStress, 2));

  const fos = state.mat.yield / (vonMises || 1);

  return { e_sc, twistDeg, maxM, vonMises, fos, Ix, J };
}

// --- DOM Interface & Control Updates ---
function buildDynamicInputs() {
  const container = document.getElementById('dimControls');
  container.innerHTML = '';

  const addInput = (id, label, val) => {
    container.innerHTML += `
      <div class="form-group">
        <label for="${id}">${label}</label>
        <input type="number" id="${id}" class="form-control dim-input" value="${val}" step="1">
      </div>`;
  };

  if (state.profile === 'c-channel' || state.profile === 'i-beam') {
    addInput('dimH', 'Height h (mm)', state.dims.h);
    addInput('dimB', 'Width b (mm)', state.dims.b);
    addInput('dimTf', 'Flange tf (mm)', state.dims.tf);
    addInput('dimTw', 'Web tw (mm)', state.dims.tw);
  } else if (state.profile === 'hollow-rect') {
    addInput('dimH', 'Height h (mm)', state.dims.h);
    addInput('dimB', 'Width b (mm)', state.dims.b);
    addInput('dimTf', 'Top/Bot t (mm)', state.dims.tf);
    addInput('dimTw', 'Side t (mm)', state.dims.tw);
  } else if (state.profile === 'pipe') {
    addInput('dimR', 'Outer Rad R (mm)', state.dims.r);
    addInput('dimTw', 'Thickness t (mm)', state.dims.tw);
  }

  document.querySelectorAll('.dim-input').forEach(input => {
    input.addEventListener('input', readInputs);
  });
}

function readInputs() {
  state.profile = document.getElementById('profileType').value;
  
  if (document.getElementById('dimH')) state.dims.h = parseFloat(document.getElementById('dimH').value) || 100;
  if (document.getElementById('dimB')) state.dims.b = parseFloat(document.getElementById('dimB').value) || 50;
  if (document.getElementById('dimTf')) state.dims.tf = parseFloat(document.getElementById('dimTf').value) || 6;
  if (document.getElementById('dimTw')) state.dims.tw = parseFloat(document.getElementById('dimTw').value) || 4;
  if (document.getElementById('dimR')) state.dims.r = parseFloat(document.getElementById('dimR').value) || 40;

  state.mat.E = parseFloat(document.getElementById('youngsMod').value) || 200;
  state.mat.G = parseFloat(document.getElementById('shearMod').value) || 77;
  state.mat.yield = parseFloat(document.getElementById('yieldStrength').value) || 250;

  state.load.L = parseFloat(document.getElementById('beamLength').value) || 2.0;
  state.load.V = parseFloat(document.getElementById('shearForce').value) || 10;
  state.load.e = parseFloat(document.getElementById('loadEccentricity').value) || 0;

  document.getElementById('eccentricityVal').innerText = `${state.load.e} mm`;

  updateApp();
}

function updateApp() {
  const results = computeMechanics();

  document.getElementById('resShearCenter').innerText = `${results.e_sc.toFixed(1)} mm`;
  document.getElementById('resTwistAngle').innerText = `${results.twistDeg.toFixed(3)}°`;
  document.getElementById('resBendingMoment').innerText = `${results.maxM.toFixed(2)} kNm`;
  document.getElementById('resVonMises').innerText = `${results.vonMises.toFixed(1)} MPa`;
  document.getElementById('legendMaxStress').innerText = `${results.vonMises.toFixed(1)} MPa`;
  
  const fosElem = document.getElementById('resFOS');
  fosElem.innerText = `FoS: ${results.fos.toFixed(2)}`;
  fosElem.style.color = results.fos < 1.0 ? 'var(--accent-rose)' : 'var(--text-muted)';

  render3DBeam(results.vonMises);
  updateCharts(results.maxM, results.twistDeg);
}

// --- Chart.js Setup ---
let bmdChart, twistChart;

function initCharts() {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
    }
  };

  const ctx1 = document.getElementById('bmdChart').getContext('2d');
  bmdChart = new Chart(ctx1, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Moment (kNm)', data: [], borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', fill: true, tension: 0.2 }] },
    options: chartOptions
  });

  const ctx2 = document.getElementById('twistChart').getContext('2d');
  twistChart = new Chart(ctx2, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Twist (°)', data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', fill: true, tension: 0.2 }] },
    options: chartOptions
  });
}

function updateCharts(maxM, maxTwist) {
  const steps = 10;
  const labels = [];
  const bmdData = [];
  const twistData = [];

  for (let i = 0; i <= steps; i++) {
    const x = (state.load.L * (i / steps)).toFixed(1);
    labels.push(`${x}m`);
    bmdData.push((maxM * (1 - i / steps)).toFixed(2));
    twistData.push((maxTwist * (i / steps)).toFixed(3));
  }

  bmdChart.data.labels = labels;
  bmdChart.data.datasets[0].data = bmdData;
  bmdChart.update();

  twistChart.data.labels = labels;
  twistChart.data.datasets[0].data = twistData;
  twistChart.update();
}

// --- Three.js 3D Viewport Setup ---
let scene, camera, renderer, controls, beamMesh;

function init3D() {
  const container = document.getElementById('threeCanvas');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1120);

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(2.5, 1.5, 3);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  const gridHelper = new THREE.GridHelper(10, 20, 0x334155, 0x1e293b);
  gridHelper.position.y = -0.8;
  scene.add(gridHelper);

  window.addEventListener('resize', onWindowResize);
  animate();
}

function createSectionShape() {
  const shape = new THREE.Shape();
  const { h, b, tf, tw, r } = state.dims;
  const scale = 0.003; // Scale mm to 3D world units

  const H = h * scale;
  const B = b * scale;
  const TF = tf * scale;
  const TW = tw * scale;
  const R = r * scale;

  if (state.profile === 'c-channel') {
    shape.moveTo(0, -H/2);
    shape.lineTo(B, -H/2);
    shape.lineTo(B, -H/2 + TF);
    shape.lineTo(TW, -H/2 + TF);
    shape.lineTo(TW, H/2 - TF);
    shape.lineTo(B, H/2 - TF);
    shape.lineTo(B, H/2);
    shape.lineTo(0, H/2);
  } else if (state.profile === 'hollow-rect') {
    shape.moveTo(-B/2, -H/2);
    shape.lineTo(B/2, -H/2);
    shape.lineTo(B/2, H/2);
    shape.lineTo(-B/2, H/2);

    const hole = new THREE.Path();
    hole.moveTo(-B/2 + TW, -H/2 + TF);
    hole.lineTo(-B/2 + TW, H/2 - TF);
    hole.lineTo(B/2 - TW, H/2 - TF);
    hole.lineTo(B/2 - TW, -H/2 + TF);
    shape.holes.push(hole);
  } else if (state.profile === 'pipe') {
    shape.absarc(0, 0, R, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, Math.max(0.001, R - TW), 0, Math.PI * 2, true);
    shape.holes.push(hole);
  } else { // I-beam
    shape.moveTo(-B/2, H/2);
    shape.lineTo(B/2, H/2);
    shape.lineTo(B/2, H/2 - TF);
    shape.lineTo(TW/2, H/2 - TF);
    shape.lineTo(TW/2, -H/2 + TF);
    shape.lineTo(B/2, -H/2 + TF);
    shape.lineTo(B/2, -H/2);
    shape.lineTo(-B/2, -H/2);
    shape.lineTo(-B/2, -H/2 + TF);
    shape.lineTo(-TW/2, -H/2 + TF);
    shape.lineTo(-TW/2, H/2 - TF);
    shape.lineTo(-B/2, H/2 - TF);
  }

  return shape;
}

function render3DBeam(maxStress) {
  if (beamMesh) scene.remove(beamMesh);

  const shape = createSectionShape();
  const extrudeSettings = {
    steps: 30,
    depth: state.load.L,
    bevelEnabled: false
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();

  // Apply von Mises stress-based vertex colors along beam length (Z-axis)
  const count = geometry.attributes.position.count;
  const colors = [];
  const positions = geometry.attributes.position;

  for (let i = 0; i < count; i++) {
    const z = positions.getZ(i);
    // Normalize z ratio along cantilever beam
    const t = (z + state.load.L / 2) / state.load.L; 
    const localStressRatio = 1 - t; // Max stress at fixed base (z = 0)

    const color = new THREE.Color();
    color.setHSL((1 - localStressRatio) * 0.66, 1.0, 0.5); // Blue (low) -> Red (high)
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.3,
    metalness: 0.2,
    side: THREE.DoubleSide
  });

  beamMesh = new THREE.Mesh(geometry, material);
  scene.add(beamMesh);
}

function animate() {
  requestAnimationFrame(animate);

  if (state.animateDeform && beamMesh) {
    const time = Date.now() * 0.003;
    beamMesh.rotation.z = Math.sin(time) * 0.05;
  }

  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  const container = document.getElementById('threeCanvas');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// --- Event Listeners Setup ---
document.addEventListener('DOMContentLoaded', () => {
  init3D();
  initCharts();
  buildDynamicInputs();

  document.getElementById('profileType').addEventListener('change', () => {
    buildDynamicInputs();
    readInputs();
  });

  document.getElementById('matPreset').addEventListener('change', (e) => {
    const presets = {
      steel: { E: 200, G: 77, yield: 250 },
      aluminum: { E: 69, G: 26, yield: 270 },
      titanium: { E: 114, G: 44, yield: 880 }
    };
    if (presets[e.target.value]) {
      document.getElementById('youngsMod').value = presets[e.target.value].E;
      document.getElementById('shearMod').value = presets[e.target.value].G;
      document.getElementById('yieldStrength').value = presets[e.target.value].yield;
      readInputs();
    }
  });

  ['youngsMod', 'shearMod', 'yieldStrength', 'beamLength', 'shearForce', 'loadEccentricity'].forEach(id => {
    document.getElementById(id).addEventListener('input', readInputs);
  });

  document.getElementById('toggleDeform').addEventListener('click', () => {
    state.animateDeform = !state.animateDeform;
  });

  document.getElementById('resetView').addEventListener('click', () => {
    camera.position.set(2.5, 1.5, 3);
    controls.reset();
  });

  readInputs();
});
