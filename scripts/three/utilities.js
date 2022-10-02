let materialUniforms = {
	u_normalScale: {type: "f", value: 1.0},
	u_heightScale: {type: "f", value: 0.0}
};

function createGeometryUtility(geometry, material, position = new THREE.Vector3(0,0,0), rotation = new THREE.Euler(0,0,0), castShadow, receiveShadow) {
	geometry.attributes.uv2 = geometry.attributes.uv;
	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.copy(position);
	mesh.rotation.copy(rotation);
	mesh.castShadow = castShadow;
	mesh.receiveShadow = receiveShadow;
	scene.add( mesh );
	return mesh;
}

function createLightUtility(color, intensity, distance, position, castShadow) {
	var light = new THREE.PointLight( color, intensity, distance );
	light.position.copy(position);
	light.castShadow = castShadow;
	if(castShadow) {
		light.shadow.mapSize.width = SHADOW_MAP_RESOLUTION;
		light.shadow.mapSize.height = SHADOW_MAP_RESOLUTION;
	}
	scene.add( light );
	return light;
}

function createPBRMaterialUtility(materialData)
{
	var tiling = new THREE.Vector2(materialData.u_tiling_x, materialData.u_tiling_y);
	var basemap = loadTextureUtility(materialData.albedo, tiling);
	var normalmap = loadTextureUtility(materialData.normal, tiling);
	var metallic = loadTextureUtility(materialData.metallic, tiling);
	var roughness = loadTextureUtility(materialData.roughness, tiling);
	var heightmap = loadTextureUtility(materialData.height, tiling);
	var AO = loadTextureUtility(materialData.AO, tiling);

	var material = new THREE.MeshStandardMaterial({
		color: 0xffffff,
		map: basemap,
		normalMap: normalmap,
		normalScale: new THREE.Vector2(materialData.u_normalScale, materialData.u_normalScale),
		metalnessMap: metallic,
		roughnessMap: roughness,
		displacementMap: heightmap,
		displacementScale: materialData.u_heightScale,
		aoMap: AO,
		aoMapIntensity: materialData.u_AOScale,
		envMap: scene.background
	});

	return material;
}

function createCustomMaterialUtility(materialData) {
	var tiling = new THREE.Vector2(materialData.u_tiling_x, materialData.u_tiling_y);
	var basemap = loadTextureUtility(materialData.albedo, tiling);
	var normalmap = loadTextureUtility(materialData.normal, tiling);
	var roughness = loadTextureUtility(materialData.roughness, tiling);
	var heightmap = loadTextureUtility(materialData.height, tiling);
	var AO = loadTextureUtility(materialData.AO, tiling);

    uniforms = {
        u_basemap: { type: "t", value: basemap },
		u_normalmap: {type: "t", value: normalmap },
		u_heightmap: {type: "t", value: heightmap },
		u_roughness: {type: "t", value: roughness },
		u_AO: {type: "t", value: AO},
		u_envMap: {type: "t", value: scene.background},

		u_normalScale: {type: "f", value: materialData.u_normalScale},
		u_heightScale: {type: "f", value: materialData.u_heightScale},
		u_AOScale: {type: "f", value: materialData.u_AOScale},
		u_tiling: {type: "v2", value: tiling},
		u_roughnessRemap: {type: "v2", value: new THREE.Vector2(materialData.u_roughnessRemap_x, materialData.u_roughnessRemap_y)},
    };
	
	materialUniforms = THREE.UniformsUtils.merge([
		THREE.UniformsLib['lights'],
		uniforms]);

    var material = new THREE.ShaderMaterial( {
        uniforms: materialUniforms,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
		lights: true,
		shading: THREE.SmoothShading
    } );

    return material;
}

function createCustomMaterialPreviewUtility() {
	var material;
	var basemap, normalmap, roughness, heightmap, AO;
	var id = document.getElementById("data_id");
	if(id != null && id.textContent != null && id.textContent != "") {
		var passedData = id.textContent;
		if(passedData != null && passedData != "") {
			console.log(passedData);
			loadSingleMaterialData(passedData, function(materialData) {
				console.log(materialData.name);
				if(materialData.name == passedData) {
					appendMaterialData(material, materialData);
				}
			});
		}
	} else {
		var basemap = loadTexturePreviewUtility('basemap', new THREE.Vector2(1.0, 1.0));
		var normalmap = loadTexturePreviewUtility('normal', new THREE.Vector2(1.0, 1.0));
		var roughness = loadTexturePreviewUtility('roughness', new THREE.Vector2(1.0, 1.0));
		var heightmap = loadTexturePreviewUtility('height', new THREE.Vector2(1.0, 1.0));
		var AO = loadTexturePreviewUtility('AO', new THREE.Vector2(1.0, 1.0));
	}
	
    uniforms = {
        u_basemap: { type: "t", value: basemap },
		u_normalmap: {type: "t", value: normalmap },
		u_heightmap: {type: "t", value: roughness },
		u_roughness: {type: "t", value: heightmap },
		u_AO: {type: "t", value: AO},
		u_envMap: {type: "t", value: scene.background},
		u_normalScale: {type: "f", value: 1.0},
		u_heightScale: {type: "f", value: 0.0},
		u_AOScale: {type: "f", value: 1.0},
		u_tiling: {type: "v2", value: new THREE.Vector2(1.0, 1.0)},
		u_roughnessRemap: {type: "v2", value: new THREE.Vector2(0.0, 1.0)}
	};

	materialUniforms = THREE.UniformsUtils.merge([
		THREE.UniformsLib['lights'],
		uniforms
	]);

    material = new THREE.ShaderMaterial({
	    uniforms: materialUniforms,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
		lights: true,
		shading: THREE.SmoothShading
	});

    return material;
}

function appendMaterialData(sphereMaterial, materialData) {
	var tiling = new THREE.Vector2(materialData.u_tiling_x, materialData.u_tiling_y);
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
	sphereMaterial.uniforms['u_normalScale'].value = materialData.u_normalScale;
	sphereMaterial.uniforms['u_heightScale'].value = materialData.u_heightScale;
	sphereMaterial.uniforms['u_AOScale'].value = materialData.u_AOScale;
	sphereMaterial.uniforms['u_tiling'].value.x = materialData.u_tiling_x;
	sphereMaterial.uniforms['u_tiling'].value.y = materialData.u_tiling_y;
	sphereMaterial.uniforms['u_roughnessRemap'].value.x = materialData.u_roughnessRemap_x;
	sphereMaterial.uniforms['u_roughnessRemap'].value.y = materialData.u_roughnessRemap_y;
}

function loadTextureUtility(textureName, tiling) {
	var texture = new THREE.TextureLoader().load( textureName );
	texture.repeat = tiling;
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	return texture;
}

function loadTexturePreviewUtility(urlID, tiling) {
	var url = document.getElementById(urlID).textContent;
	console.log(url);
	var texture = new THREE.TextureLoader().load( url );
	texture.repeat = tiling;
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	return texture;
}

function loadCubemapUtility(folderName, textureName) {
	var texture = new THREE.CubeTextureLoader()
	.setPath( 'scene-content/' + folderName + '/' )
	.load([
		textureName + 'px.png',
		textureName + 'nx.png',
		textureName + 'py.png',
		textureName + 'ny.png',
		textureName + 'pz.png',
		textureName + 'nz.png'
	]);
	texture.format = THREE.RGBFormat;
	return texture;
}

function createVectorUtility(x=0,y=0,z=0) {
	return new THREE.Vector3(x,y,z);
}

function createEulerUtility(x=0,y=0,z=0,order="XYZ") {
	return new THREE.Euler(x*DEG2RAD, y*DEG2RAD, z*DEG2RAD, order);
}
