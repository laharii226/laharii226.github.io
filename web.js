import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import {
  OrbitControls
} from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const $ = id => document.getElementById(id);

const sceneHost = $('scene');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1726);

const camera = new THREE.PerspectiveCamera(
  42,
  sceneHost.clientWidth / sceneHost.clientHeight,
  0.01,
  100
);

camera.position.set(2.3, 1.7, 2.5);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

renderer.setSize(
  sceneHost.clientWidth,
  sceneHost.clientHeight
);

renderer.shadowMap.enabled = true;

sceneHost.appendChild(renderer.domElement);

const controls = new OrbitControls(
  camera,
  renderer.domElement
);

controls.enableDamping = true;

// Lighting
scene.add(
  new THREE.HemisphereLight(
    0xb9dfff,
    0x172235,
    2
  )
);

const keyLight = new THREE.DirectionalLight(
  0xffffff,
  2.2
);

keyLight.position.set(2, 4, 3);
scene.add(keyLight);

// Grid and axes
const grid = new THREE.GridHelper(
  4,
  20,
  0x34516b,
  0x1b3045
);

grid.position.y = -0.38;
scene.add(grid);

const axes = new THREE.AxesHelper(0.65);

axes.position.set(-0.9, -0.37, -0.4);
scene.add(axes);

// Model group
let modelGroup = new THREE.Group();

scene.add(modelGroup);

let wire = false;

let current = {
  L: 1.2,
  Do: 0.05,
  Di: 0.04
};


// BUILD THE 3D MODEL
function buildModel() {

  while (modelGroup.children.length) {

    const object = modelGroup.children.pop();

    object.geometry?.dispose();

    if (object.material) {

      if (Array.isArray(object.material)) {

        object.material.forEach(material => {
          material.dispose();
        });

      } else {

        object.material.dispose();

      }
    }
  }

  const {
    L,
    Do,
    Di
  } = current;

  // Outer cylindrical surface
  const geometry = new THREE.CylinderGeometry(
    Do / 2,
    Do / 2,
    L,
    64,
    1,
    true
  );

  geometry.rotateZ(-Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    color: 0x278ed0,
    metalness: 0.65,
    roughness: 0.28,
    side: THREE.DoubleSide,
    wireframe: wire
  });

  const tube = new THREE.Mesh(
    geometry,
    material
  );

  tube.position.x = L / 2;

  modelGroup.add(tube);

  // Inner cylindrical surface
  const innerGeometry = new THREE.CylinderGeometry(
    Di / 2,
    Di / 2,
    L,
    64,
    1,
    true
  );

  innerGeometry.rotateZ(-Math.PI / 2);

  const innerMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b1726,
    side: THREE.DoubleSide,
    wireframe: wire
  });

  const innerMesh = new THREE.Mesh(
    innerGeometry,
    innerMaterial
  );

  innerMesh.position.x = L / 2;

  modelGroup.add(innerMesh);

  // End rings
  for (const x of [0, L]) {

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(
        Di / 2,
        Do / 2,
        64
      ),
      new THREE.MeshStandardMaterial({
        color: 0x4eb9ee,
        side: THREE.DoubleSide,
        metalness: 0.4,
        roughness: 0.35
      })
    );

    ring.rotation.y = Math.PI / 2;
    ring.position.x = x;

    modelGroup.add(ring);
  }

  // Fixed support
  const support = new THREE.Mesh(
    new THREE.BoxGeometry(
      0.045,
      0.45,
      0.45
    ),
    new THREE.MeshStandardMaterial({
      color: 0x55d5a1,
      transparent: true,
      opacity: 0.22
    })
  );

  support.position.set(-0.05, 0, 0);

  modelGroup.add(support);

  // Applied force arrow
  const force = new THREE.ArrowHelper(
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(L, Do / 2 + 0.12, 0),
    0.32,
    0xff9c52,
    0.09,
    0.06
  );

  modelGroup.add(force);

  // Support frame
  const edge = new THREE.EdgesGeometry(
    new THREE.BoxGeometry(
      0.05,
      0.5,
      0.5
    )
  );

  const frame = new THREE.LineSegments(
    edge,
    new THREE.LineBasicMaterial({
      color: 0x65d6a1
    })
  );

  frame.position.x = -0.05;

  modelGroup.add(frame);

  // Adjust camera
  const maxDim = Math.max(L, 0.5);

  camera.position.set(
    maxDim * 1.8,
    maxDim * 1.35,
    maxDim * 1.9
  );

  controls.target.set(L / 2, 0, 0);

  controls.update();
}


// RESIZE THE 3D VIEW
function resize() {

  const width = sceneHost.clientWidth;
  const height = sceneHost.clientHeight;

  camera.aspect = width / height;

  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

window.addEventListener('resize', resize);


// ANIMATION LOOP
function animate() {

  requestAnimationFrame(animate);

  controls.update();

  renderer.render(scene, camera);
}

animate();


// ENGINEERING CALCULATIONS
function calculate() {

  // Read inputs
  const L = Number($('length').value);

  const Do = Number($('outerD').value) / 1000;

  const Di = Number($('innerD').value) / 1000;

  const F = Number($('force').value);

  const e = Number($('offset').value) / 1000;

  const Tinput = Number($('torque').value);

  const p = Number($('probe').value) / 100;

  // Default steel properties
  let E = 200e9;
  let yieldMPa = 250;
  let nu = 0.3;

  // Aluminium properties
  if ($('material').value === 'aluminium') {

    E = 69e9;
    yieldMPa = 275;
    nu = 0.33;
  }

  // Custom material properties
  if ($('material').value === 'custom') {

    E = Number($('young').value) * 1e9;

    yieldMPa = Number($('yield').value);

    nu = 0.3;
  }

  // Validate inputs
  if (
    ![
      L,
      Do,
      Di,
      F,
      e,
      Tinput,
      E,
      yieldMPa
    ].every(Number.isFinite) ||

    L <= 0 ||
    Do <= 0 ||
    Di < 0 ||
    Di >= Do ||
    E <= 0 ||
    yieldMPa <= 0
  ) {

    $('notes').textContent =
      'Invalid input. Ensure length and outer diameter are positive, inner diameter is non-negative and smaller than outer diameter, and material properties are positive.';

    return;
  }

  // SECTION PROPERTIES
  const A =
    Math.PI / 4 *
    (Do ** 2 - Di ** 2);

  const I =
    Math.PI / 64 *
    (Do ** 4 - Di ** 4);

  const J = 2 * I;

  const G = E / (2 * (1 + nu));

  const c = Do / 2;

  // Inspection position
  const x = L * p;

  const remaining = L - x;

  // BENDING CALCULATIONS
  const M = F * remaining;

  const stress = M * c / I;

  const strain = stress / E;

  // Cantilever deflection at position x
  const defl =
    F * x * x * (3 * L - x) /
    (6 * E * I);

  // TORSION CALCULATIONS
  // Eccentricity is treated as a perpendicular
  // offset that creates torque about the shaft axis.

  const T = Tinput + F * e;

  const twist =
    T * x / (G * J);

  const torsionStress =
    Math.abs(T) * c / J;

  // VON MISES APPROXIMATION
  const vm = Math.sqrt(
    stress ** 2 +
    3 * torsionStress ** 2
  );

  const fos =
    (yieldMPa * 1e6) / vm;


  // DISPLAY SECTION PROPERTIES
  $('area').textContent =
    (A * 1e6).toFixed(2) + ' mm²';

  $('inertia').textContent =
    (I * 1e12).toFixed(2) + ' mm⁴';

  $('torsionJ').textContent =
    (J * 1e12).toFixed(2) + ' mm⁴';


  // DISPLAY INSPECTION RESULTS
  $('moment').textContent =
    M.toFixed(2) + ' N·m';

  $('stress').textContent =
    (stress / 1e6).toFixed(3) + ' MPa';

  $('strain').textContent =
    (strain * 1e6).toFixed(2) + ' µε';

  $('deflection').textContent =
    (defl * 1000).toFixed(4) + ' mm';

  $('twist').textContent =
    (twist * 180 / Math.PI).toFixed(5) + '°';


  // TOP SUMMARY
  $('stressTop').textContent =
    (Math.abs(stress) / 1e6).toFixed(2) + ' MPa';

  $('deflectionTop').textContent =
    (
      F * L ** 3 /
      (3 * E * I) * 1000
    ).toFixed(3) + ' mm';

  $('twistTop').textContent =
    (
      T * L /
      (G * J) * 180 / Math.PI
    ).toFixed(4) + '°';


  // FACTOR OF SAFETY
  $('safety').textContent =
    Number.isFinite(fos)
      ? fos.toFixed(2) + ' ×'
      : '—';

  const pill = $('safetyStatus');

  pill.className =
    'pill ' + (fos >= 1 ? 'safe' : 'warn');

  pill.textContent =
    fos >= 1
      ? 'Within yield criterion'
      : 'Yield criterion exceeded';


  // MODEL NOTES
  $('notes').textContent =
    `At x = ${x.toFixed(3)} m from the fixed end. ` +
    `The force produces M = F(L − x). ` +
    `Eccentricity is treated as a perpendicular offset ` +
    `that creates torque T = F·e about the tube axis. ` +
    `The von Mises estimate combines the outer-fibre ` +
    `bending normal stress with circular-shaft torsional ` +
    `shear; transverse shear, stress concentrations and ` +
    `local 3D effects are omitted.`;


  // UPDATE 3D MODEL
  current = {
    L,
    Do,
    Di
  };

  buildModel();
}


// RUN ANALYSIS BUTTON
$('analyseBtn').addEventListener(
  'click',
  calculate
);


// INSPECTION POSITION SLIDER
$('probe').addEventListener(
  'input',
  () => {

    $('probeValue').textContent =
      $('probe').value + '%';

    calculate();
  }
);


// MATERIAL SELECTION
$('material').addEventListener(
  'change',
  () => {

    $('customFields').classList.toggle(
      'hidden',
      $('material').value !== 'custom'
    );

    if ($('material').value === 'steel') {

      $('materialNote').textContent =
        'E = 200 GPa · Yield = 250 MPa · ν = 0.30';

    } else if ($('material').value === 'aluminium') {

      $('materialNote').textContent =
        'E = 69 GPa · Yield = 275 MPa · ν = 0.33';

    } else {

      $('materialNote').textContent =
        'Enter your material properties below.';
    }

    calculate();
  }
);


// SOLID / WIREFRAME VIEW
document.querySelectorAll('.view-btn').forEach(
  button => {

    button.addEventListener(
      'click',
      () => {

        wire = button.dataset.view === 'wire';

        document.querySelectorAll('.view-btn').forEach(
          item => {
            item.classList.toggle(
              'active',
              item === button
            );
          }
        );

        buildModel();
      }
    );
  }
);


// SHOW / HIDE MATHEMATICS
$('mathToggle').addEventListener(
  'click',
  () => {

    const content = $('mathContent');

    content.classList.toggle('hidden');

    $('mathToggle').textContent =
      content.classList.contains('hidden')
        ? 'Show +'
        : 'Hide −';
  }
);


// RESET MODEL
$('resetBtn').addEventListener(
  'click',
  () => {

    $('length').value = 1.2;

    $('outerD').value = 50;

    $('innerD').value = 40;

    $('force').value = 500;

    $('offset').value = 0;

    $('torque').value = 0;

    $('probe').value = 100;

    $('probeValue').textContent = '100%';

    $('material').value = 'steel';

    $('customFields').classList.add('hidden');

    $('materialNote').textContent =
      'E = 200 GPa · Yield = 250 MPa · ν = 0.30';

    calculate();
  }
);


// INITIAL ANALYSIS
calculate();
