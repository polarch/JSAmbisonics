# JSAmbisonics
A JS library for first-order ambisonic (FOA) and higher-order ambisonic (HOA) processing for  browsers, using the Web Audio API.
**[Live Demo](https://cdn.rawgit.com/polarch/JSAmbisonics/b536e502/index.html)**

---
>
> Archontis Politis (Aalto University)
>
> archontis.politis@aalto.fi
>
> David Poirier-Quinot (IRCAM)
>
> david.poirier-quinot@ircam.fr
>
----

## Description <a name="description"></a>
JSAmbisonics is a JavaScript library that implements a set of objects for real-time spatial audio processing, using the Ambisonics framework. The objects correspond to typical ambisonic processing blocks, and internally implement Web Audio graphs for the associated operations.

The library is suitable for both FOA and HOA processing, using the following specifications:
* FOA or HOA with ACN channel ordering and N3D normalization. This is the default mode, and all internal processing is done using this.
* FOA or HOA with ACN channel ordering and SN3D normalization.
* FOA or HOA (up to 3rd-order) using the [Furse-Malham specification](http://www.blueripplesound.com/b-format).
* FOA B-format signals with traditional ordering **[W X Y Z]** and a factor of **1/sqrt(2)** on the omnidirectional first channel.

The implemented Web Audio classes are:
* **monoEncoder**: encodes a monophonic sound source to an ambisonic stream of a set order, with real-time control of the panning direction.
* **sceneRotator**: rotates the sound scene of an ambisonic stream, with real-time control of yaw, pitch, and roll rotation angles.
* **sceneMirror**: mirrors the sound scene of an ambisonic stream with respect to (front-back), (left-right), or (up-down) axes.
* **virtualMic**: applies FOA and HOA virtual microphones to an ambionic stream, with real-time control of their orientation and pattern.
* **binDecoder**: implements an ambisonic to binaural decoding, using user-defined HRTF-based filters. If these are not provided, two plain opposing cardioids are used instead.
* **orderLimiter**: takes a HOA stream of order N, and outputs the channel-limited HOA stream of order N'<=N
* **orderWeight**: applies user-specified gains to the channels of the same order, for directional smoothing or psychoacoustic (max energy-vector) decoding
* **converters.wxyz2acn**: converts a traditional FOA stream to FOA ACN/N3D stream
* **converters.acn2wxyz**: converts the first-order channels of a HOA stream to traditional FOA stream
* **converters.n3d2sn3d**: converts an ACN/N3D stream to an ACN/SN3D stream
* **converters.sn3d2n3d**: converts an ACN/SN3D stream to an ACN/N3D stream
* **converters.fuma2acn**: converts a FuMa stream to a ACN/N3D stream
* **intensityAnalyser**: implements an acoustic intensity analysis for visualization of directional information captured in the ambisonic stream
* **powermapAnalyser**: analysis of the directional power distribution in the sound field for visualization of directional information captured in the ambisonic stream
* **rmsAnalyser**: returns the RMS values of the ambisonic channels, useful for metering and visualization.

The library is a work-in-progress, but fully functional. At the moment, demos seem to work fine in Mozilla Firefox and Google Chrome. Safari seems to be working too with some issues in multichannel file loading. No other browsers have been checked yet.

If you would like to reference the library in an article please use the following [publication](https://www.researchgate.net/publication/308761825_JSAmbisonics_A_Web_Audio_library_for_interactive_spatial_sound_processing_on_the_web):

    JSAmbisonics: A Web Audio library for interactive spatial sound processing on the web
    A. Politis, D. Poirier-Quinot
    Interactive Audio Systems Symposium, York, UK, 2016
    
in which you can also find a detailed description of the internals of the library.

Computation of spherical harmonics and rotations relies on the JavaScript spherical harmonic library contributed by the author [here](https://github.com/polarch/Spherical-Harmonic-Transform-JS). The HOA code is based on the larger Matlab [HOA](https://github.com/polarch/Higher-Order-Ambisonics) and [Spherical Harmonic Transform](https://github.com/polarch/Spherical-Harmonic-Transform) libraries contributed by the author in Github. The rotation algorithm is the fast recursive one by [Ivanic and Ruedenberg](http://pubs.acs.org/doi/abs/10.1021/jp953350u?journalCode=jpchax).

---
## Table of Contents <a name="table-of-contents"></a>

  * [Description](#description)
  * [Real-time demos](#demos)
  * [Installation and usage](#usage)
  * [Loading of multichannel files for HOA](#multichannel)
  * [Integration with SOFA HRTFs](#sofa)  
  * [Legacy](#legacy)
  * [Developers](#developers)
  * [License](#license)

---
## Real-time demos (Chrome and Firefox) <a name="demos"></a>

See the live [Rawgit demo](https://cdn.rawgit.com/polarch/JSAmbisonics/06ae3ec4cb54fcc453c071aec21f4990ecb0cf34/index.html)  (serving the content of the ``./examples`` folder).

HOA recordings are made by the author in the [Communication Acoustics laboratory of Aalto University](http://spa.aalto.fi/en/research/research_groups/communication_acoustics/), using the [Eigenmike](http://www.mhacoustics.com/products#eigenmike1) microphone.

---
## Installation and usage <a name="usage"></a>

To add the library to you node project, type in (terminal at project root):

```bash
npm install ambisonics
```

To use the ambisonic objects, include the JSAmbisonics library in the body of your html code as:
```javascript
<script type="text/javascript" src="ambisonics.umd.js"></script>
```

or use it directly as a node module:
```javascript
var ambisonics = require('ambisonics');
```

**ambisonic encoder** is initialized as

```javascript
var encoder = new ambisonics.monoEncoder(audioContext, order)
```

where *audioContext* is the current Web Audio context, and *order* the desired ambisonic order. The input stream comes from an audio node to be spatialized.
The azimuth and elevation of the encoded source can be updated at runtime by

```javascript
encoder.azim = azim_value_in_degrees;
encoder.elev = elev_value_in_degrees;
encoder.updateGains();
```

**ambisonic mirror** is initialized as

```javascript
var mirror = new ambisonics.sceneMirror(audioContext, order)
```

The reflection planes (1: front-back), (2: left-right), (3: up-down), or (0: no reflection) can be updated at runtime by
```javascript
mirror.mirror(planeNo);
```
where *planeNo* is any of the above integers.

**ambisonic rotator** is initialized as

```javascript
var rotator = new ambisonics.sceneRotator(audioContext, order)
```

The yaw (Z-axis rotation), pitch (Y-axis) and roll (X-axis) rotation angles can be updated at runtime by
```javascript
rotator.yaw = yaw_value_in_degrees;
rotator.pitch = pitch_value_in_degrees;
rotator.roll = roll_value_in_degrees;
rotator.updateRotMtx();
```

**ambisonic binaural decoder** is initialized as

```javascript
var binDecoder = new ambisonics.binDecoder(audioContext, order)
```

If no decoding filters are passed to the decoder, an initial decoding based on two opposing cardioids is defined by default.
In case binaural decoding filters are available, they should be loaded in a multichannel *audioBuffer* and passed to the decoder through

```javascript
binDecoder.updateFilters(audioBuffer);
```

The number of channels of the buffer should be equal or greater to ```(order+1)^2```, which amounts to the number of ambisonic channels for the specified order. The filters can be reset to their default cardioids by

```javascript
binDecoder.resetFilters();
```

Some FOA and HOA HRTF-based decoding filters are included in the examples.

**ambisonic virtual microphone** is initialized as

```javascript
var vmic = new ambisonics.virtualMic(audioContext, order)
```

The virtual microphone is initialized to a hypercardioid of the appropriate order, pointing to the front. The orientation can be updated at runtime by

```javascript
vmic.azim = azim_value_in_degrees;
vmic.elev = elev_value_in_degrees;
vmic.updateOrientation();
```

The pattern of the microphone can be also updated by

```javascript
vmic.vmicPattern = string;
vmic.updatePattern();
```
where *string* can be one of the following:
* **"cardioid"**
* **"supercardioid"**
* **"hypercardioid"**
* **"max_rE"**

Higher-order cardioids correspond to the normal cardioid raised to the power of *order*. Higher-order supercardioids correspond to the pattern of that order that maximizes the front-to-back energy ratio. Higher-order hypercardioids correspond to the pattern of that order that maximizes the directivity factor. the max-rE pattern, found in ambisonic decoding literature, corresponds to the pattern of that order that maximizes the (Gerzon) energy vector for diffuse sound.

All objects have an input node *object.in* and an output node *object.out* which are used for the connections. The number of channels expected from each input depends on the object (for example a FOA encoder expects a monophonic signal, and outputs 4 channels, a FOA binaural decoder expects 4-channel input and outputs 2 channels, etc.). Example connections:
```javascript
soundBufferPlayer.connect(encoder.in);
encoder.out.connect(rotator.in);
rotator.out.connect(binDecoder.in);
binDecoder.connect(audioContext.destination);
```
which implements a graph such as:
```
soundBufferPlayer ------------->encoder------------>rotator---------->binDecoder-------------->out
                  mono stream            HOA stream         HOA stream            stereo stream
```
and
```javascript
soundBufferPlayer.connect(vmic.in);
vmic.out.connect(audioContext.destination);
```
with a graph such as:
```
soundBufferPlayer ------------->vmic------------>out
                  HOA stream         mono stream
```

See the scripts in the ``./examples`` folder for more insights on how to use the different objects of the library.

---
## Loading of multichannel files for HOA <a name="multichannel"></a>

The HOA processing of *order=N* requires audio streams of *(N+1)^2* channels. Loading HOA recordings or HOA binaural filters from sound files of that many channels seems to be problematic for the browsers. Both Firefox and Chrome seem to be able to handle WAVE and OGG files of up to 8ch. For that reason a helper class is provided that loads individual 8ch files that have been split from the full HOA multichannel file. Usage:

```javascript
var HOA3soundBuffer;
var order = 3;
var url = "https://address/HOA3_rec1.wav";
var callbackOnLoad = function(mergedBuffer) {
    HOA3soundBuffer = mergedBuffer;
}
var HOA3loader = new ambisonics.HOAloader(audioContext, order, url, callbackOnLoad);
HOA3loader.load();
```
The class will try to find files with the provided file name *HOA3_rec1.wav* but of the form:
```
  HOA3_rec1_01-08ch.wav
  HOA3_rec1_09-16ch.wav
```
The above example for 3rd-order will have exactly two files of 8ch (16 HOA channels). For a 2nd-order example (9 HOA channels) the loader will check for
```
  HOA2_rec1_01-08ch.wav
  HOA2_rec1_09-09ch.wav
```
and so on.

---
## Integration with SOFA HRTFs <a name="sofa"></a>

Generation of the binaural decoding filters require Head-related Transfer Functions (HRTFs), and they depend on the order, the measurement grid of the HRTFs, and the choice of ambisonic decoding approach. This is often not a straightforward task and not for the end-user of the library. If users are not satisfied with the example filters provided in the repo, and they have access to various HRTF sets, or to their own personalized HRTFs, they should have an automated way to generate these filters.
A module that loads HRTFs and attempts to do that is included in the library. The HRTFs should be in the standardized [SOFA](https://www.sofaconventions.org/mediawiki/index.php/Main_Page) format, which seems to be the most established one at the moment. Usage:

```javascript
var decodingFilterBuffer;
var order = 3;
var url = "https://address/HRTFset_subjectXX.sofa.json";
var callbackOnLoad = function(decodedBuffer) {
    decodingFilterBuffer = decodedBuffer;
}

var binDecoder = new ambisonics.binDecoder(audioContext, order);
var hrirLoader = new ambisonics.HRIRloader_xxxxx(audioContext, order, callbackOnLoad);
hrirLoader.load(url);
binDecoder.updateFilters(decodingFilterBuffer);
```

The SOFA file should be first converted to a JSON file. The appropriate *HRIRloader_xxxxx* should be used, depending on the origin of the SOFA files.

**HRIRloader_ircam**

This loader is meant to be used with JSON-converted SOFA files from IRCAM. Two examples are included in the repo. This loader relies on the IRCAM module [serveSofaHrir](https://github.com/Ircam-RnD/serveSofaHrir) and it is included for future loading of HRTFs served publicly from IRCAM. Scripts to convert your own SOFA files to this JSON convention are not included.

**HRIRloader_local**

This loader is meant to be used with the user's own SOFA files. You need to have Python installed to convert the SOFA files to JSON, and the h5py Python library installed. Using PIP do:

```bash
pip install h5py
```

Then in the ```./utils``` folder do (thanks to Antti Vanne for the script) 

```bash
python sofa2json.py [HRTFsetFilePath].sofa
```

That will generate the same file but as [HRTFsetFilePath].sofa.json, which you can then load normally, using the loader as above.

---
## Legacy <a name="legacy"></a>

In the ```./legacy``` folder of the repository there is a copy of the FOA part of the initial release of the library, when the library was still split in FOA and HOA components. The only reason that this is preserved is that if somebody is interested in FOA only processing, the *WebAudio_FOA.js* file has all the components needed without the additional complexity of HOA processing and with no external dependencies.

---
## Developers <a name="developers"></a>

To modify the library you need Node.js installed on your machine. First install the development version of the library:

```bash
npm install polarch/JSAmbisonics
```

and then install the project's dependencies typing in a terminal (opened in project's root):

```bash
npm install
```

You can then start developing, using the ```watch```  utility to dynamically transpile / bundle your code as you write it:

```bash
npm run watch
```

and test the changes on the files of the ```./examples``` folder, serving ```./index.html``` with a local HTTP server (see e.g. the [http-server node](https://github.com/indexzero/http-server)).

When you're satisfied with your changes, create the ```ambisonics.*.js``` bundles with:

```bash
npm run bundle
```
---
## License <a name="license"></a>

The library is released under the [BSD 3-Clause License](https://opensource.org/licenses/BSD-3-Clause).
