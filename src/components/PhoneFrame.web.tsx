import React, { useEffect } from 'react';
import { palette } from '@/theme/colors';

// MAXX is a phone app; the Netlify web build (see CLAUDE.md "Web preview") is
// a quick react-native-web preview, not the real target platform. Without
// this, react-native-web stretches the root view to fill the whole browser
// window/monitor. This confines it to a phone-sized frame on wide viewports
// and falls back to full-bleed on anything already phone-width (i.e. an
// actual mobile browser), where a frame-within-a-frame would be pointless.
const FRAME_WIDTH = 430;
const FRAME_HEIGHT = 932;
const STYLE_ID = 'maxx-phone-frame-style';

const CSS = `
  html, body, #root {
    height: 100%;
  }
  body {
    margin: 0;
    background: ${palette.bgCanvas};
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #root {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
  .maxx-phone-frame {
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  @media (min-width: ${FRAME_WIDTH + 1}px) and (min-height: ${FRAME_HEIGHT + 1}px) {
    .maxx-phone-frame {
      width: ${FRAME_WIDTH}px;
      height: ${FRAME_HEIGHT}px;
      max-height: 92vh;
      border-radius: 44px;
      border: 10px solid #05060a;
      box-shadow: 0 0 0 1px rgba(233,233,237,0.08), 0 40px 80px rgba(0,0,0,0.55);
    }
  }
`;

function useInjectFrameStyle() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }, []);
}

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  useInjectFrameStyle();
  return <div className="maxx-phone-frame">{children}</div>;
}
