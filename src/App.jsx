import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { ZapparCamera, ImageTracker, ZapparCanvas } from '@zappar/zappar-react-three-fiber';
import { useLoader, Canvas, useThree } from "@react-three/fiber"
import * as THREE from "three";
import DatGui, { DatNumber } from 'react-dat-gui';

import tracker from "./assets/trackers/dummy.zpt"
import img from "./assets/trackers/dummy.png"

import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"
import humanobj from "./assets/obj/human_Echorce.obj"   //free model from sketchfab
import humanTexture from "./assets/obj/body_texture.png"

import { extendMaterial } from "./plugin/ExtendMaterial.module"

import "./styles/main.scss"


let texture = new THREE.TextureLoader().load(humanTexture);

let fresnelMaterial = extendMaterial(THREE.MeshPhysicalMaterial, {


  // Will be prepended to vertex and fragment code

  header: 'varying vec3 vNN; varying vec3 vEye;',
  fragmentHeader: 'uniform vec3 fresnelColor;',


  // Insert code lines by hinting at a existing

  vertex: {
    // Inserts the line after #include <fog_vertex>
    '#include <fog_vertex>': `
    

      mat4 LM = modelMatrix;
      LM[2][3] = 0.0;
      LM[3][0] = 0.0;
      LM[3][1] = 0.0;
      LM[3][2] = 0.0;

      vec4 GN = LM * vec4(objectNormal.xyz, 1.0);
      vNN = normalize(GN.xyz);
      vEye = normalize(GN.xyz-cameraPosition);`   //cameraPosition
  },
  fragment: {
    'gl_FragColor = vec4( outgoingLight, diffuseColor.a );': `
    
    
    gl_FragColor.rgb +=  ( 1.0 - -min(dot(vEye, normalize(vNN) ), 0.0) ) * fresnelColor;
    diffuseColor.a=opacity;
    gl_FragColor.a=diffuseColor.a;

`
  },


  // Uniforms (will be applied to existing or added)

  uniforms: {
    //diffuse: new THREE.Color( 'black' ),
    fresnelColor: new THREE.Color(0.00000, 0.13333, 0.58039),
    map: texture,
    cameraPosition: new THREE.Vector3(0, 0, 10),
    //transmission: 5,
    opacity: 0.5,
  }


})

// console.log(fresnelMaterial.uniforms)
// console.log(fresnelMaterial.vertexShader)
console.log(fresnelMaterial.fragmentShader)

function App() {

  const [transformData, setTransformData] = useState({
    x: 0,  //position
    y: -10,
    z: 0,
    masterScale: 1, //scale of group
  })


  return (
    <>

      <ZapparCanvas>
        <Suspense fallback={null}>
          <Scene transformData={transformData} ></Scene>
        </Suspense>
      </ZapparCanvas>

      {/* <Canvas camera={{position:[0,0,0]}}>
        <Suspense fallback={null}>
          <Scene transformData={transformData} ></Scene>
        </Suspense>
      </Canvas> */}



      <DatGui style={{ display: "" }} data={transformData} onUpdate={(newData) => {
        setTransformData(newData);
      }}>
        <DatNumber path="x" label="x" min={-20} max={20} step={0.01}></DatNumber>
        <DatNumber path="y" label="y" min={-20} max={20} step={0.01}></DatNumber>
        <DatNumber path="z" label="z" min={-20} max={20} step={0.01}></DatNumber>
        <DatNumber path="masterScale" label="Master Scale" min={0.5} max={3} step={0.01}></DatNumber>
      </DatGui>

    </>
  );
}

function Scene(props) {
  const { transformData } = props;
  const obj1 = useLoader(OBJLoader, humanobj)

  const [group, setGroup] = useState(undefined);
  const [mesh, setMesh] = useState(undefined);
  const [material, setMaterial] = useState(fresnelMaterial);

  const [visibility, setVisibility] = useState(false);  //whether the mesh is visible

  const { camera } = useThree();



  useEffect(() => {

    console.log(camera)
    //camera.position.z=5;
  }, [camera]);

  //set group when it's loaded
  const onGroupRefChange = useCallback(node => {
    if (node) {
      setGroup(node);
      camera.poseAnchorOrigin = group;
    }
  }, []);


  //set mesh state when group is loaded
  useEffect(() => {
    if (group) {
      setMesh(group.children[0]);
      //console.log(group)
    }
  }, [group]);

  //add material when mesh is loaded
  useEffect(() => {
    if (mesh) {
      fresnelMaterial.transparent = true;
      fresnelMaterial.opacity = 0.5;
      mesh.material = fresnelMaterial;
    }
  }, [mesh]);



  function onVisible(index) {

    setVisibility(true);

  }

  function onNotVisible(index) {

    setVisibility(false)


  }


  return (
    <>
      <ZapparCamera userCameraMirrorMode="poses" rearCameraMirrorMode="none" />
      {/* <ImageTracker targetImage={tracker}>
     
    
    </ImageTracker> */}

      <primitive
        visible={true}
        position={[transformData.x, transformData.y, transformData.z]}
        scale={[transformData.masterScale, transformData.masterScale, transformData.masterScale]}
        object={obj1}
        material={material}
        ref={onGroupRefChange}>
      </primitive>




      <ambientLight intensity={0.1}></ambientLight>

    </>
  )
}
export default App;
