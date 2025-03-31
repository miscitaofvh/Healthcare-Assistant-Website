import React from 'react';
import { usePopup } from '../../contexts/PopUpContext';

const Popup = () => {
  const { popupContent, isOpen, closePopup } = usePopup();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '100%'
      }}>
        <button 
          onClick={closePopup}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
        {popupContent}
      </div>
    </div>
  );
};

export default Popup;