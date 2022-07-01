const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const SHADOW_MAP_RESOLUTION = 2048;
const DEBUG_MODE = true;

let VERTEX_SHADER = "", FRAGMENT_SHADER = "";
let scene, renderer, statistics, camera;
let GUI;

function initializeEngine() {
	scene = initializeScene();
	renderer = initializeRenderer();
}

function initializeGui() {
	var gui = new dat.GUI();
	propertyGUI = gui;
  }

function initializeDebugger() {
	if(DEBUG_MODE) {
		statistics = initializeDebugStatistics();
	}
}

function initializeScene() {
	var scene = new THREE.Scene();
	return scene;
}

function initializeRenderer() {
	var renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	document.body.appendChild( renderer.domElement );
	return renderer;
}

function initializeCamera(position, rotation) {
	var camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
	camera.position.copy(position)
	camera.rotation.copy(rotation);
	return camera;
}

function initializeDebugStatistics() {
	var stats = new Stats();
	document.body.appendChild(stats.dom);
	return stats;
}
