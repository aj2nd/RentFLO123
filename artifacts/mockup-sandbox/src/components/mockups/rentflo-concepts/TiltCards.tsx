import React, { useRef, useState } from 'react';

const Card = ({ title, value, subtitle }: { title: string, value: string, subtitle?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation (-15 to 15 degrees)
    const rotateX = -((y - centerY) / centerY) * 15;
    const rotateY = ((x - centerX) / centerX) * 15;
    
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full aspect-[4/3] cursor-pointer transition-transform duration-200 ease-out z-10"
      style={{
        transformStyle: 'preserve-3d',
        transform: isHovered 
          ? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.05, 1.05, 1.05)` 
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        zIndex: isHovered ? 20 : 10
      }}
    >
      {/* Card Content Layer */}
      <div 
        className="absolute inset-0 bg-black border border-[#333] flex flex-col justify-between p-6 overflow-hidden"
        style={{
          boxShadow: isHovered 
            ? `0 20px 40px -10px rgba(111, 255, 233, 0.15), 0 10px 20px -5px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(111, 255, 233, ${isHovered ? 0.3 : 0})` 
            : '0 4px 6px -1px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(51, 51, 51, 1)',
          transform: 'translateZ(20px)',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
          borderColor: isHovered ? 'rgba(111, 255, 233, 0.4)' : '#333'
        }}
      >
        {/* Shimmer Effect */}
        {isHovered && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle 150px at ${mousePos.x}px ${mousePos.y}px, rgba(111, 255, 233, 0.15), transparent 80%)`,
            }}
          />
        )}
        
        <div className="z-10" style={{ transform: 'translateZ(30px)' }}>
          <h3 className="text-[#888] text-sm uppercase tracking-widest font-semibold mb-2">{title}</h3>
          <div className="text-white text-4xl font-light tracking-tight">{value}</div>
        </div>
        
        {subtitle && (
          <div className="z-10 text-[#6FFFE9] text-xs uppercase tracking-wider font-mono mt-4" style={{ transform: 'translateZ(40px)' }}>
            {subtitle}
          </div>
        )}

        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#6FFFE9] opacity-0 transition-opacity duration-300" style={{ opacity: isHovered ? 1 : 0 }} />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#6FFFE9] opacity-0 transition-opacity duration-300" style={{ opacity: isHovered ? 1 : 0 }} />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#6FFFE9] opacity-0 transition-opacity duration-300" style={{ opacity: isHovered ? 1 : 0 }} />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#6FFFE9] opacity-0 transition-opacity duration-300" style={{ opacity: isHovered ? 1 : 0 }} />
      </div>

      {/* Deep Shadow Layer */}
      <div 
        className="absolute inset-0 bg-[#6FFFE9] opacity-0 blur-xl pointer-events-none transition-opacity duration-500"
        style={{
          transform: 'translateZ(-10px)',
          opacity: isHovered ? 0.1 : 0
        }}
      />
    </div>
  );
};

export default function TiltCards() {
  const metrics = [
    { title: "Total Rent Advanced", value: "₹2,40,000", subtitle: "Active Portfolio" },
    { title: "Monthly Collection", value: "₹85,000", subtitle: "+12.4% vs Last Month" },
    { title: "Properties Active", value: "12", subtitle: "Zero Vacancy" },
    { title: "Settlements This Month", value: "8", subtitle: "All On Time" }
  ];

  return (
    <div className="min-h-screen bg-black w-full flex items-center justify-center p-8 font-sans overflow-hidden relative" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Animated subtle grid background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #333 1px, transparent 1px),
            linear-gradient(to bottom, #333 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)'
        }}
      />

      {/* Main Content */}
      <div className="max-w-6xl w-full z-10 relative">
        <header className="mb-16 border-l-2 border-[#6FFFE9] pl-6">
          <h1 className="text-4xl text-white font-light tracking-tight mb-2">Portfolio Overview</h1>
          <p className="text-[#888] uppercase tracking-widest text-xs font-semibold">RentFLO Institutional Dashboard</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" style={{ perspective: '2000px' }}>
          {metrics.map((metric, idx) => (
            <Card key={idx} {...metric} />
          ))}
        </div>
      </div>
    </div>
  );
}
