import React, { Component } from 'react';
import { render } from 'react-dom';
import InnerImageZoom from '../../src';
import '../../src/InnerImageZoom/styles.css';

class Demo extends Component {
  render() {
    return (
      <div>
        <h1>react-inner-image-zoom Demo</h1>
        <div style={{ marginBottom: '30px' }}>
          <h2>Pan Example</h2>
          <InnerImageZoom
            src="/unsplash.jpg"
            zoomSrc="/unsplash-large.jpg"
            fullscreenOnMobile={false}
            width={750}
            height={500}
            imgAttributes={{
              src: 'test',
              'data-key': 'value',
              title: 'Title',
              alt: '',
              height: 1000,
              onLoad: () => console.log('Original image loaded')
            }}
          />
        </div>
        <div style={{ marginBottom: '30px' }}>
          <h2>Hover Example</h2>
          <InnerImageZoom
            src="/unsplash2.jpg"
            width={750}
            height={500}
            hasSpacer={true}
            zoomSrc="/unsplash2-large.jpg"
            zoomType="hover"
            zoomPreload={true}
            fullscreenOnMobile={true}
          />
        </div>
      </div>
    );
  }
}

render(<Demo />, document.querySelector('#demo'));
