
<!DOCTYPE html>
<html lang="en">

<head>
    <title>Dae render</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
    <script src="scripts/three.min.js"></script>
    <script src="scripts/ColladaLoader.js"></script>
    <script src="scripts/jquery-1.12.4.js"></script>
    <script src="scripts/OrbitControls.js"></script>
    <script src="https://unpkg.com/sweetalert/dist/sweetalert.min.js"></script>
    <link rel="stylesheet" href="src/style.css" />
</head>

<body>

    <div style="position:absolute;">
        <p>Click to load an collada file</p>
        <input id="file-upload-input" type="file" name="files[]" multiple="" class="inputfile" >
    </div>

    <script src="src/require.js"></script>
    <script>

        var container, controls, camera, scene, renderer;
        var windowHalfX = window.innerWidth / 2;
        var windowHalfY = window.innerHeight / 2;
        var clock = new THREE.Clock();
        let loadFlag = false;
        let init_angle;

        init();
        animate();

        function init() {

            container = document.createElement('div');
            document.body.appendChild(container);
            // camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500000);
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            // camera.position.set(0, 0, 2);

            // scene
            scene = new THREE.Scene();
            var ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
            scene.add(ambientLight);
            var pointLight = new THREE.PointLight(0xffffff, 0.8);
            camera.add(pointLight);
            // camera.lookAt(scene.position);

            scene.add(camera);

            renderer = new THREE.WebGLRenderer();
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x808080);
            container.appendChild(renderer.domElement);

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.autoRotate = true;
            controls.autoRotateSpeed = 6;
            controls.minPolarAngle = 0; // radians
            controls.maxPolarAngle = Math.PI; // radians
            controls.maxAzimuthAngle = 2 * Math.PI; // radians
            controls.minAzimuthAngle = 0; // radians

            window.addEventListener('resize', onWindowResize, false);

            $('.inputfile').change(function (e) {

                // zoomInCheck();
                
                var files = e.currentTarget.files;
                // var files = ['box.dae', 'stormtrooper.dae', 'test.dae'];
                // console.log("here files to import", files[0]);
                var dae_path;
                loadFlag = true;
                var extraFiles = {}, file;
                for (var i = 0; i < files.length; i++) {
                    file = files[i];
                    extraFiles[file.name] = file;

                    //Filename ends in .dae/.DAE
                    if (files[i].name.match(/\w*.dae\b/i)) {
                        dae_path = files[i].name;
                    }
                }

                const manager = new THREE.LoadingManager();
                manager.setURLModifier(function (url, path) {

                    url = url.split('/');
                    url = url[url.length - 1];

                    if (extraFiles[url] !== undefined) {

                        var blobURL = URL.createObjectURL(extraFiles[url]);
                        const start = document.getElementById("file-upload-input");
                        let recorder, stream;

                        async function startRecording() {

                            dae_file_name = dae_path.split('.')[0];

                            (function() {

                                let canvas = document.querySelector('canvas');
                                // Optional frames per second argument.
                                let stream = canvas.captureStream(25);
                                var options = {
                                    mimeType: 'video/webm; codecs=vp9'
                                };
                                let recorder = new MediaRecorder(stream, options);
                                let blobs = [];

                                function download(blob) {

                                    var url = window.URL.createObjectURL(blob);
                                    var a = document.createElement('a');
                                    a.style.display = 'none';
                                    a.href = url;
                                    a.download = dae_file_name  + '.webm';
                                    document.body.appendChild(a);
                                    a.click();
                                    setTimeout(function() {
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                    }, 100);
                                }

                                recorder.ondataavailable = e => {
                                    if (e.data && e.data.size > 0) {
                                        blobs.push(e.data);  
                                    }
                                };
                                recorder.onstop = (e) => download(new Blob(blobs, {type: 'video/webm'}));
                                recorder.start(10); // collect 10ms chunks of data

                                // Record for 10 seconds.
                                setTimeout(() => {

                                    recorder.stop();
                                    start.removeAttribute("disabled");

                                    swal("Save as a video successfully!", "", "success", {
                                        timer: 2000
                                    });
                                    //     location.reload();
                                    renderer.render( scene, camera );
                                    scene.remove.apply(scene, scene.children);
                           
                                }, 10000);

                            })();

                            /* 
                            stream = await navigator.mediaDevices.getDisplayMedia({
                                video: { mediaSource: "screen" }
                            });
                            recorder = new MediaRecorder(stream);

                            const chunks = [];
                            recorder.ondataavailable = e => chunks.push(e.data);
                            recorder.onstop = e => {
                                const completeBlob = new Blob(chunks, { type: chunks[0].type });
                                video.src = URL.createObjectURL(completeBlob);
                                dae_file_name = dae_path.split('.')[0];

                                var f = new FormData();
                                f.append('videofile', completeBlob);
                                f.append('videoname', dae_file_name)
                                var xhr = new XMLHttpRequest();
                                xhr.open('POST', 'savevideofile.php');
                                xhr.send(f);

                                swal("save video successfully!", "", "success", {
                                    timer: 2000
                                });
                            };
                            recorder.start();

                            */

                        }

                        start.setAttribute("disabled", true);
                        startRecording();
                        
                        return blobURL;
                    }
                    return url;
                });

                var loader = new THREE.ColladaLoader(manager);
                loader.load(dae_path, function (collada) {

                    init_angle = Math.floor(controls.getAzimuthalAngle() * 100);

                    var bBox = new THREE.Box3().setFromObject(collada.scene);
                    var height = bBox.size().z;
                    // var axis_x = bBox.size().x;
                    // var axis_y = bBox.size().y;

                    var dist = height / (2 * Math.tan(camera.fov * Math.PI / 360));
                    var pos = collada.scene.position;

                    camera.position.set(pos.x, 0.1, dist * 3.5); // fudge factor so you can see the boundaries
                    camera.lookAt(pos);

                    var dae = collada.scene;
                    scene.add(dae);
                    sizeofDesk(dae);
                });
            });
        }

        function onWindowResize() {

            windowHalfX = window.innerWidth / 2;
            windowHalfY = window.innerHeight / 2;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

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

        function sizeofDesk(dae) {

            var helper = new THREE.BoundingBoxHelper(dae, 0xff0000);
            helper.update();
            // If you want a visible bounding box
            // scene.add(helper);
            // If you just want the numbers
            var min = helper.scale.x;
            var max = helper.scale.y;

        }
        function animate() {

            requestAnimationFrame(animate);
            var delta = clock.getDelta();
            controls.update(delta);
            render();
        }
        
        function render() {

            renderer.render(scene, camera);
            let upperLimitAngle = controls.getAzimuthalAngle() * 100;

            if (loadFlag && Math.floor(upperLimitAngle) === init_angle ) {

                // console.log("matched!")
            }
        }

    </script>
</body>

</html>