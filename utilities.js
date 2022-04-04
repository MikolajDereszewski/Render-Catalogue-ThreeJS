function createGeometryUtility(geometry, material, position = new THREE.Vector3(0,0,0), rotation = new THREE.Euler(0,0,0), castShadow, receiveShadow) {
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

function createPBRMaterialUtility(folderName, normalScale, heightScale, tiling)
{
	var baseColor = loadTextureUtility(folderName, 'basemap.png', tiling);
	var normal = loadTextureUtility(folderName, 'normal.png', tiling);
	var metallic = loadTextureUtility(folderName, 'metallic.png', tiling);
	var roughness = loadTextureUtility(folderName, 'roughness.png', tiling);
	var height = loadTextureUtility(folderName, 'height.png', tiling);

	var cubemap = loadCubemapUtility("environment", "env");

	var material = new THREE.MeshStandardMaterial({
		color: 0xffffff,
		map: baseColor,
		normalMap: normal,
		normalScale: normalScale,
		metalnessMap: metallic,
		roughnessMap: roughness,
		displacementMap: height,
		displacementScale: heightScale,
		envMap: cubemap
	});

	return material;
}

function createCustomMaterialUtility(folderName, normalScale, heightScale, tiling) {
	var basemap = loadTextureUtility(folderName, 'basemap.png', tiling);
	var normalmap = loadTextureUtility(folderName, 'normal.png', tiling);
	var heightmap = loadTextureUtility(folderName, 'height.png', tiling);
    uniforms = {
        u_basemap: { type: "t", value: basemap },
		u_normalmap: {type: "t", value: normalmap},
		u_heightmap: {type: "t", value: heightmap},
		u_normalScale: {type: "f", value: normalScale},
		u_heightScale: {type: "f", value: heightScale}
    };
	
	uniforms = THREE.UniformsUtils.merge([
		THREE.UniformsLib['lights'],
		uniforms]);

    var material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
		lights: true,
		shading: THREE.SmoothShading
    } );

    return material;
}

function loadTextureUtility(folderName, textureName, tiling) {
	var texture = new THREE.TextureLoader().load( 'scene-content/' + folderName + '/' + textureName );
	texture.repeat = tiling;
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	return texture;
}

function loadCubemapUtility(folderName, textureName) {
	var texture = new THREE.CubeTextureLoader()
	.setPath( 'scene-content/' + folderName + '/' )
	.load( [
		textureName + 'px.png',
		textureName + 'nx.png',
		textureName + 'py.png',
		textureName + 'ny.png',
		textureName + 'pz.png',
		textureName + 'nz.png'
	] );
	return texture;
}

function createVectorUtility(x=0,y=0,z=0) {
	return new THREE.Vector3(x,y,z);
}

function createEulerUtility(x=0,y=0,z=0,order="XYZ") {
	return new THREE.Euler(x*DEG2RAD, y*DEG2RAD, z*DEG2RAD, order);
}
