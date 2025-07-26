import { useEffect } from 'react';

interface DynamicGlassMorphismBackgroundProps {
  className?: string;
}

class DynamicGlassmorphism {
  private shapes: NodeListOf<Element>;
  private container: Element | null;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private maxShapes: number = 12;
  private lastSpawnTime: number = 0;

  constructor() {
    this.shapes = document.querySelectorAll('.glass-shape');
    this.container = document.querySelector('.glass-morphism-container');
    this.init();
  }

  init() {
    this.addSubtleInteraction();
    this.addDynamicColorShifting();
    this.addParticleSystem();
    this.addClickEffects();
    this.addCollisionDetection();
  }

  addSubtleInteraction() {
    if (!this.container) return;
    
    // Subtle mouse influence that doesn't interfere with drift
    this.container.addEventListener('mousemove', (e: Event) => {
      const mouseEvent = e as MouseEvent;
      this.mouseX = (mouseEvent.clientX / window.innerWidth - 0.5) * 2;
      this.mouseY = (mouseEvent.clientY / window.innerHeight - 0.5) * 2;
      
      this.shapes.forEach((shape) => {
        const element = shape as HTMLElement;
        // Very subtle influence that doesn't override the main drift
        const influence = 0.02;
        const rotInfluence = this.mouseX * 5 * influence + this.mouseY * 3 * influence;
        
        // Apply as a CSS filter for subtle depth effect
        const brightness = 1 + Math.abs(this.mouseX + this.mouseY) * 0.1;
        const currentFilter = element.style.filter || '';
        
        if (!currentFilter.includes('hue-rotate(180deg)')) {
          element.style.filter = currentFilter + ` brightness(${brightness}) contrast(${1 + Math.abs(rotInfluence) * 0.1})`;
        }
      });
    });
    
    this.container.addEventListener('mouseleave', () => {
      this.shapes.forEach(shape => {
        const element = shape as HTMLElement;
        if (!element.style.filter.includes('hue-rotate(180deg)')) {
          // Remove mouse-based filters but keep color shifting
          const filter = element.style.filter;
          element.style.filter = filter.replace(/brightness\([^)]*\)|contrast\([^)]*\)/g, '').trim();
        }
      });
    });
  }

  addClickEffects() {
    // Click adds temporary visual effects without disrupting drift
    this.shapes.forEach(shape => {
      this.addClickEffectsToShape(shape);
    });
  }

  createClickBurst(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 4 + 2;
      const angle = (i / 8) * Math.PI * 2;
      const velocity = Math.random() * 100 + 50;
      
      particle.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        -webkit-touch-callout: none;
        z-index: 10000;
        animation: burstParticle 1s ease-out forwards;
        --burst-x: ${Math.cos(angle) * velocity}px;
        --burst-y: ${Math.sin(angle) * velocity}px;
      `;
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 1000);
    }
  }

  addDynamicColorShifting() {
    setInterval(() => {
      this.shapes.forEach((shape, index) => {
        const element = shape as HTMLElement;
        const time = Date.now() * 0.001;
        const hueShift = Math.sin(time * 0.3 + index * 0.5) * 20 + Math.cos(time * 0.2 + index * 0.8) * 15;
        const saturation = 1 + Math.cos(time * 0.4 + index) * 0.25;
        const brightness = 1 + Math.sin(time * 0.15 + index) * 0.12;
        
        if (!element.style.filter.includes('hue-rotate(180deg)') && !element.style.filter.includes('drop-shadow')) {
          element.style.filter = `hue-rotate(${hueShift}deg) saturate(${saturation}) brightness(${brightness})`;
        }
      });
    }, 100);
  }

  addParticleSystem() {
    const createParticle = () => {
      if (!this.container) return;
      
      const particle = document.createElement('div');
      const size = Math.random() * 3 + 1;
      
      // Particles enter from random edges and drift across
      const edge = Math.floor(Math.random() * 4);
      let startX: number, startY: number, endX: number, endY: number;
      
      switch(edge) {
        case 0: // Top
          startX = Math.random() * 100;
          startY = -10;
          endX = Math.random() * 100;
          endY = 110;
          break;
        case 1: // Right
          startX = 110;
          startY = Math.random() * 100;
          endX = -10;
          endY = Math.random() * 100;
          break;
        case 2: // Bottom
          startX = Math.random() * 100;
          startY = 110;
          endX = Math.random() * 100;
          endY = -10;
          break;
        case 3: // Left
        default:
          startX = -10;
          startY = Math.random() * 100;
          endX = 110;
          endY = Math.random() * 100;
          break;
      }
      
      const duration = Math.random() * 20 + 25;
      
      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, ${Math.random() * 0.4 + 0.3});
        border-radius: 50%;
        left: ${startX}%;
        top: ${startY}%;
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        -webkit-touch-callout: none;
        animation: particleDrift ${duration}s linear infinite;
        z-index: 1000;
        --end-x: ${endX}%;
        --end-y: ${endY}%;
      `;
      
      this.container!.appendChild(particle);
      
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, duration * 1000 + 1000);
    };
    
    setInterval(createParticle, 2000);
  }

  addCollisionDetection() {
    // Track collision detection every frame
    const checkCollisions = () => {
      const activeShapes = Array.from(this.shapes).filter(shape => 
        !shape.classList.contains('shattered') && 
        getComputedStyle(shape as Element).opacity > '0.1'
      );
      
      for (let i = 0; i < activeShapes.length; i++) {
        for (let j = i + 1; j < activeShapes.length; j++) {
          if (this.areColliding(activeShapes[i] as HTMLElement, activeShapes[j] as HTMLElement)) {
            // Only trigger collision 25% of the time
            if (Math.random() < 0.25) {
              this.shatterShapes(activeShapes[i] as HTMLElement, activeShapes[j] as HTMLElement);
            }
          }
        }
      }
      
      // Check if we need to spawn new shapes
      this.checkAndSpawnNewShapes();
      
      requestAnimationFrame(checkCollisions);
    };
    
    requestAnimationFrame(checkCollisions);
  }

  checkAndSpawnNewShapes() {
    const currentTime = Date.now();
    const activeShapes = document.querySelectorAll('.glass-shape:not(.shattered)').length;
    
    // Spawn new shapes if we're below the target count and enough time has passed
    if (activeShapes < this.maxShapes && currentTime - this.lastSpawnTime > 3000) {
      this.spawnNewShape();
      this.lastSpawnTime = currentTime;
    }
  }

  spawnNewShape() {
    if (!this.container) return;
    
    const shapes = ['main-cube', 'rect-long', 'small-cube', 'rect-1', 'rect-2', 'rect-3', 
                   'glass-4', 'glass-5', 'glass-6', 'glass-7', 'glass-8', 'glass-9', 
                   'glass-10', 'glass-11', 'glass-12'];
    
    const shapeClass = shapes[Math.floor(Math.random() * shapes.length)];
    const newShape = document.createElement('div');
    newShape.className = `glass-shape ${shapeClass}`;
    
    // Random spawn position at edges to avoid stacking
    const edge = Math.floor(Math.random() * 4);
    let startX, startY;
    
    switch(edge) {
      case 0: // Top
        startX = Math.random() * 80 + 10; // 10-90%
        startY = -10;
        break;
      case 1: // Right
        startX = 110;
        startY = Math.random() * 80 + 10;
        break;
      case 2: // Bottom
        startX = Math.random() * 80 + 10;
        startY = 110;
        break;
      case 3: // Left
      default:
        startX = -10;
        startY = Math.random() * 80 + 10;
        break;
    }
    
    newShape.style.left = `${startX}%`;
    newShape.style.top = `${startY}%`;
    newShape.style.opacity = '0';
    
    this.container.appendChild(newShape);
    
    // Fade in the new shape
    setTimeout(() => {
      newShape.style.transition = 'opacity 2s ease-in';
      newShape.style.opacity = '1';
    }, 100);
    
    // Update shapes list
    this.shapes = document.querySelectorAll('.glass-shape');
    this.addClickEffectsToShape(newShape);
  }

  addClickEffectsToShape(shape: Element) {
    shape.addEventListener('click', (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      
      const mouseEvent = e as MouseEvent;
      const element = shape as HTMLElement;
      // Visual feedback without changing animation
      element.style.filter = 'hue-rotate(180deg) saturate(2) brightness(1.5) drop-shadow(0 0 20px rgba(255,255,255,0.8))';
      element.style.transform = element.style.transform + ' scale(1.1)';
      
      setTimeout(() => {
        element.style.filter = '';
        element.style.transform = element.style.transform.replace(/scale\([^)]*\)/g, '').trim();
      }, 1200);
      
      // Create click particle burst
      this.createClickBurst(mouseEvent.clientX, mouseEvent.clientY);
    });
  }

  areColliding(shape1: HTMLElement, shape2: HTMLElement): boolean {
    const rect1 = shape1.getBoundingClientRect();
    const rect2 = shape2.getBoundingClientRect();
    
    return !(rect1.right < rect2.left || 
            rect1.left > rect2.right || 
            rect1.bottom < rect2.top || 
            rect1.top > rect2.bottom);
  }

  shatterShapes(shape1: HTMLElement, shape2: HTMLElement) {
    // Mark shapes as shattered to prevent multiple collisions
    shape1.classList.add('shattered');
    shape2.classList.add('shattered');
    
    // Get collision point (center between the two shapes)
    const rect1 = shape1.getBoundingClientRect();
    const rect2 = shape2.getBoundingClientRect();
    const collisionX = (rect1.left + rect1.right + rect2.left + rect2.right) / 4;
    const collisionY = (rect1.top + rect1.bottom + rect2.top + rect2.bottom) / 4;
    
    // Create shards for both shapes
    this.createShards(shape1, collisionX, collisionY);
    this.createShards(shape2, collisionX, collisionY);
    
    // Hide original shapes with dramatic effect
    shape1.style.transition = 'all 0.3s ease-out';
    shape2.style.transition = 'all 0.3s ease-out';
    shape1.style.opacity = '0';
    shape2.style.opacity = '0';
    shape1.style.transform += ' scale(0)';
    shape2.style.transform += ' scale(0)';
    
    // Create collision explosion effect
    this.createCollisionExplosion(collisionX, collisionY);
    
    // Remove shapes after animation
    setTimeout(() => {
      if (shape1.parentNode) shape1.parentNode.removeChild(shape1);
      if (shape2.parentNode) shape2.parentNode.removeChild(shape2);
    }, 300);
  }

  createShards(originalShape: HTMLElement, collisionX: number, collisionY: number) {
    const rect = originalShape.getBoundingClientRect();
    const shardCount = Math.floor(Math.random() * 6) + 8; // 8-13 shards
    
    for (let i = 0; i < shardCount; i++) {
      const shard = document.createElement('div');
      const size = Math.random() * 30 + 10; // 10-40px shards
      
      // Random shard shape
      const shapes = ['polygon(50% 0%, 0% 100%, 100% 100%)', 
                     'polygon(0% 0%, 100% 50%, 0% 100%)',
                     'polygon(20% 0%, 80% 20%, 100% 100%, 0% 80%)',
                     'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)'];
      
      // Start position near the original shape
      const startX = rect.left + Math.random() * rect.width;
      const startY = rect.top + Math.random() * rect.height;
      
      // Velocity away from collision point
      const angle = Math.atan2(startY - collisionY, startX - collisionX);
      const velocity = Math.random() * 300 + 200; // 200-500px/s
      const velocityX = Math.cos(angle) * velocity + (Math.random() - 0.5) * 100;
      const velocityY = Math.sin(angle) * velocity + (Math.random() - 0.5) * 100;
      
      const rotation = Math.random() * 720 - 360; // -360 to 360 degrees
      const lifetime = Math.random() * 3 + 2; // 2-5 seconds
      
      shard.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size}px;
        left: ${startX}px;
        top: ${startY}px;
        background: ${this.getShardColor()};
        clip-path: ${shapes[Math.floor(Math.random() * shapes.length)]};
        backdrop-filter: blur(20px) saturate(2);
        border: 1px solid rgba(255, 255, 255, 0.6);
        pointer-events: none;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        animation: shardPhysics ${lifetime}s ease-out forwards;
        --velocity-x: ${velocityX}px;
        --velocity-y: ${velocityY}px;
        --rotation: ${rotation}deg;
        --lifetime: ${lifetime}s;
      `;
      
      document.body.appendChild(shard);
      
      // Remove shard after animation
      setTimeout(() => {
        if (shard.parentNode) {
          shard.parentNode.removeChild(shard);
        }
      }, lifetime * 1000 + 100);
    }
  }

  getShardColor(): string {
    const colors = [
      'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(173, 216, 230, 0.6))',
      'linear-gradient(135deg, rgba(255, 192, 203, 0.7), rgba(221, 160, 221, 0.5))',
      'linear-gradient(135deg, rgba(173, 216, 230, 0.8), rgba(255, 255, 255, 0.6))',
      'linear-gradient(135deg, rgba(221, 160, 221, 0.7), rgba(255, 192, 203, 0.5))'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  createCollisionExplosion(x: number, y: number) {
    // Create a bright flash effect
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      width: 100px;
      height: 100px;
      left: ${x - 50}px;
      top: ${y - 50}px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.3) 30%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      animation: explosionFlash 0.5s ease-out forwards;
    `;
    
    document.body.appendChild(flash);
    
    // Create multiple explosion particles
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      const angle = (i / 12) * Math.PI * 2;
      const velocity = Math.random() * 150 + 100;
      const size = Math.random() * 4 + 2;
      
      particle.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        animation: explosionParticle 1s ease-out forwards;
        --explosion-x: ${Math.cos(angle) * velocity}px;
        --explosion-y: ${Math.sin(angle) * velocity}px;
      `;
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        if (particle.parentNode) particle.parentNode.removeChild(particle);
      }, 1000);
    }
    
    setTimeout(() => {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
    }, 500);
  }
}

export const DynamicGlassMorphismBackground: React.FC<DynamicGlassMorphismBackgroundProps> = ({ 
  className = '' 
}) => {
  useEffect(() => {
    // Initialize dynamic effects after component mounts
    new DynamicGlassmorphism();
    
    // Cleanup function is not needed as the effects are global
    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div className={`glass-morphism-container ${className}`}>
      {/* Ambient lighting effects */}
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>
      <div className="ambient-light light-3"></div>
      
      {/* Clean, simple glass shapes */}
      <div className="glass-shape main-cube"></div>
      <div className="glass-shape rect-long"></div>
      <div className="glass-shape small-cube"></div>
      <div className="glass-shape rect-1"></div>
      <div className="glass-shape rect-2"></div>
      <div className="glass-shape rect-3"></div>
      <div className="glass-shape glass-4"></div>
      <div className="glass-shape glass-5"></div>
      <div className="glass-shape glass-6"></div>
      <div className="glass-shape glass-7"></div>
      <div className="glass-shape glass-8"></div>
      <div className="glass-shape glass-9"></div>
      <div className="glass-shape glass-10"></div>
      <div className="glass-shape glass-11"></div>
      <div className="glass-shape glass-12"></div>
    </div>
  );
};

export default DynamicGlassMorphismBackground;
