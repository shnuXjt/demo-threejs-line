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

  let lineContainer = useRef<HTMLDivElement>(null);

  const color = new Color();

  const pointer = new Vector2(Infinity, Infinity);

  const raycaster = new Raycaster();

  raycaster.params.Line2 = { threshold: 0 } as any;

  const matLine = new LineMaterial({
    color: 0xffffff,
    linewidth: 1, // in world units with size attenuation, pixels otherwise
    worldUnits: true,
    vertexColors: true,

    //resolution:  // to be set by renderer, eventually
    alphaToCoverage: true,
  });

  const matThresholdLine = new LineMaterial({
    color: 0xffffff,
    linewidth: matLine.linewidth, // in world units with size attenuation, pixels otherwise
    worldUnits: true,
    // vertexColors: true,
    transparent: true,
    opacity: 0.2,
    depthTest: false,
    visible: false,
    //resolution:  // to be set by renderer, eventually
  });

  const params = {
    "line type": 0,
    "world units": matLine.worldUnits,
    "visualize threshold": matThresholdLine.visible,
    width: matLine.linewidth,
    alphaToCoverage: matLine.alphaToCoverage,
    threshold: raycaster.params.Line2?.threshold,
    translation: raycaster.params.Line2?.threshold,
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

    const sphereGeometry = new SphereGeometry(0.25, 8, 4);
    const sphereInterMaterial = new MeshBasicMaterial({
      color: 0xff0000,
      depthTest: false,
    });
    const sphereOnLineMaterial = new MeshBasicMaterial({
      color: 0x00ff00,
      depthTest: false,
    });

    sphereInter = new Mesh(sphereGeometry, sphereInterMaterial);
    sphereOnLine = new Mesh(sphereGeometry, sphereOnLineMaterial);
    sphereInter.visible = false;
    sphereOnLine.visible = false;
    sphereInter.renderOrder = 10;
    sphereOnLine.renderOrder = 10;
    scene.add(sphereInter);
    scene.add(sphereOnLine);

    // Position and THREE.Color Data

    const positions = [];
    const colors = [];
    const points = [];
    for (let i = -50; i < 50; i++) {
      const t = i / 3;
      points.push(new Vector3(t * Math.sin(2 * t), t, t * Math.cos(2 * t)));
    }

	const newpoints = getBobbinPoints();
	// bobbin.visible = false;
    const spline = new CatmullRomCurve3(newpoints);
    const divisions = Math.round(3 * newpoints.length);
    const point = new Vector3();
    const color = new Color();

    for (let i = 0, l = divisions; i < l; i++) {
      const t = i / l;

      spline.getPoint(t, point);
      positions.push(point.x, point.y, point.z);

      color.setHSL(t, 1.0, 0.5, SRGBColorSpace);
      colors.push(color.r, color.g, color.b);
    }

    const lineGeometry = new LineGeometry();
    lineGeometry.setPositions(positions);
    lineGeometry.setColors(colors);

    const segmentsGeometry = new LineSegmentsGeometry();
    segmentsGeometry.setPositions(positions);
    segmentsGeometry.setColors(colors);

    segments = new LineSegments2(segmentsGeometry, matLine);
    segments.computeLineDistances();
    segments.scale.set(1, 1, 1);
    scene.add(segments);
    segments.visible = false;

    thresholdSegments = new LineSegments2(segmentsGeometry, matThresholdLine);
    thresholdSegments.computeLineDistances();
    thresholdSegments.scale.set(1, 1, 1);
    scene.add(thresholdSegments);
    thresholdSegments.visible = false;

    line = new Line2(lineGeometry, matLine);
    line.computeLineDistances();
    line.scale.set(1, 1, 1);
    scene.add(line);

    thresholdLine = new Line2(lineGeometry, matThresholdLine);
    thresholdLine.computeLineDistances();
    thresholdLine.scale.set(1, 1, 1);
    scene.add(thresholdLine);

    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new Float32BufferAttribute(colors, 3));

    //

    document.addEventListener("pointermove", onPointerMove);
    window.addEventListener("resize", onWindowResize);
    onWindowResize();

    stats = new Stats();
    document.body.appendChild(stats.dom);

    gpuPanel = new GPUStatsPanel(renderer.getContext());
    stats.addPanel(gpuPanel);
    stats.showPanel(0);
    initGui();

	
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    // renderer will set this eventually
    matLine.resolution.set(window.innerWidth, window.innerHeight);
    matThresholdLine.resolution.set(window.innerWidth, window.innerHeight);
  }

  function onPointerMove(event: any) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  function animate() {
    requestAnimationFrame(animate);

    stats.update();

    const delta = clock.getDelta();

    const obj = line.visible ? line : segments;
    thresholdLine.position.copy(line.position);
    thresholdLine.quaternion.copy(line.quaternion);
    thresholdSegments.position.copy(segments.position);
    thresholdSegments.quaternion.copy(segments.quaternion);

    // if (params.animate) {
    //   line.rotation.y += delta * 0.1;

    //   segments.rotation.y = line.rotation.y;
    // }

    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObject(obj);

    if (intersects.length > 0) {
      sphereInter.visible = true;
      sphereOnLine.visible = true;

      sphereInter.position.copy(intersects[0].point);
      sphereOnLine.position.copy((intersects[0] as any).pointOnLine);

      const index = intersects[0].faceIndex as any;
      const colors = obj.geometry.getAttribute("instanceColorStart");

      color.fromBufferAttribute(colors, index);

      sphereInter.material.color.copy(color).offsetHSL(0.3, 0, 0);
      sphereOnLine.material.color.copy(color).offsetHSL(0.7, 0, 0);

      renderer.domElement.style.cursor = "crosshair";
    } else {
      sphereInter.visible = false;
      sphereOnLine.visible = false;
      renderer.domElement.style.cursor = "";
    }

    gpuPanel.startQuery();
    renderer.render(scene, camera);
    gpuPanel.endQuery();
  }

  //

  function switchLine(val: any) {
    switch (val) {
      case 0:
        line.visible = true;
        thresholdLine.visible = true;

        segments.visible = false;
        thresholdSegments.visible = false;

        break;

      case 1:
        line.visible = false;
        thresholdLine.visible = false;

        segments.visible = true;
        thresholdSegments.visible = true;

        break;
    }
  }

  function initGui() {
    gui = new GUI();

    gui
      .add(params, "line type", { LineGeometry: 0, LineSegmentsGeometry: 1 })
      .onChange(function (val: any) {
        switchLine(val);
      })
      .setValue(0);

    gui.add(params, "world units").onChange(function (val: any) {
      matLine.worldUnits = val;
      matLine.needsUpdate = true;

      matThresholdLine.worldUnits = val;
      matThresholdLine.needsUpdate = true;
    }).setValue(false);

    gui.add(params, "visualize threshold").onChange(function (val: any) {
      matThresholdLine.visible = val;
    });

    gui.add(params, "width", 1, 10).onChange(function (val: any) {
      matLine.linewidth = val;
      matThresholdLine.linewidth =
        matLine.linewidth + (raycaster.params.Line2?.threshold || 0);
    });

    gui.add(params, "alphaToCoverage").onChange(function (val: any) {
      matLine.alphaToCoverage = val;
    });

    gui.add(params, "threshold", 0, 10).onChange(function (val: any) {
      raycaster.params.Line2 && (raycaster.params.Line2.threshold = val);
      matThresholdLine.linewidth =
        matLine.linewidth + (raycaster.params.Line2?.threshold || 0);
    });

    gui.add(params, "translation", 0, 10).onChange(function (val: any) {
      line.position.x = val;
      segments.position.x = val;
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
  return <div ref={lineContainer}></div>;
}
