camera = initializeCamera(createVectorUtility(0.6, 0.1, 0.6), createEulerUtility(-10, 45, 0, "YXZ"));
renderer.setAnimationLoop( update );
window.addEventListener( 'resize', onWindowResize );

initializePlanes();
initializeLights();

var mainSphere = createGeometryUtility(new THREE.SphereGeometry( 0.2, 250, 250 ), createPBRMaterialUtility('ice_resources', new THREE.Vector2(1, 1), 0.002, new THREE.Vector2(1, 1)), createVectorUtility(-0.15, 0, 0.15), createEulerUtility(0, 0, 0), true, false);
var secondarySphere = createGeometryUtility(new THREE.SphereGeometry( 0.2, 250, 250 ), createPBRMaterialUtility('tiles_resources', new THREE.Vector2(2, 2), 0.03, new THREE.Vector2(2, 1)), createVectorUtility(0.15, 0, -0.15), createEulerUtility(0, 0, 0), true, false);

function initializePlanes() {
	var material = new THREE.MeshStandardMaterial( {color: 0xffffff} );
	var geometry = new THREE.PlaneGeometry(3, 3, 3, 3);
	createGeometryUtility(geometry, material, createVectorUtility(0, 0, -1.5), createEulerUtility(0, 0, 0), false, true);
	createGeometryUtility(geometry, material, createVectorUtility(0, -0.5, 0), createEulerUtility(-90, 0, 0), false, true);
	createGeometryUtility(geometry, material, createVectorUtility(-1.5, 0, 0), createEulerUtility(0, 90, 0), false, true);
}

function initializeLights() {
	scene.add( new THREE.AmbientLight( 0x121212 ) );
	createLightUtility(0xffffff, 0.9, 10, createVectorUtility(0, 1, 0), true);
	createLightUtility(0xefd87e, 0.4, 10, createVectorUtility(0, 0.1, 1), false);
	createLightUtility(0xa1bbea, 0.4, 10, createVectorUtility(1, 0.1, 0), false);
}

function update( time ) {
	mainSphere.rotation.y = time / 4000;
	secondarySphere.rotation.y = time / 4000;
	renderer.render( scene, camera );
	if(DEBUG_MODE) {
		statistics.update();
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}
