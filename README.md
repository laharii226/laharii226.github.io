# Aneurix: Where Engineering Meets the Artery

**An interactive stent explorer built on solid mechanics.**

🔗 **Live website:** https://laharii226.github.io

> *Which stent for which situation?*
> No stent is best everywhere. Pick a medical situation and a stent, watch what happens in the artery, then see how every stent ranks for that job.

Aneurix turns solid mechanics into something you can see: **pressure, stress, strain and fatigue** in aneurysms and narrowed arteries, explored with live sliders instead of equations.

| 8 | 5 | 9 |
|:-:|:-:|:-:|
| stent types | medical situations | properties ranked |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Website Structure](#2-website-structure)
3. [Medical Situations Modelled](#3-medical-situations-modelled)
4. [Stent Types Compared](#4-stent-types-compared)
5. [Solid Mechanics Fundamentals](#5-solid-mechanics-fundamentals)
6. [Mechanics of an Aneurysm](#6-mechanics-of-an-aneurysm)
7. [Stent Graft and Load Sharing](#7-stent-graft-and-load-sharing)
8. [Mechanics of a Narrowed Artery (Stenosis)](#8-mechanics-of-a-narrowed-artery-stenosis)
9. [Inside the Stent: Strut Mesh Mechanics](#9-inside-the-stent-strut-mesh-mechanics)
10. [Material Behaviour and Stress-Strain Curves](#10-material-behaviour-and-stress-strain-curves)
11. [Fatigue Analysis](#11-fatigue-analysis)
12. [Flexibility: Bending Moment vs Curvature](#12-flexibility-bending-moment-vs-curvature)
13. [Stent Ranking Method](#13-stent-ranking-method)
14. [Graph Lab](#14-graph-lab)
15. [Formula Cheat Sheet](#15-formula-cheat-sheet)
16. [Assumptions and Limitations](#16-assumptions-and-limitations)
17. [Glossary](#17-glossary)
18. [Running Locally and Deploying](#18-running-locally-and-deploying)
19. [Disclaimer](#19-disclaimer)

---

## 1. Project Overview

Cardiovascular stents are tiny metal scaffolds, yet they are loaded by pulsatile blood pressure, vessel motion and crimping or deployment forces. Choosing a stent is therefore a **solid mechanics trade-off**:

- A stent that is **too stiff** protects a weak wall but creates a stiffness jump at its ends and resists bending in moving arteries.
- A stent that is **too flexible** conforms nicely but may not carry enough load or open a hard plaque.
- A stent that is **too thin** has low radial strength and high strut stress.
- A stent that **yields** keeps a permanent set, whereas one that is **superelastic** springs back.

Aneurix lets a user choose a **medical situation** and a **stent**, then shows:

- the live **wall stress** with and without the stent,
- the **share of load** carried by the stent,
- the **stiffness mismatch** at the stent ends,
- the **lumen opening** in narrowed arteries,
- a **stress map** of the strut mesh (2D and 3D),
- **fatigue safety** under the heartbeat,
- a **ranking** of all stents for the chosen situation.

The selected situation and stent carry across every page.

---

## 2. Website Structure

| Section | Anchor | What it does |
|---|---|---|
| **Home** | `#home` | Landing page with an animated, stress-coloured 3D stent (blue = low stress, red = high stress). Drag to rotate. |
| **Simulator** | `#sim` | Pick a situation and stent. Watch the blood flow, the bulge or narrowing, and live stress readouts. |
| **Ranking** | `#rank` | Scores all eight stents across nine properties, weighted by the chosen situation. |
| **Inside the stent** | `#inside` | Stress map of the strut mesh in 2D and 3D. Squeeze, crimp or deploy it and change the strut geometry. |
| **Graph lab** | `#graphs` | Five live graphs, each with a "What you see / Trend / Theory / Meaning" analysis. |

### Simulator controls

| Control | Meaning |
|---|---|
| Situation | One of five clinical cases |
| Stent | "No stent" plus eight stent types |
| Material | Stent material (stainless steel, nitinol, cobalt-chromium, ...) |
| Opens by | Balloon-expandable or self-expanding |
| Bulge diameter | Size of the aneurysm |
| Plaque narrowing | Severity of stenosis |
| Blood pressure | Systolic loading, `P` |
| Healthy radius | Undeformed vessel radius, `r₀` |
| Healthy wall thickness | Undeformed wall thickness, `t₀` |
| Wall strength | Failure strength of the artery wall |
| Artery wall stiffness | Wall elastic modulus, `Eₐ` |
| Stent stiffness (E × thickness) | Axial stiffness of the stent layer, `Eₛtₛ` |

### Live readouts

- **Share of wall strength used** (`σ / σ_wall`)
- **Wall stress now** and **wall stress without a stent**
- **Share of the load carried by the stent**
- **Blood flow into the bulge**
- **Stiffness jump at the stent ends**
- **Percentage of the healthy diameter at the narrowest point** (stenosis)
- **Blood speed at the narrowing compared with normal**
- **Percentage open before a stent**

---

## 3. Medical Situations Modelled

| # | Situation | Dominant mechanical issue |
|---|---|---|
| 1 | **Large aortic aneurysm** | High wall stress from a large radius and thin wall; the stent graft must carry hoop load and seal the sac |
| 2 | **Brain aneurysm** (small, twisting vessel) | Tortuous, small-calibre vessel; needs a very flexible, low-profile device that diverts flow |
| 3 | **Narrowed heart artery** | Plaque must be pushed open; needs high radial strength and good drug delivery to prevent re-narrowing |
| 4 | **Narrowed leg artery that bends a lot** | Repeated bending, torsion and compression; fatigue and flexibility dominate |
| 5 | **Narrowed artery in a young patient** | Long life expectancy; a stent that disappears or avoids a permanent metal cage may be preferred |

---

## 4. Stent Types Compared

| Stent | Opens by | Typical material | Typical use | Mechanical character |
|---|---|---|---|---|
| **No stent** | n/a | n/a | Baseline | Reference case for wall stress |
| **Stent graft, stainless steel** | Balloon or self-expanding frame | 316L stainless steel + fabric | Aortic aneurysm | Stiff, strong, plastic deformation on deployment |
| **Stent graft, nitinol** | Self-expanding | NiTi + fabric | Aortic aneurysm | Superelastic, conforms to anatomy, constant outward force |
| **Stent graft, cobalt-chromium** | Balloon / frame | CoCr + fabric | Aortic aneurysm | Very high strength, thin struts possible |
| **Flow diverter** | Self-expanding | Braided nitinol / CoCr wire | Brain aneurysm | Dense, flexible mesh that reduces inflow to the sac |
| **Bare-metal stent (balloon-expandable)** | Balloon | Stainless steel / CoCr | Narrowed heart artery | High radial strength, plastic deformation, recoil |
| **Drug-eluting stent** | Balloon | CoCr / PtCr + drug polymer | Narrowed heart artery | Same scaffold mechanics, plus drug against re-narrowing |
| **Self-expanding nitinol stent (open mesh)** | Self-expanding | Nitinol | Narrowed leg artery | Superelastic, kink-resistant, fatigue-friendly |
| **Bioresorbable stent** | Balloon | Polymer or magnesium alloy | Narrowed artery in a young patient | Thicker struts, lower strength, dissolves over time |

---

## 5. Solid Mechanics Fundamentals

### 5.1 Stress

Stress is internal force per unit area.

$$
\sigma = \frac{F}{A}\qquad(\text{normal stress}), \qquad \tau = \frac{V}{A}\qquad(\text{shear stress})
$$

Units: Pa, N/m², MPa. Blood pressure uses mmHg: **1 mmHg = 133.322 Pa**, so 120 mmHg ≈ 16 kPa.

### 5.2 Strain

$$
\varepsilon = \frac{\Delta L}{L_0}\qquad\text{(engineering strain)},\qquad \gamma = \tan\phi \approx \phi\qquad\text{(shear strain)}
$$

True (logarithmic) strain for large deformation:

$$
\varepsilon_{true} = \ln\!\left(1+\varepsilon\right),\qquad \sigma_{true} = \sigma\,(1+\varepsilon)
$$

### 5.3 Hooke's law (linear elasticity)

$$
\sigma = E\,\varepsilon,\qquad \tau = G\,\gamma,\qquad G = \frac{E}{2(1+\nu)}
$$

Poisson's ratio:

$$
\nu = -\frac{\varepsilon_{lateral}}{\varepsilon_{axial}}
$$

Bulk modulus:

$$
K = \frac{E}{3(1-2\nu)}
$$

Generalised Hooke's law (isotropic, 3D):

$$
\varepsilon_{x} = \frac{1}{E}\left[\sigma_x - \nu(\sigma_y+\sigma_z)\right]
$$

### 5.4 Principal stresses and Mohr's circle (2D)

$$
\sigma_{1,2} = \frac{\sigma_x+\sigma_y}{2} \pm \sqrt{\left(\frac{\sigma_x-\sigma_y}{2}\right)^2+\tau_{xy}^2}
$$

$$
\tau_{max} = \sqrt{\left(\frac{\sigma_x-\sigma_y}{2}\right)^2+\tau_{xy}^2},\qquad \tan 2\theta_p = \frac{2\tau_{xy}}{\sigma_x-\sigma_y}
$$

### 5.5 Failure (yield) criteria

**Von Mises** (used for ductile metals such as steel, CoCr and for the stent contour map):

$$
\sigma_{vm} = \sqrt{\tfrac{1}{2}\left[(\sigma_1-\sigma_2)^2+(\sigma_2-\sigma_3)^2+(\sigma_3-\sigma_1)^2\right]}
$$

For a beam-like strut with bending/axial normal stress `σ` and shear `τ`:

$$
\boxed{\sigma_{vm} = \sqrt{\sigma^2 + 3\tau^2}}
$$

**Tresca** (maximum shear):

$$
\sigma_{Tresca} = \sigma_1 - \sigma_3
$$

**Factor of safety:**

$$
FoS = \frac{\sigma_{limit}}{\sigma_{vm}}
$$

In Aneurix the contour is plotted as `σ_vm / σ_limit`: **blue = low, red = at the material limit (1.0), purple = beyond it (1.5 and above).**

### 5.6 Bending of beams

Euler-Bernoulli beam theory:

$$
\sigma = \frac{M\,y}{I},\qquad \sigma_{max} = \frac{M}{S},\qquad S = \frac{I}{c}
$$

$$
\frac{1}{\rho} = \kappa = \frac{M}{EI},\qquad \frac{d^2 v}{dx^2} = \frac{M(x)}{EI}
$$

For a rectangular cross-section (width `w` in the bending plane, thickness `t` out of plane):

$$
I = \frac{t\,w^3}{12},\qquad S = \frac{t\,w^2}{6}
$$

### 5.7 Axial, torsion and buckling

$$
\delta = \frac{F L}{A E},\qquad \tau = \frac{T r}{J},\qquad \phi = \frac{T L}{G J}
$$

$$
P_{cr} = \frac{\pi^2 E I}{(K L)^2}\qquad\text{(Euler buckling)}
$$

### 5.8 Strain energy

$$
U = \int \frac{\sigma\,\varepsilon}{2}\,dV = \int \frac{\sigma^2}{2E}\,dV
$$

---

## 6. Mechanics of an Aneurysm

An aneurysm is a local ballooning of the artery wall. Its danger is explained by **Laplace's law for thin-walled pressure vessels**.

### 6.1 Hoop (circumferential) stress

$$
\boxed{\sigma_\theta = \frac{P\,r}{t}}
$$

Axial (longitudinal) stress in a closed vessel:

$$
\sigma_z = \frac{P\,r}{2t}
$$

For a sphere (a saccular aneurysm idealised as a spherical cap):

$$
\sigma = \frac{P\,r}{2t}
$$

Thin-wall validity: `t / r < 0.1`. For thick walls, Lamé's equations apply:

$$
\sigma_r = \frac{P_i r_i^2 - P_o r_o^2}{r_o^2-r_i^2} - \frac{(P_i-P_o) r_i^2 r_o^2}{(r_o^2-r_i^2)\,r^2}
$$

$$
\sigma_\theta = \frac{P_i r_i^2 - P_o r_o^2}{r_o^2-r_i^2} + \frac{(P_i-P_o) r_i^2 r_o^2}{(r_o^2-r_i^2)\,r^2}
$$

### 6.2 Why growth is unstable: wall thinning

The wall tissue is nearly **incompressible** and its volume is conserved as the vessel dilates:

$$
r\,t \approx r_0\,t_0\quad\Rightarrow\quad t = \frac{r_0 t_0}{r}
$$

Substituting into Laplace's law:

$$
\sigma_\theta = \frac{P\,r}{t} = \frac{P\,r^2}{r_0 t_0}
$$

**Hoop stress grows with the square of the radius.** Doubling the bulge radius quadruples the wall stress, so aneurysms can run away: bigger bulge → thinner wall → higher stress → even bigger bulge.

### 6.3 Share of wall strength used

$$
\text{utilisation} = \frac{\sigma_\theta}{\sigma_{wall}}
$$

When utilisation approaches **100 %** the wall is at risk of rupture. Aneurix reports this as *"share of wall strength used"*.

### 6.4 Cylinder with a bulge: radial stiffness of the wall

$$
k_{wall} \propto \frac{E_a\,t}{r^2}
$$

A thicker, stiffer wall (higher `Eₐt`) resists pressure more strongly. The aneurysm wall is typically **thinner and stiffer** (collagen-dominated) at large strain.

---

## 7. Stent Graft and Load Sharing

A stent graft is a covered stent bridging the aneurysm. Blood flows through the graft and the sac is excluded from pressure.

### 7.1 Two springs in parallel

The artery wall and the stent deform together (same radial displacement), so they act like **parallel springs**:

$$
k_{total} = k_{a} + k_{s}
$$

With axial-membrane stiffnesses `Eₐtₐ` and `Eₛtₛ`:

$$
\boxed{\text{wall share} = \frac{E_a t}{E_a t + E_s t_s}},\qquad
\boxed{\text{stent share} = \frac{E_s t_s}{E_a t + E_s t_s}}
$$

### 7.2 Wall stress with a stent

$$
\sigma_{wall,\,stent} = \sigma_{no\ stent}\cdot\frac{E_a t}{E_a t + E_s t_s}
$$

The stiffer the stent (`Eₛtₛ` large compared to `Eₐt`), the more load it carries and the lower the wall stress. For nitinol (E ≈ 40–75 GPa) vs. steel (≈ 200 GPa) vs. CoCr (≈ 230 GPa), a stiffer stent offloads the wall more, but at a price (see below).

### 7.3 Stiffness mismatch (compliance mismatch) at the stent ends

$$
\text{stiffness jump} = \frac{E_s t_s + E_a t}{E_a t}\quad\text{or}\quad \frac{E_s t_s}{E_a t}
$$

A large jump concentrates stress, strain and shear at the proximal and distal landing zones, which can cause **neointimal hyperplasia, endoleaks, stent migration and anastomotic failure**. This is why Aneurix shows both *"share of the load carried by the stent"* and *"stiffness jump at the stent ends"*.

### 7.4 Flow into the bulge

For a flow diverter, the mesh porosity and pore density reduce inflow to the sac:

$$
\text{porosity} = 1 - \frac{A_{metal}}{A_{surface}}
$$

Lower porosity → less inflow → stagnation and thrombosis in the sac → aneurysm occlusion. Too dense a mesh, however, is stiffer and can block side branches.

---

## 8. Mechanics of a Narrowed Artery (Stenosis)

### 8.1 Geometry

$$
\text{narrowing}\ (\%) = \frac{A_0 - A}{A_0}\times 100 = \left(1-\frac{r^2}{r_0^2}\right)\times 100
$$

$$
\text{open fraction (of healthy diameter)} = \frac{d}{d_0}
$$

### 8.2 Blood speed at the narrowing (continuity)

For incompressible flow, `Q = A v` is constant:

$$
\frac{v}{v_0} = \frac{A_0}{A} = \left(\frac{r_0}{r}\right)^2
$$

A 70 % area narrowing makes blood travel ≈ 3.3 times faster at the throat.

### 8.3 Stent as an opposing spring

The plaque pushes inward on the stent and the stent pushes outward on the plaque, like **two springs in opposition**. The lumen opens by a fraction that grows with the stent's **radial strength**:

$$
\delta_{open} = \frac{F_{radial}}{k_{plaque} + k_{stent}}\quad\Rightarrow\quad \text{opening} \propto \frac{k_{stent}}{k_{stent}+k_{plaque}}
$$

### 8.4 Radial strength of a stent

For a ring of `N` struts each carrying outward force, the pressure that a stent can resist is related to hoop equilibrium:

$$
F_{ring} = P\,R\,h\quad(\text{per ring, force per length})
$$

$$
P_{crush} \approx \frac{N\,F_{crown}\cdot 2}{2\pi R\,h}
$$

The radial strength is controlled mainly by strut width `w`, thickness `t`, strut length `L` and the number of crowns.

### 8.5 Recoil and foreshortening

$$
\text{recoil}\ (\%) = \frac{D_{inflated}-D_{deflated}}{D_{inflated}}\times 100
$$

$$
\text{foreshortening}\ (\%) = \frac{L_{crimped}-L_{expanded}}{L_{crimped}}\times 100
$$

Elastic recoil after balloon deflation is mostly due to the springback of the stent metal (`ε_elastic = σ_y / E`) and the elastic tissue response.

### 8.6 Pressure drop (Poiseuille) in the narrowed segment

$$
\Delta P = \frac{8\,\mu\,L\,Q}{\pi\,r^4}
$$

Because of the `r⁴` dependence, small gains in lumen radius give large improvements in flow.

---

## 9. Inside the Stent: Strut Mesh Mechanics

The *Inside the stent* page isolates the stent with no artery around it and colours each part of the metal by how hard it is working.

### 9.1 Stent model

Each ring is a **zigzag of beams joined at crowns**. Every strut acts as a bending beam. The bending moment is **largest at the crowns and zero at mid-strut**, so colours fade along each strut.

**Parameters** (all adjustable by sliders):

| Parameter | Symbol | Effect |
|---|---|---|
| Outside pressure | `p` | Load in the *Squeeze* case |
| Crimped diameter | `D_c` | Strain level in the *Crimp* case |
| Strut width | `w` | In-plane width, strongest effect (`w²`, `w³`) |
| Strut thickness | `t` | Radial thickness |
| Strut length | `L` | Longer struts → more flexible, higher strain |
| Stent radius | `R` | Sets the hoop load |
| Crowns per ring | `N` | More crowns share the load |

### 9.2 Loading modes

#### (a) Squeeze: external pressure on the stent

Hoop force per unit length is `p·R`; for a ring of height `h`, the total radial load is `p·2πR·h`, shared among `2N` struts' crowns:

$$
\boxed{F = \frac{p\cdot 2\pi R\cdot h}{2N}}\quad\text{(force per crown)}
$$

Bending moment in the strut (strut length `L`, inclined at angle `θ`):

$$
\boxed{M = \frac{F}{2}\,L\cos\theta}
$$

Peak bending stress at the crown:

$$
\boxed{\sigma = \frac{6M}{t\,w^2}}
$$

Because stress scales as **1/w²**, thinner struts are far weaker. Halving the strut width **quadruples** the stress.

Combined with shear `τ`, the equivalent stress is:

$$
\sigma_{vm}=\sqrt{\sigma^2+3\tau^2}
$$

Mid-strut keeps a small share from shear (`τ = 3V/2A` for a rectangle) instead of dropping to zero.

#### (b) Crimp: compressing the stent onto a catheter

Crimping forces each strut to bend through a displacement `Δ`. For a cantilever-like strut:

$$
\boxed{\varepsilon \approx \frac{3\,w\,\Delta}{L^2}}
$$

(from `ε = σ/E = M·(w/2)/(E·I)` and `Δ = F L³ / (3 E I)`). Strain rises with **w** and falls with **L²**, which is why long, slender struts survive crimping better.

#### (c) Deploy: crimped → expanded → rebound

The animation plays a full cycle, **crimped → expanded → rebound**, showing PEEQ build-up in elastic-plastic materials and recovery in superelastic ones.

### 9.3 Display metrics

| Metric | Meaning |
|---|---|
| **Stress** | Von Mises stress as a fraction of the material limit |
| **PEEQ** | Equivalent plastic strain, i.e. permanent deformation accumulated in the metal |

Equivalent plastic strain:

$$
\varepsilon_{p}^{eq}=\int \sqrt{\tfrac{2}{3}\,\dot{\varepsilon}^{p}_{ij}\dot{\varepsilon}^{p}_{ij}}\;dt
$$

### 9.4 Readout colour scale

```
Blue (0) ------ Red (1.0 = material limit) ------ Purple (1.5 and above)
 low stress        at the limit                    beyond the limit
```

### 9.5 Material behaviour summary

| Material | Elastic range | Behaviour at large strain |
|---|---|---|
| Stainless steel 316L | yields at ≈ **0.15–0.2 %** strain | Permanent set (plastic) |
| Cobalt-chromium (L605, MP35N) | yields at ≈ **0.2 %** strain | Permanent set, higher strength allows thinner struts |
| Nitinol (superelastic) | recovers strains up to ≈ **6 %** | Returns to shape on unloading |
| Polymer / Mg alloy (bioresorbable) | low modulus, low yield | Needs thicker struts; strength declines as it degrades |

> *Mesh motion is exaggerated in the squeeze case, and material values are simplified and illustrative.*

---

## 10. Material Behaviour and Stress-Strain Curves

The graph lab compares the **stress-strain curves of the stent materials**.

### 10.1 Linear elastic–plastic (steel, CoCr)

$$
\sigma =
\begin{cases}
E\,\varepsilon & \varepsilon \le \varepsilon_y\\[4pt]
\sigma_y + H\,(\varepsilon-\varepsilon_y) & \varepsilon > \varepsilon_y
\end{cases}
$$

with `H` the hardening modulus. Unloading follows slope `E` and leaves a permanent strain:

$$
\varepsilon_{permanent}=\varepsilon-\frac{\sigma}{E}
$$

### 10.2 Ramberg-Osgood (smooth curve)

$$
\varepsilon = \frac{\sigma}{E} + K\left(\frac{\sigma}{E}\right)^{n}
$$

### 10.3 Superelastic nitinol

Nitinol loads along an **upper plateau** (austenite → martensite), and unloads along a **lower plateau** (martensite → austenite), forming a **flag-shaped hysteresis loop**:

| Region | Behaviour |
|---|---|
| Linear austenite | `σ = E_A ε` |
| Upper plateau | Stress-induced transformation at `σ_UP ≈ 400–500 MPa`, almost constant stress to ≈ 6 % strain |
| Linear martensite | `σ = E_M ε` after transformation completes |
| Lower plateau | Reverse transformation at `σ_LP ≈ 150–250 MPa` |

Two important consequences:

- **Chronic outward force** (the lower plateau) is gentle and nearly constant → good for vessels.
- **Radial resistive force** (the upper plateau) is higher → resists crushing.

### 10.4 Artery wall (hyperelastic, J-shaped)

Arterial tissue is nonlinear: soft at low strain, rapidly stiffening at high strain as collagen fibres straighten. A common fit is the Fung exponential law:

$$
\sigma \approx C\left(e^{\,b\,\varepsilon}-1\right)
$$

Hence the wall stiffness `Eₐ` used in Aneurix is an **effective (tangent) modulus** at the working strain.

---

## 11. Fatigue Analysis

A stent sees roughly **40 million heartbeats per year**, so a 10-year design life means ≈ **4 × 10⁸ cycles**. Fatigue, not static strength, is often the governing criterion.

### 11.1 Stress amplitude and mean stress

$$
\sigma_a = \frac{\sigma_{max}-\sigma_{min}}{2},\qquad
\sigma_m = \frac{\sigma_{max}+\sigma_{min}}{2},\qquad
R = \frac{\sigma_{min}}{\sigma_{max}}
$$

In Aneurix:

- **Systolic pressure** = the blood-pressure slider,
- **Pulse pressure** (default 40 mmHg) sets the cyclic part,
- **Vessel motion per heartbeat** (default 0.3 %) adds cyclic strain,
- Optionally **residual stress from deployment** is included as a mean stress.

### 11.2 S-N (Basquin) curve

$$
\sigma_a = \sigma_f'\,(2N_f)^{b}
$$

### 11.3 Strain-life (Coffin-Manson, low-cycle)

$$
\frac{\Delta\varepsilon}{2}=\frac{\sigma_f'}{E}(2N_f)^b+\varepsilon_f'(2N_f)^c
$$

### 11.4 Mean stress correction: the Goodman and Gerber diagram

The **fatigue limit** (endurance limit) `S_e` applies at zero mean stress. A mean tensile stress lowers the allowable amplitude.

**Goodman (linear, conservative):**

$$
\boxed{\frac{\sigma_a}{S_e}+\frac{\sigma_m}{S_{u}}=\frac{1}{n}}
$$

**Gerber (parabolic, less conservative):**

$$
\boxed{\frac{\sigma_a}{S_e}+\left(\frac{\sigma_m}{S_{u}}\right)^{2}=\frac{1}{n}}
$$

**Soderberg (most conservative, uses yield):**

$$
\frac{\sigma_a}{S_e}+\frac{\sigma_m}{S_y}=\frac{1}{n}
$$

where `n` is the fatigue factor of safety and `S_u` is the ultimate strength. A point plotted **below the Goodman/Gerber line** is safe (infinite-life); above it, the stent is at risk of fatigue fracture.

### 11.5 Strain-based fatigue for nitinol

Because nitinol is superelastic, **strain amplitude** (not stress) is the better predictor:

$$
\varepsilon_a=\frac{\varepsilon_{max}-\varepsilon_{min}}{2},\qquad \varepsilon_m=\frac{\varepsilon_{max}+\varepsilon_{min}}{2}
$$

Typical endurance limit for nitinol: **`ε_a ≈ 0.4 %`** at 10⁷ cycles, usually plotted on a strain-amplitude vs. mean-strain diagram.

### 11.6 Miner's rule (variable-amplitude loading)

$$
D=\sum_i \frac{n_i}{N_i}\le 1
$$

### 11.7 Crack growth (Paris law)

$$
\frac{da}{dN}=C\,(\Delta K)^{m},\qquad \Delta K = Y\,\Delta\sigma\sqrt{\pi a}
$$

### 11.8 Factors that reduce stent fatigue life

- stress concentration at crowns (`K_t > 1`),
- surface defects and corrosion (pitting),
- deployment over-expansion and residual stress,
- bending, torsion and axial compression in leg arteries,
- overlapping stents and fretting.

---

## 12. Flexibility: Bending Moment vs Curvature

Flexibility determines whether a stent can follow a twisting brain vessel or a bending knee artery without kinking.

### 12.1 Linear region

$$
M = EI\,\kappa
$$

The slope `EI` is the **bending stiffness**. For a stent, `EI` should be effectively the sum over all struts and links. A lower `EI` means a more flexible stent.

### 12.2 Beyond yield

For an elastic-plastic section, the moment saturates at the **plastic moment**:

$$
M_y=\sigma_y\,S,\qquad M_p=\sigma_y\,Z,\qquad Z=\frac{t\,w^2}{4}\ \text{(rectangle)},\qquad \text{shape factor}=\frac{M_p}{M_y}=1.5
$$

Beyond `M_y`, curvature increases rapidly with little extra moment, and the stent keeps a permanent bend.

### 12.3 Nitinol

Shows a **plateau** in the `M–κ` curve (transformation), i.e. the stent can bend a lot with a nearly constant moment and then fully recover.

### 12.4 Design implications

| Goal | Design choice |
|---|---|
| Flexible stent for bending arteries | Longer, thinner struts and open-cell design (`EI ∝ t w³ / L`) |
| High radial strength | Thicker, wider struts and closed cells |
| Kink resistance | Superelastic material, open mesh |
| Flow diverter in tortuous brain vessels | Braided fine wires with low individual `EI` |

---

## 13. Stent Ranking Method

Each stent has a rating for **nine properties**, scored on a simple scale. The medical situation then **weights** how much each property matters.

### 13.1 Weighted score

$$
S_j=\sum_{i=1}^{9} w_i^{(situation)}\;r_{ij}\qquad\text{with}\qquad \sum_i w_i = 1
$$

- `r_ij` = rating of stent `j` on property `i`,
- `w_i` = importance of property `i` in the chosen situation.

### 13.2 Example weighting logic

| Situation | Properties that matter most |
|---|---|
| Large aortic aneurysm | Load sharing, sealing, strength, durability |
| Brain aneurysm | Flexibility, low profile, flow diversion, trackability |
| Narrowed heart artery | Radial strength, recoil, drug delivery, deliverability |
| Narrowed leg artery | Fatigue resistance, flexibility, kink resistance |
| Narrowed artery in a young patient | Long-term outcome, absence of permanent implant, healing |

The **"Use the best stent for this situation"** button selects the highest-scoring stent automatically.

> Ratings, weights and stiffness values are illustrative teaching numbers, not clinical advice.

---

## 14. Graph Lab

Five live graphs, each updated from the simulator sliders and each followed by an analysis block (**What you see / Trend / Theory / Meaning**).

| # | Graph | Equation behind it | Key lesson |
|---|---|---|---|
| 1 | **Wall stress vs bulge diameter, with and without stents** | `σ = P r² / (r₀ t₀)` and `σ_stent = σ · Eₐt / (Eₐt + Eₛtₛ)` | Stress rises quadratically with the radius; a stiffer stent lowers wall stress |
| 2 | **Stress-strain curves of the stent materials** | Elastic-plastic and superelastic laws (Section 10) | Steel and CoCr yield and keep a permanent set; nitinol recovers up to ≈ 6 % |
| 3 | **Peak crown stress vs strut width** | `σ = 6M / (t w²)` | Stress ∝ `1/w²`, so thin struts are far weaker |
| 4 | **Fatigue: Goodman and Gerber diagram** | Section 11.4 | Compare operating point (σₘ, σₐ) with the safe envelope |
| 5 | **Flexibility: bending moment vs curvature** | `M = EIκ` and `M_p = σ_y Z` | Stiffer stents carry more load but bend less |

Shared sliders:

- **Strut width** and **strut thickness** (the same sliders as on *Inside the stent*; moving one moves the other),
- **Pulse pressure** (default 40 mmHg),
- **Vessel motion per heartbeat** (default 0.3 %),
- **Include the residual stress left by deployment** (checkbox),
- Fatigue criterion: **Goodman** or **Gerber**.

The **material** comes from the stent chosen in the simulator, and the fatigue graph uses the **blood pressure slider as systolic pressure**.

---

## 15. Formula Cheat Sheet

| Topic | Formula |
|---|---|
| Normal stress | $\sigma = F/A$ |
| Engineering strain | $\varepsilon = \Delta L/L_0$ |
| Hooke's law | $\sigma = E\varepsilon$ |
| Shear modulus | $G = E/[2(1+\nu)]$ |
| Von Mises | $\sigma_{vm}=\sqrt{\sigma^2+3\tau^2}$ |
| Principal stresses | $\sigma_{1,2}=\frac{\sigma_x+\sigma_y}{2}\pm\sqrt{(\frac{\sigma_x-\sigma_y}{2})^2+\tau_{xy}^2}$ |
| Beam bending stress | $\sigma = My/I$ |
| Rectangular section | $I = tw^3/12,\ S=tw^2/6$ |
| Curvature | $\kappa = M/EI$ |
| Hoop stress (thin cylinder) | $\sigma_\theta = Pr/t$ |
| Axial stress (closed cylinder) | $\sigma_z = Pr/2t$ |
| Sphere | $\sigma = Pr/2t$ |
| Wall thinning (incompressible) | $t = r_0t_0/r$ |
| Hoop stress with thinning | $\sigma_\theta = Pr^2/(r_0t_0)$ |
| Wall share with a stent | $E_at/(E_at+E_st_s)$ |
| Stent share | $E_st_s/(E_at+E_st_s)$ |
| Force per crown (squeeze) | $F = p\cdot2\pi Rh/2N$ |
| Strut moment | $M=(F/2)L\cos\theta$ |
| Peak strut stress | $\sigma = 6M/(tw^2)$ |
| Crimp strain | $\varepsilon\approx 3w\Delta/L^2$ |
| Flow speed in stenosis | $v/v_0 = (r_0/r)^2$ |
| Poiseuille pressure drop | $\Delta P = 8\mu LQ/(\pi r^4)$ |
| Goodman | $\sigma_a/S_e+\sigma_m/S_u=1/n$ |
| Gerber | $\sigma_a/S_e+(\sigma_m/S_u)^2=1/n$ |
| Basquin | $\sigma_a=\sigma_f'(2N_f)^b$ |
| Paris law | $da/dN = C(\Delta K)^m$ |
| Plastic moment | $M_p=\sigma_yZ$ |
| Pressure unit | $1\ \text{mmHg}=133.322\ \text{Pa}$ |

---

## 16. Assumptions and Limitations

- Walls are modelled as **thin-walled, axisymmetric, incompressible** shells; real arteries are layered, anisotropic and viscoelastic.
- Blood is treated through pressure and a simplified flow relation; there is no full CFD (no wall shear stress or turbulence model).
- The stent is an **idealised zigzag beam model**; real stents have connectors, varying strut widths and complex cell geometry that would normally be analysed by finite element analysis.
- Material curves are **simplified** (bilinear and flag-shaped).
- The brain case is drawn at the same scale as the others for simplicity.
- Ratings, weights and stiffness values are **illustrative teaching numbers**.
- No patient-specific anatomy, calcification, residual stress in the tissue, or long-term healing and remodelling is included.

---

## 17. Glossary

| Term | Meaning |
|---|---|
| **Aneurysm** | Local bulging of an artery wall |
| **Stenosis** | Narrowing of an artery, often by plaque |
| **Stent** | Small metal (or polymer) scaffold that holds a vessel open |
| **Stent graft** | Stent covered with fabric to exclude an aneurysm |
| **Flow diverter** | Dense braided stent that redirects blood from a brain aneurysm |
| **Bare-metal stent (BMS)** | Uncoated metal stent |
| **Drug-eluting stent (DES)** | Stent coated with a drug-releasing polymer |
| **Bioresorbable stent** | Stent that dissolves over time |
| **Balloon-expandable** | Stent opened by inflating a balloon (plastic deformation) |
| **Self-expanding** | Stent that springs open when released (superelastic) |
| **Strut / crown / ring** | Beam element / bend joining two struts / zigzag loop around the circumference |
| **Hoop stress** | Circumferential stress in a pressurised vessel |
| **Von Mises stress** | Equivalent stress for yield and failure assessment |
| **PEEQ** | Equivalent plastic strain |
| **Radial strength** | Resistance of a stent to being crushed |
| **Recoil** | Elastic springback after deployment |
| **Foreshortening** | Reduction in stent length on expansion |
| **Superelasticity** | Recoverable large strain through a phase transformation |
| **Compliance mismatch** | Stiffness difference between stent and artery |
| **Endoleak** | Leakage of blood into the aneurysm sac after stenting |
| **Goodman / Gerber** | Mean-stress fatigue criteria |

---

## 18. Running Locally and Deploying

The site is a static web page and runs entirely in the browser.

```bash
# clone the repository
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

# open directly in a browser
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows

# or serve locally
python -m http.server 8000
# then visit http://localhost:8000
```

### Deploy on GitHub Pages

1. Push the files to a repository named `<your-username>.github.io`.
2. Go to **Settings → Pages**.
3. Choose the `main` branch and `/ (root)` as the source.
4. Your site will be live at `https://<your-username>.github.io`.

---

## 19. Disclaimer

Aneurix is an **educational tool** that illustrates solid mechanics concepts. It is **not** a medical device and does **not** provide clinical advice. Real stent selection depends on many more factors, including anatomy, lesion type, patient condition, regulatory approval and physician judgement.

---

## Authors

Created by the Aneurix team. 🔗 https://laharii226.github.io

*Aneurix · Where engineering meets the artery.*
