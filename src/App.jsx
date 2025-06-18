import { useState, useRef, createRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

const images = [
  '/src/assets/nocats/1.jpeg',
  '/src/assets/nocats/2.jpeg',
  '/src/assets/nocats/3.jpeg',
  '/src/assets/nocats/4.jpeg',
  '/src/assets/nocats/5.jpeg',
  '/src/assets/nocats/6.jpeg',
  '/src/assets/nocats/7.jpeg',
  '/src/assets/nocats/8.jpeg',
  '/src/assets/nocats/9.jpeg',
  '/src/assets/nocats/10.jpeg',
  '/src/assets/nocats/11.jpeg',
  '/src/assets/nocats/12.jpeg',
]

const CIRCLE_SIZE = 50

function App() {
  const [openIdx, setOpenIdx] = useState(null)
  const [circleEditIdx, setCircleEditIdx] = useState(null)
  const [circlePos, setCirclePos] = useState(Array(images.length).fill(undefined))
  const dragState = useRef({ idx: null, offsetX: 0, offsetY: 0 })
  const imgRefs = useRef(images.map(() => createRef()))
  const buttonDivRefs = useRef(images.map(() => createRef()));
  const lastEditedIdx = useRef(null);
  const circlePosRef = useRef(circlePos);
  circlePosRef.current = circlePos;

  useEffect(() => {
    // Wait for images to load
    const handleLoad = () => {
      const newPositions = images.map((_, idx) => {
        const stored = localStorage.getItem(`cat-pos-${idx}`);
        const img = imgRefs.current[idx]?.current;
        if (stored && img) {
          const { x, y } = JSON.parse(stored);
          const { width, height } = img.getBoundingClientRect();
          return {
            x: x * width,
            y: y * height,
          };
        }
        return undefined;
      });
      setCirclePos(newPositions);
    };

    // If all images are loaded, update positions
    let loaded = 0;
    images.forEach((_, idx) => {
      const img = imgRefs.current[idx]?.current;
      if (img && img.complete) {
        loaded++;
      } else if (img) {
        img.addEventListener('load', () => {
          loaded++;
          if (loaded === images.length) handleLoad();
        });
      }
    });
    if (loaded === images.length) handleLoad();
  }, []);

  useEffect(() => {
    if (circleEditIdx === null && lastEditedIdx.current !== null) {
      setTimeout(() => {
        const btnDiv = buttonDivRefs.current[lastEditedIdx.current]?.current;
        if (btnDiv) {
          btnDiv.scrollIntoView({ block: 'start' });
        } else {
          console.warn('Button div not found for index:', lastEditedIdx.current);
        }
        lastEditedIdx.current = null;
      }, 400)
    }
    if (circleEditIdx !== null) {
      document.body.style.overflow = 'hidden'
      window.scrollTo({ top: 0, left: 0 })
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [circleEditIdx]);

  const handleToggleCircle = (idx) => {
    if (circleEditIdx === idx) {
      lastEditedIdx.current = idx;
      setCircleEditIdx(null);
    } else {
      setCircleEditIdx(idx);
    }
  }

  // Add this function inside your App component
  const handleResetAllPositions = () => {
    images.forEach((_, idx) => {
      localStorage.removeItem(`cat-pos-${idx}`);
    });
    setCirclePos(Array(images.length).fill(undefined));
  };

  // Handle drag start
  const handleCircleMouseDown = (e, idx) => {
    e.preventDefault()
    const { clientX, clientY } = e.touches && e.touches[0] || e
    const rect = e.target.getBoundingClientRect()
    const img = imgRefs.current[idx]?.current
    const imgRect = img ? img.getBoundingClientRect() : { left: 0, top: 0 }
    dragState.current = {
      idx,
      offsetX: clientX - rect.left + imgRect.left,
      offsetY: clientY - rect.top,
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleMouseMove, { passive: false })
    window.addEventListener('touchend', handleMouseUp)
  }

  // Handle drag move
  const handleMouseMove = (e) => {
    if (e.touches) e.preventDefault()
    const { idx, offsetX, offsetY } = dragState.current
    if (idx == null) return
    const { clientX, clientY } = e.touches && e.touches[0] || e
    setCirclePos((prev) =>
      prev.map((pos, i) =>
        i === idx
          ? {
              x: clientX - offsetX,
              y: clientY - offsetY,
            }
          : pos
      )
    )
  }

  // Handle drag end
  const handleMouseUp = () => {
    const { idx } = dragState.current;
    if (idx !== null) {
      const img = imgRefs.current[idx]?.current;
      if (img) {
        const { width, height } = img.getBoundingClientRect();
        const { x, y } = circlePosRef.current[idx];
        const relX = x / width;
        const relY = y / height;
        localStorage.setItem(`cat-pos-${idx}`, JSON.stringify({ x: relX, y: relY }));
        console.log(`Circle ${idx} relative position:`, { x: relX, y: relY });
      }
    }
    dragState.current = { idx: null, offsetX: 0, offsetY: 0 }
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    window.removeEventListener('touchmove', handleMouseMove)
    window.removeEventListener('touchend', handleMouseUp)
  }

  const foundCount = circlePos.filter(Boolean).length;
  const allFound = foundCount === images.length;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {circleEditIdx == null && <>
        <h1 style={{ textAlign: 'center' }}>😺 Finn katten 🙀</h1>
        {foundCount > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ textAlign: 'center', margin: 0 }}>
              {foundCount} av {images.length} kattar er lokalisert {allFound ? '✅' : '🕵️️'}
            </p>
          </div>
        )}
      </>
      }
      {circleEditIdx == null ? (
        images.map((src, idx) => (
          <div key={src} style={{ marginBottom: 32, position: 'relative' }}>
            <div
              ref={buttonDivRefs.current[idx]}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch', // Ensures children stretch to same height
                justifyContent: 'center',
                width: '100%',
                marginBottom: '10px'
              }}
            >
              <button
                style={{
                  marginTop: 8,
                  padding: '6px 12px',
                  fontSize: 16,
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                }}
                onClick={() => handleToggleCircle(idx)}
              >
                {circlePos[idx] ? 'Juster markeringa' : 'Marker kattefunn'}
              </button>
              <button
                style={{
                  marginTop: 8,
                  padding: '6px 12px',
                  fontSize: 16,
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (dragState.current.idx == null) {
                    setOpenIdx(idx);
                  }
                }}
              >
                Zoom & leit
              </button>
            </div>
            <img
              ref={imgRefs.current[idx]}
              src={src}
              alt={`img-${idx + 1}`}
              style={{ width: '100%', display: 'block', cursor: 'pointer' }}
            />
            <div
              style={{
                position: 'absolute',
                top: 60,
                right: 8,
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: 18,
                zIndex: 20,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              {idx + 1}
            </div>
            {circlePos[idx] && (
              <div
                style={{
                  position: 'absolute',
                  left: circlePos[idx].x,
                  top: circlePos[idx].y,
                  width: CIRCLE_SIZE,
                  height: CIRCLE_SIZE,
                  borderRadius: '50%',
                  background: 'rgba(0,255,0,0.2)',
                  border: '4px solid #00ff00',
                  pointerEvents: 'none',
                  zIndex: 10,
                  userSelect: 'none',
                }}
              />
            )}
          </div>
        ))
      ) : (
        <div style={{ marginBottom: 32, position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch', // Ensures children stretch to same height
              justifyContent: 'center',
              width: '100%',
              marginBottom: '10px'
            }}
          >
            <button
              style={{
                marginTop: 8,
                padding: '6px 12px',
                fontSize: 16,
                borderRadius: 4,
                border: '1px solid #ccc',
                cursor: 'pointer',
              }}
              onClick={() => handleToggleCircle(circleEditIdx)}
            >
              Ferdig
            </button>
          </div>
          <img
            ref={imgRefs.current[circleEditIdx]}
            src={images[circleEditIdx]}
            alt={`img-${circleEditIdx + 1}`}
            style={{ width: '100%', display: 'block', cursor: 'pointer' }}
          />
          <div
            style={{
              position: 'absolute',
              left: circlePos[circleEditIdx]?.x ?? 0,
              top: circlePos[circleEditIdx]?.y ?? 56,
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              borderRadius: '50%',
              background: 'rgba(255,0,0,0.1)',
              border: '4px solid red',
              cursor: 'grab',
              zIndex: 10,
              userSelect: 'none',
            }}
            onMouseDown={(e) => handleCircleMouseDown(e, circleEditIdx)}
            onTouchStart={(e) => handleCircleMouseDown(e, circleEditIdx)}
          />
        </div>
      )}
      {openIdx !== null && (
        <div
          style={{
            position: 'fixed',
            zIndex: 1000,
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <button
            onClick={() => setOpenIdx(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              zIndex: 1100,
              padding: '6px 12px',
              fontSize: 16,
              flex: 1,
              borderRadius: 4,
              border: '1px solid #ccc',
              cursor: 'pointer',
            }}
          >
            Tilbake
          </button>
          <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={10}
            doubleClick={{ disabled: true }}
            pinch={{ step: 5 }}
            wheel={{ disabled: true }}
          >
            <TransformComponent wrapperStyle={{ overflow: 'visible' }}>
              <img
                src={images[openIdx]}
                alt={`img-full-${openIdx + 1}`}
                style={{
                  maxWidth: '100vw',
                  maxHeight: '100vh',
                  display: 'block',
                  margin: '0 auto',
                  userSelect: 'none',
                  touchAction: 'none',
                }}
                draggable={false}
              />
            </TransformComponent>
          </TransformWrapper>
        </div>
      )}
      { circleEditIdx == null && <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
        <button
          onClick={handleResetAllPositions}
          style={{
            marginBottom: '32px',
            padding: '6px 12px',
            fontSize: 16,
            borderRadius: 4,
            border: '1px solid #ccc',
            cursor: 'pointer',
          }}
        >
          Fjern alle markeringane
        </button>
        <p>Kjelde: <a href="https://www.reddit.com/r/ThereIsnoCat/" target="_blank">/r/ThereIsNoCat</a></p>
      </div> }
    </div>
  )
}

export default App
