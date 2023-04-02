export const getImageId = (imageUrl: string): string => {
  const fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
  return fileName.split('.')[0];
};
