import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ============================================
// THREE.JS SETUP
// ============================================

class ParticleNetwork {
  constructor() {
    this.canvas = document.getElementById('bg-canvas');
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });

    this.particles = [];
    this.geometries = [];
    this.mouse = new THREE.Vector2();
    this.targetMouse = new THREE.Vector2();

    this.init();
  }

  init() {
    // Renderer setup
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    // Camera position
    this.camera.position.z = 30;

    // Create elements
    this.createParticles();
    this.createFloatingGeometries();
    this.createNetworkLines();

    // Event listeners
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));

    // Start animation
    this.animate();
  }

  createParticles() {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;

    const posArray = new Float32Array(particlesCount * 3);
    const colorArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 100;
      posArray[i + 1] = (Math.random() - 0.5) * 100;
      posArray[i + 2] = (Math.random() - 0.5) * 50;

      // Cyan to green gradient
      const t = Math.random();
      colorArray[i] = 0 + t * 0;
      colorArray[i + 1] = 1 - t * 0.3;
      colorArray[i + 2] = 1 - t * 0.5;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particlesMesh);
  }

  createFloatingGeometries() {
    const geometryTypes = [
      new THREE.OctahedronGeometry(1, 0),
      new THREE.TetrahedronGeometry(1, 0),
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.BoxGeometry(1, 1, 1),
    ];

    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });

    for (let i = 0; i < 15; i++) {
      const geometry = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
      const mesh = new THREE.Mesh(geometry, material.clone());

      mesh.position.x = (Math.random() - 0.5) * 60;
      mesh.position.y = (Math.random() - 0.5) * 60;
      mesh.position.z = (Math.random() - 0.5) * 30;

      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;

      const scale = Math.random() * 1.5 + 0.5;
      mesh.scale.set(scale, scale, scale);

      mesh.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02
        },
        floatSpeed: Math.random() * 0.5 + 0.5,
        floatOffset: Math.random() * Math.PI * 2
      };

      this.geometries.push(mesh);
      this.scene.add(mesh);
    }
  }

  createNetworkLines() {
    const linesMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.15
    });

    const points = [];
    for (let i = 0; i < 50; i++) {
      points.push(new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 40
      ));
    }

    // Create connections between nearby points
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const distance = points[i].distanceTo(points[j]);
        if (distance < 20) {
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([points[i], points[j]]);
          const line = new THREE.Line(lineGeometry, linesMaterial);
          this.scene.add(line);
        }
      }
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(event) {
    this.targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const time = Date.now() * 0.001;

    // Smooth mouse follow
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

    // Animate particles
    if (this.particlesMesh) {
      this.particlesMesh.rotation.x = time * 0.05;
      this.particlesMesh.rotation.y = time * 0.03;

      // Mouse influence on particles
      this.particlesMesh.rotation.x += this.mouse.y * 0.1;
      this.particlesMesh.rotation.y += this.mouse.x * 0.1;
    }

    // Animate geometries
    this.geometries.forEach((mesh) => {
      mesh.rotation.x += mesh.userData.rotationSpeed.x;
      mesh.rotation.y += mesh.userData.rotationSpeed.y;
      mesh.rotation.z += mesh.userData.rotationSpeed.z;

      // Float animation
      mesh.position.y += Math.sin(time * mesh.userData.floatSpeed + mesh.userData.floatOffset) * 0.01;

      // Mouse influence
      mesh.position.x += this.mouse.x * 0.02;
      mesh.position.y += this.mouse.y * 0.02;
    });

    // Camera slight movement
    this.camera.position.x = this.mouse.x * 2;
    this.camera.position.y = this.mouse.y * 2;
    this.camera.lookAt(this.scene.position);

    this.renderer.render(this.scene, this.camera);
  }
}

// ============================================
// SKILLS 3D VISUALIZATION
// ============================================

class SkillsCube {
  constructor(container) {
    this.container = container;
    if (!this.container) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    this.init();
  }

  init() {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);

    this.camera.position.z = 5;

    this.createCube();
    this.animate();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  createCube() {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });

    this.cube = new THREE.LineSegments(edges, material);
    this.scene.add(this.cube);

    // Inner cube
    const innerGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const innerEdges = new THREE.EdgesGeometry(innerGeometry);
    const innerMaterial = new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 1 });

    this.innerCube = new THREE.LineSegments(innerEdges, innerMaterial);
    this.scene.add(this.innerCube);
  }

  onResize() {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    if (this.cube) {
      this.cube.rotation.x += 0.005;
      this.cube.rotation.y += 0.01;
    }

    if (this.innerCube) {
      this.innerCube.rotation.x -= 0.01;
      this.innerCube.rotation.y -= 0.005;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// ============================================
// TYPING ANIMATION
// ============================================

class TypeWriter {
  constructor(element, words, waitTime = 2000) {
    this.element = element;
    this.words = words;
    this.waitTime = waitTime;
    this.wordIndex = 0;
    this.charIndex = 0;
    this.isDeleting = false;

    this.type();
  }

  type() {
    const currentWord = this.words[this.wordIndex];

    if (this.isDeleting) {
      this.element.textContent = currentWord.substring(0, this.charIndex - 1);
      this.charIndex--;
    } else {
      this.element.textContent = currentWord.substring(0, this.charIndex + 1);
      this.charIndex++;
    }

    let typeSpeed = this.isDeleting ? 50 : 100;

    if (!this.isDeleting && this.charIndex === currentWord.length) {
      typeSpeed = this.waitTime;
      this.isDeleting = true;
    } else if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.wordIndex = (this.wordIndex + 1) % this.words.length;
      typeSpeed = 500;
    }

    setTimeout(() => this.type(), typeSpeed);
  }
}

// ============================================
// GSAP ANIMATIONS
// ============================================

function initScrollAnimations() {
  // Navbar scroll effect
  ScrollTrigger.create({
    start: 'top -80',
    end: 99999,
    toggleClass: { className: 'scrolled', targets: '.navbar' }
  });

  // Section animations
  gsap.utils.toArray('.section').forEach((section) => {
    gsap.from(section.querySelector('.section-title'), {
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      y: 50,
      duration: 0.8
    });
  });

  // Terminal animation
  gsap.from('.terminal', {
    scrollTrigger: {
      trigger: '.about',
      start: 'top 60%',
      toggleActions: 'play none none reverse'
    },
    opacity: 0,
    x: -50,
    duration: 1,
    ease: 'power3.out'
  });

  // Skill cards - immediate visibility, then animate
  gsap.set('.skill-category', { opacity: 1, y: 0 });

  // Project cards - immediate visibility, then animate
  gsap.set('.project-card', { opacity: 1, y: 0 });

  // Timeline items
  gsap.from('.timeline-item', {
    scrollTrigger: {
      trigger: '.timeline',
      start: 'top 70%',
      toggleActions: 'play none none reverse'
    },
    opacity: 0,
    x: -30,
    stagger: 0.3,
    duration: 0.8,
    ease: 'power3.out'
  });

  // Achievement cards - immediate visibility
  gsap.set('.achievement-card', { opacity: 1, y: 0 });
  gsap.set('.certification-card', { opacity: 1, y: 0 });

  // Contact section
  gsap.from('.contact-info', {
    scrollTrigger: {
      trigger: '.contact-content',
      start: 'top 70%',
      toggleActions: 'play none none reverse'
    },
    opacity: 0,
    x: -50,
    duration: 0.8,
    ease: 'power3.out'
  });

  gsap.from('.contact-form', {
    scrollTrigger: {
      trigger: '.contact-content',
      start: 'top 70%',
      toggleActions: 'play none none reverse'
    },
    opacity: 0,
    x: 50,
    duration: 0.8,
    ease: 'power3.out'
  });
}

// ============================================
// MOBILE MENU
// ============================================

function initMobileMenu() {
  const navToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-links a');

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
}

// ============================================
// SMOOTH SCROLL
// ============================================

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offsetTop = target.offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ============================================
// CONTACT FORM
// ============================================

function initContactForm() {
  const form = document.getElementById('contact-form');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const btn = form.querySelector('.submit-btn');
      const originalText = btn.querySelector('.btn-text').textContent;

      // Animate button
      btn.querySelector('.btn-text').textContent = 'Sending...';
      btn.disabled = true;

      // Simulate form submission
      setTimeout(() => {
        btn.querySelector('.btn-text').textContent = 'Message Sent!';
        btn.style.background = 'linear-gradient(135deg, #00ff88, #00ffff)';

        setTimeout(() => {
          btn.querySelector('.btn-text').textContent = originalText;
          btn.style.background = '';
          btn.disabled = false;
          form.reset();
        }, 2000);
      }, 1500);
    });
  }
}

// ============================================
// SKILL TAG HOVER EFFECTS
// ============================================

function initSkillTagEffects() {
  const skillTags = document.querySelectorAll('.skill-tag');

  skillTags.forEach(tag => {
    tag.addEventListener('mouseenter', () => {
      gsap.to(tag, {
        scale: 1.1,
        duration: 0.2,
        ease: 'power2.out'
      });
    });

    tag.addEventListener('mouseleave', () => {
      gsap.to(tag, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out'
      });
    });
  });
}

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Three.js particle network
  new ParticleNetwork();

  // Initialize skills cube (optional - can be added to skills section)
  const skillsContainer = document.getElementById('skills-3d-container');
  if (skillsContainer) {
    new SkillsCube(skillsContainer);
  }

  // Initialize typing animation
  const typingElement = document.querySelector('.typing-text');
  if (typingElement) {
    new TypeWriter(typingElement, [
      'Cybersecurity Engineer',
      'Cloud Security Specialist',
      'DevSecOps Enthusiast',
      'Threat Intelligence Analyst',
      'Security Researcher'
    ], 2000);
  }

  // Initialize other features
  initScrollAnimations();
  initMobileMenu();
  initSmoothScroll();
  initContactForm();
  initSkillTagEffects();

  // Preloader effect - fade in content
  gsap.to('body', {
    opacity: 1,
    duration: 0.5,
    delay: 0.2
  });
});

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause heavy animations when tab is hidden
    gsap.globalTimeline.pause();
  } else {
    gsap.globalTimeline.resume();
  }
});
