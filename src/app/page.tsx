"use client";
import {
  Color,
  Vector2,
  Raycaster,
  Clock,
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
  Vector3,
  CatmullRomCurve3,
  SRGBColorSpace,
  BufferGeometry,
  Float32BufferAttribute,
  CapsuleGeometry,
  MeshStandardMaterial,
  DirectionalLight,
  Line,
  Euler,
  BufferAttribute,
  LineBasicMaterial,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";
const { GPUStatsPanel } = require("three/examples/jsm/utils/GPUStatsPanel.js");
// import {GPUStatsPanel} from 'three/examples/jsm/utils/GPUStatsPanel.js';

import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { useEffect, useRef } from "react";

export default function Home() {
  let line: any, thresholdLine: any, segments: any, thresholdSegments: any;
  let renderer: any, scene: any, camera: any, controls: any;
  let sphereInter: any, sphereOnLine: any;
  let stats: any, gpuPanel: any;
  let gui;
  let clock: any;
  let bobbin: Mesh;

  let aglo1data: any[] = [];

  let lineContainer = useRef<HTMLDivElement>(null);

  const color = new Color();

  const pointer = new Vector2(Infinity, Infinity);

  const raycaster = new Raycaster();

  raycaster.params.Line2 = { threshold: 0 } as any;

  let rotateV = 10;
  let stepHeight = 0.01;
  let stepWidth = 0.2;

  let dLine: Line;
  let DRAW_COUNT = 30000;
  let cengcount = 0;
  const planR = 5;

  let canRestartFlag = false;

  const params = {
    // "line type": 0,
    // "world units": matLine.worldUnits,
    // "visualize threshold": matThresholdLine.visible,
    // width: matLine.linewidth,
    // alphaToCoverage: matLine.alphaToCoverage,
    "速度": rotateV,
    "线的半径增加宽度": stepWidth,
    animate: true,
  };

  useEffect(() => {
    init();
    animate();
  }, []);

  // init();
  // animate();

  function init() {
    clock = new Clock();
	cengcount = 0;

    renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
	if(lineContainer?.current) {
		while (lineContainer.current.firstChild) {
			lineContainer.current.removeChild(lineContainer.current.firstChild);
		};
		lineContainer.current.appendChild(renderer.domElement);
	} else {
		document.body.appendChild(renderer.domElement);
	}
    

    scene = new Scene();

    camera = new PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.set(-40, 0, 60);

	addLights();

    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 10;
    controls.maxDistance = 500;


	// 细纺
	createBobbin();
	createLine();

    // const geo = new BufferGeometry();
    // geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    // geo.setAttribute("color", new Float32BufferAttribute(colors, 3));

    //

    // document.addEventListener("pointermove", onPointerMove);
    window.addEventListener("resize", onWindowResize);
    onWindowResize();

    stats = new Stats();
    document.body.appendChild(stats.dom);

    gpuPanel = new GPUStatsPanel(renderer.getContext());
    stats.addPanel(gpuPanel);
    stats.showPanel(0);
    initGui();
	aglo1data = generateHeightWeightSegments().sort((a: any,b: any) => a.w - b.w);
	console.log('test: ', aglo1data);
	
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    // renderer will set this eventually
    // matLine.resolution.set(window.innerWidth, window.innerHeight);
    // matThresholdLine.resolution.set(window.innerWidth, window.innerHeight);
  }

  function onPointerMove(event: any) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  let currentP = 1;
  function animate() {
    requestAnimationFrame(animate);

    stats.update();

    const delta = clock.getDelta();

    // if (params.animate) {
    //   line.rotation.y += delta * 0.1;

    //   segments.rotation.y = line.rotation.y;
    // }
	if (params.animate) {
		if (bobbin) {
			bobbin.rotateY(-delta);
			if (currentP <= DRAW_COUNT) {
				updatePositions(currentP++, delta);
			} else {
				canRestartFlag = true;
			}
	
			dLine.geometry.attributes.position.needsUpdate = true;
			
		}
	}
	

    gpuPanel.startQuery();
    renderer.render(scene, camera);
    gpuPanel.endQuery();
  }

  //

  function switchLine(val: any) {
    // switch (val) {
    //   case 0:
    //     line.visible = true;
    //     thresholdLine.visible = true;

    //     segments.visible = false;
    //     thresholdSegments.visible = false;

    //     break;

    //   case 1:
    //     line.visible = false;
    //     thresholdLine.visible = false;

    //     segments.visible = true;
    //     thresholdSegments.visible = true;

    //     break;
    // }
  }

  function initGui() {
    gui = new GUI();

    // gui
    //   .add(params, "line type", { LineGeometry: 0, LineSegmentsGeometry: 1 })
    //   .onChange(function (val: any) {
    //     switchLine(val);
    //   })
    //   .setValue(0);

    // gui.add(params, "world units").onChange(function (val: any) {
      
    // }).setValue(false);

    // gui.add(params, "visualize threshold").onChange(function (val: any) {
    // });

    // gui.add(params, "width", 1, 10).onChange(function (val: any) {
    // });

    // gui.add(params, "alphaToCoverage").onChange(function (val: any) {
    // });

    gui.add(params, "速度", 10, 60).onChange(function (val: any) {
		rotateV = val;
    });

    gui.add(params, "线的半径增加宽度", 0, 2).onChange(function (val: any) {
    //   line.position.x = val;
    //   segments.position.x = val;
	stepWidth = val;
    });

    gui.add(params, "animate");
  }

  const createBobbin = () => {
	const geometry = new CapsuleGeometry( 0.3, 20, 4, 8 ); 
	const material = new MeshStandardMaterial( {color: 0xffffff, roughness: 0.5, metalness: 1} ); 
	const capsule = new Mesh( geometry, material ); 
	const parent = addCapsuleParent();
	parent.translateY(-2);
	capsule.add(parent);
	bobbin = capsule;
	scene.add( capsule );
  };

  const addCapsuleParent = () => {
	const geometry = new CapsuleGeometry( 0.4, 18, 4, 8 ); 
	const material = new MeshStandardMaterial( {color: 0xfdff00, roughness: 0.5, metalness: 0.6} );
	return new Mesh( geometry, material );
  };

  const addLights = () => {
	const dirLight = new DirectionalLight(0xffffff, 3);
	dirLight.color.setHSL(1, 10, 1);
	dirLight.position.set(-1, 1.75, 1);
	dirLight.position.multiplyScalar(30);
	scene.add(dirLight);
  };

  const getBobbinPoints = (r = 0.5) => {
	const center = bobbin.position.clone();
	// 获取上半部分, bobbin r =3 , height = 20;
	const MAX_POINTS = 200;
	const points = [];
	const step = 10 / MAX_POINTS;
	for(let i = 0; i < MAX_POINTS;i += 4) {
		points.push(new Vector3(center.x, center.y + i * step, center.z + r));
		points.push(new Vector3(center.x - r, center.y + (i + 1) * step, center.z));
		points.push(new Vector3(center.x, center.y + (i + 2) * step, center.z - r));
		points.push(new Vector3(center.x + r, center.y + (i + 3) * step, center.z));
		// points.push(new Vector3(0, center.y + i * step, 0));
		// points.push(new Vector3(0, center.y + (i + 1) * step, 0));
		// points.push(new Vector3(0, center.y + (i + 2) * step, 0));
		// points.push(new Vector3(0, center.y + (i + 3) * step, 0));
		
	}
	const y = points[points.length - 1].y;
	points.push(new Vector3(center.x + 20, y + 2, center.z));
	points.push(new Vector3(center.x + 30, y + 2, center.z));
	points.push(new Vector3(center.x + 40, y + 2, center.z));
	points.push(new Vector3(center.x + 50, y + 2, center.z));
	console.log('pp: ', points);
	return points;

  };

  

  const createLine = () => {
	const geometry = new BufferGeometry();
	const positions = new Float32Array(DRAW_COUNT * 3);
	initDLinePositions(positions);
	geometry.setAttribute('position', new BufferAttribute(positions, 3));

	geometry.setDrawRange(0, DRAW_COUNT);

	const material = new LineBasicMaterial({color: 0xD3D3D3, linewidth: 5});
	dLine = new Line(geometry, material);

	scene.add(dLine);
  };

  const initDLinePositions = (positions: Float32Array) => {
	positions[0] = 0;
	positions[1] = -10;
	positions[2] = 0.5;

	for (let i = 3; i < (DRAW_COUNT - 10) * 3; i +=3) {
		positions[i] = 0;
		positions[i + 1] = 10;
		positions[i + 2] = 0;
	}

	for (let i = (DRAW_COUNT - 10) * 3; i < DRAW_COUNT * 3; i +=3) {
		positions[i] = positions[i - 3] + 50 / 10;
		positions[i + 1] = 10;
		positions[i + 2] = 0;
	}

	// for (let i = 2000 * 3; i < 5000 * 3; i +=3) {
	// 	positions[i] = 50;
	// 	positions[i + 1] = 10;
	// 	positions[i + 2] = 0;
	// }
  };

  
  const heightSegments = [3, 10, 7];
  const segmentHunit = 0.5;
  const updatePositions = (currentPoint: number, delta: number) => {
	
	const planR = 5;
	const v = -rotateV * Math.PI / 180;

	const positions = dLine.geometry.attributes.position.array;
	const lastpoint = new Vector3(
		positions[(currentPoint - 1) * 3],
		positions[(currentPoint - 1) * 3 + 1],
		positions[(currentPoint - 1) * 3 + 2],
	);

	const euler = new Euler(0, v, 0, 'XYZ');
	const vert: Vector3 = lastpoint.applyEuler(euler);
	const tempHeight = vert.y + stepHeight;

	if (vert.y + stepHeight >= 10) {
		return;
	}
	ago1(currentPoint, vert, lastpoint, positions);

	
  }

  const ago1 = (currentPoint: number, vert: Vector3, lastpoint: Vector3, positions: any) => {
	if (aglo1data.length && cengcount < aglo1data.length && (Math.pow((planR), 2) - (new Vector2(vert.x, vert.z)).lengthSq()  > Number.MIN_VALUE)) {
		(dLine.material as LineMaterial).color. setHSL(0, Math.random(), 0.5)
		const tempHeight = vert.y + stepHeight;
		const len = heightSegments[0] / 0.5;
		const cengdata = aglo1data[cengcount];
		const highest = getHighestfromw(cengdata.w);
		if (vert.y >= highest+ stepHeight) {
			const newVec = (new Vector2(vert.x, vert.z));
			const vecLength = newVec.length();
			const newVec1 = newVec.setLength(vecLength+ stepWidth);
			positions[currentPoint * 3] = newVec1.x;
			positions[currentPoint * 3 + 2] = newVec1.y;
			console.log('highest: ', highest);
			console.log("cengcount: ", cengcount)
			jianian(positions);
			
	
			if ((new Vector2(vert.x, vert.z)).lengthSq() - Math.pow((cengdata.w), 2) > Number.MIN_VALUE) {
				cengcount += 1;
				
	
			}
			console.log('alog1data h: ', aglo1data[cengcount].h)
			positions[currentPoint * 3 + 1] = aglo1data[cengcount].h;
		} else {
			positions[currentPoint * 3] = vert.x;
			positions[currentPoint * 3 + 2] = vert.z;
			positions[currentPoint * 3 + 1] = tempHeight;
		}
	} else {
		canRestartFlag = true;
		(dLine.material as LineMaterial).color. setHSL(0, 0, 0.5)
	}
	

  }

  const getHighestfromw = (w: number) => {
	const data = aglo1data.filter(item => item.w >= w).map(item => item.h).sort();
	return data[data.length - 1];
  }

  let generateHeightWeightSegments = () => {
	const initR = 0.5;
	const heightUnit = 0.5;
	const objectY = [-10, 10];
	const result: any = [];
	let sum = 0;

	heightSegments.forEach((hs, index) => {
		const count = Math.round(hs / heightUnit);
		sum += count;
		const rstep = (planR - initR) / count;
		let w, h;
		for (let i = 0; i < count; i++) {
			switch(index) {
				case 1:
					w = planR;
					h = objectY[0] + heightSegments[0] + i * heightUnit;
					break;
				case 2:
					w = (planR - i * rstep);
					h = objectY[0] + heightSegments[0] + heightSegments[1] + i * heightUnit;
					break;
				default:
					w = initR + i * rstep;
					h = objectY[0] + i * heightUnit;
			}

			result.push({w, h});
		}
	});
	// cengcount = sum;
	return result;
  }

  const jianian = (positions: any[]) => {
	// TODO 加捻
  }

  const restart =() => {
	// console.log("bobbin: ", bobbin);
    const positions: any = dLine.geometry.attributes.position.array;
    initDLinePositions(positions);
    currentP = 1;
    cengcount = 0;
    dLine.geometry.attributes.position.needsUpdate = true;
    

  }
  return <div className="relative">
    <div className="canvas" ref={lineContainer} ></div>
    <button disabled={!canRestartFlag} className="absolute bottom-2 right-4 px-1 py-2 bg-neutral-800 text-slate-300 rounded opacity-70 hover:opacity-100 disabled:opacity-40" onClick={() => restart()}>重新开始</button>
  </div>;
}
