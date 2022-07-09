<!DOCTYPE html>
<html>
    <head>
		<meta charset=utf-8>
		<meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
		<title>Preview</title>
		<link rel="stylesheet" href="styles.css">
	</head>
    <body>
        <div id="data" style="display: none;"><?php echo $_GET["id"]; ?></div>
        <div id="data_basemap" style="display: none;"><?php echo $_GET["basemap"]; ?></div>
        <div id="data_normal" style="display: none;"><?php echo $_GET["normal"]; ?></div>
        <div id="data_metallic" style="display: none;"><?php echo $_GET["metallic"]; ?></div>
        <div id="data_roughness" style="display: none;"><?php echo $_GET["roughness"]; ?></div>
        <div id="data_AO" style="display: none;"><?php echo $_GET["AO"]; ?></div>
        <div id="data_height" style="display: none;"><?php echo $_GET["height"]; ?></div>
        <script src="node_modules/three/build/three.min.js"></script>
		<script src="node_modules/three/examples/js/controls/OrbitControls.js"></script>
		<script src="node_modules/stats.js/build/stats.min.js"></script>
		<script src="node_modules/dat.gui/build/dat.gui.min.js"></script>
        <script src="engine.js"></script>
        <script src="utilities.js"></script>
        <script src="previewContent.js"></script>
    </body>
</html>