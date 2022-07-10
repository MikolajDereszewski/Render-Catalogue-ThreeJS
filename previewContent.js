let controls;
let mainSphere;
let sphereMaterial;
let shaderLoadedCallback = false;
let initializeGameContentCallback = false;

initializeEngine();

fetch("./basicVertex.glsl").then(function(response) {
	return response.text().then(function(text) {
		VERTEX_SHADER = text;
		onShaderLoaded();
	});
});

fetch("./basicFragment.glsl").then(function(response) {
	return response.text().then(function(text) {
		FRAGMENT_SHADER = text;
		onShaderLoaded();
	});
});

function initializeGameContent() {
	if(!shaderLoadedCallback) {
		initializeGameContentCallback=true;
		return;
	}
	while(scene.children.length > 0){ 
		scene.remove(scene.children[0]); 
	}
	camera = initializeCamera(createVectorUtility(0.6, 0.1, 0.6), createEulerUtility(-10, 45, 0, "YXZ"));
	initializeControls();
	initializeEnvironment();
	initializeSphere();
	renderer.setAnimationLoop( update );
	window.addEventListener( 'resize', onWindowResize );
}

function initializeControls() {
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.update();
}

function initializeSphere() {
	var sphereGeometry = new THREE.SphereGeometry( 0.2, 500, 500 );
	sphereGeometry.computeTangents();
	sphereMaterial = createCustomMaterialPreviewUtility();
	mainSphere = createGeometryUtility(sphereGeometry, sphereMaterial, createVectorUtility(0, 0, 0), createEulerUtility(0, 0, 0), true, false);
}

function initializeEnvironment() {
	var cubemap = loadCubemapUtility("environment", "env");
	scene.background = cubemap;
	initializePlanes();
	initializeLights();
}

function initializePlanes() {
	var material = new THREE.MeshStandardMaterial( {color: 0xffffff} );
	var geometry = new THREE.PlaneGeometry(3, 3, 3, 3);
	createGeometryUtility(geometry, material, createVectorUtility(0, -0.5, 0), createEulerUtility(-90, 0, 0), false, true);
}

function initializeLights() {
	scene.add( new THREE.AmbientLight( 0x121212 ) );
	createLightUtility(0xffffff, 0.6, 10, createVectorUtility(0.3, 1, 0.3), true);
	createLightUtility(0xefd87e, 0.4, 10, createVectorUtility(0, 0.3, 0.6), true);
	createLightUtility(0xa1bbea, 0.4, 10, createVectorUtility(0.6, 0.3, 0), true);
}

function update( time ) {
	mainSphere.rotation.y = time / 4000;
	controls.update();
	renderer.render( scene, camera );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onShaderLoaded() {
	if(VERTEX_SHADER != "" && FRAGMENT_SHADER != "") {
		shaderLoadedCallback = true;
		if(initializeGameContentCallback) {
			initializeGameContent();
		}
	}
}