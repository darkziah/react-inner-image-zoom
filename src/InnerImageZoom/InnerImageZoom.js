import React, { Fragment, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Image from './components/Image';
import ZoomImage from './components/ZoomImage';
import FullscreenPortal from './components/FullscreenPortal';

const InnerImageZoom = ({
  moveType = 'pan',
  zoomType = 'click',
  src,
  srcSet,
  sizes,
  sources,
  zoomSrc,
  zoomScale = 1,
  zoomPreload,
  alt,
  fadeDuration = 150,
  fullscreenOnMobile,
  mobileBreakpoint = 640,
  className,
  afterZoomIn,
  afterZoomOut
}) => {
  const img = useRef(null);
  const zoomImg = useRef(null);
  const imgProps = useRef({});
  const [isActive, setIsActive] = useState(zoomPreload);
  const [isTouch, setIsTouch] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentMoveType, setCurrentMoveType] = useState(moveType);
  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(0);

  useEffect(() => {
    imgProps.current = getDefaults();
  }, []);

  const handleMouseEnter = (e) => {
    setIsActive(true);
    (zoomType === 'hover' && !isZoomed) && handleClick(e);
  };

  const handleTouchStart = () => {
    const enableFullscreen = fullscreenOnMobile && window.matchMedia && window.matchMedia(`(max-width: ${mobileBreakpoint}px)`).matches;

    setIsTouch(true);
    setIsFullscreen(enableFullscreen);
    setCurrentMoveType('drag');
  };

  const handleClick = (e) => {
    if (isZoomed) {
      (!isTouch && !isDragging) && zoomOut();
      return;
    }

    isTouch && setIsActive(true);

    if (zoomImg.current) {
      zoomIn(e.pageX, e.pageY);
    } else {
      imgProps.current.onLoadCallback = zoomIn.bind(this, e.pageX, e.pageY);
    }
  };

  const handleLoad = (e) => {
    zoomImg.current = e.target;
    zoomImg.current.setAttribute('width', zoomImg.current.offsetWidth * zoomScale);
    zoomImg.current.setAttribute('height', zoomImg.current.offsetHeight * zoomScale);

    imgProps.current.bounds = getBounds(img.current, false);
    imgProps.current.ratios = getRatios(imgProps.current.bounds, zoomImg.current);

    if (imgProps.current.onLoadCallback) {
      imgProps.current.onLoadCallback();
      imgProps.current.onLoadCallback = null;
    }
  };

  const handleMouseMove = (e) => {
    let left = e.pageX - imgProps.current.offsets.x;
    let top = e.pageY - imgProps.current.offsets.y;

    left = Math.max(Math.min(left, imgProps.current.bounds.width), 0);
    top = Math.max(Math.min(top, imgProps.current.bounds.height), 0);

    setLeft(left * -imgProps.current.ratios.x);
    setTop(top * -imgProps.current.ratios.y);
  };

  const handleDragStart = (e) => {
    const eventType = isTouch ? 'touchmove' : 'mousemove';

    imgProps.current.offsets = getOffsets((e.pageX || e.changedTouches[0].pageX), (e.pageY || e.changedTouches[0].pageY), zoomImg.current.offsetLeft, zoomImg.current.offsetTop);
    zoomImg.current.addEventListener(eventType, handleDragMove, { passive: false });

    if (!isTouch) {
      imgProps.current.eventPosition = {
        x: e.pageX,
        y: e.pageY
      };
    }
  };

  const handleDragMove = (e) => {
    e.preventDefault();
    e.stopPropagation();

    let left = (e.pageX || e.changedTouches[0].pageX) - imgProps.current.offsets.x;
    let top = (e.pageY || e.changedTouches[0].pageY) - imgProps.current.offsets.y;

    left = Math.max(Math.min(left, 0), (zoomImg.current.offsetWidth - imgProps.current.bounds.width) * -1);
    top = Math.max(Math.min(top, 0), (zoomImg.current.offsetHeight - imgProps.current.bounds.height) * -1);

    setLeft(left);
    setTop(top);
  };

  const handleDragEnd = (e) => {
    const eventType = isTouch ? 'touchmove' : 'mousemove';

    zoomImg.current.removeEventListener(eventType, handleDragMove);

    if (!isTouch) {
      const moveX = Math.abs(e.pageX - imgProps.current.eventPosition.x);
      const moveY = Math.abs(e.pageY - imgProps.current.eventPosition.y);

      setIsDragging(moveX > 5 || moveY > 5);
    }
  };

  const handleMouseLeave = (e) => {
    currentMoveType === 'drag' && isZoomed ? handleDragEnd(e) : handleClose();
  };

  const handleClose = () => {
    zoomOut(() => {
      setTimeout(() => {
        zoomImg.current = null;
        imgProps.current = getDefaults();

        setIsActive(false);
        setIsTouch(false)
        setIsFullscreen(false);
        setCurrentMoveType(moveType);
      }, fadeDuration);
    });
  };

  const initialMove = (pageX, pageY) => {
    imgProps.current.offsets = getOffsets(window.pageXOffset, window.pageYOffset, -imgProps.current.bounds.left, -imgProps.current.bounds.top);
    handleMouseMove({ pageX, pageY });
  };

  const initialDrag = (pageX, pageY) => {
    const initialPageX = (pageX - (window.pageXOffset + imgProps.current.bounds.left)) * -imgProps.current.ratios.x;
    const initialPageY = (pageY - (window.pageYOffset + imgProps.current.bounds.top)) * -imgProps.current.ratios.y;

    imgProps.current.bounds = getBounds(img.current, isFullscreen);
    imgProps.current.offsets = getOffsets(0, 0, 0, 0);

    handleDragMove({
      changedTouches: [{
        pageX: initialPageX,
        pageY: initialPageY
      }],
      preventDefault: () => {},
      stopPropagation: () => {}
    });
  };

  const zoomIn = (pageX, pageY) => {
    setIsZoomed(true);
    currentMoveType === 'drag' ? initialDrag(pageX, pageY) : initialMove(pageX, pageY);
    afterZoomIn && afterZoomIn();
  };

  const zoomOut = (callback) => {
    setIsZoomed(false);
    afterZoomOut && afterZoomOut();
    callback && callback();
  };

  const getDefaults = () => {
    return {
      onLoadCallback: null,
      bounds: {},
      offsets: {},
      ratios: {},
      eventPosition: {}
    };
  };

  const getBounds = (img, isFullscreen) => {
    if (isFullscreen) {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        left: 0,
        top: 0
      };
    }

    return img.getBoundingClientRect();
  };

  const getOffsets = (pageX, pageY, left, top) => {
    return {
      x: pageX - left,
      y: pageY - top
    };
  };

  const getRatios = (bounds, zoomImg) => {
    return {
      x: (zoomImg.offsetWidth - bounds.width) / bounds.width,
      y: (zoomImg.offsetHeight - bounds.height) / bounds.height
    };
  };

  const zoomImageProps = {
    src: zoomSrc || src,
    fadeDuration: isFullscreen ? 0 : fadeDuration,
    top,
    left,
    isZoomed,
    onLoad: handleLoad,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onClose: isTouch ? handleClose : null
  };

  return(
    <figure
      className={`iiz ${currentMoveType === 'drag' ? 'iiz--drag' : ''} ${className ? className : ''}`}
      ref={img}
      onTouchStart={isZoomed ? null : handleTouchStart}
      onClick={handleClick}
      onMouseEnter={isTouch ? null : handleMouseEnter}
      onMouseMove={currentMoveType === 'drag' || !isZoomed ? null : handleMouseMove}
      onMouseLeave={isTouch ? null : handleMouseLeave}
    >
      <Image
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        sources={sources}
        alt={alt}
        fadeDuration={fadeDuration}
        isZoomed={isZoomed}
      />

      {isActive &&
        <Fragment>
          {isFullscreen ? (
            <FullscreenPortal>
              <ZoomImage {...zoomImageProps} />
            </FullscreenPortal>
          ) : (
            <ZoomImage {...zoomImageProps} />
          )}
        </Fragment>
      }

      {!isZoomed &&
        <span className="iiz__btn iiz__hint"></span>
      }
    </figure>
  );
};

InnerImageZoom.propTypes = {
  moveType: PropTypes.string,
  zoomType: PropTypes.string,
  src: PropTypes.string.isRequired,
  srcSet: PropTypes.string,
  sizes: PropTypes.string,
  sources: PropTypes.array,
  zoomSrc: PropTypes.string,
  zoomScale: PropTypes.number,
  zoomPreload: PropTypes.bool,
  alt: PropTypes.string,
  fadeDuration: PropTypes.number,
  fullscreenOnMobile: PropTypes.bool,
  mobileBreakpoint: PropTypes.number,
  className: PropTypes.string,
  afterZoomIn: PropTypes.func,
  afterZoomOut: PropTypes.func
};

export default InnerImageZoom;