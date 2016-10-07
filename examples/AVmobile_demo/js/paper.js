(function() {
    'use strict';

    var camera, scene, renderer;
    var effect, controls;
    var element, container, videoTexture;
    var videoMesh;
 
    console.log(ambisonics);
 
    // Setup audio context and variables
    var AudioContext = window.AudioContext // Default
    || window.webkitAudioContext; // Safari and old versions of Chrome
    var context = new AudioContext; // Create and Initialize the Audio Context
 
    var soundUrl = "videos/musiikkitalo1_seg1_short_wxyz.wav";
    var irUrl = "../IRs/HOA1_IRC_1008_virtual.wav";
    var soundBuffer, sound;

     // initialize ambisonic rotator
     var rotator = new ambisonics.sceneRotator(context, 1);
     console.log(rotator);
     // initialize ambisonic decoder
     var decoder = new ambisonics.binDecoder(context, 1);
     console.log(decoder);
     // FuMa to ACN converter
     var converterF2A = new ambisonics.converters.wxyz2acn(context);
     console.log(converterF2A);
 

    init();

    function init() {
        console.log('init');
 
         //// WAA setup
         // connect graph
         converterF2A.out.connect(rotator.in);
         rotator.out.connect(decoder.in);
         decoder.out.connect(context.destination);
         
         
         // function to assign sample to the filter buffers for convolution
         var assignSample2Filters = function(decodedBuffer) {
         decoder.updateFilters(decodedBuffer);
         }
         // function to assign sample to the sound buffer for playback (and enable playbutton)
         var assignSample2SoundBuffer = function(decodedBuffer) {
         soundBuffer = decodedBuffer;
         
         sound = context.createBufferSource();
         sound.buffer = soundBuffer;
         sound.loop = true;
         sound.connect(converterF2A.in);
         }
         
         // function to load samples
         function loadSample(url, doAfterLoading) {
         var fetchSound = new XMLHttpRequest(); // Load the Sound with XMLHttpRequest
         fetchSound.open("GET", url, true); // Path to Audio File
         fetchSound.responseType = "arraybuffer"; // Read as Binary Data
         fetchSound.onload = function() {
         context.decodeAudioData(fetchSound.response, doAfterLoading);
         }
         fetchSound.send();
         }
         
         // load and assign samples
         loadSample(soundUrl, assignSample2SoundBuffer);
         loadSample(irUrl, assignSample2Filters);
 
 
        //// THREEJS setup
        renderer = new THREE.WebGLRenderer();
        element = renderer.domElement;
        container = document.getElementById('example');
        container.appendChild(element);

        scene = new THREE.Scene();

        var sphere = new THREE.SphereGeometry( 500, 64, 64 );
        sphere.applyMatrix(new THREE.Matrix4().makeScale( -1, 1, 1 ));

        var video = document.getElementById('video');

        function bindPlay () {
            fullscreen();
            video.play();
            sound.start(0);
            element.removeEventListener('touchstart', bindPlay, false);
        }

        element.addEventListener('touchstart', bindPlay, false);

        var videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.LinearFilter;

        var videoMaterial = new THREE.MeshBasicMaterial({
            map: videoTexture
        });

        videoMesh = new THREE.Mesh(sphere, videoMaterial);
        videoMesh.rotation.y = -Math.PI/2;

        effect = new THREE.StereoEffect(renderer);

        camera = new THREE.PerspectiveCamera(95, 1, 0.001, 700);
        camera.position.set(0, 0, 0);
        scene.add(camera);

        scene.add(videoMesh);

        console.log('camera', camera);

        function setOrientationControls(e) {
            if (!e.alpha) {
                return;
            }

            controls = new THREE.DeviceOrientationControls(camera, true);
            controls.connect();
            controls.update();

 //           element.addEventListener('click', fullscreen, false);

            window.removeEventListener('deviceorientation', setOrientationControls, true);
        }

        window.addEventListener('deviceorientation', setOrientationControls, true);

        window.addEventListener('resize', resize, false);
 
//        // Wait for window.onload to fire. See crbug.com/112368
//        window.addEventListener('load', function(e) {
//
//        }, false);
 
        animate();
    }

    function resize() {
        var width = container.offsetWidth;
        var height = container.offsetHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        effect.setSize(width, height);
    }

    function update() {
        resize();
        if (controls) controls.update();

 //AP
 rotator.yaw = camera.rotation.y*180/Math.PI;
 rotator.pitch = -camera.rotation.x*180/Math.PI;
 rotator.roll = -camera.rotation.z*180/Math.PI;
 rotator.updateRotMtx();
 
 
 //console.log([rotator.yaw, rotator.pitch, rotator.roll]);
    }

    function render() {
        effect.render(scene, camera);
    }

    function animate() {
        requestAnimationFrame(animate);
        update();
        render();
    }

    function fullscreen() {
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
            container.mozRequestFullScreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        }
    }
}());
