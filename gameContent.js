let controls;
let mainSphere;
let sphereMaterial;

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
	camera = initializeCamera(createVectorUtility(0.6, 0.1, 0.6), createEulerUtility(-10, 45, 0, "YXZ"));
	initializeControls();
	initializeEnvironment();
	initializeSphere('tiles_resources');
	initializeProperties();
	renderer.setAnimationLoop( update );
	window.addEventListener( 'resize', onWindowResize );
}

function initializeControls() {
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.update();
}

function initializeSphere(folderName) {
	var sphereGeometry = new THREE.SphereGeometry( 0.2, 500, 500 );
	sphereGeometry.computeTangents();
	sphereMaterial = createCustomMaterialUtility(folderName, 1.0, 0.002, new THREE.Vector2(1, 1));
	mainSphere = createGeometryUtility(sphereGeometry, sphereMaterial, createVectorUtility(0, 0, 0), createEulerUtility(0, 0, 0), true, false);
	//mainSphere = createGeometryUtility(new THREE.SphereGeometry( 0.2, 250, 250 ), createPBRMaterialUtility('ice_resources', new THREE.Vector2(1, 1), 0.002, new THREE.Vector2(1, 1)), createVectorUtility(-0.15, 0, 0.15), createEulerUtility(0, 0, 0), true, false);
}

function reloadMaterialTextures(folderName, tiling) {
	if(sphereMaterial) {
		var basemap = loadTextureUtility(folderName, 'basemap.png', tiling);
		var normalmap = loadTextureUtility(folderName, 'normal.png', tiling);
		var roughness = loadTextureUtility(folderName, 'roughness.png', tiling);
		var heightmap = loadTextureUtility(folderName, 'height.png', tiling);
		sphereMaterial.uniforms['u_basemap'].value = basemap;
		sphereMaterial.uniforms['u_normalmap'].value = normalmap;
		sphereMaterial.uniforms['u_roughness'].value = roughness;
		sphereMaterial.uniforms['u_heightmap'].value = heightmap;
	}
}

function initializeProperties() {
	propertyGUI.add(materialUniforms.u_normalScale, 'value', 0.0, 5.0).name("Normal Scale").listen().onChange(
		function() {
			sphereMaterial.uniforms['u_normalScale'].value = materialUniforms.u_normalScale.value;
		}
	);
	propertyGUI.add(materialUniforms.u_heightScale, 'value', 0.0, 0.1).name("Height Scale").listen().onChange(
		function() {
			sphereMaterial.uniforms['u_heightScale'].value = materialUniforms.u_heightScale.value;
		}
	);
	propertyGUI.add(materialUniforms.u_tiling.value, 'x', 1, 10).listen().name("Tiling X").onChange(
		function() {
			sphereMaterial.uniforms['u_tiling'].value.x = materialUniforms.u_tiling.value.x;
		}
	);
	propertyGUI.add(materialUniforms.u_tiling.value, 'y', 1, 10).listen().name("Tiling Y").onChange(
		function() {
			sphereMaterial.uniforms['u_tiling'].value.y = materialUniforms.u_tiling.value.y;
		}
	);
	propertyGUI.add(materialUniforms.u_roughnessRemap.value, 'x', 0.0, 1.0).listen().name("Remap Min").onChange(
		function() {
			sphereMaterial.uniforms['u_roughnessRemap'].value.x = materialUniforms.u_roughnessRemap.value.x;
		}
	);
	propertyGUI.add(materialUniforms.u_roughnessRemap.value, 'y', 0.0, 1.0).listen().name("Remap Max").onChange(
		function() {
			sphereMaterial.uniforms['u_roughnessRemap'].value.y = materialUniforms.u_roughnessRemap.value.y;
		}
	);

	var loadIce = { add : function() {
		reloadMaterialTextures("ice_resources", new THREE.Vector2(1, 1));
	}};
	var loadTiles = { add : function() {
		reloadMaterialTextures("tiles_resources", new THREE.Vector2(2, 1));
	}};

	propertyGUI.add(loadIce,'add').name("Load Ice");
	propertyGUI.add(loadTiles,'add').name("Load Tiles");
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
	if(DEBUG_MODE) {
		statistics.update();
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onShaderLoaded() {
	if(VERTEX_SHADER != "" && FRAGMENT_SHADER != "") {
		initializeGameContent();
	}
}