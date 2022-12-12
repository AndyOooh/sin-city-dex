import React from 'react';

import chipPng from './chip.png';

export const Logo = () => {
  return (
    <div className='h-full'>
      <img src={chipPng} alt='logo' className='h-full' />
    </div>
  );
};
