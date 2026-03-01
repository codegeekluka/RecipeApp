import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import '../../styles/ui/ImageCropper.css';

const ImageCropper = ({ 
  imageSrc, 
  onCropComplete, 
  onCancel, 
  aspectRatio = 1, 
  cropShape = 'rect', 
  title = 'Crop Image' 
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log('ImageCropper - imageSrc:', imageSrc);
    console.log('ImageCropper - aspectRatio:', aspectRatio);
    console.log('ImageCropper - cropShape:', cropShape);
  }, [imageSrc, aspectRatio, cropShape]);

  const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixels) => {
    console.log('Crop complete - croppedArea:', croppedArea);
    console.log('Crop complete - croppedAreaPixels:', croppedAreaPixels);
    if (croppedAreaPixels && croppedAreaPixels.width > 0 && croppedAreaPixels.height > 0) {
      setCroppedAreaPixels(croppedAreaPixels);
    }
  }, []);

  // Also capture crop changes to ensure we always have a valid crop area
  const onCropChange = useCallback((crop) => {
    setCrop(crop);
    // Force a crop complete call to ensure we have the latest crop area
    if (imageSrc) {
      // This will trigger onCropCompleteInternal with the current crop
      setTimeout(() => {
        // The onCropCompleteInternal should be called automatically by react-easy-crop
      }, 100);
    }
  }, [imageSrc]);

  // Set initial crop area when component mounts or image changes
  useEffect(() => {
    if (imageSrc && !croppedAreaPixels) {
      // Wait a bit for the image to load, then set a default crop area
      const timer = setTimeout(() => {
        if (!croppedAreaPixels) {
          const defaultCropArea = {
            x: 0,
            y: 0,
            width: 100,
            height: aspectRatio === 1 ? 100 : 100 / aspectRatio
          };
          console.log('Setting default crop area after timeout:', defaultCropArea);
          setCroppedAreaPixels(defaultCropArea);
        }
      }, 1000); // Wait 1 second for image to load
      
      return () => clearTimeout(timer);
    }
  }, [imageSrc, aspectRatio, croppedAreaPixels]);

  const getCroppedImg = useCallback(async () => {
    if (!croppedAreaPixels) {
      console.log('No cropped area pixels available, using current crop position');
      // If we don't have croppedAreaPixels, we'll need to calculate them from the current crop
      // For now, let's return null and let the user know they need to adjust the crop
      return null;
    }

    const image = new Image();
    image.src = imageSrc;

    return new Promise((resolve) => {
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // For circular crops, we need to create a circular mask
        if (cropShape === 'circle') {
          // Generate higher resolution for better quality on large monitors
          const size = Math.min(croppedAreaPixels.width, croppedAreaPixels.height);
          const scale = 2; // 2x resolution for better quality
          canvas.width = size * scale;
          canvas.height = size * scale;

          // Enable high-quality rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Create circular clipping path
          ctx.beginPath();
          ctx.arc(size * scale / 2, size * scale / 2, size * scale / 2, 0, 2 * Math.PI);
          ctx.clip();

          // Draw the cropped image at higher resolution
          ctx.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            size * scale,
            size * scale
          );
        } else {
          // For rectangular crops - also generate higher resolution
          const scale = 2; // 2x resolution for better quality
          canvas.width = croppedAreaPixels.width * scale;
          canvas.height = croppedAreaPixels.height * scale;

          // Enable high-quality rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width * scale,
            croppedAreaPixels.height * scale
          );
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
            resolve(file);
          }
        }, 'image/jpeg', 0.95);
      };
    });
  }, [croppedAreaPixels, imageSrc, cropShape]);

  const handleCropConfirm = async () => {
    console.log('Apply crop clicked');
    console.log('Current croppedAreaPixels:', croppedAreaPixels);
    
    if (!croppedAreaPixels) {
      console.log('No crop area available, please adjust the crop area first');
      alert('Please adjust the crop area first by dragging the image or crop box');
      return;
    }
    
    const croppedFile = await getCroppedImg();
    if (croppedFile) {
      console.log('Cropped file created:', croppedFile);
      onCropComplete(croppedFile);
    } else {
      console.log('Failed to create cropped file');
      alert('Failed to create cropped image. Please try again.');
    }
  };

  // Don't render if no image source
  if (!imageSrc) {
    console.log('No image source provided');
    return null;
  }

  // Check if we can enable the apply button - enable if we have an image
  const canApplyCrop = !!imageSrc;

  console.log('Can apply crop:', canApplyCrop, {
    hasCroppedArea: !!croppedAreaPixels,
    cropWidth: croppedAreaPixels?.width,
    cropHeight: croppedAreaPixels?.height
  });

  return (
    <div className="image-cropper-overlay">
      <div className="image-cropper-modal">
        <div className="image-cropper-header">
          <h3>{title}</h3>
          <p>Drag to adjust the crop area</p>
        </div>
        
        <div className="image-cropper-content">
          <div className="crop-container">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={onCropChange}
                onZoomChange={setZoom}
                onCropComplete={onCropCompleteInternal}
                cropShape={cropShape === 'circle' ? 'round' : 'rect'}
                showGrid={false}
                objectFit="contain"
                minZoom={0.5}
                maxZoom={3}
                style={{
                  containerStyle: {
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '12px'
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="image-cropper-actions">
          <button 
            className="crop-btn crop-btn-secondary" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="crop-btn crop-btn-primary" 
            onClick={handleCropConfirm}
            disabled={!canApplyCrop}
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
