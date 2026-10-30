const $=i=>document.getElementById(i),V=i=>parseFloat($(i).value);
const f=(v,d=3)=>!isFinite(v)?'–':(v!==0&&(Math.abs(v)>=1e5||Math.abs(v)<1e-3))?v.toExponential(2):String(+v.toFixed(d));
const MATS={'ASTM A36 steel':[200000,.26,250,400,7850],'6061-T6 aluminium':[68900,.33,276,310,2700],'Ti-6Al-4V annealed':[113800,.342,880,950,4430],'Custom':null};
const PRE={'Hollow cantilever, eccentric load':{sec:'rhs',Lg:1000,W:60,H:100,t:4,mat:'ASTM A36 steel',Fy:1000,Fx:0,T0:0,e:30},
'Solid shaft under torque':{sec:'circ',Lg:800,W:40,H:40,t:4,mat:'ASTM A36 steel',Fy:0,Fx:0,T0:500000,e:0},
'Channel loaded at centroid':{sec:'chan',Lg:1000,W:50,H:100,t:5,mat:'6061-T6 aluminium',Fy:500,Fx:0,T0:0,e:0},
'Solid rectangular beam':{sec:'rect',Lg:600,W:40,H:80,t:4,mat:'6061-T6 aluminium',Fy:2000,Fx:0,T0:0,e:0}};
// ---------- section properties (polygon integration, loops: outer CCW, holes CW) ----------
function props(Ls){let A=0,Sz=0,Sy=0,Iz=0,Iy=0;for(const p of Ls)for(let i=0;i<p.length;i++){const[z1,y1]=p[i],[z2,y2]=p[(i+1)%p.length],c=z1*y2-z2*y1;
A+=c/2;Sz+=(z1+z2)*c/6;Sy+=(y1+y2)*c/6;Iz+=(y1*y1+y1*y2+y2*y2)*c/12;Iy+=(z1*z1+z1*z2+z2*z2)*c/12}
const cz=Sz/A,cy=Sy/A;return{A,cz,cy,Iz:Iz-A*cy*cy,Iy:Iy-A*cz*cz}}
const rc=(w,h)=>[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]],ci=d=>Array.from({length:72},(_,i)=>[d/2*Math.cos(i*Math.PI/36),d/2*Math.sin(i*Math.PI/36)]);
function solve(){
 const s=$('sec').value,L=V('Lg'),W=V('W'),H=s==='circ'||s==='chs'?V('W'):V('H'),t=V('t'),E=V('E'),nu=V('nu'),sy=V('sy'),su=V('su'),rho=V('rho');
 const P=V('Fy')||0,Nx=V('Fx')||0,T0=V('T0')||0,e=V('e')||0;
 for(const[k,v]of Object.entries({L,W,H,E,sy,su,rho}))if(!(v>0))return{err:'Enter a positive value for '+k+'.'};
 if(!(nu>-1&&nu<.5))return{err:'Poisson ratio must be between -1 and 0.5.'};
 const hol=s==='rhs'||s==='chs'||s==='chan';if(hol&&!(t>0))return{err:'Wall thickness must be positive.'};
 if(s==='rhs'&&2*t>=Math.min(W,H))return{err:'Wall thickness must be less than half the smaller outer dimension.'};
 if(s==='chs'&&2*t>=W)return{err:'Inner diameter must be positive: reduce t or raise D.'};
 if(s==='chan'&&(t>=W||2*t>=H))return{err:'Channel thickness is too large for the flange or web.'};
 let raw=[],circ=s==='circ'||s==='chs',zsc=0,J,tauT,pj={};
 if(s==='rect')raw=[rc(W,H)];if(s==='rhs')raw=[rc(W,H),rc(W-2*t,H-2*t).reverse()];
 if(s==='circ')raw=[ci(W)];if(s==='chs')raw=[ci(W),ci(W-2*t).reverse()];
 if(s==='chan')raw=[[[0,0],[W,0],[W,t],[t,t],[t,H-t],[W,H-t],[W,H],[0,H]]];
 const p=props(raw);let A=p.A,Iz=p.Iz,Iy=p.Iy;
 if(circ){const d=s==='chs'?W-2*t:0;A=Math.PI/4*(W*W-d*d);Iz=Iy=Math.PI/64*(W**4-d**4);J=Math.PI/32*(W**4-d**4);tauT=1}
 const loops=raw.map(l=>l.map(q=>[q[0]-p.cz,q[1]-p.cy]));
 if(s==='rhs'){const Am=(W-t)*(H-t),sl=2*(W-t+H-t);J=4*Am*Am*t/sl;tauT=1/(2*Am*t)}
 if(s==='rect'){const a=Math.max(W,H),b=Math.min(W,H);J=a*b**3*(1/3-.21*b/a*(1-b**4/(12*a**4)));tauT=(3*a+1.8*b)/(a*a*b*b)}
 if(s==='chan'){const b=W-t/2,h=H-t,ec=3*b*b/(h+6*b);zsc=t/2-ec-p.cz;J=(H+2*W)*t**3/3;tauT=t/J}
 if(circ)tauT=null;
 const T=T0+P*(e-zsc),G=E/(2*(1+nu)),ymax=Math.max(...loops[0].map(q=>Math.abs(q[1]))),rmax=Math.max(...loops[0].map(q=>Math.hypot(q[0],q[1])));
 const tauMax=circ?T*W/2/J:T*tauT;
 return{s,L,W,H,t,E,nu,G,sy,su,rho,P,Nx,T0,e,A,Iz,Iy,J,zsc,loops,T,ymax,rmax,circ,tauMax,tc:circ?null:T*tauT,cz:p.cz,
  tipw:P*L**3/(3*E*Iz),th:T*L/(G*J),u:Nx*L/(A*E),M0:P*L,mass:rho*1e-9*A*L,hol}}
let S,geo,mesh,ghost,base=[],idx=[],pIdx=null,sc,cam,ren,ctl,gArr,marker,NR=48;
const st=(b)=>{const[x,y,z]=b,sx=S.Nx/S.A+S.P*(S.L-x)*y/S.Iz,tau=S.circ?S.T*Math.hypot(y,z)/S.J:S.tc;return{sx,tau,vm:Math.hypot(sx,Math.sqrt(3)*tau)}};
const disp=([x,y,z],m)=>{const w=S.P*x*x*(3*S.L-x)/(6*S.E*S.Iz),u=S.Nx*x/(S.A*S.E),th=S.T*x/(S.G*S.J),dz=z-S.zsc,c=Math.cos(th*m),s=Math.sin(th*m);
 return[x+u*m,dz*s+y*c-w*m,S.zsc+dz*c-y*s]};
function auto(){const a=[.12*S.L/Math.max(Math.abs(S.tipw),1e-9),.5/Math.max(Math.abs(S.th),1e-9),5000];return Math.min(...a)}
const mag=()=>$('def').checked?auto()*V('mg')/100:0;
function init(){
 const el=$('c');ren=new THREE.WebGLRenderer({antialias:true});el.appendChild(ren.domElement);ren.setPixelRatio(devicePixelRatio);
 sc=new THREE.Scene();sc.background=new THREE.Color(0x0b1220);cam=new THREE.PerspectiveCamera(40,1,1,1e5);
 ctl=new THREE.OrbitControls(cam,ren.domElement);ctl.enableDamping=true;
 sc.add(new THREE.HemisphereLight(0xffffff,0x223355,.8));const d=new THREE.DirectionalLight(0xffffff,.9);d.position.set(1,2,1.5);sc.add(d);
 gArr=new THREE.Group();sc.add(gArr);
 marker=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),new THREE.MeshBasicMaterial({color:0xffffff}));marker.visible=false;sc.add(marker);
 new ResizeObserver(()=>{const r=$('V').getBoundingClientRect();ren.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()}).observe($('V'));
 const rc2=new THREE.Raycaster(),mv=new THREE.Vector2();let dn;
 ren.domElement.onpointerdown=e=>dn=[e.clientX,e.clientY];
 ren.domElement.onpointerup=e=>{if(!dn||Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>4||!mesh)return;const r=ren.domElement.getBoundingClientRect();
  mv.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);rc2.setFromCamera(mv,cam);const h=rc2.intersectObject(mesh)[0];if(!h)return;
  const pa=geo.attributes.position,q=h.point;let best=1e18;for(const i of[h.face.a,h.face.b,h.face.c]){const dd=(pa.getX(i)-q.x)**2+(pa.getY(i)-q.y)**2+(pa.getZ(i)-q.z)**2;if(dd<best){best=dd;pIdx=i}}probe()};
 (function loop(){requestAnimationFrame(loop);ctl.update();ren.render(sc,cam)})();
}
function build(){
 S=solve();$('err').textContent=S.err||'';if(S.err){$('rt').innerHTML='';$('stat').innerHTML='';$('math').textContent=S.err;return}
 if(mesh){sc.remove(mesh,ghost)}
 base=[];idx=[];const L=S.L,n=NR;
 S.loops.forEach(p=>{const o=base.length,m=p.length;for(let k=0;k<=n;k++)for(const q of p)base.push([L*k/n,q[1],q[0]]);
  for(let k=0;k<n;k++)for(let j=0;j<m;j++){const a=o+k*m+j,b=o+k*m+(j+1)%m,c=a+m,d=b+m;idx.push(a,c,b,b,c,d)}});
 for(const xc of[0,L]){const sh=new THREE.Shape(S.loops[0].map(q=>new THREE.Vector2(q[0],q[1])));
  S.loops.slice(1).forEach(h=>sh.holes.push(new THREE.Path(h.map(q=>new THREE.Vector2(q[0],q[1])))));
  const g=new THREE.ShapeGeometry(sh),pa=g.attributes.position,o=base.length;for(let i=0;i<pa.count;i++)base.push([xc,pa.getY(i),pa.getX(i)]);
  Array.from(g.index.array).forEach(i=>idx.push(o+i))}
 geo=new THREE.BufferGeometry();geo.setIndex(idx);geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(base.length*3),3));
 geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(base.length*3),3));
 mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,flatShading:true,roughness:.55,metalness:.1}));
 const gg=new THREE.BufferGeometry();gg.setIndex(idx);gg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(base.flat()),3));
 ghost=new THREE.Mesh(gg,new THREE.MeshBasicMaterial({color:0x6b8bb8,wireframe:true,transparent:true,opacity:.18}));
 sc.add(mesh,ghost);
 S.vmMax=Math.max(...base.map(b=>st(b).vm));
 gArr.clear();const wall=new THREE.Mesh(new THREE.BoxGeometry(L*.02,S.ymax*4,S.rmax*4),new THREE.MeshStandardMaterial({color:0x334766}));wall.position.x=-L*.01;gArr.add(wall);
 const ax=new THREE.AxesHelper(L*.15);gArr.add(ax);
 const ar=Math.max(L*.12,S.ymax*2);
 if(S.P)gArr.add(new THREE.ArrowHelper(new THREE.Vector3(0,-Math.sign(S.P),0),new THREE.Vector3(L,S.P>0?S.ymax+ar:-S.ymax-ar,S.e-S.cz),ar,0xfb923c,ar*.25,ar*.15));
 if(S.Nx)gArr.add(new THREE.ArrowHelper(new THREE.Vector3(Math.sign(S.Nx),0,0),new THREE.Vector3(L+(S.Nx<0?ar:0),0,0),ar,0x22d3ee,ar*.25,ar*.15));
 if(S.T){const r=new THREE.Mesh(new THREE.TorusGeometry(S.rmax*1.5,S.rmax*.05,8,40,4.7),new THREE.MeshBasicMaterial({color:0xf472b6}));r.rotation.y=Math.PI/2;r.position.x=L;gArr.add(r)}
 pIdx=null;marker.visible=false;update();report();
}
function fit(v){const L=S.L,c=cam,d=L*1.5,o={iso:[L/2+d*.4,d*.55,d*.8],front:[L/2,0,d*1.4],top:[L/2,d*1.4,.01],side:[L+d*1.4,0,0]}[v];c.position.set(...o);ctl.target.set(L/2,0,0);ctl.update()}
function update(){
 if(!S||S.err)return;const m=mag(),k=$('fld').value,pa=geo.attributes.position,ca=geo.attributes.color,vals=[];
 base.forEach((b,i)=>{const d=disp(b,m);pa.setXYZ(i,...d);let v;const s=st(b);
  if(k==='vm')v=s.vm;else if(k==='sx')v=s.sx;else if(k==='tau')v=Math.abs(s.tau);else{const d1=disp(b,1);v=Math.hypot(d1[0]-b[0],d1[1]-b[1],d1[2]-b[2])}vals.push(v)});
 const lo=k==='sx'?Math.min(...vals):0,hi=Math.max(...vals,lo+1e-12),c=new THREE.Color();
 vals.forEach((v,i)=>{c.setHSL((1-(v-lo)/(hi-lo))*.66,.85,.5);ca.setXYZ(i,c.r,c.g,c.b)});
 pa.needsUpdate=ca.needsUpdate=true;geo.computeBoundingSphere();mesh.material.wireframe=$('wire').checked;ghost.visible=$('def').checked;
 const u=k==='dis'?'mm':'MPa';$('lgt').textContent={vm:'Von Mises',sx:'Normal stress σx',tau:'Torsional shear |τ|',dis:'Displacement magnitude'}[k]+' ('+u+')';
 $('lo').textContent=f(lo);$('hi').textContent=f(hi);$('mgv').textContent=m?'×'+f(m,1):'×0';
 if(pIdx!==null){const q=pa;marker.position.set(q.getX(pIdx),q.getY(pIdx),q.getZ(pIdx));marker.scale.setScalar(S.rmax*.08);marker.visible=true}
}
function report(){
 const n=S.sy/S.vmMax,tipDef=S.tipw,rows=[['Area A',f(S.A)+' mm²'],['Centroid from left face',f(S.cz)+' mm'],['Iz (bending, about z)',f(S.Iz)+' mm⁴'],['Torsion constant J',f(S.J)+' mm⁴'],
 ['Shear centre z (from centroid)',f(S.zsc)+' mm'],['Net torque at tip',f(S.T)+' N·mm'],['Root bending moment',f(S.M0)+' N·mm'],['Tip deflection',f(tipDef)+' mm'],
 ['Tip twist',f(S.th*180/Math.PI)+' °'],['Tip axial extension',f(S.u,4)+' mm'],['Max von Mises (root)',f(S.vmMax)+' MPa'],['Max torsional shear',f(Math.abs(S.tauMax))+' MPa'],
 ['Factor of safety (yield)',f(n)],['Mass',f(S.mass)+' kg']];
 $('rt').innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
 let h=n>=1?`<div class="st ok">Within the von Mises yield criterion (FoS ${f(n,2)}).</div>`:`<div class="st bad">Criterion exceeded: von Mises stress is above yield.</div>`;
 if(S.s==='chan'&&Math.abs(S.e-S.zsc)>.01)h+=`<div class="st warn">Load line is ${f(Math.abs(S.e-S.zsc))} mm from the shear centre, so the channel twists as well as bends.</div>`;
 if(S.s==='chan')h+=`<div class="st warn">Channel torsion uses the open thin-wall approximation and ignores warping restraint at the root.</div>`;
 if(S.s==='rect')h+=`<div class="st warn">Rectangular torsion uses an approximate J and τmax (Roark-type formulas).</div>`;
 $('stat').innerHTML=h;
 let ft='';const nb=S.Nx<0?Math.PI**2*S.E*Math.min(S.Iz,S.Iy)/(4*S.L**2):null;
 ft+=`<p><b>Static:</b> ${n>=1?'within':'exceeds'} yield criterion. Ultimate check: ${S.vmMax<S.su?'below':'above'} σu (${f(S.su)} MPa).</p>`;
 ft+=nb?`<p><b>Buckling (Euler, cantilever, K=2):</b> Pcr = ${f(nb)} N; applied ${f(-S.Nx)} N → ratio ${f(-S.Nx/nb)}.</p>`:'<p><b>Buckling:</b> not checked (no compressive axial load).</p>';
 const R=V('R'),Se=V('Se');
 if(Se>0){const sa=(1-R)/2*S.vmMax,sm=(1+R)/2*S.vmMax,nf=1/(sa/Se+sm/S.su);ft+=`<p><b>Fatigue (Goodman, infinite life):</b> σa=${f(sa)}, σm=${f(sm)} MPa → n = ${f(nf,2)}. ${nf>=1?'Within the criterion.':'Criterion exceeded; finite life, S–N data required.'}</p>`}
 else ft+='<p><b>Fatigue:</b> insufficient data. Enter an endurance limit Se (and S–N data for finite life).</p>';
 ft+='<small>Constant load below the static limit does not imply a finite time to failure. No creep model is included; educational estimates only.</small>';
 $('ft').innerHTML=ft;
 $('math').textContent=
`Section: A = ${f(S.A)} mm², Iz = ${f(S.Iz)} mm⁴ (polygon integration${S.circ?'; circles use closed forms':''}), G = E/(2(1+ν)) = ${f(S.G)} MPa
Bending (Euler–Bernoulli):  σx = N/A + M(x)·y/Iz,  M(x) = Fy(L−x)
   M(0) = ${f(S.P)}×${f(S.L)} = ${f(S.M0)} N·mm;  y_max = ${f(S.ymax)} mm → σ_bend = ${f(S.M0*S.ymax/S.Iz)} MPa;  N/A = ${f(S.Nx/S.A)} MPa
Deflection:  w(L) = Fy·L³/(3·E·Iz) = ${f(S.P)}×${f(S.L)}³/(3×${f(S.E)}×${f(S.Iz)}) = ${f(S.tipw)} mm
Eccentric torque:  T = T0 + Fy(e − z_sc) = ${f(S.T0)} + ${f(S.P)}×(${f(S.e)} − ${f(S.zsc)}) = ${f(S.T)} N·mm
Twist:  θ = T·L/(G·J) = ${f(S.T)}×${f(S.L)}/(${f(S.G)}×${f(S.J)}) = ${f(S.th,5)} rad = ${f(S.th*180/Math.PI)}°
Von Mises:  σvm = √(σx² + 3τ²).  Mass = ρ·A·L = ${f(S.mass)} kg
Assumptions: linear elastic, small deformation, prismatic member, Saint-Venant torsion, transverse shear (VQ/Ib) and stress concentrations not included.
Shear centre: ${S.s==='chan'?'thin-walled channel, e = 3b²/(h+6b) from web centreline (outside the material, on the web side)':'doubly symmetric section, shear centre = centroid'}.
Fixed-end peak stresses are idealised (no local singularity/support effects).`}
function probe(){
 if(pIdx===null){return}const b=base[pIdx],s=st(b),E=S.E,nu=S.nu,half=s.sx/2,R=Math.hypot(half,s.tau),s1=half+R,s2=half-R;
 const d=disp(b,1),e1=(s1-nu*s2)/E,e2=(s2-nu*s1)/E,e3=-nu*(s1+s2)/E,tm=Math.max(Math.abs(s1),Math.abs(s2),Math.abs(s1-s2))/2;
 $('pr').innerHTML=`<table>${[['Location x, y, z (mm)',[b[0],b[1],b[2]].map(v=>f(v,1)).join(', ')],['σx',f(s.sx)+' MPa'],['τ (torsion)'+(S.circ?'':' *'),f(s.tau)+' MPa'],['σ1 / σ2',f(s1)+' / '+f(s2)+' MPa'],
 ['τ max (3D)',f(tm)+' MPa'],['Von Mises',f(s.vm)+' MPa'],['Factor of safety',f(S.sy/Math.max(s.vm,1e-9),2)],['εx',f(s.sx/E,6)],['γ',f(s.tau/S.G,6)],['ε1 / ε2 / ε3',[e1,e2,e3].map(v=>f(v,6)).join(' / ')],
 ['Displacement u, v, w (mm)',[d[0]-b[0],d[1]-b[1],d[2]-b[2]].map(v=>f(v,3)).join(', ')],['Distance to centroid',f(Math.hypot(b[1],b[2]))+' mm'],['Distance to shear centre',f(Math.hypot(b[1],b[2]-S.zsc))+' mm']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>
 <small>Analytic value at the nearest mesh node, not a finite-element result. Sign: σx&gt;0 is tension.${S.circ?'':' * Non-circular τ is the section-maximum estimate, uniform over the surface.'} Transverse shear is not included.</small>`;update()}
// ---------- UI wiring ----------
function setMat(){const m=MATS[$('mat').value];if(m)['E','nu','sy','su','rho'].forEach((k,i)=>$(k).value=m[i])}
function ready(){$('wl').textContent=['circ','chs'].includes($('sec').value)?'Diameter D':'Width b';$('H').disabled=['circ','chs'].includes($('sec').value);$('t').disabled=['rect','circ'].includes($('sec').value)}
function tests(){const r=[],ck=(n,a,b)=>r.push((Math.abs(a-b)/Math.abs(b)<.005?'PASS ':'FAIL ')+n+' '+f(a)+' vs '+f(b));
 ck('Rect Iz',props([rc(40,80)]).Iz,40*80**3/12);ck('RHS Iz',props([rc(60,100),rc(52,92).reverse()]).Iz,(60*100**3-52*92**3)/12);
 ck('Circle Iz (72-gon)',props([ci(50)]).Iz,Math.PI*50**4/64);const sg=5e1,ta=2e1;ck('Principal σ1²−σ1σ2+σ2² = σx²+3τ²/…',(sg/2+Math.hypot(sg/2,ta))**2-(sg/2+Math.hypot(sg/2,ta))*(sg/2-Math.hypot(sg/2,ta))+(sg/2-Math.hypot(sg/2,ta))**2,sg*sg+3*ta*ta);
 $('tout').textContent=r.join('\n')}
function csv(){if(!S||S.err)return;const rows=[['quantity','value']].concat([...$('rt').querySelectorAll('tr')].map(t=>[...t.children].map(c=>c.textContent)));
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'}));a.download='tensora_results.csv';a.click()}
window.onload=()=>{
 $('mat').innerHTML=Object.keys(MATS).map(k=>`<option>${k}</option>`).join('');
 $('pre').innerHTML=Object.keys(PRE).map(k=>`<button>${k}</button>`).join('');
 [...$('pre').children].forEach(b=>b.onclick=()=>{const p=PRE[b.textContent];for(const k in p)$(k).value=p[k];setMat();ready();build();fit('iso')});
 $('mat').onchange=()=>{setMat();build()};
 ['E','nu','sy','su','rho'].forEach(k=>$(k).addEventListener('input',()=>$('mat').value='Custom'));
 document.querySelectorAll('#L input,#L select').forEach(x=>x.addEventListener('input',()=>{if(x.id!=='mat'){ready();build()}}));
 ['fld','def','wire','mg'].forEach(k=>$(k).addEventListener('input',update));
 document.querySelectorAll('.tb [data-v]').forEach(b=>b.onclick=()=>fit(b.dataset.v));
 document.querySelectorAll('#stages button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#stages button').forEach(x=>x.classList.remove('on'));b.classList.add('on');$(b.dataset.s).scrollIntoView({behavior:'smooth',block:'nearest'})});
 $('tst').onclick=tests;$('csv').onclick=csv;
 init();const p=PRE['Hollow cantilever, eccentric load'];for(const k in p)$(k).value=p[k];setMat();ready();build();fit('iso');
};
