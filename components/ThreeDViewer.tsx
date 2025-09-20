import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ThreeDViewerProps {
  imageUrl: string;
}

const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ imageUrl }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current || !imageUrl) return;

    const currentMount = mountRef.current;
    let animationFrameId: number;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 0.01; // Start inside the sphere
    camera.rotation.order = 'YXZ'; // Set rotation order to avoid gimbal lock and make controls more intuitive

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance" 
    });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    // Set pixel ratio for sharp rendering on high-DPI displays, capped at 2x
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // Sphere with texture - increased segments for higher quality
    const geometry = new THREE.SphereGeometry(500, 120, 80);
    geometry.scale(-1, 1, 1); // Invert the geometry on the x-axis so we see it from the inside

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageUrl, (texture) => {
      // Improve texture quality with anisotropic filtering
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
    }, undefined, (error) => {
      console.error('An error happened while loading the texture.', error);
    });

    // Keyboard controls state
    const keysPressed: { [key: string]: boolean } = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (keysPressed.hasOwnProperty(event.key)) {
            keysPressed[event.key] = true;
        }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
        if (keysPressed.hasOwnProperty(event.key)) {
            keysPressed[event.key] = false;
        }
    };
    
    // Mouse Drag Controls
    const handleMouseDown = (event: MouseEvent) => {
        isDragging.current = true;
        previousMousePosition.current = { x: event.clientX, y: event.clientY };
        currentMount.style.cursor = 'grabbing';
    };

    const handleMouseMove = (event: MouseEvent) => {
        if (!isDragging.current) return;
        
        const deltaMove = {
            x: event.clientX - previousMousePosition.current.x,
            y: event.clientY - previousMousePosition.current.y
        };
        
        const rotationSpeed = 0.005;

        // Yaw (left/right) on Y-axis
        camera.rotation.y -= deltaMove.x * rotationSpeed;
        // Pitch (up/down) on X-axis
        camera.rotation.x -= deltaMove.y * rotationSpeed;
        
        previousMousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        currentMount.style.cursor = 'grab';
    };


    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    currentMount.addEventListener('mousedown', handleMouseDown);
    currentMount.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    currentMount.addEventListener('mouseleave', handleMouseUp);
    
    // Animation loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const speed = 0.02;
      // Pitch (up/down)
      if (keysPressed.ArrowUp) camera.rotation.x -= speed;
      if (keysPressed.ArrowDown) camera.rotation.x += speed;
      // Yaw (left/right)
      if (keysPressed.ArrowLeft) camera.rotation.y += speed;
      if (keysPressed.ArrowRight) camera.rotation.y -= speed;

      // Clamp vertical rotation to prevent flipping over
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
        if (currentMount) {
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            // Re-apply pixel ratio on resize
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      if (currentMount) {
        currentMount.removeEventListener('mousedown', handleMouseDown);
        currentMount.removeEventListener('mousemove', handleMouseMove);
        currentMount.removeEventListener('mouseleave', handleMouseUp);
        if (currentMount.contains(renderer.domElement)) {
          currentMount.removeChild(renderer.domElement);
        }
      }
      window.removeEventListener('mouseup', handleMouseUp);

      renderer.dispose();
      geometry.dispose();
      // Materials and textures are not explicitly tracked here, but Three.js will GC them
    };
  }, [imageUrl]);

  return <div ref={mountRef} className="w-full h-full cursor-grab bg-gray-200" aria-label="3D panoramic view of the memory palace. Use arrow keys or drag mouse to navigate."/>;
};

export default ThreeDViewer;