import * as THREE from 'three';

import {
  OrbitControls
} from 'three/addons/controls/OrbitControls.js';

const $ = (id) => document.getElementById(id);

const MATERIALS = {
  steel: {
    name: 'Structural steel',
    E: 200e9,
    yield: 250e6,
    nu: 0.30,
    density: 7850,
    label: 'E 200 GPa · σᵧ 250 MPa · ρ 7850 kg/m³'
  },

  aluminium: {
    name: 'Aluminium alloy',
    E: 69e9,
    yield: 275e6,
    nu: 0.33,
    density: 2700,
    label: 'E 69 GPa · σᵧ 275 MPa · ρ 2700 kg/m³'
  },

  titanium: {
    name: 'Titanium alloy',
    E: 114e9,
    yield: 880e6,
    nu: 0.34,
    density: 4430,
    label: 'E 114 GPa · σᵧ 880 MPa · ρ 4430 kg/m³'
  }
};

const state = {
  last: null,
  render: 'solid',
  camera: 'iso',
  imageUrl: null,
  modelName: 'Hollow cantilever tube'
};


// ==========================================
// MATERIAL PROPERTIES
// ==========================================

function materialData() {
  const key = $('material').value;

  if (key !== 'custom') {
    return MATERIALS[key];
  }

  return {
    name: 'Custom material',
    E: Number($('customE').value) * 1e9,
    yield: Number($('customYield').value) * 1e6,
    nu: Number($('customNu').value),
    density: Number($('customDensity').value),

    label:
      `E ${$('customE').value} GPa · ` +
      `σᵧ ${$('customYield').value} MPa · ` +
      `ρ ${$('customDensity').value} kg/m³`
  };
}


// ==========================================
// READ MODEL INPUTS
// ==========================================

function readInputs() {
  const L = Number($('length').value);

  const Do =
    Number($('outerD').value) / 1000;

  const Di =
    Number($('innerD').value) / 1000;

  const F = Number($('force').value);

  const N = Number($('axial').value);

  const eccentricity =
    Number($('eccentricity').value) / 1000;

  const torqueInput =
    Number($('torque').value);

  const p =
    Number($('probe').value) / 100;

  const mat = materialData();

  return {
    L,
    Do,
    Di,
    F,
    N,
    eccentricity,
    torqueInput,
    p,
    mat,
    support: $('support').value
  };
}


// ==========================================
// INPUT VALIDATION
// ==========================================

function validate(v) {
  const values = [
    v.L,
    v.Do,
    v.Di,
    v.F,
    v.N,
    v.eccentricity,
    v.torqueInput,
    v.mat.E,
    v.mat.yield,
    v.mat.nu,
    v.mat.density,
    v.p
  ];

  if (!values.every(Number.isFinite)) {
    return 'Enter valid numeric values in all fields.';
  }

  if (
    v.L <= 0 ||
    v.Do <= 0 ||
    v.Di < 0 ||
    v.Di >= v.Do
  ) {
    return 'Geometry is invalid. Length and outer diameter must be positive; inner diameter must be smaller than outer diameter.';
  }

  if (
    v.mat.E <= 0 ||
    v.mat.yield <= 0 ||
    v.mat.density <= 0 ||
    v.mat.nu < 0 ||
    v.mat.nu >= 0.5
  ) {
    return 'Material properties are invalid. E, yield strength and density must be positive; Poisson ratio must be between 0 and 0.5.';
  }

  return '';
}


// ==========================================
// BEAM RESPONSE EQUATIONS
// ==========================================

function responseAt(v, x) {
  const { L, F, E, I } = v;

  let M;
  let displacement;

  if (v.support === 'fixed') {

    // Cantilever with end point load

    M = F * (L - x);

    displacement =
      F * x * x * (3 * L - x) /
      (6 * E * I);

  } else {

    // Simply supported beam with
    // a point load at the centre

    const a = L / 2;

    M =
      x <= a
        ? F * x / 2
        : F * (L - x) / 2;

    displacement =
      x <= a
        ? F * x * (3 * L * L - 4 * x * x) /
          (48 * E * I)

        : F * (L - x) *
          (3 * L * L - 4 * (L - x) ** 2) /
          (48 * E * I);
  }

  return {
    M,
    displacement
  };
}


// ==========================================
// MAIN ANALYSIS ENGINE
// ==========================================

function calculate({ redraw = true } = {}) {

  const v = readInputs();

  const error = validate(v);

  if (error) {
    $('resultNote').textContent = error;

    $('yieldStatus').textContent =
      'INPUT ERROR';

    $('yieldStatus').className =
      'safety-pill danger';

    return null;
  }

  const {
    L,
    Do,
    Di,
    F,
    N,
    eccentricity,
    torqueInput,
    p,
    mat
  } = v;


  // SECTION PROPERTIES

  const A =
    Math.PI / 4 *
    (Do ** 2 - Di ** 2);

  const I =
    Math.PI / 64 *
    (Do ** 4 - Di ** 4);

  const J = 2 * I;

  const G =
    mat.E / (2 * (1 + mat.nu));

  const c = Do / 2;


  // PROBE POSITION

  const x = L * p;

  const {
    M,
    displacement
  } = responseAt(
    {
      ...v,
      E: mat.E,
      I
    },
    x
  );


  // ECCENTRIC LOAD AND TORQUE

  const torqueFromEccentricity =
    F * eccentricity;

  const T =
    torqueInput + torqueFromEccentricity;


  // STRESSES

  const sigmaAxial = N / A;

  const sigmaBending =
    M * c / I;

  const sigma =
    sigmaAxial + sigmaBending;

  const tau =
    Math.abs(T) * c / J;


  // VON MISES APPROXIMATION

  const vm =
    Math.sqrt(
      sigma ** 2 +
      3 * tau ** 2
    );

  const fos =
    mat.yield / vm;


  // STRAIN

  const strain =
    sigma / mat.E;


  // TORSIONAL TWIST

  const twist =
    T * x / (G * J);


  // MASS

  const massPerLength =
    A * mat.density;


  // TIP DEFLECTION

  const tip =
    responseAt(
      {
        ...v,
        E: mat.E,
        I
      },
      L
    ).displacement;


  // MAXIMUM BENDING STRESS

  const maxMoment =
    v.support === 'fixed'
      ? Math.abs(F * L)
      : Math.abs(F * L / 4);

  const maxBendingStress =
    maxMoment * c / I;


  // TOTAL TWIST AT TIP

  const tipTwist =
    T * L / (G * J);


  // SAMPLE RESPONSE AT 41 STATIONS

  const samples = Array.from(
    { length: 41 },
    (_, i) => {

      const sx = L * i / 40;

      const r = responseAt(
        {
          ...v,
          E: mat.E,
          I
        },
        sx
      );

      return {
        x: sx,
        M: r.M,
        displacement: r.displacement,
        stress: r.M * c / I
      };
    }
  );


  const result = {
    ...v,
    A,
    I,
    J,
    G,
    c,
    x,
    M,
    displacement,
    T,
    torqueFromEccentricity,
    sigmaAxial,
    sigmaBending,
    sigma,
    tau,
    vm,
    fos,
    strain,
    twist,
    massPerLength,
    tip,
    maxMoment,
    maxBendingStress,
    tipTwist,
    samples
  };

  state.last = result;

  updateUI(result);

  if (redraw) {
    buildModel(result);
    drawResponseChart();
  }

  return result;
}


// ==========================================
// RESULT FORMATTING
// ==========================================

function fmt(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return '—';
  }

  return value.toLocaleString(
    'en-US',
    {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits
    }
  );
}

function setText(id, value) {
  $(id).textContent = value;
}


// ==========================================
// UPDATE DASHBOARD
// ==========================================

function updateUI(r) {

  const wall =
    (r.Do - r.Di) * 500;

  setText(
    'wallThickness',
    `${fmt(wall)} mm`
  );

  setText('materialName', r.mat.name);

  setText('materialProps', r.mat.label);

  setText(
    'probePct',
    `${Math.round(r.p * 100)}%`
  );

  setText(
    'probeLocation',
    `x = ${fmt(r.x, 3)} m`
  );

  setText(
    'viewportTitle',
    r.support === 'fixed'
      ? (
          r.Di === 0
            ? 'Solid circular cantilever'
            : 'Hollow cantilever tube'
        )
      : 'Simply supported circular beam'
  );

  setText(
    'modelScale',
    `${fmt(r.L, 2)} m`
  );

  setText(
    'projectNameTop',
    state.modelName
  );


  // TOP KPIs

  setText(
    'kpiStress',
    `${fmt(Math.abs(r.maxBendingStress) / 1e6, 2)} MPa`
  );

  setText(
    'kpiStressSub',
    'Peak outer-fibre bending'
  );

  setText(
    'kpiDeflection',
    `${fmt(Math.abs(r.tip) * 1000, 3)} mm`
  );

  setText(
    'kpiTwist',
    `${fmt(r.tipTwist * 180 / Math.PI, 4)}°`
  );

  setText(
    'kpiFos',
    Number.isFinite(r.fos)
      ? fmt(r.fos, 2)
      : '∞'
  );


  // SECTION PROPERTIES

  setText(
    'resArea',
    `${fmt(r.A * 1e6)} mm²`
  );

  setText(
    'resI',
    `${fmt(r.I * 1e12)} mm⁴`
  );

  setText(
    'resJ',
    `${fmt(r.J * 1e12)} mm⁴`
  );

  setText(
    'resMass',
    `${fmt(r.massPerLength, 3)} kg/m`
  );


  // PROBE RESULTS

  setText(
    'resMoment',
    `${fmt(r.M)} N·m`
  );

  setText(
    'resAxial',
    `${fmt(r.sigmaAxial / 1e6, 3)} MPa`
  );

  setText(
    'resBending',
    `${fmt(r.sigmaBending / 1e6, 3)} MPa`
  );

  setText(
    'resShear',
    `${fmt(r.tau / 1e6, 3)} MPa`
  );

  setText(
    'resStrain',
    `${fmt(r.strain * 1e6, 2)} µε`
  );

  setText(
    'resDisp',
    `${fmt(r.displacement * 1000, 4)} mm`
  );

  setText(
    'resAngle',
    `${fmt(r.twist * 180 / Math.PI, 5)}°`
  );


  // YIELD SCREEN

  setText(
    'yieldValue',
    `${fmt(r.vm / 1e6, 2)} MPa`
  );

  const safe = r.fos >= 1;

  $('yieldStatus').textContent =
    safe
      ? 'BELOW YIELD LIMIT'
      : 'YIELD LIMIT EXCEEDED';

  $('yieldStatus').className =
    `safety-pill ${safe ? 'safe' : 'danger'}`;


  // EXPLANATION

  setText(
    'resultNote',

    `At x = ${fmt(r.x, 3)} m. ` +
    `T = T applied + F·e = ${fmt(r.T, 2)} N·m. ` +
    `Von Mises combines the selected longitudinal normal ` +
    `stress with circular-shaft torsional shear. ` +
    `Transverse shear, stress concentrations and local ` +
    `3D effects are omitted.`
  );


  // MATHEMATICS SUBSTITUTION

  setText(
    'substitution',

    `A = ${fmt(r.A * 1e6)} mm² · ` +
    `I = ${fmt(r.I * 1e12)} mm⁴ · ` +
    `M(x) = ${fmt(r.M)} N·m · ` +
    `σₓ = ${fmt(r.sigma / 1e6, 3)} MPa · ` +
    `τ = ${fmt(r.tau / 1e6, 3)} MPa · ` +
    `σᵥₘ = ${fmt(r.vm / 1e6, 3)} MPa.`
  );


  // POINT PROBE

  setText(
    'probeStress',
    `${fmt(r.sigma / 1e6, 3)} MPa`
  );

  setText(
    'probeStrain',
    `${fmt(r.strain * 1e6, 2)} µε`
  );

  setText(
    'probeDisplacement',
    `${fmt(r.displacement * 1000, 4)} mm`
  );


  // FAILURE STATUS

  if (safe) {

    setText(
      'predictionTitle',
      'Below the selected yield criterion'
    );

    setText(
      'predictionText',

      `Estimated yield factor of safety is ${fmt(r.fos, 2)}. ` +
      `This is a simplified static screen, not a guarantee ` +
      `of safety. Buckling, fatigue, defects and connection ` +
      `effects are not assessed.`
    );

  } else {

    setText(
      'predictionTitle',
      'Selected yield criterion exceeded'
    );

    setText(
      'predictionText',

      `The calculated equivalent stress is above the entered ` +
      `yield strength. Review the load case, dimensions and ` +
      `material data. This screen does not predict a failure time.`
    );
  }
}


// ==========================================
// THREE.JS 3D VIEWPORT
// ==========================================

const host = $('viewport');

const scene = new THREE.Scene();

scene.background =
  new THREE.Color(0x0b1726);

const camera =
  new THREE.PerspectiveCamera(
    42,
    1,
    0.01,
    100
  );

camera.position.set(2.4, 1.8, 2.7);

const renderer =
  new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
  });

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio || 1, 2)
);

renderer.outputColorSpace =
  THREE.SRGBColorSpace;

renderer.toneMapping =
  THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1.15;

host.appendChild(renderer.domElement);

const orbit =
  new OrbitControls(
    camera,
    renderer.domElement
  );

orbit.enableDamping = true;
orbit.dampingFactor = 0.07;


// LIGHTING

scene.add(
  new THREE.HemisphereLight(
    0xc5e4ff,
    0x152235,
    2.1
  )
);

const keyLight =
  new THREE.DirectionalLight(
    0xffffff,
    2.4
  );

keyLight.position.set(2.5, 4, 3);
scene.add(keyLight);

const rimLight =
  new THREE.DirectionalLight(
    0x4c9dff,
    1.1
  );

rimLight.position.set(-2, 1, -3);
scene.add(rimLight);


// GRID AND AXES

const grid =
  new THREE.GridHelper(
    4,
    24,
    0x36516a,
    0x1a2d40
  );

grid.position.y = -0.32;
scene.add(grid);

const axes =
  new THREE.AxesHelper(0.55);

axes.position.set(-0.75, -0.31, -0.35);
scene.add(axes);


// MODEL GROUPS

const modelGroup = new THREE.Group();

scene.add(modelGroup);

const annotationGroup = new THREE.Group();

scene.add(annotationGroup);


// ==========================================
// CLEAN UP OLD 3D OBJECTS
// ==========================================

function disposeGroup(group) {

  while (group.children.length) {

    const obj = group.children.pop();

    obj.geometry?.dispose();

    if (obj.material) {

      (
        Array.isArray(obj.material)
          ? obj.material
          : [obj.material]
      ).forEach(m => m.dispose());
    }
  }
}


// ==========================================
// CURVED TUBE GEOMETRY
// ==========================================

function makeTubeGeometry(
  L,
  radius,
  innerRadius,
  segments,
  rings,
  deflectionFn,
  displayScale
) {

  const positions = [];
  const indices = [];
  const uvs = [];

  for (let j = 0; j <= rings; j++) {

    const x = L * j / rings;

    const yShift =
      deflectionFn
        ? -deflectionFn(x) * displayScale
        : 0;

    for (let i = 0; i <= segments; i++) {

      const a =
        i / segments * Math.PI * 2;

      positions.push(
        x,
        yShift + radius * Math.cos(a),
        radius * Math.sin(a)
      );

      uvs.push(
        j / rings,
        i / segments
      );
    }
  }

  for (let j = 0; j < rings; j++) {

    for (let i = 0; i < segments; i++) {

      const a =
        j * (segments + 1) + i;

      const b =
        a + segments + 1;

      indices.push(
        a, b, a + 1,
        b, b + 1, a + 1
      );
    }
  }

  const geo = new THREE.BufferGeometry();

  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );

  geo.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute(uvs, 2)
  );

  geo.setIndex(indices);

  geo.computeVertexNormals();

  return geo;
}


function makeInnerGeometry(
  L,
  radius,
  segments,
  rings,
  deflectionFn,
  displayScale
) {

  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= rings; j++) {

    const x = L * j / rings;

    const yShift =
      deflectionFn
        ? -deflectionFn(x) * displayScale
        : 0;

    for (let i = 0; i <= segments; i++) {

      const a =
        i / segments * Math.PI * 2;

      positions.push(
        x,
        yShift + radius * Math.cos(a),
        radius * Math.sin(a)
      );

      uvs.push(
        j / rings,
        i / segments
      );
    }
  }

  for (let j = 0; j < rings; j++) {

    for (let i = 0; i < segments; i++) {

      const a =
        j * (segments + 1) + i;

      const b =
        a + segments + 1;

      indices.push(
        a, a + 1, b,
        b, a + 1, b + 1
      );
    }
  }

  const geo = new THREE.BufferGeometry();

  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );

  geo.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute(uvs, 2)
  );

  geo.setIndex(indices);

  geo.computeVertexNormals();

  return geo;
}


// ==========================================
// BUILD THE 3D MODEL
// ==========================================

function buildModel(r) {

  disposeGroup(modelGroup);
  disposeGroup(annotationGroup);

  const radius =
    Math.min(r.Do / 2, 0.22);

  const inner =
    r.Di / 2 / (r.Do / 2) * radius;

  const visualL =
    Math.max(1.2, Math.min(2.5, r.L));

  const xScale =
    visualL / r.L;


  // Convert actual beam displacement to a
  // visually magnified display displacement.

  const deflectionAt = (xVisual) => {

    const xReal =
      xVisual / xScale;

    return Math.abs(
      responseAt(
        {
          ...r,
          E: r.mat.E,
          I: r.I
        },
        xReal
      ).displacement
    );
  };

  const maxDef =
    Math.abs(r.tip);

  const deformScale =
    maxDef > 0
      ? Math.min(160, 0.14 / maxDef)
      : 1;

  const curveFn = (xVisual) =>
    deflectionAt(xVisual) * deformScale;


  // OUTER TUBE

  const shellGeo =
    makeTubeGeometry(
      visualL,
      radius,
      inner,
      56,
      48,
      curveFn,
      1
    );

  const shellMat =
    new THREE.MeshStandardMaterial({
      color: 0x348fc6,
      metalness: 0.68,
      roughness: 0.25,
      side: THREE.DoubleSide,
      wireframe: state.render === 'wire',
      transparent: state.render === 'transparent',
      opacity:
        state.render === 'transparent'
          ? 0.3
          : 1
    });

  const shell =
    new THREE.Mesh(shellGeo, shellMat);

  modelGroup.add(shell);


  // INNER TUBE WALL

  if (inner > 0.0001) {

    const innerGeo =
      makeInnerGeometry(
        visualL,
        inner,
        56,
        48,
        curveFn,
        1
      );

    const innerMat =
      new THREE.MeshStandardMaterial({
        color: 0x102337,
        metalness: 0.2,
        roughness: 0.8,
        side: THREE.DoubleSide,
        wireframe: state.render === 'wire',
        transparent: state.render === 'transparent',
        opacity:
          state.render === 'transparent'
            ? 0.2
            : 1
      });

    modelGroup.add(
      new THREE.Mesh(innerGeo, innerMat)
    );
  }


  // END RINGS

  [0, visualL].forEach(x => {

    const y = -curveFn(x);

    const ring =
      new THREE.Mesh(
        new THREE.RingGeometry(
          inner,
          radius,
          56
        ),
        new THREE.MeshStandardMaterial({
          color: 0x75c7ef,
          metalness: 0.5,
          roughness: 0.28,
          side: THREE.DoubleSide
        })
      );

    ring.rotation.y = Math.PI / 2;

    ring.position.set(x, y, 0);

    modelGroup.add(ring);
  });


  // SUPPORTS

  if (r.support === 'fixed') {

    const support =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.055,
          0.55,
          0.55
        ),
        new THREE.MeshStandardMaterial({
          color: 0x4bc997,
          transparent: true,
          opacity: 0.24
        })
      );

    support.position.set(-0.045, 0, 0);

    modelGroup.add(support);

    const edges =
      new THREE.LineSegments(
        new THREE.EdgesGeometry(
          new THREE.BoxGeometry(
            0.055,
            0.55,
            0.55
          )
        ),
        new THREE.LineBasicMaterial({
          color: 0x65d5a2
        })
      );

    edges.position.copy(support.position);

    modelGroup.add(edges);

  } else {

    [0, visualL].forEach(x => {

      const base =
        new THREE.Mesh(
          new THREE.ConeGeometry(
            0.13,
            0.16,
            3
          ),
          new THREE.MeshStandardMaterial({
            color: 0x62d2a0
          })
        );

      base.rotation.z = Math.PI;
      base.position.set(x, -0.16, 0);

      modelGroup.add(base);
    });
  }


  // APPLIED FORCE ARROW

  const forceDirection =
    new THREE.Vector3(
      0,
      r.F >= 0 ? -1 : 1,
      0
    );

  const loadX =
    r.support === 'fixed'
      ? visualL
      : visualL / 2;

  const loadY =
    -curveFn(loadX);

  const arrow =
    new THREE.ArrowHelper(
      forceDirection,
      new THREE.Vector3(
        loadX,
        loadY + (
          r.F >= 0
            ? radius + 0.22
            : -radius - 0.22
        ),
        0
      ),
      0.32,
      0xff9d57,
      0.09,
      0.06
    );

  annotationGroup.add(arrow);


  // TORQUE INDICATOR

  if (Math.abs(r.T) > 1e-9) {

    const torqueArrow =
      new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(
          visualL * 0.75,
          radius + 0.17,
          0
        ),
        0.22,
        0xffbd72,
        0.07,
        0.05
      );

    annotationGroup.add(torqueArrow);
  }


  // PROBE MARKER

  const probeX =
    r.x * xScale;

  const probeY =
    -curveFn(probeX);

  const probe =
    new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0x5de2d5
      })
    );

  probe.position.set(
    probeX,
    probeY + radius,
    0
  );

  annotationGroup.add(probe);


  // DEFORMED CENTRELINE

  const linePts = [];

  for (let i = 0; i <= 48; i++) {

    const x =
      visualL * i / 48;

    linePts.push(
      new THREE.Vector3(
        x,
        -curveFn(x),
        0
      )
    );
  }

  const centreLine =
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(linePts),
      new THREE.LineBasicMaterial({
        color: 0x9ce9e2,
        transparent: true,
        opacity: 0.55
      })
    );

  annotationGroup.add(centreLine);

  scene.add(annotationGroup);


  // CAMERA

  camera.position.set(
    visualL * 1.75,
    visualL * 1.25,
    visualL * 1.85
  );

  orbit.target.set(visualL / 2, 0, 0);

  orbit.update();

  resizeRenderer();
}


// ==========================================
// VIEWPORT RESIZE AND ANIMATION
// ==========================================

function resizeRenderer() {

  const w =
    Math.max(1, host.clientWidth);

  const h =
    Math.max(1, host.clientHeight);

  renderer.setSize(w, h, false);

  camera.aspect = w / h;

  camera.updateProjectionMatrix();
}

window.addEventListener(
  'resize',
  resizeRenderer
);

function animate() {

  requestAnimationFrame(animate);

  orbit.update();

  renderer.render(scene, camera);
}

animate();


// ==========================================
// RESPONSE GRAPH
// ==========================================

function drawResponseChart() {

  const r = state.last;

  if (!r) return;

  const canvas = $('responseChart');

  const rect =
    canvas.getBoundingClientRect();

  const dpr =
    Math.min(window.devicePixelRatio || 1, 2);

  const width =
    Math.max(300, rect.width);

  const height = 180;

  canvas.width =
    Math.round(width * dpr);

  canvas.height =
    Math.round(height * dpr);

  const ctx =
    canvas.getContext('2d');

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, width, height);

  const mode = $('chartMode').value;

  const values =
    r.samples.map(s => {

      if (mode === 'deflection') {
        return s.displacement * 1000;
      }

      if (mode === 'moment') {
        return s.M;
      }

      return s.stress / 1e6;
    });

  const maxAbs =
    Math.max(
      1e-12,
      ...values.map(Math.abs)
    );

  const left = 43;
  const right = width - 13;
  const top = 15;
  const bottom = height - 27;

  ctx.strokeStyle = '#26394d';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#74899e';
  ctx.font = '8px DM Mono, monospace';

  for (let i = 0; i <= 4; i++) {

    const y =
      top + (bottom - top) * i / 4;

    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    const val =
      maxAbs * (1 - 2 * i / 4);

    ctx.fillText(
      fmt(val, 1),
      2,
      y + 3
    );
  }

  ctx.strokeStyle = '#38516a';

  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();


  // RESPONSE CURVE

  ctx.strokeStyle = '#4aaeff';
  ctx.lineWidth = 2.2;
  ctx.beginPath();

  values.forEach((v, i) => {

    const x =
      left + (right - left) *
      i / (values.length - 1);

    const y =
      top + (bottom - top) *
      (0.5 - 0.46 * v / maxAbs);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  ctx.fillStyle = '#8297ac';
  ctx.font = '8px DM Mono, monospace';

  ctx.fillText(
    '0',
    left - 2,
    height - 8
  );

  ctx.fillText(
    `${fmt(r.L, 2)} m`,
    right - 35,
    height - 8
  );

  const labels = {
    deflection: 'Calculated deflection along member',
    moment: 'Bending moment distribution',
    stress: 'Outer-fibre bending stress distribution'
  };

  setText(
    'chartCaption',
    labels[mode]
  );
}

$('chartMode').addEventListener(
  'change',
  drawResponseChart
);


// ==========================================
// MOHR'S CIRCLE CALCULATOR
// ==========================================

function calculateMohr() {

  const sx = Number($('sigmaX').value);
  const sy = Number($('sigmaY').value);
  const txy = Number($('tauXY').value);
  const theta = Number($('thetaStress').value);

  if (
    ![sx, sy, txy, theta].every(Number.isFinite)
  ) {
    toast('Enter valid stress values.');
    return;
  }

  const avg =
    (sx + sy) / 2;

  const diff =
    (sx - sy) / 2;

  const R =
    Math.sqrt(diff ** 2 + txy ** 2);

  const s1 = avg + R;
  const s2 = avg - R;

  const tauMax = R;

  const thetaP =
    0.5 *
    Math.atan2(2 * txy, sx - sy) *
    180 / Math.PI;


  // STRESS TRANSFORMATION

  const rad =
    theta * Math.PI / 180;

  const sxp =
    avg +
    diff * Math.cos(2 * rad) +
    txy * Math.sin(2 * rad);

  const syp =
    avg -
    diff * Math.cos(2 * rad) -
    txy * Math.sin(2 * rad);

  const txyp =
    -diff * Math.sin(2 * rad) +
    txy * Math.cos(2 * rad);


  setText(
    'principal1',
    `${fmt(s1, 3)} MPa`
  );

  setText(
    'principal2',
    `${fmt(s2, 3)} MPa`
  );

  setText(
    'maxShear',
    `${fmt(tauMax, 3)} MPa`
  );

  setText(
    'principalAngle',
    `${fmt(thetaP, 2)}°`
  );

  setText(
    'transformedState',

    `At θ = ${fmt(theta, 2)}°: ` +
    `σₓ′ = ${fmt(sxp, 3)} MPa · ` +
    `σᵧ′ = ${fmt(syp, 3)} MPa · ` +
    `τₓ′ᵧ′ = ${fmt(txyp, 3)} MPa. ` +
    `The principal-plane angle is measured from the ` +
    `original x-axis using the stated positive-rotation convention.`
  );

  drawMohrCircle(
    avg,
    R,
    sx,
    sy,
    txy
  );
}


// DRAW MOHR'S CIRCLE

function drawMohrCircle(
  avg,
  R,
  sx,
  sy,
  tau
) {

  const canvas = $('mohrCanvas');

  const ctx =
    canvas.getContext('2d');

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = '#0a1725';
  ctx.fillRect(0, 0, w, h);

  const pad = 48;

  const maxS =
    Math.max(Math.abs(avg) + R, 1);

  const scale =
    (w / 2 - pad) / (maxS * 1.25);

  const cx =
    w / 2 + avg * scale;

  const cy = h / 2;

  const radius = R * scale;


  // AXES

  ctx.strokeStyle = '#2a4057';
  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.moveTo(pad, cy);
  ctx.lineTo(w - pad, cy);

  ctx.moveTo(w / 2, 20);
  ctx.lineTo(w / 2, h - 28);

  ctx.stroke();

  ctx.fillStyle = '#8da2b8';
  ctx.font = '12px DM Mono';

  ctx.fillText(
    'σ (MPa)',
    w - 100,
    cy - 10
  );

  ctx.fillText(
    'τ (MPa)',
    w / 2 + 9,
    20
  );


  // CIRCLE

  ctx.strokeStyle = '#4aaeff';
  ctx.lineWidth = 2.5;

  ctx.beginPath();

  ctx.arc(
    cx,
    cy,
    radius,
    0,
    Math.PI * 2
  );

  ctx.stroke();


  // STRESS POINTS

  const point = (
    s,
    t,
    color,
    label
  ) => {

    const px =
      w / 2 + s * scale;

    const py =
      cy - t * scale;

    ctx.fillStyle = color;

    ctx.beginPath();

    ctx.arc(
      px,
      py,
      5,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.font = '11px DM Mono';

    ctx.fillText(
      label,
      px + 8,
      py - 8
    );
  };

  point(sx, tau, '#ff9d57', 'A');

  point(sy, -tau, '#65d5a2', 'B');


  // CENTRE

  ctx.fillStyle = '#5de2d5';

  ctx.beginPath();

  ctx.arc(
    cx,
    cy,
    3,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.font = '10px DM Mono';

  ctx.fillText(
    'C',
    cx + 7,
    cy + 14
  );


  // PRINCIPAL STRESSES

  ctx.fillStyle = '#9db0c4';

  ctx.fillText(
    `σ₂ ${fmt(avg - R, 1)}`,
    w / 2 + (avg - R) * scale - 18,
    cy + 22
  );

  ctx.fillText(
    `σ₁ ${fmt(avg + R, 1)}`,
    w / 2 + (avg + R) * scale - 18,
    cy + 22
  );
}

$('mohrCalc').addEventListener(
  'click',
  calculateMohr
);


// ==========================================
// MODALS AND NAVIGATION
// ==========================================

function openModal(id) {
  $(id).classList.remove('hidden');
}

function closeModal(id) {
  $(id).classList.add('hidden');
}

document.querySelectorAll('[data-close]').forEach(
  button => {

    button.addEventListener(
      'click',
      () => closeModal(button.dataset.close)
    );
  }
);

document.querySelectorAll('.modal-backdrop').forEach(
  backdrop => {

    backdrop.addEventListener(
      'click',
      event => {

        if (event.target === backdrop) {
          backdrop.classList.add('hidden');
        }
      }
    );
  }
);


document.querySelectorAll('.nav-item').forEach(
  button => {

    button.addEventListener(
      'click',
      () => {

        document.querySelectorAll('.nav-item').forEach(
          item => {
            item.classList.toggle(
              'active',
              item === button
            );
          }
        );

        const view = button.dataset.view;

        if (view === 'mechanics') {

          openModal('mohrModal');
          calculateMohr();

        } else if (view === 'photo') {

          openModal('photoModal');

        } else if (view === 'reports') {

          exportReport();

        } else if (view === 'materials') {

          $('material').focus();

          toast(
            'Choose a material in the Model Definition panel.'
          );

        } else if (view === 'geometry') {

          $('length').focus();

          toast(
            'Edit the member geometry in the Model Definition panel.'
          );

        } else {

          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      }
    );
  }
);


document.querySelectorAll('[data-open]').forEach(
  button => {

    button.addEventListener(
      'click',
      () => {

        if (button.dataset.open === 'materials') {

          $('material').focus();

          toast(
            'Choose a material preset or enter custom properties.'
          );
        }
      }
    );
  }
);


$('helpBtn').addEventListener(
  'click',
  () => openModal('guideModal')
);


// ==========================================
// SHOW / HIDE MATHEMATICS
// ==========================================

$('mathToggle').addEventListener(
  'click',
  () => {

    const body = $('mathBody');

    body.classList.toggle('hidden');

    $('mathToggle').textContent =
      body.classList.contains('hidden')
        ? 'Expand +'
        : 'Collapse −';
  }
);


// ==========================================
// 3D RENDER MODES
// ==========================================

function setRender(mode) {

  state.render = mode;

  document.querySelectorAll('.view-toggle').forEach(
    button => {

      button.classList.toggle(
        'active',
        button.dataset.render === mode
      );
    }
  );

  if (state.last) {
    buildModel(state.last);
  }
}

document.querySelectorAll('.view-toggle').forEach(
  button => {

    button.addEventListener(
      'click',
      () => setRender(button.dataset.render)
    );
  }
);


// ==========================================
// CAMERA PRESETS
// ==========================================

document.querySelectorAll('.camera-btn').forEach(
  button => {

    button.addEventListener(
      'click',
      () => {

        if (!state.last) return;

        const L =
          Math.max(
            1.2,
            Math.min(2.5, state.last.L)
          );

        if (button.dataset.camera === 'front') {

          camera.position.set(
            L / 2,
            0.1,
            L * 2.8
          );

        } else if (button.dataset.camera === 'top') {

          camera.position.set(
            L / 2,
            L * 2.8,
            0.01
          );

        } else {

          camera.position.set(
            L * 1.75,
            L * 1.25,
            L * 1.85
          );
        }

        orbit.target.set(L / 2, 0, 0);

        orbit.update();
      }
    );
  }
);


// ==========================================
// EXAMPLE MODEL PRESETS
// ==========================================

$('preset').addEventListener(
  'change',
  () => {

    const preset = $('preset').value;

    if (preset === 'shaft') {

      $('outerD').value = 40;
      $('innerD').value = 0;
      $('torque').value = 30;
      $('force').value = 0;

      state.modelName =
        'Solid shaft under torque';

    } else if (preset === 'thin') {

      $('outerD').value = 60;
      $('innerD').value = 54;
      $('torque').value = 20;
      $('force').value = 500;

      state.modelName =
        'Thin-wall circular tube';

    } else {

      $('outerD').value = 60;
      $('innerD').value = 45;
      $('torque').value = 15;
      $('force').value = 800;

      state.modelName =
        'Hollow cantilever tube';
    }

    setText(
      'projectNameTop',
      state.modelName
    );

    calculate();
  }
);


// ==========================================
// MATERIAL SELECTION
// ==========================================

$('material').addEventListener(
  'change',
  () => {

    const custom =
      $('material').value === 'custom';

    $('customMaterial').classList.toggle(
      'hidden',
      !custom
    );

    const m =
      MATERIALS[$('material').value];

    if (m) {

      setText('materialName', m.name);

      setText('materialProps', m.label);
    }

    calculate();
  }
);


// ==========================================
// AUTOMATIC RECALCULATION
// ==========================================

[
  'length',
  'outerD',
  'innerD',
  'force',
  'axial',
  'eccentricity',
  'torque',
  'support',
  'customE',
  'customYield',
  'customNu',
  'customDensity'
].forEach(id => {

  $(id).addEventListener(
    'change',
    () => calculate()
  );
});


$('probe').addEventListener(
  'input',
  () => {

    setText(
      'probePct',
      `${$('probe').value}%`
    );

    calculate();
  }
);


$('analyseBtn').addEventListener(
  'click',
  () => {

    const r = calculate();

    if (r) {
      toast(
        'Analysis updated from current model inputs.'
      );
    }
  }
);


// ==========================================
// RESET MODEL
// ==========================================

$('resetBtn').addEventListener(
  'click',
  () => {

    $('preset').value = 'cantilever';

    $('length').value = 1.2;
    $('outerD').value = 60;
    $('innerD').value = 45;

    $('material').value = 'steel';

    $('support').value = 'fixed';

    $('force').value = 800;
    $('axial').value = 0;

    $('eccentricity').value = 8;
    $('torque').value = 15;

    $('probe').value = 100;

    $('customMaterial').classList.add('hidden');

    state.modelName =
      'Hollow cantilever tube';

    setText(
      'projectNameTop',
      state.modelName
    );

    calculate();

    toast(
      'Model reset to the default hollow cantilever.'
    );
  }
);


// ==========================================
// PHOTO UPLOAD AND SCALE CALIBRATION
// ==========================================

$('photoFile').addEventListener(
  'change',
  event => {

    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {

      toast('Please choose an image file.');

      return;
    }

    if (state.imageUrl) {
      URL.revokeObjectURL(state.imageUrl);
    }

    state.imageUrl =
      URL.createObjectURL(file);

    $('photoPreview').src =
      state.imageUrl;

    $('photoPreviewWrap').classList.remove(
      'hidden'
    );

    setText(
      'calibrationResult',
      'Image loaded. Enter the known dimension and measured pixel distance.'
    );
  }
);


[
  'knownLength',
  'pixelLength'
].forEach(id => {

  $(id).addEventListener(
    'input',
    () => {

      const real =
        Number($('knownLength').value);

      const pixels =
        Number($('pixelLength').value);

      if (real > 0 && pixels > 0) {

        setText(
          'calibrationResult',

          `Scale = ${fmt(real / pixels, 4)} mm/px · ` +
          `${fmt(pixels / real, 4)} px/mm. ` +
          `Geometry remains an estimate and must be manually confirmed.`
        );
      }
    }
  );
});


// ==========================================
// SAVE PROJECT AS JSON
// ==========================================

function projectData() {

  return {
    app: 'MECHMIND 3D',
    version: '0.2.0',
    savedAt: new Date().toISOString(),
    projectName: state.modelName,

    inputs: {
      preset: $('preset').value,
      length: $('length').value,
      outerD: $('outerD').value,
      innerD: $('innerD').value,
      material: $('material').value,

      customE: $('customE').value,
      customYield: $('customYield').value,
      customNu: $('customNu').value,
      customDensity: $('customDensity').value,

      support: $('support').value,

      force: $('force').value,
      axial: $('axial').value,
      eccentricity: $('eccentricity').value,
      torque: $('torque').value,

      probe: $('probe').value
    }
  };
}


function downloadBlob(blob, filename) {

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement('a');

  a.href = url;
  a.download = filename;

  a.click();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
}


$('saveProjectBtn').addEventListener(
  'click',
  () => {

    const blob =
      new Blob(
        [
          JSON.stringify(
            projectData(),
            null,
            2
          )
        ],
        {
          type: 'application/json'
        }
      );

    downloadBlob(
      blob,
      'mechmind3d-project.json'
    );

    toast(
      'Project configuration downloaded as JSON.'
    );
  }
);


// ==========================================
// LOAD PROJECT JSON
// ==========================================

$('loadProjectBtn').addEventListener(
  'click',
  () => $('projectFile').click()
);


$('projectFile').addEventListener(
  'change',
  async event => {

    const file =
      event.target.files?.[0];

    if (!file) return;

    try {

      const data =
        JSON.parse(await file.text());

      if (
        data.app !== 'MECHMIND 3D' ||
        !data.inputs
      ) {
        throw new Error(
          'This is not a MECHMIND 3D project file.'
        );
      }

      const ids = [
        'preset',
        'length',
        'outerD',
        'innerD',
        'material',
        'customE',
        'customYield',
        'customNu',
        'customDensity',
        'support',
        'force',
        'axial',
        'eccentricity',
        'torque',
        'probe'
      ];

      ids.forEach(id => {

        if (data.inputs[id] !== undefined) {
          $(id).value = data.inputs[id];
        }
      });

      state.modelName =
        data.projectName || 'Imported project';

      $('customMaterial').classList.toggle(
        'hidden',
        $('material').value !== 'custom'
      );

      setText(
        'projectNameTop',
        state.modelName
      );

      calculate();

      toast('Project loaded.');

    } catch (err) {

      toast(
        err.message ||
        'Could not load project file.'
      );
    }

    event.target.value = '';
  }
);


// ==========================================
// CSV ANALYSIS REPORT
// ==========================================

function exportReport() {

  const r =
    state.last || calculate({ redraw: false });

  if (!r) return;

  const rows = [

    ['MECHMIND 3D — ANALYSIS SUMMARY', 'Value', 'Unit'],

    ['Project', state.modelName, ''],

    [
      'Analysis type',
      r.support === 'fixed'
        ? 'Cantilever beam'
        : 'Simply supported beam',
      ''
    ],

    ['Length', r.L, 'm'],

    ['Outer diameter', r.Do * 1000, 'mm'],

    ['Inner diameter', r.Di * 1000, 'mm'],

    ['Material', r.mat.name, ''],

    ['Young modulus', r.mat.E / 1e9, 'GPa'],

    ['Yield strength', r.mat.yield / 1e6, 'MPa'],

    ['Transverse force', r.F, 'N'],

    ['Axial force', r.N, 'N'],

    ['Total torque', r.T, 'N·m'],

    ['Probe position', r.x, 'm'],

    ['Area', r.A * 1e6, 'mm²'],

    ['Second moment I', r.I * 1e12, 'mm⁴'],

    ['Polar moment J', r.J * 1e12, 'mm⁴'],

    ['Bending moment at probe', r.M, 'N·m'],

    [
      'Normal stress at selected outer fibre',
      r.sigma / 1e6,
      'MPa'
    ],

    [
      'Torsional shear stress',
      r.tau / 1e6,
      'MPa'
    ],

    [
      'Von Mises estimate',
      r.vm / 1e6,
      'MPa'
    ],

    [
      'Factor of safety to yield',
      r.fos,
      ''
    ],

    [
      'Probe deflection',
      r.displacement * 1000,
      'mm'
    ],

    [
      'Probe twist',
      r.twist * 180 / Math.PI,
      'deg'
    ],

    [
      'Method',
      'Elementary beam theory + circular Saint-Venant torsion',
      ''
    ],

    [
      'Limitations',
      'No FEA, transverse shear field, buckling, fatigue, creep or local 3D stress concentration analysis.',
      ''
    ]
  ];


  const csv =
    rows.map(
      row => row.map(
        value =>
          `"${String(value ?? '').replaceAll('"', '""')}"`
      ).join(',')
    ).join('\n');


  downloadBlob(
    new Blob(
      [csv],
      {
        type: 'text/csv;charset=utf-8'
      }
    ),
    'mechmind3d-analysis-report.csv'
  );

  toast('CSV analysis report exported.');
}


// ==========================================
// NOTIFICATION MESSAGE
// ==========================================

let toastTimer;

function toast(message) {

  const el = $('toast');

  el.textContent = message;

  el.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(
    () => el.classList.remove('show'),
    2800
  );
}


// ==========================================
// INITIALISE APPLICATION
// ==========================================

$('customMaterial').classList.add('hidden');

calculate();

calculateMohr();


// ==========================================
// PRINT STYLING
// ==========================================

const printStyle =
  document.createElement('style');

printStyle.textContent = `
@media print {

  body {
    background: #fff !important;
    color: #111 !important;
  }

  .topbar,
  .sidebar,
  .heading-right,
  .workflow,
  .setup-panel,
  .viewport-actions,
  .viewport-overlay,
  .modal-backdrop,
  .toast,
  .btn,
  .text-link {
    display: none !important;
  }

  .main-layout {
    display: block;
  }

  .content {
    padding: 0;
    max-width: none;
  }

  .panel {
    break-inside: avoid;
    background: #fff !important;
    color: #111 !important;
    border: 1px solid #bbb !important;
    box-shadow: none !important;
  }

  .panel h2,
  .panel b,
  .kpi b,
  .result-line b {
    color: #111 !important;
  }

  .section-kicker,
  .eyebrow {
    color: #176b88 !important;
  }

  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
  }

  .viewport-panel {
    grid-column: 1 / -1;
  }

  .results-panel {
    display: block !important;
  }

  .analysis-grid,
  .bottom-grid {
    grid-template-columns: 1fr 1fr;
  }
}
`;

document.head.appendChild(printStyle);
