
if (WEBGL.isWebGLAvailable() === false) { document.body.appendChild(WEBGL.getWebGLErrorMessage()); }

var container, no_of_items;
var camera, cameraHelper, scene, renderer, controls, sceneGroup;
var center, size, sceneRadiusForCamera, length;
var sceneGroupBoxHelper, sceneGroupBoundingBox, vertices, bbmin, bbmax;
var max_fov, previous_fov;

center = new THREE.Vector3();
size = new THREE.Vector3();

var pivot = new THREE.Group();

//var angle = Math.PI / 4; //180/4 = 45; //default old value
var rotate_by = Math.PI / 2; //180/2 = ;
var axis = new THREE.Vector3(0, 1, 0); //rotate on yaxis
var rotWorldMatrix;

var product_id, color_id, url, product_url, product_sku_size_unique_id;

var light, lightHelper;

// set up scene, etc.
init();

function init() {

    product_sku_size_unique_id = "67x2_81x2_85x2_130x4_135x3_142x2_175x2_178x4_179x2";
    product_id = "";
    color_id = "67_8,81_8,85_8,130_92,135_92,142_8,175_92,178_92,179_92";

    if (product_sku_size_unique_id) {
        //url = "product-data/product_dae_file_new.php?product_sku_size_unique_id=" + product_sku_size_unique_id + "&sku_color_id=" + color_id;
        url = "../3d/product-dae-file?image_quality=0&cache=1&product_sku_size_unique_id=" + product_sku_size_unique_id + "&sku_color_id=" + color_id;
        //product_url = "product-data/queries.php?func=get-products&product_sku_size_unique_id=" + product_sku_size_unique_id + "&sku_color_id=" + color_id;
        product_url = "../3d/get-3d-product?product_sku_size_unique_id=" + product_sku_size_unique_id + "&sku_color_id=" + color_id;
    } else {
        url = "product-data/product-dae-file.php?image_quality=0&cache=1&product_id=" + product_id + "&color_id=" + color_id;
        product_url = "product-data/queries.php?func=get-products&product_id=" + product_id + "&color_id=" + color_id;
    }

    container = document.getElementById('container');
    sceneGroup = new THREE.Object3D(); //var material ;

    function onSuccessCallback(collada) {
        console.log("onSuccessCallback");

        sceneGroup = collada.scene;
        sceneGroup.rotation.set(0.0, 0.0, 0.0); //default
        sceneGroup.scale.set(1, 1, 1); //default

        /*sceneGroup.traverse( function ( child ) {
            if ( child.geometry ){ child.geometry.computeFaceNormals(); child.geometry.computeVertexNormals(); }
            if ( child.material ){ material = child.material; child.material = new THREE.MeshBasicMaterial({map: material.map}); }
        });*/
        //sceneGroup.add( new THREE.AxesHelper(10) );

        /*Box3 - Represents a box or cube in 3D space. The main purpose of this is to represent the world-axis-aligned bounding boxes for objects.
        * object - Object3D to compute the bounding box of.
        *Computes the world-axis-aligned bounding box of an Object3D (including its children), accounting for the object's, and children's, world transforms.*/
        sceneGroupBoundingBox = new THREE.Box3();
        sceneGroupBoundingBox.setFromObject(sceneGroup); // Store original position
        sceneGroupBoundingBox.getCenter(center); // Center geometry faces //Returns the center point of the box as a Vector3.
        sceneGroupBoundingBox.getSize(size); //Returns the width, height and depth of this box.
        length = size.length();

        /* Three JS: Load an OBJ, translate to origin (center in scene), orbit
            *  After loading the OBJ, you need to do 3 things:
            *  1. Create a Bounding Box based on the OBJ
            *  2. Setup the Camera based on this bounding box / scene radius
            *  3. Reposition the OBJ to the scene origin Like any centering exercise, the position is then the width and height divided by 2
            * https://stackoverflow.com/a/41049730/5992783
        */
        sceneRadiusForCamera = Math.max(
            sceneGroupBoundingBox.max.y - sceneGroupBoundingBox.min.y,
            sceneGroupBoundingBox.max.z - sceneGroupBoundingBox.min.z,
            sceneGroupBoundingBox.max.x - sceneGroupBoundingBox.min.x
        ) / 2 * (1 + Math.sqrt(length)) + 2; // golden number to beautify display

        max_fov = Math.round(2 * Math.atan((length) / (2 * sceneRadiusForCamera)) * (180 / Math.PI));//console.log(max_fov);
        scene = new THREE.Scene();
        scene.background = null;
        //scene.background = new THREE.Color(0xf2f1f1); //0xf0f0f0 #F2F1F1
        //scene.background = new THREE.Color('rgb(242,241,241)'); //0xf0f0f0
        //scene.background = new THREE.Color('black');
        //scene.add( new THREE.AxesHelper(10) );

        light = new THREE.HemisphereLight(0xFFFFFF, 0xCCCCCC, 1); light.position.set(0, sceneRadiusForCamera, 0); scene.add(light);
        /*lightHelper = new THREE.HemisphereLightHelper( light, 5 ); scene.add( lightHelper );*/

        scene.add(pivot);

        //size, divisions
        //var gridHelper = new THREE.GridHelper( 5,5 );scene.add( gridHelper );

        //Field of view angle, aspect_ratio, near_plane, far_plane //Camera y-position is direction of camera moves left or right //Camera z-position is distance from object and camera
        camera = new THREE.PerspectiveCamera(max_fov, window.innerWidth / window.innerHeight, 0.01, 1000); //10,0.01,1000

        camera.position.z = 0;
        camera.position.y = sceneRadiusForCamera / 2; //0;
        camera.position.x = sceneRadiusForCamera;
        camera.lookAt(scene.position);

        camera.updateMatrix(); // make sure camera's local matrix is updated
        camera.updateMatrixWorld(); // make sure camera's world matrix is updated

        /*var cameraHelper = new THREE.CameraHelper( camera );scene.add( cameraHelper );
        cameraHelper.camera = camera;
        cameraHelper.matrix = camera.matrixWorld;
        cameraHelper.update();*/

        var x = sceneGroupBoundingBox.max.x - sceneGroupBoundingBox.min.x;
        var y = sceneGroupBoundingBox.max.y - sceneGroupBoundingBox.min.y;
        var z = sceneGroupBoundingBox.max.z - sceneGroupBoundingBox.min.z;

        // Repositioning object
        sceneGroup.position.x = -sceneGroupBoundingBox.min.x - x / 2;
        sceneGroup.position.y = -sceneGroupBoundingBox.min.y - y / 2;
        sceneGroup.position.z = -sceneGroupBoundingBox.min.z - z / 2;
        pivot.add(sceneGroup);

        //placing sku to floor - start
        sceneGroupBoundingBox = new THREE.Box3();
        sceneGroupBoundingBox.setFromObject(pivot); // Store original position
        sceneGroupBoundingBox.getCenter(center); // Center geometry faces //Returns the center point of the box as a Vector3.
        sceneGroupBoundingBox.getSize(size); //Returns the width, height and depth of this box.

        var planeGeom = new THREE.BufferGeometry();
        planeGeom.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
            sceneGroupBoundingBox.max.x, sceneGroupBoundingBox.min.y, sceneGroupBoundingBox.max.z,
            sceneGroupBoundingBox.max.x, sceneGroupBoundingBox.min.y, sceneGroupBoundingBox.min.z,
            sceneGroupBoundingBox.min.x, sceneGroupBoundingBox.min.y, sceneGroupBoundingBox.max.z,
            sceneGroupBoundingBox.min.x, sceneGroupBoundingBox.min.y, sceneGroupBoundingBox.min.z,
        ]), 3));
        planeGeom.setIndex([0, 2, 1, 2, 3, 1]);

        var plane = new THREE.Mesh(planeGeom, new THREE.MeshBasicMaterial({ color: "red", wireframe: true, side: THREE.DoubleSide, transparent: true, opacity: 0 }));
        scene.add(plane);

        sceneGroup.traverse(function (child) {
            if (child instanceof THREE.Group && child.parent != undefined && (child.name == "sku_907.DAE" || child.name == "sku_408.DAE" || child.name == "sku_829.DAE")) {
                //console.log(child);
                var center = new THREE.Vector3();
                var bb = new THREE.Box3();
                bb.setFromObject(child); // Store original position
                bb.getCenter(center);
                //child.translateY(-(sceneRadiusForCamera - center.y/2 ) );

                var radius = Math.max(
                    bb.max.y - bb.min.y,
                    bb.max.z - bb.min.z,
                    bb.max.x - bb.min.x
                ) / 2;

                /*var normal = new THREE.Vector3(0,1,0);
                var raycaster = new THREE.Raycaster(center,normal.clone().negate(), 0, Number.POSITIVE_INFINITY);

                var intersects = raycaster.intersectObjects( [plane] );
                if (intersects.length > 0) {
                    //console.log(intersects);
                    child.translateY(-(intersects[0].distance - radius ) );
                }*/

                if (child.name == "sku_408.DAE") {
                    //height difference 408, 361 skus
                    child.translateZ(-0.285 / 2);
                } else if (child.name == "sku_829.DAE") {
                    child.translateZ(-0.600 / 2);
                } else {
                    var normal = new THREE.Vector3(0, 1, 0);
                    var raycaster = new THREE.Raycaster(center, normal.clone().negate(), 0, Number.POSITIVE_INFINITY);

                    var intersects = raycaster.intersectObjects([plane]);
                    if (intersects.length > 0) {
                        //console.log(intersects);
                        child.translateZ(-(intersects[0].distance - radius));
                    }
                }
            }
        });
        //placing sku to floor - end

        //sceneGroupBoxHelper = new THREE.BoxHelper(pivot, 0xff0000);
        //scene.add(sceneGroupBoxHelper);

        console.log('Object Loaded');

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); //  alpha: true - remove canvas' bg color
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.screenSpacePanning = true;
        controls.enableZoom = false;
        controls.update();

        window.addEventListener('resize', onWindowResize, false);
        document.addEventListener('wheel', onDocumentMouseWheel, false);
        document.getElementById("takeScreenshot").addEventListener('click', takeScreenshot); // add Screenshot listener
        //document.getElementById("rotateCamera").addEventListener('click', rotateObject); // add RotateCamera listener
        document.getElementById("rotateCamera").addEventListener("click", function () {
            rotateObject();
        }, false);
        document.getElementById("zoomInCheck").addEventListener('click', zoomInCheck); // add ZoomCheck listener

        animate();

        rotateObject(Math.PI / 4);

        //updateBBox();

        //zoomInCheck();
        //zoomInCheck(0).then(() => {console.log('done'); });

        //topPostion();
    }

    function onProgressCallback(e) {
        console.log("onProgressCallback ", e.target.status + ", " + e.target.statusText);
    }

    function onErrorCallback(e) {
        console.log("onErrorCallback ColladaLoader failed! because of error " + e.target.status + ", " + e.target.statusText);
        //console.log(e);
    }

    var loader = new THREE.ColladaLoader();
    loader.load(url, onSuccessCallback, onProgressCallback, onErrorCallback);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;

    //must call when fov,aspect ratio, near, far changed to get it to work
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    //cameraHelper.update();

    render();
}

function render() {
    renderer.render(scene, camera);
}

function onDocumentMouseWheel(event) {
    previous_fov = camera.fov;
    var fov = camera.fov + event.deltaY * 0.01;
    camera.fov = THREE.Math.clamp(fov, -1000, 1000);//fov, 10, 75
    //camera.fov   = THREE.Math.clamp( fov, -1000, max_fov ); //fov, 10, 75
    onWindowResize();
    /*if (fovCheck()) {
        camera.fov = previous_fov;
        onWindowResize();
        console.log("new ", camera.fov); //,"old ", previous_fov
    } else {
        console.log(camera.fov);
    }*/
}

function updateBBox() {

    //update box helper
    //sceneGroupBoxHelper.update(pivot);

    //update bounding box vertices position
    // Draw bounding box
    /*
          5____4
        1/___0/|
        | 6__|_7
        2/___3/

        0: max.x, max.y, max.z
        1: min.x, max.y, max.z
        2: min.x, min.y, max.z
        3: max.x, min.y, max.z
        4: max.x, max.y, min.z
        5: min.x, max.y, min.z
        6: min.x, min.y, min.z
        7: max.x, min.y, min.z
    */
    sceneGroupBoundingBox = new THREE.Box3();
    sceneGroupBoundingBox.setFromObject(pivot); // Store original position
    sceneGroupBoundingBox.getCenter(center); // Center geometry faces //Returns the center point of the box as a Vector3.
    sceneGroupBoundingBox.getSize(size); //Returns the width, height and depth of this box.
    length = size.length();

    sceneRadiusForCamera = Math.max(
        sceneGroupBoundingBox.max.y - sceneGroupBoundingBox.min.y,
        sceneGroupBoundingBox.max.z - sceneGroupBoundingBox.min.z,
        sceneGroupBoundingBox.max.x - sceneGroupBoundingBox.min.x
    ) / 2 * (1 + Math.sqrt(length)) + 2; // golden number to beautify display
    //console.log(sceneRadiusForCamera);

    max_fov = Math.round(2 * Math.atan((length) / (2 * sceneRadiusForCamera)) * (180 / Math.PI));
    /*console.log(max_fov);*/

    bbmin = sceneGroupBoundingBox.min; bbmax = sceneGroupBoundingBox.max;
    /*var diagonal = bbmin.distanceTo( bbmax );console.log(diagonal,length);*/

    vertices = [
        new THREE.Vector3(bbmax.x, bbmax.y, bbmax.z),
        new THREE.Vector3(bbmin.x, bbmax.y, bbmax.z),
        new THREE.Vector3(bbmin.x, bbmin.y, bbmax.z),
        new THREE.Vector3(bbmax.x, bbmin.y, bbmax.z),
        new THREE.Vector3(bbmax.x, bbmax.y, bbmin.z),
        new THREE.Vector3(bbmin.x, bbmax.y, bbmin.z),
        new THREE.Vector3(bbmin.x, bbmin.y, bbmin.z),
        new THREE.Vector3(bbmax.x, bbmin.y, bbmin.z),
    ];

    /*for(var j= 0; j<vertices.length;j++){
        var boxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        boxMesh = new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({
            color: Math.random() * 0xffffff,
            side: THREE.DoubleSide
        }));
        boxMesh.position.set(vertices[j].x, vertices[j].y, vertices[j].z);
        scene.add(boxMesh);
    }*/
}

/*function zoomInCheck(index){
    return new Promise(async function (resolve, reject) {
        if (index <= 9) {

            //zoom
            var arr = range(1, max_fov);
            arr = arr.reverse();

            for (let fov of arr) {
                const result = await cameraFov(fov);
                if (result == "success") break;
            }
            //var result = await takeScreenshot(); console.log("takeScreenshot = ", index);

            if(index <= 7 ) {
                //rotate 7 times
                var result = await rotateObject(); resolve(zoomInCheck(++index));
            }else if(index == 8 ) {
                // 8th time update camera to top
                var result = await topPostion(); resolve(zoomInCheck(++index));
            }else{
                resolve();
            }
        } else {
            resolve();
        }
    });
}*/

function zoomInCheck() {
    return new Promise(async function (resolve, reject) {

        //zoom
        var arr = range(1, max_fov);
        arr = arr.reverse();

        for (let fov of arr) {
            const result = await cameraFov(fov);
            if (result == "success") break;
        }

        resolve();

    });
}

function rotateObject(angle = null) {
    if (angle == null) angle = rotate_by;
    return new Promise(async function (resolve, reject) {

        /*pivot.rotation.y += THREE.Math.radToDeg(90); //45
        pivot.updateMatrixWorld();*/

        rotWorldMatrix = new THREE.Matrix4();
        rotWorldMatrix.makeRotationAxis(axis.normalize(), angle);
        rotWorldMatrix.multiply(pivot.matrix); // pre-multiply
        pivot.matrix = rotWorldMatrix;
        pivot.rotation.setFromRotationMatrix(pivot.matrix);

        render();

        updateBBox();

        //var result = await zoomInCheck();
        resolve("success");
    });
}

function topPostion() {
    return new Promise(async function (resolve, reject) {

        pivot.rotation.set(0.0, 0.0, 0.0);
        pivot.updateMatrix(); // make sure pivot's local matrix is updated

        /*camera.position.z = 0;
        camera.position.y = sceneRadiusForCamera;
        camera.position.x = 0;
        camera.lookAt(scene.position);
        camera.updateMatrix(); // make sure camera's local matrix is updated
        camera.updateMatrixWorld(); // make sure camera's world matrix is updated*/

        rotWorldMatrix = new THREE.Matrix4();
        rotWorldMatrix.makeRotationAxis(new THREE.Vector3(0, 0, 1).normalize(), -Math.PI / 2);
        rotWorldMatrix.multiply(pivot.matrix); // pre-multiply
        pivot.matrix = rotWorldMatrix;
        pivot.rotation.setFromRotationMatrix(pivot.matrix);

        pivot.position.y += camera.position.y;
        camera.lookAt(pivot.position);

        render();

        updateBBox();

        resolve("success");
    });
}

function range(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
}

//CHECK IF OBJECT IS CUT OFF FROM SCREEN // How to determine if plane is in Three.js camera Frustum
function cameraFov(fov) {
    return new Promise(function (resolve, reject) {
        var old_fov = camera.fov;
        var deltaY = -100;
        fov = fov + deltaY * 0.01;
        camera.fov = THREE.Math.clamp(fov, 1, max_fov);

        onWindowResize();

        //check if within camera's view:
        camera.updateMatrix();  // make sure camera's local matrix is updated
        camera.updateMatrixWorld(); // make sure camera's world matrix is updated
        camera.matrixWorldInverse.getInverse(camera.matrixWorld);
        var frustum = new THREE.Frustum();
        frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));

        //console.log(frustum.containsPoint(bbmin), frustum.containsPoint(bbmax));
        //console.log(frustum.planes);
        // Your 3d point to check
        if (
            //frustum.containsPoint(bbmin) && frustum.containsPoint(bbmax)
            frustum.containsPoint(vertices[0]) &&
            frustum.containsPoint(vertices[1]) &&
            frustum.containsPoint(vertices[2]) &&
            frustum.containsPoint(vertices[3]) &&
            frustum.containsPoint(vertices[4]) &&
            frustum.containsPoint(vertices[5]) &&
            frustum.containsPoint(vertices[6])
        ) {
            //console.log(camera.fov,' within camera view');
            setTimeout(() => { resolve("error"); }, 100); //0.1 sec
        } else {
            camera.fov = old_fov;
            /*var deltaY  = +200;
            fov         = camera.fov + deltaY * 0.01;
            camera.fov  = THREE.Math.clamp( fov, 1, max_fov );
            console.log("new ", camera.fov,"old ", old_fov);*/
            //console.log("new ",camera.fov,' outside camera view');
            onWindowResize();
            setTimeout(() => { resolve("success"); }, 100); //0.1 sec
        }
    });
}

function fovCheck() {
    camera.updateMatrix();
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.getInverse(camera.matrixWorld);
    var frustum = new THREE.Frustum();
    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    if (
        frustum.containsPoint(vertices[0]) &&
        frustum.containsPoint(vertices[1]) &&
        frustum.containsPoint(vertices[2]) &&
        frustum.containsPoint(vertices[3]) &&
        frustum.containsPoint(vertices[4]) &&
        frustum.containsPoint(vertices[5]) &&
        frustum.containsPoint(vertices[6])
    ) {
        return false;
    } else {
        return true;
    }
}

function takeScreenshot() {
    return new Promise(function (resolve, reject) {
        try {
            /*var a = document.createElement('a');
            // Without 'preserveDrawingBuffer' set to true, we must render now
            renderer.render(scene, camera);
            a.href = renderer.domElement.toDataURL().replace("image/png", "image/octet-stream");
            a.download = 'canvas.png'
            setTimeout(() =>{ resolve(a.click()); }, 500); //0.1 sec*/

            var w = window.open('', '');
            w.document.title = "Screenshot";
            var img = new Image();
            // Without 'preserveDrawingBuffer' set to true, we must render now
            render();
            img.src = renderer.domElement.toDataURL();
            resolve(w.document.body.appendChild(img));
            //setTimeout(() =>{ resolve(w.document.body.appendChild(img)); }, 100); //0.1 sec

        } catch (e) {
            //console.log(e);
            //return;
            resolve("error");
        }
    });
}

