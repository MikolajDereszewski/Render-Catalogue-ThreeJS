const deg2Rad = calculateDegreesToRadians();
const rad2Deg = calculateRadiansToDegrees();

const scene = initializeScene();
const renderer = initializeRenderer();
const camera = initializeCamera();
const statistics = initializeDebugStatistics();

initializePlanes();
initializeLights();
const mainSphere = buildGeometry(new THREE.SphereGeometry( 0.2, 250, 250 ), buildPBRMaterial('iceSSS_resources', true, new THREE.Vector2(1, 1), 0.002, new THREE.Vector2(1, 1)), buildVector(-0.15, 0, 0.15), buildEuler(0, 0, 0), true, false);
const secondarySphere = buildGeometry(new THREE.SphereGeometry( 0.2, 250, 250 ), buildPBRMaterial('tiles_resources', false, new THREE.Vector2(2, 2), 0.03, new THREE.Vector2(2, 1)), buildVector(0.15, 0, -0.15), buildEuler(0, 0, 0), true, false);

function initializeScene() {
	var scene = new THREE.Scene();
	return scene;
}

function initializeRenderer() {
	var renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setAnimationLoop( update );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	document.body.appendChild( renderer.domElement );
	return renderer;
}

function initializeCamera() {
	var camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
	camera.position.copy(buildVector(0.6, 0.1, 0.6))
	camera.rotation.copy(buildEuler(-10, 45, 0, "YXZ"));
	return camera;
}

function initializeDebugStatistics() {
	var stats = new Stats();
	document.body.appendChild(stats.dom);
	return stats;
}

function initializePlanes() {
	var material = new THREE.MeshStandardMaterial( {color: 0xffffff} );
	var geometry = new THREE.PlaneGeometry(3, 3, 3, 3);
	buildGeometry(geometry, material, buildVector(0, 0, -1.5), buildEuler(0, 0, 0), false, true);
	buildGeometry(geometry, material, buildVector(0, -0.5, 0), buildEuler(-90, 0, 0), false, true);
	buildGeometry(geometry, material, buildVector(-1.5, 0, 0), buildEuler(0, 90, 0), false, true);
}

function initializeLights() {
	scene.add( new THREE.AmbientLight( 0x121212 ) );
	buildLight(0xffffff, 0.7, 10, buildVector(0, 1, 0), true);
	buildLight(0xefd87e, 0.4, 10, buildVector(0, 0.1, 1), false);
	buildLight(0xa1bbea, 0.4, 10, buildVector(1, 0.1, 0), false);
}

function update( time ) {
	mainSphere.rotation.y = time / 4000;
	secondarySphere.rotation.y = time / 4000;
	renderer.render( scene, camera );
	if(statistics) {
		statistics.update();
	}
}

function calculateDegreesToRadians() {
	return Math.PI / 180;
}

function calculateRadiansToDegrees() {
	return 180 / Math.PI;
}

function buildGeometry(geometry, material, position = new THREE.Vector3(0,0,0), rotation = new THREE.Euler(0,0,0), castShadow, receiveShadow) {
	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.copy(position);
	mesh.rotation.copy(rotation);
	mesh.castShadow = castShadow;
	mesh.receiveShadow = receiveShadow;
	scene.add( mesh );
	return mesh;
}

function buildLight(color, intensity, distance, position, castShadow) {
	var light = new THREE.PointLight( color, intensity, distance );
	light.position.copy(position);
	light.castShadow = castShadow;
	if(castShadow) {
		light.shadow.mapSize.width = 2048;
		light.shadow.mapSize.height = 2048;
	}
	scene.add( light );
	return light;
}

function buildPBRMaterial(folderName, transparent, normalScale, heightScale, textureRepeat)
{
	var baseColor = new THREE.TextureLoader().load( 'scene-content/' + folderName + '/default_baseColor.png' );
	var normal = new THREE.TextureLoader().load( 'scene-content/' + folderName + '/default_normal.png' );
	var metallic = new THREE.TextureLoader().load( 'scene-content/' + folderName + '/default_metallic.png' );
	var roughness = new THREE.TextureLoader().load( 'scene-content/' + folderName + '/default_roughness.png' );
	var height = new THREE.TextureLoader().load( 'scene-content/' + folderName + '/default_height.png' );
	var sss = new THREE.TextureLoader().load( 'scene-content/' + folderName + '/default_scattering.png' );

	baseColor.repeat = textureRepeat;
	normal.repeat = textureRepeat;
	metallic.repeat = textureRepeat;
	roughness.repeat = textureRepeat;
	height.repeat = textureRepeat;
	sss.repeat = textureRepeat;

	baseColor.wrapS = THREE.RepeatWrapping;
	normal.wrapS = THREE.RepeatWrapping;
	metallic.wrapS = THREE.RepeatWrapping;
	roughness.wrapS = THREE.RepeatWrapping;
	height.wrapS = THREE.RepeatWrapping;
	sss.wrapS = THREE.RepeatWrapping;

	baseColor.wrapT = THREE.RepeatWrapping;
	normal.wrapT = THREE.RepeatWrapping;
	metallic.wrapT = THREE.RepeatWrapping;
	roughness.wrapT = THREE.RepeatWrapping;
	height.wrapT = THREE.RepeatWrapping;
	sss.wrapT = THREE.RepeatWrapping;

	var material = new THREE.MeshStandardMaterial({
		color: 0xffffff,
		map: baseColor,
		transparent: transparent,
		alphaMap: sss,
		normalMap: normal,
		normalScale: normalScale,
		metalnessMap: metallic,
		roughnessMap: roughness,
		displacementMap: height,
		displacementScale: heightScale
	});

	return material;
}

function buildVector(x=0,y=0,z=0) {
	return new THREE.Vector3(x,y,z);
}

function buildEuler(x=0,y=0,z=0,order="XYZ") {
	return new THREE.Euler(x*deg2Rad, y*deg2Rad, z*deg2Rad, order);
}