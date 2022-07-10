let controls;
let mainSphere;
let sphereMaterial;
let propertiesInitialized=false;

initializeEngine();
initializeGui();
initializeDebugger();

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
	renderer.setAnimationLoop( update );
	window.addEventListener( 'resize', onWindowResize );
}

function initializeControls() {
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.update();
}

function initializeSphere(materialData) {
	var sphereGeometry = new THREE.SphereGeometry( 0.2, 500, 500 );
	sphereGeometry.computeTangents();
	sphereMaterial = createCustomMaterialUtility(materialData, 1.0, 0.002, new THREE.Vector2(1, 1));
	mainSphere = createGeometryUtility(sphereGeometry, sphereMaterial, createVectorUtility(0, 0, 0), createEulerUtility(0, 0, 0), true, false);
	//mainSphere = createGeometryUtility(new THREE.SphereGeometry( 0.2, 250, 250 ), createPBRMaterialUtility('ice_resources', new THREE.Vector2(1, 1), 0.002, new THREE.Vector2(1, 1)), createVectorUtility(-0.15, 0, 0.15), createEulerUtility(0, 0, 0), true, false);
}

function reloadMaterialTextures(materialData, tiling) {
	if(sphereMaterial) {
		var basemap = loadTextureUtility(materialData.albedo, tiling);
		var normalmap = loadTextureUtility(materialData.normal, tiling);
		var roughness = loadTextureUtility(materialData.roughness, tiling);
		var heightmap = loadTextureUtility(materialData.height, tiling);
		var AO = loadTextureUtility(materialData.AO, tiling);
		sphereMaterial.uniforms['u_basemap'].value = basemap;
		sphereMaterial.uniforms['u_normalmap'].value = normalmap;
		sphereMaterial.uniforms['u_roughness'].value = roughness;
		sphereMaterial.uniforms['u_heightmap'].value = heightmap;
		sphereMaterial.uniforms['u_AO'].value = AO;
	} else {
		initializeSphere(materialData);
		initializeProperties();
	}
}

function initializeProperties() {
	if(propertiesInitialized) {
		return;
	}
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
	propertyGUI.add(materialUniforms.u_AOScale, 'value', 0.0, 1.0).listen().name("AO Intensity").onChange(
		function() {
			sphereMaterial.uniforms['u_AOScale'].value = materialUniforms.u_AOScale.value;
		}
	);
	propertyGUI.add(materialUniforms.u_tiling.value, 'x', 1, 10).listen().name("Tiling X").onChange(
		function() {
			sphereMaterial.uniforms['u_tiling'].value.x = Math.round(materialUniforms.u_tiling.value.x);
		}
	);
	propertyGUI.add(materialUniforms.u_tiling.value, 'y', 1, 10).listen().name("Tiling Y").onChange(
		function() {
			sphereMaterial.uniforms['u_tiling'].value.y = Math.round(materialUniforms.u_tiling.value.y);
		}
	);
	propertyGUI.add(materialUniforms.u_roughnessRemap.value, 'x', 0.0, 1.0).listen().name("R Remap Min").onChange(
		function() {
			sphereMaterial.uniforms['u_roughnessRemap'].value.x = materialUniforms.u_roughnessRemap.value.x;
		}
	);
	propertyGUI.add(materialUniforms.u_roughnessRemap.value, 'y', 0.0, 1.0).listen().name("R Remap Max").onChange(
		function() {
			sphereMaterial.uniforms['u_roughnessRemap'].value.y = materialUniforms.u_roughnessRemap.value.y;
		}
	);
	propertiesInitialized = true;

	/*loadMaterialData(function(material) {
		var load = { add : function() {
			reloadMaterialTextures(material, new THREE.Vector2(1, 1));
		}};
		propertyGUI.add(load,'add').name(material);
	});*/
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
	if(mainSphere != null) {
		mainSphere.rotation.y = time / 4000;
	}
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